import {ProductService, TransactionBaseService} from "@medusajs/medusa"
import {EntityManager} from "typeorm"
import {PrintfulClient} from "printful-request"
import {CreateProductInput, UpdateProductInput} from "@medusajs/medusa/dist/types/product";
import {UpdateProductVariantInput} from "@medusajs/medusa/dist/types/product-variant";
import {kebabCase} from "lodash";

class PrintfulSyncService extends TransactionBaseService {
    protected manager_: EntityManager
    protected transactionManager_: EntityManager
    private productService: ProductService;
    private printfulClient: any;
    private readonly storeId: any;
    private readonly enableSync: Boolean;
    private productVariantService: any;
    private shippingProfileService: any;
    private salesChannelService: any;
    private shippingOptionService: any;
    private regionService: any;
    private printfulService: any;
    private printfulWebhooksService: any;

    constructor(container, options) {
        super(container);
        this.productService = container.productService;
        this.productVariantService = container.productVariantService;
        this.shippingProfileService = container.shippingProfileService;
        this.shippingOptionService = container.shippingOptionService;
        this.salesChannelService = container.salesChannelService;
        this.regionService = container.regionService;
        this.printfulService = container.printfulService;
        this.printfulClient = new PrintfulClient(options.printfulAccessToken);
        this.storeId = options.storeId;
        this.enableSync = options.enableSync;
        this.printfulWebhooksService = container.printfulWebhooksService;

        if (this.enableSync) {
            this.syncPrintfulProducts().then(r => console.log("Successfully synced products from Printful", r)).catch(e => {
                throw new Error("Error syncing products from Printful")
            });
        }
        if (options.enableWebhooks) {
            this.printfulWebhooksService.createWebhooks().then().catch(e => {
                throw new Error("Error creating Printful Webhooks")
            });
        }

    }

    async getScopes() {
        return await this.printfulClient.get("oauth/scopes");
    }


    async syncPrintfulProducts() {
        const products = []
        const {result: availableProducts} = await this.printfulClient.get("store/products", {store_id: this.storeId});

        for (let product of availableProducts) {
            const {
                result: {
                    sync_product,
                    sync_variants
                }
            } = await this.printfulClient.get(`sync/products/${product.id}`, {store_id: this.storeId});

            const variantOptions = await Promise.all(sync_variants.map(async (variant) => {
                const {result: {variant: options}} = await this.printfulClient.get(`products/variant/${variant.variant_id}`);
                return options;
            }));

            // add variantOptions to sync_variants based on variant_id and id of variantOptions
            const builtVariants = sync_variants.map((variant) => {
                const variantOption = variantOptions.find((option) => option.id === variant.variant_id);
                return {...variant, ...variantOption}
            })


            const builtProduct = {...sync_product, variants: builtVariants}
            products.push(builtProduct);
        }

        if (products.length > 0) {

            for (let product of products) {

                const existingProduct = await this.checkIfProductExists(product.id);

                if (existingProduct.id) {
                    const productObj: UpdateProductInput = {
                        title: product.name,
                        thumbnail: product.thumbnail_url,
                    }

                    await this.productService.update(existingProduct.id, productObj);


                    for (let existingVariant of existingProduct.variants) {
                        const printfulVariantId = existingVariant.metadata.printful_id;
                        const matchingVariant = product.variants.find((v) => v.id === printfulVariantId);

                        if (matchingVariant) {
                            const variantObj: any = {
                                title: `${existingProduct.title} - ${matchingVariant.size} / ${matchingVariant.color}`,
                                sku: matchingVariant.sku,
                                price: parseFloat(matchingVariant.retail_price) * 100,
                                currency_code: matchingVariant.currency.toLowerCase(),
                            };
                            await this.productVariantService.update(existingVariant.id, variantObj);
                            await this.productVariantService.updateVariantPrices(existingVariant.id, [{
                                amount: variantObj.price,
                                currency_code: variantObj.currency_code
                            }]);
                        }
                    }

                } else {
                    console.log("Creating product in Medusa");
                    const defaultShippingProfile = await this.shippingProfileService.retrieveDefault();
                    const defaultSalesChannel = await this.salesChannelService.retrieveDefault();

                    const productObj: CreateProductInput = {
                        title: product.name,
                        handle: kebabCase(product.name),
                        thumbnail: product.thumbnail_url,
                        options: [{title: "size"}, {title: "color"}],
                        profile_id: defaultShippingProfile.id,
                        external_id: product.id,
                        sales_channels: [{id: defaultSalesChannel.id}],
                        metadata: {
                            printful_id: product.id
                        }
                    }
                    const productVariantsObj = product.variants.map((variant) => {
                        return {
                            title: `${productObj.title} - ${variant.size} / ${variant.color}`,
                            sku: variant.sku,
                            external_id: variant.id,
                            manage_inventory: false,
                            allow_backorder: true,
                            inventory_quantity: 100,
                            prices: [{
                                amount: parseFloat(variant.retail_price) * 100,
                                currency_code: variant.currency.toLowerCase()
                            }],
                            metadata: {
                                printful_id: variant.id,
                                size: variant.size,
                                color: variant.color,
                                color_code: variant.color_code
                            }
                        }
                    })
                    console.log("productVariantsObj", productVariantsObj[0])

                    const productToPush = {
                        ...productObj,
                        variants: productVariantsObj,
                    }

                    try {
                        const createdProduct = await this.createProductInMedusa(productToPush);
                        if (createdProduct) {
                            console.log(createdProduct)
                        }
                    } catch (e) {
                        console.log(e);
                    }
                }
            }
        }
        return this.productService.list({q: ''}, {relations: ['variants']});
    }

    async addProductOptions(productId, optionTitle) {
        try {
            await this.productService.addOption(productId, optionTitle);
        } catch (e) {
            console.log("An error occurred while trying to an option!", e);
        }
    }

    async addVariantOptionValue(variantId, optionId, value) {
        try {
            await this.productVariantService.addOptionValue(variantId, optionId, value);
        } catch (e) {
            console.log("An error occurred while trying to add option value!", e);
        }
    }

    async updateVariantCurrencyPrice(sku: string, price: string) {
        const {id} = await this.productVariantService.retrieveBySKU(sku);
        // convert price string to number
        const priceNumber = parseInt(price, 10);
        const updatedVariant = await this.productVariantService.setCurrencyPrice(id, {
            amount: priceNumber * 100,
            currency_code: "EUR"
        });
    }

    async createPrintfulRegions() {
        const printfulCountries = await this.printfulService.getCountryList();
        let nestedCountries = {};
        printfulCountries.forEach(country => {
            if (!nestedCountries[country.region]) {
                nestedCountries[country.region] = [country];
            } else {
                nestedCountries[country.region].push(country);
            }
        });

        const createdRegions = await Promise.all(
            Object.keys(nestedCountries).map(async regionName => {
                const regionData = {
                    name: regionName.charAt(0).toUpperCase() + regionName.slice(1),
                    currency_code: "EUR",
                    tax_rate: 0,
                    payment_providers: ["stripe"],
                    fulfillment_providers: ["printful"],
                    countries: nestedCountries[regionName].map(country => country.code),
                };
                // exclude 'AN' from countries - since it doens't exist in anymore
                if (regionData.countries.includes('AN')) {
                    regionData.countries = regionData.countries.filter(country => country !== 'AN');
                }
                console.log(regionData)
                return await this.regionService.create(regionData);
            })
        );
        return {printfulCountries, createdRegions};
    }


    async checkIfProductExists(id: string) {
        const product = await this.productService.list({external_id: id}, {relations: ['variants']});
        if (product.length > 0) {
            return product[0];
        }
        return [];
    }

    async createProductInMedusa(product: CreateProductInput) {

        const createdProduct = await this.productService.create(product);

        if (createdProduct) {
            const {variants, options} = await this.productService.retrieve(createdProduct.id, {
                relations: ['variants', 'options'],
            });

            for (const option of options) {
                for (const variant of variants) {
                    if (option.title === 'size' || option.title === 'color') {
                        const value = variant.metadata[option.title];
                        console.log(`Variant ${variant.id}: option ${option.title} = ${value}`);
                        // if (value !== undefined && option.values && value !== option.values[0].value) {
                        console.log(`Updating variant ${variant.id} option ${option.id} to ${value}`);
                        await this.productVariantService.addOptionValue(variant.id, option.id, value);
                        // }
                    }
                }
            }
        }

        console.log(`Successfully created product ${createdProduct.title} in Medusa`)
        return createdProduct;
    }


    async updateProductInMedusa(productOrProductId: string, product: UpdateProductInput) {
        const updatedProduct = await this.productService.update(productOrProductId, product);
        if (updatedProduct) {
            console.log(`Successfully updated product ${updatedProduct.title} in Medusa`)
        }
        // return updatedProduct;
    }


    async updateVariantInMedusa(variant_id: string, update: UpdateProductVariantInput) {
        const variant = await this.productVariantService.retrieve(variant_id);
        const updatedVariant = await this.productVariantService.update(variant.id, update);
        if (updatedVariant) {
            console.log(`Successfully updated variant ${updatedVariant.title} in Medusa`)
        } else {
            console.log(`Failed to update variant ${variant.title} in Medusa`)
        }
        if (update.prices) {
            const prices = update.prices.map(price => {
                return {
                    amount: price.amount,
                    currency_code: price.currency_code.toLowerCase()
                }
            })
            await this.productVariantService.updateVariantPrices(variant.id, prices);
        }
    }


    async updateVariantOptionValueInMedusa(variantId: string, optionId: string, optionValue: string) {
        return await this.productVariantService.updateOptionValue(variantId, optionId, optionValue);
    }


    async deleteProduct(productOrProductId: string) {
        try {
            await this.productService.delete(productOrProductId);
            console.log(`Successfully deleted product ${productOrProductId} in Medusa`)
        } catch (e) {
            console.log(`Failed to delete product ${productOrProductId} in Medusa`)
        }
    }

}

export default PrintfulSyncService;