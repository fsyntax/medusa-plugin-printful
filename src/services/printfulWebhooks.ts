import {TransactionBaseService} from "@medusajs/medusa"
import {EntityManager} from "typeorm"
import {PrintfulClient, request} from "printful-request"


class PrintfulWebhooksService extends TransactionBaseService {
    protected manager_: EntityManager
    protected transactionManager_: EntityManager
    private printfulClient: any;
    private readonly storeId: any;
    private readonly backendUrl: any;
    private eventBusService: any;


    constructor(container, options) {
        super(container);
        this.printfulClient = new PrintfulClient(options.printfulAccessToken);
        this.storeId = options.storeId;
        this.backendUrl = options.backendUrl;
        this.eventBusService = container.eventBusService;
    }

    async createWebhooks() {
        const currentWebhookConfig = await this.printfulClient.get("webhooks", {store_id: this.storeId});
        if (currentWebhookConfig.url !== `${this.backendUrl}/printful/webhooks`) {
            const webhookTypes = [
                "package_shipped",
                "package_returned",
                "order_created",
                "order_updated",
                "order_failed",
                "order_canceled",
                "product_updated",
                "product_deleted",
                "order_put_hold",
                "order_put_hold_approval",
                "order_remove_hold",
            ]

            const setWebhookConfig = await this.printfulClient.post("webhooks", {
                store_id: this.storeId,
                url: `${this.backendUrl}/printful/webhook`,
                types: webhookTypes,
            });
            if (setWebhookConfig.code === 200) {
                console.log("Webhooks created successfully")
            }
        }
    }

    async handleWebhook(data) {
        switch (data.type) {
            case "product_updated": {
                console.log("Emitting event: printful.product_updated")
                this.eventBusService.emit("printful.product_updated", data)
                break;
            }
            case "product_deleted": {
                this.eventBusService.emit("printful.product_deleted", data)
                break;
            }
            case "package_shipped": {
                this.eventBusService.emit("printful.package_shipped", data)
                break;
            }
            case "package_returned": {
                this.eventBusService.emit("printful.package_returned", data)
                break;
            }
            case "order_created": {
                this.eventBusService.emit("printful.order_created", data)
                break;
            }
            case "order_updated": {
                this.eventBusService.emit("printful.order_updated", data)
                break;
            }

        }
    }
}

export default PrintfulWebhooksService;