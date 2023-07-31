import {
    OrderService,
    ProductCategoryService,
    ProductService, ProductVariantService, SalesChannelService,
    ShippingProfileService,
    TransactionBaseService
} from "@medusajs/medusa"
import {EntityManager} from "typeorm"
import {PrintfulClient} from "../utils/printful-request"
import {
    CreateFulfillmentOrder,
    CreateShipmentConfig,
    FulFillmentItemType
} from "@medusajs/medusa/dist/types/fulfillment";
import {CreateProductInput, UpdateProductInput} from "@medusajs/medusa/dist/types/product";
import {kebabCase, capitalize, chunk, last} from "lodash";
import {backOff, IBackOffOptions} from "exponential-backoff";

import {blue, green, greenBright, red, yellow, yellowBright} from "colorette";
import {FulfillmentService } from "medusa-interfaces";


class PrintfulService extends TransactionBaseService {

    // @ts-ignore
    protected manager_: EntityManager
    // @ts-ignore
    protected transactionManager_: EntityManager
    private productService: ProductService;
    private productCategoryService: ProductCategoryService;
    private productVariantService: ProductVariantService;
    private orderService: OrderService;
    private fulfillmentService: any
    private salesChannelService: SalesChannelService;
    private shippingProfileService: ShippingProfileService;

    private readonly backoffOptions: IBackOffOptions;
    private printfulClient: PrintfulClient;
    private apiKey: string;
    private categoryAliases: object;
    private readonly storeId: string;
    private readonly printfulAccessToken: string;
    private readonly productTags: boolean;
    private readonly productCategories: boolean;
    private readonly confirmOrder: boolean;

    constructor(container, options) {
        super(container);
        this.manager_ = container.manager;
        this.productService = container.productService;
        this.productVariantService = container.productVariantService;
        this.productCategoryService = container.productCategoryService;
        this.fulfillmentService = container.fulfillmentService;
        this.orderService = container.orderService;
        this.salesChannelService = container.salesChannelService;
        this.shippingProfileService = container.shippingProfileService;

        this.printfulClient = new PrintfulClient(options.printfulAccessToken);
        this.apiKey = options.printfulAccessToken;
        this.storeId = options.storeId;
        this.productTags = options.productTags;
        this.productCategories = options.productCategories;
        this.categoryAliases = options.categoryAliases
        this.confirmOrder = options.confirmOrder || false;

        this.backoffOptions = {
            numOfAttempts: 10,
            delayFirstAttempt: false,
            startingDelay: 60000,
            timeMultiple: 2,
            jitter: "full",
            maxDelay: 60000,
            retry: (e: any, attempts: number) => {
                const status = e.response?.status || e.code
                if (status === 429) {
                    console.error(`${red('[medusa-plugin-printful]:')} Rate limit error occurred while trying to create a product! Attempt ${attempts} of ${this.backoffOptions.numOfAttempts}. Will retry...`);
                    return true;
                }
                console.error(`${red('[medusa-plugin-printful]:')} Error occurred while trying to create a product! Attempt ${attempts} of ${this.backoffOptions.numOfAttempts}. Error: `, red(e));
                return false;
            }
        };

    }


    async getSyncProduct(id: string) {
        const {
            result: printfulStoreProduct,
            code
        } = await this.printfulClient.get(`store/products/${id}`, {store_id: this.storeId});

        if (code !== 200) {
            console.error("Error getting product from Printful: ", printfulStoreProduct)
            return null;
        }
        return printfulStoreProduct;
    }

    async getSyncVariant(id: string) {

        const {
            result: variant,
            code: code
        } = await this.printfulClient.get(`store/variants/${id}`, {store_id: this.storeId});
        if (code !== 200) {
            console.error("Error getting variant from Printful: ", variant)
            return null;
        }
        return variant;
    }

    convertToInteger(str) {
        // replace comma with period
        let numStr = str.replace(",", ".");
        // parse the number and round to the nearest integer
        return Math.round(parseFloat(numStr) * 100);
    }

    buildProductImages(printfulVariants) {
        return printfulVariants.flatMap(variant => (
            variant.files
                .filter(file => file.type === 'preview')
                .map(file => file.preview_url)
        )).filter((url, index, arr) => arr.indexOf(url) === index && url !== null && url !== '');
    }

    async createMedusaProduct(rawProduct: any) {

        const variantChunks = chunk(rawProduct.sync_variants, 10);

        return await this.atomicPhase_(async (manager) => {
            const {
                sync_product: printfulSyncProduct,
                sync_variants: printfulSyncVariants

            } = rawProduct;

            const defaultShippingProfile = await this.shippingProfileService.retrieveDefault();
            const defaultSalesChannel = await this.salesChannelService.retrieveDefault();


            const printfulCatalogProductVariants = []

            for (const chunk of variantChunks) {
                const chunkResults = [];

                for (const variantChunk of chunk) {
                    try {
                        const result = await backOff(async () => {
                            const {
                                result: {
                                    variant,
                                    product
                                }
                            } = await this.printfulClient.get(`products/variant/${variantChunk.variant_id}`);
                            return {...variant, parentProduct: product};
                        }, this.backoffOptions);
                        chunkResults.push(result);
                    } catch (e) {
                        console.error(e);
                    }
                }

                printfulCatalogProductVariants.push(...chunkResults);
                if (chunk !== last(variantChunks)) {
                    await new Promise(resolve => setTimeout(resolve, 60000));
                }
            }

            const productCategories = this.productCategories ?
                await backOff(async () => {
                    return await this.buildProductCategory(printfulCatalogProductVariants)
                }, this.backoffOptions)
                : [];


            function buildProductOptions() {
                const hasSize = printfulCatalogProductVariants.some(({size}) => size !== null);
                const hasColor = printfulCatalogProductVariants.some(({color}) => color !== null);

                return [
                    ...(hasSize ? [{title: "size"}] : []),
                    ...(hasColor ? [{title: "color"}] : []),
                ];
            }


            const productTags = Object.keys(
                printfulCatalogProductVariants.reduce((acc, variant) => {
                    const {size, color} = variant;
                    const {type} = variant.parentProduct;
                    if (size && !acc[size]) {
                        acc[size] = true;
                    }
                    if (color && !acc[color]) {
                        acc[color] = true;
                    }
                    if (type && !acc[type]) {
                        acc[type] = true;
                    }
                    return acc;
                }, {})
            ).map((value) => ({value: capitalize(value)}));


            const productObj: CreateProductInput = {
                title: printfulSyncProduct.name,
                handle: kebabCase(printfulSyncProduct.name),
                thumbnail: printfulSyncProduct.thumbnail_url,
                options: buildProductOptions(),
                images: this.buildProductImages(printfulSyncVariants),
                tags: this.productTags ? productTags : [],
                categories: productCategories,
                profile_id: defaultShippingProfile.id,
                external_id: printfulSyncProduct.id,
                sales_channels: [{id: defaultSalesChannel.id}],
                metadata: {
                    printful_id: printfulSyncProduct.id
                }
            };

            const productSizeGuide = await backOff(async () => {
                return await this.getProductSizeGuide(printfulSyncVariants[0].product.product_id)
            }, this.backoffOptions);


            const productVariantsObj = [];

            for (const chunk of variantChunks) {
                const chunkResults = [];
                for (const {currency, id, product, retail_price, sku, variant_id} of chunk) {
                    const getVariantOptions = async () => {
                        const {result: {variant: option}} = await this.printfulClient.get(`products/variant/${variant_id}`);
                        const options = {
                            ...(option.size ? {size: option.size} : {}),
                            ...(option.color ? {color: option.color} : {}),
                            ...(option.color_code ? {color_code: option.color_code} : {})
                        }

                        return {
                            title: productObj.title + (option.size ? ` - ${option.size}` : '') + (option.color ? ` / ${option.color}` : ''),
                            sku: sku,
                            external_id: id,
                            manage_inventory: false,
                            allow_backorder: true,
                            inventory_quantity: 100,
                            prices: [{
                                amount: this.convertToInteger(retail_price),
                                currency_code: currency.toLowerCase()
                            }],
                            metadata: {
                                printful_id: id,
                                printful_catalog_variant_id: variant_id,
                                printful_product_id: product.product_id,
                                printful_catalog_product_id: product.id,
                                size_tables: productSizeGuide?.size_tables ?? null,
                                ...options
                            }
                        }
                    }
                    const variantOptions = await backOff(getVariantOptions, this.backoffOptions);
                    chunkResults.push(variantOptions);
                }
                productVariantsObj.push(...chunkResults);

                if (chunk !== last(variantChunks)) {
                    await new Promise(resolve => setTimeout(resolve, 60000));
                }
            }

            const productToPush = {
                ...productObj,
                variants: productVariantsObj,
            }

            try {
                const createdProduct = await this.productService.create(productToPush);
                console.log(`${green('[medusa-plugin-printful]:')} Created product in Medusa: ${green(createdProduct.id)}`);
                if (createdProduct) {
                    console.log(`${blue("[medusa-plugin-printful]:")} Trying to add options to variants...`);
                    const {variants, options} = await this.productService.retrieve(createdProduct.id, {
                        relations: ['variants', 'options'],
                    });


                    for (const option of options) {
                        for (const variant of variants) {
                            if (option.title === 'size' || option.title === 'color') {
                                const value = variant.metadata[option.title];
                                if (value !== null) {
                                    const addedOption = await this.productVariantService.addOptionValue(variant.id, option.id, value);
                                    if (addedOption) {
                                        console.log(`${green('[medusa-plugin-printful]:')} Updated variant ${variant.id} option ${option.id} to ${value}! ✅`);
                                    }
                                }
                            }
                        }
                    }
                }
            } catch (e) {
                console.error(`${red("[medusa-plugin-printful]:")} There appeared an error trying to create '${red(productObj.title)}' in Medusa: `, e)
                throw e
            }
        })
    }


    async updateMedusaProduct(rawProduct: any, type: string, data: any) {

        return await this.atomicPhase_(async (manager) => {
            if (type === 'fromPrintful') {

                const {
                    sync_product: printfulProduct,
                    sync_variants: printfulProductVariant,
                    medusa_product: medusaProduct
                } = rawProduct;


                const variantsToDelete = medusaProduct.variants.filter(v => !printfulProductVariant.find(pv => pv.id === v.metadata.printful_id));

                if (variantsToDelete.length > 0) {
                    console.log(`${yellowBright("[medusa-plugin-printful]: ")} Deleting variants unsynced with Printful..`);
                    for (const variant of variantsToDelete) {
                        await this.deleteMedusaProductVariant(variant.id);
                    }
                }


                const printfulCatalogProductVariants: any[] = await backOff(async () => {
                    return await Promise.all(printfulProductVariant.map(async (v) => {
                        const {
                            result: {
                                variant,
                                product
                            }
                        } = await this.printfulClient.get(`products/variant/${v.variant_id}`);
                        return {
                            ...variant, parentProduct: product
                        }
                    }))
                }, this.backoffOptions);


                const productTags = Object.keys(
                    printfulCatalogProductVariants.reduce((acc, variant) => {
                        const {size, color} = variant;
                        const {type} = variant.parentProduct;
                        if (size && !acc[size]) {
                            acc[size] = true;
                        }
                        if (color && !acc[color]) {
                            acc[color] = true;
                        }
                        if (type && !acc[type]) {
                            acc[type] = true;
                        }
                        return acc;
                    }, {})
                ).map((value) => ({value: capitalize(value)}));

                const productCategories = this.productCategories ? await this.buildProductCategory(printfulCatalogProductVariants) : [];

                const productObj: UpdateProductInput = {
                    title: printfulProduct.name,
                    handle: kebabCase(printfulProduct.name),
                    external_id: printfulProduct.id,
                    tags: this.productTags ? productTags : [],
                    categories: this.productCategories ? productCategories : [],
                    metadata: {
                        printful_id: printfulProduct.id,
                    }
                }


                const productSizeGuide = await backOff(async () => {
                    return await this.getProductSizeGuide(printfulProductVariant[0].product.product_id)
                }, this.backoffOptions);

                const productVariantsObj = await Promise.all(printfulProductVariant.map(async (variant) => {

                    const {result: {variant: option}} = await backOff(async () => {
                        return await this.printfulClient.get(`products/variant/${variant.variant_id}`);
                    }, this.backoffOptions)

                    const medusaVariant = medusaProduct.variants.find(v => v.metadata.printful_id === variant.id);

                    if (medusaVariant !== undefined) {
                        const title = productObj.title + (option.size ? ` - ${option.size}` : '') + (option.color ? ` / ${option.color}` : '');
                        const metadata = {
                            medusa_id: medusaVariant.id,
                            printful_id: variant.id,
                            printful_catalog_variant_id: variant.variant_id,
                            size: option.size,
                            color: option.color,
                            color_code: option.color_code,
                            ...productSizeGuide
                        };

                        return {
                            title,
                            sku: variant.sku,
                            prices: [{
                                amount: this.convertToInteger(variant.retail_price),
                                currency_code: variant.currency.toLowerCase()
                            }],
                            metadata
                        };
                    } else {
                        console.log(`${blue('[medusa-plugin-printful]')} Creating new variant for product ${blue(medusaProduct.id)}...`);

                        const sizeOptionId = medusaProduct.options.find(o => o.title === 'size')?.id ?? null;
                        const colorOptionId = medusaProduct.options.find(o => o.title === 'color')?.id ?? null;

                        const options = [];
                        if (sizeOptionId) {
                            options.push({
                                option_id: sizeOptionId,
                                value: option.size
                            })
                        }
                        if (colorOptionId) {
                            options.push({
                                option_id: colorOptionId,
                                value: option.color
                            })
                        }

                        const newVariant = await this.productVariantService.create(medusaProduct.id, {
                            title: `${productObj.title} - ${option.size} / ${option.color}`,
                            sku: variant.sku,
                            inventory_quantity: 100,
                            allow_backorder: true,
                            manage_inventory: false,
                            external_id: variant.id,
                            options,
                            prices: [{
                                amount: this.convertToInteger(variant.retail_price),
                                currency_code: variant.currency.toLowerCase()
                            }],
                            metadata: {
                                printful_id: variant.id,
                                printful_catalog_variant_id: variant.variant_id,
                                size: option.size,
                                color: option.color,
                                color_code: option.color_code,
                                ...productSizeGuide
                            }
                        });

                        if (newVariant) {
                            await this.productVariantService.update(newVariant.id, {metadata: {medusa_id: newVariant.id}});
                            console.log(`${green("[medusa-plugin-printful]: ")} Created variant '${green(newVariant.title)}' in Medusa!`);

                            const title = productObj.title + (option.size ? ` - ${option.size}` : '') + (option.color ? ` / ${option.color}` : '');
                            const metadata = {
                                medusa_id: newVariant.id,
                                printful_id: variant.id,
                                printful_catalog_variant_id: variant.variant_id,
                                size: option.size,
                                color: option.color,
                                color_code: option.color_code,
                                ...productSizeGuide
                            };

                            return {
                                title,
                                sku: variant.sku,
                                prices: [{
                                    amount: this.convertToInteger(variant.retail_price),
                                    currency_code: variant.currency.toLowerCase()
                                }],
                                metadata
                            };

                        }
                    }
                }));


                try {
                    const updatedProduct = await this.productService.update(medusaProduct.id, productObj);
                    console.log(`${green("[medusa-plugin-printful]: ")} Updated '${green(updatedProduct.title)}' in Medusa! `);

                    const updatedVariants = await Promise.all(productVariantsObj.map(async (variant) => {
                        const variantToUpdate = await this.productVariantService.update(variant.metadata.medusa_id, {
                            title: variant.title,
                            sku: variant.sku,
                            metadata: variant.metadata,
                            external_id: variant.external_id,
                        });
                        if (variantToUpdate) {
                            return variantToUpdate;
                        }
                    }));

                    if (updatedVariants) {
                        console.log(`${green("[medusa-plugin-printful]: ")} Also updated '${updatedVariants.length}' variants from '${blue(updatedProduct.title)}' in Medusa!`);

                        const {variants, options} = await this.productService.retrieve(updatedProduct.id, {
                            relations: ['variants', 'options'],
                        });

                        try {
                            console.log(`${blue("[medusa-plugin-printful]: ")} Updating options on variants from ${blue(productObj.title)}...`);
                            const updateVariantOptionsPromises = variants.map(async (variant) => {
                                const optionValues = {};
                                options.forEach((option) => {
                                    if (option.title === 'size' || option.title === 'color') {
                                        optionValues[option.id] = variant.metadata[option.title];
                                    }
                                });
                                for (const optionId in optionValues) {
                                    try {
                                        await this.productVariantService.updateOptionValue(variant.id, optionId, optionValues[optionId]);
                                    } catch (e) {
                                        console.error(`${red("[medusa-plugin-printful]: ")} Error updating option value on variant ${red(variant.title)}: `, e.message);
                                    }
                                }
                            });
                            await Promise.all(updateVariantOptionsPromises);
                            console.log(`${green("[medusa-plugin-printful]: ")} Updated options on several variants from ${green(productObj.title)}!`);
                        } catch (e) {
                            console.error(`${red("[medusa-plugin-printful]: ")} Error updating options on variants from ${red(productObj.title)}:  `, e.message);
                        }

                        try {
                            console.log(`${blue("[medusa-plugin-printful]: ")} Updating prices on variants...`);
                            const updateVariantPricesPromises = productVariantsObj.map(async (variant) => {
                                await this.productVariantService.updateVariantPrices(variant.metadata.medusa_id, variant.prices);
                            });

                            await Promise.all(updateVariantPricesPromises);
                            console.log(`${green("[medusa-plugin-printful]: ")} Updated several variant prices from ${green(productObj.title)}!`);
                        } catch (e) {
                            console.error(`${red("[medusa-plugin-printful]: ")} There occurred an error while trying to update variant prices from ${red(productObj.title)}: `, e.message);
                        }
                    }
                } catch (e) {
                    console.error(`${red("[medusa-plugin-printful]: ")} Error while trying to update ${red(productObj.title)} in Medusa:`, e.message);
                }
                return "[medusa-plugin-printful]: Could not update product";
            }
        });
    }

    async buildProductCategory(printfulCatalogProduct: any) {
        const categories = printfulCatalogProduct.map(({parentProduct}) => {
            return {
                main_category_id: parentProduct.main_category_id,
            }
        })

        try {
            const result = await backOff(async () => {
                const {
                    code,
                    result
                } = await this.printfulClient.get(`categories/${categories[0].main_category_id}`)
                return {code, result};
            }, this.backoffOptions);

            if (result.code === 200) {
                console.log(`${blue('[medusa-plugin-printful]:')} Checking category alias for Printful category '${blue(result.result.category.title)}'..`)
                let categoryTitle = this.categoryAliases.exactMatch[result.result.category.title] || result.result.category.title;

                // If an exact alias was not found, check the inexactMatch aliases
                if (categoryTitle === result.result.category.title) {
                    for (const pattern in this.categoryAliases.inexactMatch) {
                        const regex = new RegExp(pattern.replace(/\*/g, '.*'), 'i'); // replace wildcard (*) with regex equivalent (.*)
                        if (regex.test(categoryTitle)) {
                            categoryTitle = this.categoryAliases.inexactMatch[pattern];
                            break;
                        }
                    }
                }
                if (categoryTitle !== result.result.category.title)
                    console.log(`${blue('[medusa-plugin-printful]:')} Category alias for Printful category '${blue(result.result.category.title)}' is '${blue(categoryTitle)}'`)

                const medusaCategory = await this.productCategoryService.listAndCount({q: categoryTitle});
                if (medusaCategory[0].length === 0) {
                    console.log(`${blue('[medusa-plugin-printful]:')} Category '${blue(categoryTitle)}' not found in Medusa! Attempting to create..`)
                    return await this.atomicPhase_(async (manager) => {
                        try {
                            const newCategory = await this.productCategoryService.create({name: categoryTitle})
                            console.log(`${green('[medusa-plugin-printful]:')} Successfully created category '${green(categoryTitle)}' in Medusa!`)
                            return [{id: newCategory.id}]
                        } catch (e) {
                            console.error(`${red('[medusa-plugin-printful]:')} Failed creating category '${red(categoryTitle)}' in Medusa: `, e);
                        }
                    })
                } else if (medusaCategory[0].length === 1) {
                    console.log(`${blue('[medusa-plugin-printful]:')} Category '${blue(categoryTitle)}' found in Medusa!`)
                    return [{id: medusaCategory[0][0].id}]
                }
                return []
            }
        } catch (e) {
            console.error(`${red('[medusa-plugin-printful]:')} Failed getting category from Printful, skipping this operation! `, e.result);
            return []
        }
    }


    async updatePrintfulProduct(data: any) {

        // get product from printful
        try {
            const {
                result: {sync_variants: initialSyncVariants}
            } = await this.printfulClient.get(`store/products/${data.external_id}`);

            const syncProduct = {
                external_id: data.id,
                name: data.name,
                id: initialSyncVariants.map((variant) => variant.metadata.printful_id),
                sku: data.sku
            }

            const syncVariants = data.variants.map((variant) => {
                console.log(data.variants)
                return {
                    id: variant.metadata.printful_id,
                    variant_id: variant.metadata.printful_catalog_variant_id,
                    external_id: variant.id,
                    sku: variant.sku,
                    name: variant.name,
                }
            })

            console.log("syncProduct: ", syncProduct)
            console.log("syncVariants: ", syncVariants)

        } catch (e: any) {
            console.log(red("There appeared to be an Error when trying to fetch the product from Printful!"), e)
        }

    }

    async getProductSizeGuide(printfulProductId) {
        try {
            const {result, code} = await this.printfulClient.get(`products/${printfulProductId}/sizes`, {unit: 'cm'});
            if (code === 200) {
                return result;
            }
        } catch (e: any) {
            console.log(e)
        }
    }

    async deleteMedusaProduct(productOrProductId: string) {
        try {
            await this.productService.delete(productOrProductId);
            console.log(green(`Successfully deleted product ${productOrProductId} in Medusa 🪦`))
        } catch (e) {
            console.log(`Failed to delete product ${productOrProductId} in Medusa 🙇‍♂️`)
        }
    }

    async deleteMedusaProductVariant(variantOrVariantId: string) {
        try {
            await this.productVariantService.delete(variantOrVariantId);
            console.log(`${greenBright("[medusa-plugin-printful]:")} Successfully deleted variant ${greenBright(variantOrVariantId)} in Medusa 🪦`)
        } catch (e) {
            console.log(`${red("[medusa-plugin-printful]:")} Failed to delete variant ${red(variantOrVariantId)} in Medusa 🙇‍♂️`)
        }
    }

    async getShippingRates(data) {
        console.log("Trying to get shipping rates for: ", data)
        const {recipient, items} = data;
        try {
            const shippingRates = await this.printfulClient.post("shipping/rates", {
                recipient,
                items,
                store_id: this.storeId
            });
            console.log(shippingRates)
            return shippingRates;
        } catch (e) {
            console.log(e)
            return 0
        }
    }

    async getCountryList() {
        const {result: countries} = await this.printfulClient.get("countries", {store_id: this.storeId});
        if (countries) return countries;
    }

    async getTaxCountriesList() {
        const {result: taxCountries} = await this.printfulClient.get("tax/countries", {store_id: this.storeId});
        if (taxCountries) return taxCountries;
    }

    async calculateTaxRate(recipient: any) {
        const {result: taxRate} = await this.printfulClient.post("tax/rates", {recipient}, {store_id: this.storeId});
        if (taxRate) return taxRate;
    }

    async estimateOrderCosts(recipient: any, items: any) {
        const {result: orderCosts} = await this.printfulClient.post("orders/estimate-costs", {
            recipient,
            items
        }, {store_id: this.storeId});

        return orderCosts;
    }

    async createPrintfulOrder(data: any) {
        console.log(`${blue('[medusa-plugin-printful]:')} Creating order with order_id '${blue(data.id)}' in Printful: `, data)

        const orderObj = {
            external_id: data.id,
            shipping: data.shipping_methods[0].shipping_option.data.id,
            recipient: {
                name: data.shipping_address.first_name + " " + data.shipping_address.last_name,
                address1: data.shipping_address.address_1,
                address2: data.shipping_address.address_2 ?? '',
                city: data.shipping_address.city,
                state_code: data.shipping_address.province,
                country_code: data.shipping_address.country_code,
                zip: data.shipping_address.postal_code,
                email: data.email,
                phone: data.shipping_address.phone ?? '',
            },
            items: data.items.map((item) => {
                return {
                    name: item.variant.title,
                    external_id: item.variant_id,
                    variant_id: item.variant.metadata.printful_catalog_variant_id,
                    sync_variant_id: item.variant.metadata.printful_id,
                    quantity: item.quantity,
                    price: `${(item.unit_price / 100).toFixed(2)}`.replace('.', '.'),
                    retail_price: `${(item.unit_price / 100).toFixed(2)}`.replace('.', '.'),
                }
            })
        }
        try {
            console.log(`${blue("[medusa-plugin-printful]:")} Trying to send the order to printful with the following data: `, orderObj)
            const order = await this.printfulClient.post("orders", {
                ...orderObj,
                store_id: this.storeId,
                confirm: this.confirmOrder
            });
            if (order.code === 200) {
                console.log(`${green("[medusa-plugin-printful]:")} Successfully created the order on Printful! `, order.result)
            }
        } catch (e) {
            console.log(`${red("[medusa-plugin-printful]:")} There was an error when trying to create the order on Printful! `, e)
        }
    }

    async cancelOrder(orderId: string | number) {
        try {
            console.log(`${yellow("[medusa-plugin-printful]:")} Trying to cancel order with id ${yellow(orderId)} on Printful`)
            const {result, code} = await this.printfulClient.delete(`orders/@${orderId}`, {store_id: this.storeId});

            if (code === 200) {
                console.log(`${green("[medusa-plugin-printful]:")} Order has been successfully canceled!`, result)
                return result;
            } else {
                console.log(`${red("[medusa-plugin-printful]:")} There was an error when trying to cancel the order on Printful! `, result)
                return result;
            }
        } catch (e) {
            console.log(`${red("[medusa-plugin-printful]:")} There was an error when trying to cancel the order on Printful! `, e)
        }
    }

    async confirmDraftForFulfillment(orderId: string | number) {
        const confirmedOrder = await this.printfulClient.post(`orders/${orderId}/confirm`, {store_id: this.storeId});
        console.log(confirmedOrder)
        return confirmedOrder;
    }

    async getOrderData(orderId: string | number) {
        const {result: orderData} = await this.printfulClient.get(`orders/${orderId}`, {store_id: this.storeId});
        return orderData;
    }

    async createMedusaFulfillment(order: CreateFulfillmentOrder, itemsToFulfill: FulFillmentItemType[]) {


        console.log("LENGTH", itemsToFulfill.length)

        const fulfillmentItems = await this.fulfillmentService.getFulfillmentItems_(order, itemsToFulfill);
        console.log("FULFILLMENT ITEMS", fulfillmentItems)


        return await this.fulfillmentService.createFulfillment(order, itemsToFulfill);
    }

    async createMedusaShipment(fulfillmentId: string, trackingLinks: {
        tracking_number: string
    }[], config: CreateShipmentConfig) {
        return await this.fulfillmentService.createShipment(fulfillmentId, trackingLinks, config);
    }
}

export default PrintfulService;
