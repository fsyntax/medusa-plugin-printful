import {OrderService, ProductService, TransactionBaseService} from "@medusajs/medusa"
import {EntityManager} from "typeorm"
import {PrintfulClient} from "printful-request"
import {
    CreateFulfillmentOrder,
    CreateShipmentConfig,
    FulFillmentItemType
} from "@medusajs/medusa/dist/types/fulfillment";
import {CreateProductInput, UpdateProductInput} from "@medusajs/medusa/dist/types/product";
import {kebabCase} from "lodash";

interface CalculateTaxRate {
    recipient: {
        country_code: string,
        state_code: string,
        city: string,
        zip: string
    }
}

class PrintfulService extends TransactionBaseService {

    protected manager_: EntityManager
    protected transactionManager_: EntityManager
    private productService: ProductService;
    private orderService: OrderService;
    private printfulClient: any;
    private readonly storeId: any;
    private readonly printfulAccessToken: any;
    private fulfillmentService: any;
    private productVariantService: any;
    private salesChannelService: any;
    private shippingProfileService: any;

    constructor(container, options) {
        super(container);
        this.productService = container.productService;
        this.orderService = container.orderService;
        this.fulfillmentService = container.fulfillmentService;
        this.productVariantService = container.productVariantService;
        this.printfulClient = new PrintfulClient(options.printfulAccessToken);
        this.shippingProfileService = container.shippingProfileService;
        this.salesChannelService = container.salesChannelService;
        this.storeId = options.storeId;
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
        let num = Math.round(parseFloat(numStr) * 100);
        return num;
    }


    async createProductInMedusa(rawProduct: any) {


        const defaultShippingProfile = await this.shippingProfileService.retrieveDefault();
        const defaultSalesChannel = await this.salesChannelService.retrieveDefault();

        const {
            sync_product: printfulProduct,
            sync_variants: printfulProductVariant

        } = rawProduct;

        // const {result: {variants: productOptions}} = await this.printfulClient.get(`products/${printfulProduct.id}`);

        // filter out options that don't exist or are empty
        // const options = [
        //     productOptions.some(v => !!v.size) ? {title: "size"} : null,
        //     productOptions.some(v => !!v.color) ? {title: "color"} : null,
        // ].filter(Boolean);

        const images = printfulProductVariant.flatMap(variant => (
            variant.files
                .filter(file => file.type === 'preview')
                .map(file => file.preview_url)
        )).filter((url, index, arr) => arr.indexOf(url) === index && url !== null && url !== '');

        const productObj: CreateProductInput = {
            title: printfulProduct.name,
            handle: kebabCase(printfulProduct.name),
            thumbnail: printfulProduct.thumbnail_url,
            options: [{title: "size"}, {title: "color"}],
            profile_id: defaultShippingProfile.id,
            external_id: printfulProduct.id,
            sales_channels: [{id: defaultSalesChannel.id}],
            metadata: {
                printful_id: printfulProduct.id
            }
        };

        if (images.length > 0) {
            productObj.images = images
        }


        const productVariantsObj = await Promise.all(printfulProductVariant.map(async (variant) => {
            const {result: {variant: option}} = await this.printfulClient.get(`products/variant/${variant.variant_id}`);

            const productSizeGuide = await this.getProductSizeGuide(variant.product.product_id);

            return {
                title: productObj.title + (option.size ? ` - ${option.size}` : '') + (option.color ? ` / ${option.color}` : ''),
                sku: variant.sku,
                external_id: variant.id,
                manage_inventory: false,
                allow_backorder: true,
                inventory_quantity: 100,
                prices: [{
                    amount: this.convertToInteger(variant.retail_price),
                    currency_code: variant.currency.toLowerCase()
                }],
                metadata: {
                    printful_id: variant.id,
                    size: option.size,
                    color: option.color,
                    color_code: option.color_code,
                    ...productSizeGuide
                }
            }
        }))
        const productToPush = {
            ...productObj,
            variants: productVariantsObj,
        }
        try {
            const createdProduct = await this.productService.create(productToPush);
            console.log("Created product in Medusa: 👹", productToPush)
            if (createdProduct) {
                console.log("Trying to add options to variants...⚙️")
                const {variants, options} = await this.productService.retrieve(createdProduct.id, {
                    relations: ['variants', 'options'],
                });

                for (const option of options) {
                    for (const variant of variants) {
                        if (option.title === 'size' || option.title === 'color') {
                            const value = variant.metadata[option.title];
                            console.log(`Variant ${variant.id}: option ${option.title} = ${value} ℹ️`);
                            // if (value !== undefined && option.values && value !== option.values[0].value) {
                            if (value !== null) {
                                console.log(`Updating variant ${variant.id} option ${option.id} to ${value}.. ⚙️`);
                                const addedOption = await this.productVariantService.addOptionValue(variant.id, option.id, value);
                                if (addedOption) {
                                    console.log(`Updated variant ${variant.id} option ${option.id} to ${value}! ✅`);
                                }
                            }
                            // }
                        }
                    }
                }
            }
        } catch (e) {
            console.error("Error creating product in Medusa: ", e)
        }
    }

    async updateProduct(rawProduct: any, type: string, data: any) {

        if (type === 'fromMedusa') {
            const {
                result: product,
                code: code
            } = await this.printfulClient.put(`store/products/${rawProduct}`, data, {store_id: this.storeId});
            if (code !== 200) {
                console.error("Error updating product in Printful: ", product)
                return null;
            }
            console.log("Updated product in Printful: ", product)
            return product;
        }


        if (type === 'fromPrintful') {

            const {
                sync_product: printfulProduct,
                sync_variants: printfulProductVariant

            } = rawProduct;

            let medusaProduct = await this.productService.retrieveByExternalId(printfulProduct.id, {relations: ["variants", "options"]});
            console.log(printfulProductVariant)
            const variantToDelete = medusaProduct.variants.filter(v => !printfulProductVariant.find(pv => pv.id === v.metadata.printful_id));

            // remove variants that are not in printful
            if (variantToDelete.length > 0) {
                console.log("Deleting variants unsynced with Printful...🚮")
                await Promise.all(variantToDelete.map(async (variant) => {
                    await this.productVariantService.delete(variant.id).then(deleted => {
                        console.log(`Deleted variant ${variant.id}! ✅`)
                    })
                }))
                console.log("Deleted variants unsynced with Printful! ✅ \n Refetching main product...⚙️")
                medusaProduct = await this.productService.retrieveByExternalId(printfulProduct.id, {relations: ["variants", "options"]});

            }

            const images = printfulProductVariant.flatMap(variant => (
                variant.files
                    .filter(file => file.type === 'preview')
                    .map(file => file.preview_url)
            )).filter((url, index, arr) => arr.indexOf(url) === index);


            const productObj: UpdateProductInput = {
                title: printfulProduct.name,
                handle: kebabCase(printfulProduct.name),
                thumbnail: printfulProduct.thumbnail_url,
                external_id: printfulProduct.id,
                images: images,
                metadata: {
                    printful_id: printfulProduct.id,
                }
            }
            const productVariantsObj = await Promise.all(printfulProductVariant.map(async (variant) => {
                const {result: {variant: option}} = await this.printfulClient.get(`products/variant/${variant.variant_id}`);

                const productSizeGuide = await this.getProductSizeGuide(variant.product.product_id);

                // check if variant exists in Medusa
                const medusaVariant = medusaProduct.variants.find(v => v.metadata.printful_id === variant.id);

                if (medusaVariant !== undefined) {
                    return {
                        title: productObj.title + (option.size ? ` - ${option.size}` : '') + (option.color ? ` / ${option.color}` : ''),
                        sku: variant.sku,
                        external_id: variant.id,
                        prices: [{
                            amount: this.convertToInteger(variant.retail_price),
                            currency_code: variant.currency.toLowerCase()
                        }],
                        metadata: {
                            medusa_id: medusaVariant.id,
                            printful_id: variant.id,
                            size: option.size,
                            color: option.color,
                            color_code: option.color_code,
                            ...productSizeGuide
                        }
                    }

                } else {
                    console.log(`Variant with SKU '${variant.sku}' not found in Medusa! Attempting to create...`)
                    const newVariant = await this.productVariantService.create(medusaProduct.id, {
                        title: `${productObj.title} - ${option.size} / ${option.color}`,
                        sku: variant.sku,
                        inventory_quantity: 100,
                        allow_backorder: true,
                        manage_inventory: false,
                        external_id: variant.id,
                        // return the correct option id and value
                        options: [
                            {
                                option_id: medusaProduct.options.find(o => o.title === 'size').id,
                                value: option.size
                            },
                            {
                                option_id: medusaProduct.options.find(o => o.title === 'color').id,
                                value: option.color
                            }
                        ],
                        prices: [{
                            amount: this.convertToInteger(variant.retail_price),
                            currency_code: variant.currency.toLowerCase()
                        }],
                        metadata: {
                            printful_id: variant.id,
                            size: option.size,
                            color: option.color,
                            color_code: option.color_code
                        }

                    })
                    if (newVariant) {
                        await this.productVariantService.update(newVariant.id, {metadata: {medusa_id: newVariant.id}});
                        console.log(`Successfully created variant ${newVariant.id} for product ${medusaProduct.id}! 🎉`)
                    }
                }


            }))

            try {
                const updatedProduct = await this.productService.update(medusaProduct.id, productObj);
                console.log(`Updated '${updatedProduct.title}' in Medusa! 🎉`)
                if (updatedProduct) {
                    console.log("Trying to update variants ... ⚙️")
                    const updatedVariants = await Promise.all(productVariantsObj.map(async (variant) => {
                        const variantToUpdate = await this.productVariantService.update(variant.metadata.medusa_id, {
                            title: variant.title,
                            sku: variant.sku,
                            metadata: variant.metadata,
                            external_id: variant.external_id,
                        })
                        if (variantToUpdate) {
                            return variantToUpdate
                        }
                    }))

                    if (updatedVariants) {
                        console.log(`Also updated '${updatedVariants.length}' variants from '${updatedProduct.title}' in Medusa! 🥳`)
                        console.log("Trying to update options from variants...⚙️")
                        const {variants, options} = await this.productService.retrieve(updatedProduct.id, {
                            relations: ['variants', 'options'],
                        });

                        for (const option of options) {
                            for (const variant of variants) {
                                if (option.title === 'size' || option.title === 'color') {
                                    const value = variant.metadata[option.title];
                                    if (value !== null) {

                                        const addedOption = await this.productVariantService.updateOptionValue(variant.id, option.id, value);
                                        if (addedOption) {
                                            console.log(`Updated variant ${variant.id} option ${option.id} to ${value}! ✅`);
                                        }
                                    }
                                }
                            }
                        }
                        try {
                            console.log("Lastly, trying to update prices on variants...⚙️")
                            await Promise.all(productVariantsObj.map(async (variant) => {
                                await this.productVariantService.updateVariantPrices(variant.metadata.medusa_id, variant.prices)
                            }))
                            console.log(`Updated prices on several variants! 💵`)
                        } catch (e) {
                            console.error("Error updating prices on variants: ", e)
                        }
                    }
                }
            } catch (e) {
                console.error("Error creating product in Medusa: ", e)
            }
        }
        return "Could not update product";
    }

    async getProductSizeGuide(printfulProductId) {
        console.log("Trying to get size guide for product: ", printfulProductId)
        try {
            const {result, code} = await this.printfulClient.get(`products/${printfulProductId}/sizes`, {unit: 'cm'});
            if (code === 200) {
                return result;
            }
        } catch (e: any) {
            console.log(e)
        }
    }

    async deleteProduct(productOrProductId: string) {
        try {
            await this.productService.delete(productOrProductId);
            console.log(`Successfully deleted product ${productOrProductId} in Medusa 🪦`)
        } catch (e) {
            console.log(`Failed to delete product ${productOrProductId} in Medusa 🙇‍♂️`)
        }
    }

    async getShippingRates(data) {
        const {recipient, items} = data;
        const {result: shippingRates} = await this.printfulClient.post("shipping/rates", {
            recipient,
            items
        }, {store_id: this.storeId});
        return shippingRates.result;
    }

    async getCountryList() {
        const {result: countries} = await this.printfulClient.get("countries", {store_id: this.storeId});
        if (countries) return countries;
    }

    async getTaxCountriesList() {
        const {result: taxCountries} = await this.printfulClient.get("tax/countries", {store_id: this.storeId});
        if (taxCountries) return taxCountries;
    }

    async calculateTaxRate(recipient: CalculateTaxRate) {
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
        console.log("Preparing order data for Printful... 📦")
        const orderObj = {
            external_id: data.id,
            recipient: {
                name: data.shipping_address.first_name + " " + data.shipping_address.last_name,
                address1: data.shipping_address.address_1,
                address2: data.shipping_address.address_2,
                city: data.shipping_address.city,
                state_code: data.shipping_address.province,
                country_code: data.shipping_address.country,
                zip: data.shipping_address.zip,
                email: data.email
            },
            items: data.items.map((item) => {
                return {
                    id: item.external_id,
                    variant_id: item.variant.id,
                    quantity: item.quantity,
                    price: item.total,
                }
            })
        }
        try {
            console.log("Sending order to Printful with the following data... ➡️", orderObj)
            const order = await this.printfulClient.post("orders", {orderObj}, {
                store_id: this.storeId,
                confirm: false // dont skip draft phase
            });
            if (order.code === 200) {
                // TODO: Send confirmation email to customer
                console.log("Order successfully sent to Printful! 📬🥳: ", order.result)
            }


        } catch (e) {
            console.log(e)
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

    async createMedusaShipment(fulfillmentId: string, trackingLinks: { tracking_number: string }[], config: CreateShipmentConfig) {
        return await this.fulfillmentService.createShipment(fulfillmentId, trackingLinks, config);
    }
}

export default PrintfulService;