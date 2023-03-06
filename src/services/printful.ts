import {OrderService, ProductService, TransactionBaseService} from "@medusajs/medusa"
import {EntityManager} from "typeorm"
import {PrintfulClient} from "printful-request"
import {
    CreateFulfillmentOrder,
    CreateShipmentConfig,
    FulFillmentItemType
} from "@medusajs/medusa/dist/types/fulfillment";


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

    constructor(container, options) {
        super(container);
        this.productService = container.productService;
        this.orderService = container.orderService;
        this.fulfillmentService = container.fulfillmentService;
        this.productVariantService = container.productVariantService;
        this.printfulClient = new PrintfulClient(options.printfulAccessToken);
        this.storeId = options.storeId;
    }


    async getSyncProduct(id: string) {
        const {
            result: product,
            code: code
        } = await this.printfulClient.get(`store/products/${id}`, {store_id: this.storeId});
        if (code !== 200) {
            console.error("Error getting product from Printful: ", product)
            return null;
        }
        return product;
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

    async updateProduct(productIdOrExternalId: string, data: any, type: string) {

        if (type === 'fromMedusa') {
            const {
                result: product,
                code: code
            } = await this.printfulClient.put(`store/products/${productIdOrExternalId}`, data, {store_id: this.storeId});
            if (code !== 200) {
                console.error("Error updating product in Printful: ", product)
                return null;
            }
            console.log("Updated product in Printful: ", product)
            return product;
        }

        if (type === 'fromPrintful') {
            const medusaProduct = await this.productService.retrieve(productIdOrExternalId, {relations: ["variants"]});
            if (medusaProduct) {
                const updatedProduct = await this.productService.update(productIdOrExternalId, data);
                if (updatedProduct) {
                    // TODO: fetch product with newest data for variants again - decide wether its needed or not

                    console.log("Updated product in Medusa: ", updatedProduct)

                    const variantsWithOptions = await Promise.all(medusaProduct.variants.map(async (variant) => {
                        const {result: {variant: options}} = await this.printfulClient.get(`products/variant/${variant.metadata.printful_id}`);
                        const toReturn = {
                            ...variant,
                            name: `${updatedProduct.title} - ${options.size} / ${options.color}`,
                            size: options.size,
                            color: options.color,
                            color_code: options.color_code,
                        }
                        console.log(toReturn)
                        return toReturn;
                    }));

                    const updatedVariants = await Promise.all(variantsWithOptions.map(async (variant) => {
                        console.log("Updating variant: ", variant)
                        const variantToUpdate = await this.productVariantService.update(variant.id, {
                            title: variant.name,
                            metadata: {
                                printful_id: variant.metadata.printful_id,
                                color: variant.color,
                                size: variant.size,
                                color_code: variant.color_code,
                            }
                        })
                        if (variantToUpdate) {
                            return variantToUpdate
                        }
                    }))

                    console.log(updatedVariants)

                }
            }
            return null;
        }
        return "Invalid type";
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

    async createOrder(data: any) {
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
            const order = await this.printfulClient.post("orders", {orderObj}, {
                store_id: this.storeId,
                confirm: false // dont skip draft phase
            });
            if (order.code === 200) {
                // TODO: Send confirmation email to customer
                console.log("Order created: ", order.result)
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