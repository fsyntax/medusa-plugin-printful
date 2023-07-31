import {FulFillmentItemType} from "@medusajs/medusa/dist/types/fulfillment";
import {blue, blueBright, green, greenBright, red} from "colorette";


class PrintfulSubscriber {
    private printfulSyncService: any;
    private productService: any;
    private orderService_: any;
    private printfulFulfillmentService: any;
    private fulfillmentService: any;
    private printfulService: any;
    private productVariantService: any;
    private paymentService: any;
    private productsQueueService: any;

    constructor({
                    eventBusService,
                    orderService,
                    printfulSyncService,
                    productService,
                    printfulFulfillmentService,
                    fulfillmentService,
                    printfulService,
                    productVariantService,
                    paymentService,
        productsQueueService
                }) {
        this.printfulSyncService = printfulSyncService;
        this.productService = productService
        this.printfulFulfillmentService = printfulFulfillmentService;
        this.orderService_ = orderService;
        this.fulfillmentService = fulfillmentService;
        this.printfulService = printfulService;
        this.productVariantService = productVariantService;
        this.paymentService = paymentService;
        this.productsQueueService = productsQueueService;

        eventBusService.subscribe("printful.product_updated", this.handlePrintfulProductUpdated);
        eventBusService.subscribe("printful.product_deleted", this.handlePrintfulProductDeleted);
        eventBusService.subscribe("printful.order_updated", this.handlePrintfulOrderUpdated);
        eventBusService.subscribe("printful.order_canceled", this.handlePrintfulOrderCanceled);

        eventBusService.subscribe("printful.package_shipped", this.handlePrintfulPackageShipped);

        eventBusService.subscribe("order.placed", this.handleOrderCreated);
        eventBusService.subscribe("order.updated", this.handleOrderUpdated);
        eventBusService.subscribe("order.completed", this.handleOrderCompleted);
        eventBusService.subscribe("order.canceled", this.handleOrderCanceled);
    }

    handlePrintfulProductUpdated = async (data: any) => {
        console.log(`${blueBright("[medusa-plugin-printful]:")} Received a webhook event from Printful! [${blueBright(data.type)}]: \n`, data)

         this.productsQueueService.addJob(data.data.sync_product);
        // try {
        //     const {
        //         sync_product: printfulProduct,
        //         sync_variants: printfulProductVariants
        //     } = await this.printfulService.getSyncProduct(data.data.sync_product.id);
        //
        //     const listedProducts = await this.productService.list({external_id: printfulProduct.id});
        //     if (listedProducts.length === 1) {
        //         const medusaProduct = await this.productService.retrieve(listedProducts[0].id, {relations: ["variants", "options"]});
        //         return await this.printfulService.updateMedusaProduct({
        //             sync_product: printfulProduct,
        //               sync_variants: printfulProductVariants,
            //             medusa_product: medusaProduct
        //         }, "fromPrintful", null);
        //
        //     } else if (listedProducts.length > 1) {
        //         console.log(`${red("[medusa-plugin-printful]:")} Found multiple products with the same external id '${red(printfulProduct.id)}' in Medusa, this should not happen!`)
        //         return false;
        //     } else if (listedProducts.length === 0) {
        //         console.log(`${blueBright("[medusa-plugin-printful]:")} Product with external id '${blueBright(printfulProduct.id)}' not found in Medusa, creating new product...`)
        //         try {
        //             return await this.printfulService.createMedusaProduct({
        //                 sync_product: printfulProduct,
        //                 sync_variants: printfulProductVariants
        //             })
        //         } catch (e) {
        //             console.log(`${red("[medusa-plugin-printful]:")} Failed to create product in Medusa: `, e)
        //         }
        //
        //     }
        // } catch (e: any) {
        //     console.log(`${red("[medusa-plugin-printful]:")} Failed to update product in Medusa: `, e)
        // }


    }

    handlePrintfulProductDeleted = async (data: any) => {
        console.log(`${blueBright("[medusa-plugin-printful]:")} Received a webhook event from Printful! [${blueBright(data.type)}]: \n`, data)
        const existingProduct = await this.productService.retrieveByExternalId(data.data.sync_product.id);
        if (!existingProduct) {
            console.log(`${blue("[medusa-plugin-printful]:")} Product with external id '${blue(data.data.sync_product.id)}' not found in Medusa, nothing to delete!`)
            return;
        }
        await this.productService.delete(existingProduct.id)
        console.log(`${green("[medusa-plugin-printful]:")} Deleted product with external id '${green(data.data.sync_product.id)}' from Medusa! RIP!`)


    }

    handlePrintfulOrderUpdated = async (data: any) => {
        console.log(`${blueBright("[medusa-plugin-printful]:")} Received a webhook event from Printful! [${blueBright(data.type)}]: \n`, data)

        const order = await this.orderService_.retrieve(data.data.order.external_id, {relations: ["items", "fulfillments", "payments", "shipping_methods", "billing_address"]});

        if (order) {
            switch (data.data.order.status) {
                case "draft":
                    console.log(`${blue("[medusa-plugin-printful]:")} Order ${blue(data.data.order.external_id)} is a draft in Printful!`)
                    break;
                case "pending":
                    console.log(`${blue("[medusa-plugin-printful]:")} Order ${blue(data.data.order.external_id)} has been submitted for fulfillment in Printful!`)
                    try {
                        console.log(`${blue("[medusa-plugin-printful]:")} Capturing payment for order ${blue(data.data.order.external_id)}...`)
                        const capturePayment = await this.orderService_.capturePayment(order.id)
                        if (capturePayment) {
                            console.log(`${green("[medusa-plugin-printful]:")} Successfully captured the payment: `, capturePayment)
                            break;
                        }
                    } catch (e) {
                        console.log(red(e))
                        break;
                    }
                    break;
                case "inprocess":
                    console.log(`${blue("[medusa-plugin-printful]:")} Order ${blue(data.data.order.external_id)} is being fulfilled in Printful!`)

                    try {
                        const itemsToFulfill: FulFillmentItemType[] = order.items.map(i => ({
                            item_id: i.id,
                            quantity: i.quantity
                        }))

                        const fulfillment = await this.orderService_.createFulfillment(order.id, itemsToFulfill)
                        if (fulfillment) {
                            console.log(`${green("[medusa-plugin-printful]:")} Successfully created fulfillment: `, fulfillment)
                            break;
                        }
                    } catch (e) {
                        console.log(e)
                        break;
                    }
                    break;
                case "canceled":
                    // Handle canceled or archived orders
                    try {
                        return await this.orderService_.cancel(order.id)
                    } catch (e) {
                        console.log(e)
                        throw new Error("Order not found")
                    }
                case "fulfilled":
                    // the order has been successfully fulfilled and shipped
                    // ignoring this event, as we are using the "shipped" event instead
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
        console.log(`${blueBright("[medusa-plugin-printful]:")} Received a webhook event from Printful! [${blueBright(data.type)}]: \n`, data)
        try {
            console.log(`${blue("[medusa-plugin-printful]:")} Order ${blue(data.data.order.external_id)} has been canceled in Printful! Trying to cancel in Medusa aswell..`)
            const order = await this.orderService_.retrieve(data.data.order.external_id);
            if (order) {
                const canceld = await this.orderService_.cancelOrder(order.id)
                if (canceld)
                    console.log(`${green("[medusa-plugin-printful]:")} Order ${blue(data.data.order.external_id)} has been successfully canceled in Medusa!`)
            }
        } catch (e) {
            console.log(`${red("[medusa-plugin-printful]:")} Failed to cancel order in Medusa: `, e)
        }


    }
    handlePrintfulPackageShipped = async (data: any) => {

        console.log(`${blueBright("[medusa-plugin-printful]:")} Received a webhook event from Printful! [${blueBright(data.type)}]: \n`, data)
        const orderData = data.data.order;
        const shipmentData = data.data.shipment;

        const order = await this.orderService_.retrieve(orderData.external_id, {relations: ["items", "fulfillments", "shipping_methods"]});
        if (order) {
            console.log(`${blue("[medusa-plugin-printful]:")} Order ${blue(orderData.external_id)} has been found, preparing to create a shipment in Medusa!`)
            try {
                const trackingLinks = [{url: shipmentData.tracking_url, tracking_number: shipmentData.tracking_number}]
                console.log(`${blue("[medusa-plugin-printful]:")} Tracking links: `, trackingLinks)
                const createShipment = await this.orderService_.createShipment(order.id, order.fulfillments[0].id, trackingLinks)
                if (createShipment) {
                    console.log(`${greenBright("[medusa-plugin-printful]:")} Successfully created shipment: `, createShipment)
                }
            } catch (e) {
                console.log(`${red("[medusa-plugin-printful]:")} Error creating shipment: `, e)
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
        const order = await this.orderService_.retrieve(data.id, { relations: ["items","items.variant", "shipping_methods", "shipping_address"] });
        console.log("Retrieved order: ", order)
        if (order) {
            await this.printfulService.createPrintfulOrder(order)
        }
    }

    handleProductUpdated = async (data: any) => {
        console.log(blue("From handleProductUpdated - processing following event:"), blue(data))
        const product = await this.productService.retrieve(data.id, {relations: ["variants"]})
        if (product) {
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
