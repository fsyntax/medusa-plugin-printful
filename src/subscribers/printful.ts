import {FulFillmentItemType} from "@medusajs/medusa/dist/types/fulfillment";
import {bgGreenBright, blue, blueBright, green, greenBright, red} from "colorette";


class PrintfulSubscriber {
    private printfulSyncService: any;
    private productService: any;
    private orderService_: any;
    private printfulFulfillmentService: any;
    private fulfillmentService: any;
    private printfulService: any;
    private productVariantService: any;
    private paymentService: any;

    constructor({
                    eventBusService,
                    orderService,
                    printfulSyncService,
                    productService,
                    printfulFulfillmentService,
                    fulfillmentService,
                    printfulService,
                    productVariantService,
                    paymentService
                }) {
        this.printfulSyncService = printfulSyncService;
        this.productService = productService
        this.printfulFulfillmentService = printfulFulfillmentService;
        this.orderService_ = orderService;
        this.fulfillmentService = fulfillmentService;
        this.printfulService = printfulService;
        this.productVariantService = productVariantService;
        this.paymentService = paymentService;

        eventBusService.subscribe("printful.product_updated", this.handlePrintfulProductUpdated);
        eventBusService.subscribe("printful.product_deleted", this.handlePrintfulProductDeleted);
        eventBusService.subscribe("printful.order_updated", this.handlePrintfulOrderUpdated);
        eventBusService.subscribe("printful.order_canceled", this.handlePrintfulOrderCanceled);

        eventBusService.subscribe("printful.package_shipped", this.handlePrintfulPackageShipped);

        eventBusService.subscribe("order.placed", this.handleOrderCreated);
        eventBusService.subscribe("order.updated", this.handleOrderUpdated);
        eventBusService.subscribe("order.completed", this.handleOrderCompleted);
        eventBusService.subscribe("order.canceled", this.handleOrderCanceled);
        eventBusService.subscribe("product.updated", this.handleProductUpdated);
    }

    handlePrintfulProductUpdated = async (data: any) => {
        console.log("From handlePrintfulProductUpdated subscriber:", data)

        try {
            const {
                sync_product: printfulProduct,
                sync_variants: printfulProductVariants
            } = await this.printfulService.getSyncProduct(data.data.sync_product.id);

            const listedProducts = await this.productService.list({external_id: printfulProduct.id});
            if (listedProducts.length === 1) {
                const medusaProduct = await this.productService.retrieve(listedProducts[0].id, {relations: ["variants", "options"]});
                const updated = await this.printfulService.updateMedusaProduct({
                    sync_product: printfulProduct,
                    sync_variants: printfulProductVariants,
                    medusa_product: medusaProduct
                }, "fromPrintful", null);
                return updated;
            } else if (listedProducts.length > 1) {
                console.log(`Found multiple products with id ${printfulProduct.id} in Medusa, this shouldn't happen!`)
                return false;
            } else if (listedProducts.length === 0) {
                console.log(`Couldn't update product with id ${printfulProduct.id} in Medusa, does it exist yet? Attempting to create it! \n`)
                try {
                    const created = await this.printfulService.createMedusaProduct({
                        sync_product: printfulProduct,
                        sync_variants: printfulProductVariants
                    })
                    return created;
                } catch (e) {
                    console.log("Error creating product in Medusa", e)
                }

            }
        } catch (e: any) {
            console.log("Error updating product in Medusa", e)
        }


    }

    handlePrintfulProductDeleted = async (data: any) => {
        console.log("From subscriber - processing following event:", data)
        const existingProduct = await this.productService.retrieveByExternalId(data.data.sync_product.id);
        if (!existingProduct) {
            console.log(`Failed to delete product ${data.data.sync_product.name} in Medusa 🙇‍♂️`)
            return;
        }
        await this.productService.delete(existingProduct.id)
        console.log(`Successfully deleted product ${existingProduct.id} in Medusa 🪦`)


    }

    handlePrintfulOrderUpdated = async (data: any) => {
        console.log(blue("From handlePrintfulOrderUpdated - processing following event: "), data)
        // data.data.order.external_id
        //  data.data.order.status = "inprocess"
        const order = await this.orderService_.retrieve(data.data.order.external_id, {relations: ["items", "fulfillments", "payments", "shipping_methods", "billing_address"]});
        if (order) {
            switch (data.data.order.status) {
                case "draft":
                    // the order has been created, but not yet submitted for fulfillment
                    console.log("Created draft order in Printful")
                    break;
                case "pending":
                    // the order has been submitted for fulfillment, but not yet processed / now it's time to capture the payment
                    console.log(blue(`Order ${order.id} is pending in Printful!`))
                    try {
                        console.log(blue("Trying to capture payments..."))
                        const capturePayment = await this.orderService_.capturePayment(order.id)
                        if (capturePayment) {
                            console.log(green("Captured payment from order: "), capturePayment)
                            break;
                        }
                    } catch (e) {
                        console.log(red(e))
                        break;
                    }
                    break;
                case "inprocess":
                    // the order is being fulfilled
                    console.log(green(`Order ${greenBright(`${order.id}`)} is fulfilled in Printful!`))

                    try {
                        const itemsToFulfill: FulFillmentItemType[] = order.items.map(i => ({
                            item_id: i.id,
                            quantity: i.quantity
                        }))

                        const fulfillment = await this.orderService_.createFulfillment(order.id, itemsToFulfill)
                        if (fulfillment) {
                            console.log(green("Fulfillment created: ", ), green(fulfillment) )
                            break;
                        }
                    } catch (e) {
                        console.log(e)
                        break;
                    }
                    break;
                case "canceled" || "archived":
                    // Handle canceled or archived orders
                    try {
                        return await this.orderService_.cancel(order.id)
                    } catch (e) {
                        console.log(e)
                        throw new Error("Order not found")
                    }
                    break;
                case "fulfilled":
                    // the order has been successfully fulfilled and shipped
                    console.log(blue("Order fulfilled in Printful"))
                    break;
                case "reshipment":
                case "partially_shipped":
                case "returned":
                    // Handle other status values
                    break;
                default:
                    // Handle unknown status values
                    break;
            }


        }

    }

    handlePrintfulOrderCanceled = async (data: any) => {
        console.log("From handlePrintfulOrderCanceled - processing following event:", data)
        // try {
        //     const order = await this.orderService_.retrieve(data.data.order.external_id);
        //     if (order) {
        //         return await this.orderService_.cancelOrder(order.id)
        //     }
        // } catch (e) {
        //     console.log(e)
        //     throw new Error("Order not found")
        // }


    }
    handlePrintfulPackageShipped = async (data: any) => {

        console.log(blue("From subscriber - processing following event: "), blue(data))
        const orderData = data.data.order;
        const shipmentData = data.data.shipment;

        const order = await this.orderService_.retrieve(orderData.external_id, {relations: ["items", "fulfillments", "shipping_methods"]});
        if (order) {
            try {
                const trackingLinks = [{url: shipmentData.tracking_url, tracking_number: shipmentData.tracking_number}]
                const createShipment = await this.orderService_.createShipment(order.id, order.fulfillments[0].id, trackingLinks)
                if (createShipment) {
                    console.log(green("Created shipment in Medusa: "), green(createShipment))
                }
            } catch (e) {
                console.log(red(e))
            }
        }

    }

    handleMedusaProductUpdated = async (data: any) => {
        console.log("From subscriber - processing handleMedusaProductUpdated: -- NOT YET IMPLEMENTED", data)
    }

    handleMedusaVariantUpdated = async (data: any) => {
        console.log("From subscriber - processing handleMedusaVariantUpdated: -- NOT YET IMPLEMENTED", data)
    }

    handleOrderCanceled = async (data: any) => {
        console.log("From subscriber - processing handleOrderCanceled:", data)
        try {
            await this.printfulService.cancelOrder(data.id)

        } catch (e) {
            console.log(e)
            throw new Error("Order not found")
        }
    }
    handleOrderCreated = async (data: any) => {
        console.log("From handleOrderCreated - processing following event: ", data)
        const order = await this.orderService_.retrieve(data.id, {relations: ["items", "shipping_methods", "shipping_address"]});
        console.log("Retrieved order: ", order)
        if (order) {
            await this.printfulService.createPrintfulOrder(order)
        }
    }

    handleProductUpdated = async (data: any) => {
        console.log(blue("From handleProductUpdated - processing following event:"), blue(data))
        const product = await this.productService.retrieve(data.id, {relations: ["variants"]})
        if(product) {
            console.log(blue(`Retrieved '${blueBright(product.title)}, trying to update..': `), blue(product))
            return await this.printfulService.updatePrintfulProduct(product);
        }
    }

    handleOrderUpdated = async (data: object) => {
        console.log("From subscriber - processing following event:", data)

    }

    handleOrderCompleted = async (data: object) => {
        console.log("From subscriber - processing following event:", data)
    }

    handlePaymentCaptured = async (order: any) => {
        console.log("From subscriber - processing following event:", order)
        const approveOrder = await this.printfulFulfillmentService.confirmDraftForFulfillment(order.id);
        if (approveOrder) {
            console.log(approveOrder)
        }
    }
}

export default PrintfulSubscriber;