import {Product, ProductService, ProductVariant, TransactionBaseService} from "@medusajs/medusa"
import {EntityManager} from "typeorm"
import {PrintfulClient, request} from "printful-request"
import {
    CreateProductInput,
    CreateProductProductVariantInput,
    UpdateProductInput
} from "@medusajs/medusa/dist/types/product";
import {ProductVariantPrice, UpdateProductVariantInput} from "@medusajs/medusa/dist/types/product-variant";
import {create, kebabCase} from "lodash";
import {CreateRegionInput} from "@medusajs/medusa/dist/types/region";

class PrintfulSyncService extends TransactionBaseService {
    protected manager_: EntityManager
    protected transactionManager_: EntityManager
    private productService: ProductService;
    private printfulClient: any;
    private readonly storeId: any;
    private readonly printfulApiToken: any;
    private productVariantService: any;
    private shippingProfileService: any;
    private salesChannelService: any;
    private shippingOptionService: any;
    private regionService: any;
    private printfulService: any;

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


    }

    async getScopes() {
        const scopes = await this.printfulClient.get("oauth/scopes");
        return scopes;
    }


    async syncPrintfulProducts() {
        // TODO: Add store id to env
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


                    const variantsObj = product.variants.map((variant) => {
                        return {
                            sku: variant.sku,
                            data: {
                                title: variant.name,
                                sku: variant.sku,
                                price: variant.retail_price,
                                external_id: variant.id,
                            }
                        }
                    })

                    // for (let variant of variantsObj) {
                    //     await this.updateVariantCurrencyPrice(variant.sku, variant.data.price)
                    // }
                    //
                    // for (let variant of variantsObj) {
                    //     await this.updateVariantInMedusa(variant.sku, variant.data)
                    // }


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


                    // TODO: add ts typings

                    const productVariantsObj = product.variants.map((variant) => {
                        return {
                            title: variant.name,
                            sku: variant.sku,
                            external_id: variant.id,
                            manage_inventory: false,
                            allow_backorder: true,
                            inventory_quantity: 100,
                            // prices: [{
                            //     amount: variant.retail_price ? parseFloat(variant.retail_price) * 100 : 0,
                            //     currency_code: variant.currency
                            // }],
                            ...variant.size,
                            ...variant.color,
                            metadata: {
                                printful_id: variant.id,
                                size: variant.size,
                                color: variant.color,
                                color_code: variant.color_code
                            }
                        }
                    })


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
        const product = await this.productService.list({external_id: id});
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


    // async createVariantInMedusa(productOrProductId: string | Product, variant: CreateProductProductVariantInput) {
    //     const createdVariant = await this.productVariantService.create(productOrProductId, variant);
    //     console.log(`Successfully created variant ${createdVariant.title} in Medusa`)
    //
    //     return createdVariant;
    // }

    async updateVariantInMedusa(variantSku: string, update: UpdateProductVariantInput) {
        const variant = await this.productVariantService.retrieveBySKU(variantSku);
        const updatedVariant = await this.productVariantService.update(variant.id, update);
        if (updatedVariant) {
            console.log(`Successfully updated variant ${updatedVariant.title} in Medusa`)
        } else {
            console.log(`Failed to update variant ${variant.title} in Medusa`)
        }
    }


    async updateVariantOptionValueInMedusa(variantId: string, optionId: string, optionValue: string) {
        const updatedVariant = await this.productVariantService.updateOptionValue(variantId, optionId, optionValue);
        return updatedVariant;
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