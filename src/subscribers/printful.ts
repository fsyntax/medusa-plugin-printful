import {kebabCase} from "lodash";
import {CreateFulfillmentOrder, FulFillmentItemType} from "@medusajs/medusa/dist/types/fulfillment";

class PrintfulSubscriber {
    private printfulSyncService: any;
    private productService: any;
    private orderService_: any;
    private printfulFulfillmentService: any;
    private fulfillmentService: any;

    constructor({
                    eventBusService,
                    orderService,
                    printfulSyncService,
                    productService,
                    printfulFulfillmentService,
                    fulfillmentService
                }) {
        this.printfulSyncService = printfulSyncService;
        this.productService = productService
        this.printfulFulfillmentService = printfulFulfillmentService;
        this.orderService_ = orderService;
        this.fulfillmentService = fulfillmentService;

        eventBusService.subscribe("printful.product_updated", this.handlePrintfulProductUpdated);
        eventBusService.subscribe("printful.product_deleted", this.handlePrintfulProductDeleted);
        eventBusService.subscribe("printful.order_updated", this.handlePrintfulOrderUpdated);
        eventBusService.subscribe("printful.package_shipped", this.handlePrintfulPackageShipped);

        eventBusService.subscribe("order.placed", this.handleOrderCreated);
        eventBusService.subscribe("order.updated", this.handleOrderUpdated);
        eventBusService.subscribe("order.completed", this.handleOrderCompleted);
        eventBusService.subscribe("payment.payment_captured", this.handlePaymentCaptured);
    }

    handlePrintfulProductUpdated = async (data: any) => {
        console.log("From handlePrintfulProductUpdated subscriber:", data)
        const existingProduct = await this.productService.list({external_id: data.id});

        if (existingProduct.length > 0) {
            await this.productService.update(existingProduct[0].id, {title: data.name, handle: kebabCase(data.name)});
        } else {
            console.error(`Product with id ${data.id} not found in Medusa, you might want to sync your products`)
        }
    }

    handlePrintfulProductDeleted = async (data: any) => {
        console.log("From subscriber - processing following event:", data)
        const existingProduct = await this.productService.list({external_id: data.data.sync_product.id});
        if (existingProduct.length === 0) {
            console.log(`Couldn't delete product with id ${data.data.sync_product.id} in Medusa, it does not exist`)
            return;
        }
        await this.productService.delete(existingProduct.id)

    }

    handlePrintfulOrderUpdated = async (data: any) => {
        console.log("From handlePrintfulOrderUpdated - processing following event:", data)
        const testOrderId = "order_01GTJ15739CSGA3VZ7P56J111B"
        // data.data.order.external_id
        data.data.order.status = "inprocess";
        const order = await this.orderService_.retrieve(testOrderId, {relations: ["items", "fulfillments", "payments", "shipping_methods", "billing_address"]});
        if (order) {
            if (data.data.order.status === "inprocess") {
                console.log(order.shipping_methods)
                try {
                    const fulfillment = await this.fulfillmentService.createFulfillment(order, order.items)
                    console.log(fulfillment)
                } catch (e) {
                    console.log(e)
                }
            }

        }

    }


    handlePrintfulPackageShipped = async (data: any) => {
        console.log("From subscriber - processing following event:", data)
        const orderData = data.data.order;
        const shipmentData = data.data.shipment;

        const order = await this.orderService_.retrieve(orderData.external_id);

    }
    handleOrderCreated = async (data: any) => {
        console.log("From subscriber - processing following event:", data)
        // TODO: Add logic to create order in printful
        const order = await this.orderService_.retrieve(data.id);
        if (order) {
            await this.printfulFulfillmentService.createOrder(order)
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