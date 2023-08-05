import {TransactionBaseService} from "@medusajs/medusa"
import {EntityManager} from "typeorm"
import {PrintfulClient} from "../utils/printful-request"
import {greenBright} from "colorette";


class PrintfulWebhooksService extends TransactionBaseService {
    protected manager_: EntityManager
    protected transactionManager_: EntityManager
    private readonly storeId: any;
    private readonly backendUrl: any;
    private printfulClient: any;
    private eventBusService: any;
    private readonly enableWebhooks: any;

    private readonly printfulAccessToken: any;


    constructor(container, options) {
        super(container);
        this.printfulClient = new PrintfulClient(options.printfulAccessToken);
        this.storeId = options.storeId;
        this.backendUrl = options.backendUrl;
        this.printfulAccessToken = options.printfulAccessToken;
        this.eventBusService = container.eventBusService;
        this.enableWebhooks = options.enableWebhooks;
        this.manager_ = container.manager;


    }

    async createWebhooks() {
        console.log(`${greenBright("[medusa-plugin-printful]:")} Creating Printful Webhooks!`)

        const currentWebhookConfig = await this.printfulClient.get("webhooks", {store_id: this.storeId});

        console.log(`${greenBright("[medusa-plugin-printful]: ")} Your current Printful Webhook configuration: `, currentWebhookConfig)
        if (currentWebhookConfig.url !== `${this.backendUrl}/printful/webhook`) {
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
                console.log(`${greenBright("[medusa-plugin-printful]:")} Printful Webhook Support is enabled! `);
            }
        } else {
            console.log(`${greenBright("[medusa-plugin-printful]:")} Printful Webhook Support is already enabled! `);
        }
    }

    async disableWebhooks() {
        const webhooksDisabled = await this.printfulClient.delete("webhooks", {store_id: this.storeId});
        if (webhooksDisabled.code === 200) {
            return "Printful Webhook Support is disabled! 👀"
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