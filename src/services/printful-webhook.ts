import { Logger, TransactionBaseService } from "@medusajs/medusa"
import { PrintfulClient } from "../utils/printful-request";
import {
    CreateWebhookConfigRequest,
    CreateWebhookConfigResponse,
    GetWebhookConfigResponse, SetWebhookEventRequest, SetWebhookEventResponse
} from "../types/webhook/webhook-config";

/**
 * PrintfulWebhookService is responsible for handling Webhooks from Printful.
 *
 * @class PrintfulWebhookService
 * @extends {PrintfulWebhookService}
 */
class PrintfulWebhookService extends TransactionBaseService {

    private printfulClient: PrintfulClient;
    private storeId: string;
    private logger: Logger;
    private eventTypes: string[];

    constructor(container, options) {
        super(container);

        this.printfulClient = new PrintfulClient(options.printfulAccessToken);
        this.storeId = options.storeId;
        this.logger = container.logger;
        this.eventTypes = [
            "shipment_sent",
            "shipment_returned",
            "order_created",
            "order_updated",
            "order_failed",
            "order_canceled",
            "product_synced",
            "product_updated",
            "product_deleted",
            "catalog_stock_updated",
            "catalog_price_changed",
            "order_put_hold",
            "order_put_hold_approval",
            "order_remove_hold"
        ];
    }

    /**
     * Returns a configured webhook URL and a list of webhook event types enabled for the store
     * @returns GetWebhookConfigResponse
     * */
    async getConfig(): Promise<GetWebhookConfigResponse | Error> {
        try {
            const result: GetWebhookConfigResponse = await this.printfulClient.get('/v2/webhooks', { store_id: this.storeId } );
            if(result.error) {
                this.logger.error(`[medusa-plugin-printful]: Error fetching Printful Webhook configurations : ${result.error.message}`);
                return new Error(result.error.message);
            }
            this.logger.success('mpp-webhooks', '[medusa-plugin-printful]: Successfully fetched Printful Webhook configurations');
            return  result
        } catch (error) {
            this.logger.error(`[medusa-plugin-printful]: Error fetching Printful Webhook configurations : ${error.message}`);
            this.logger.error(`[medusa-plugin-printful]: Stack trace: ${error.stack}`);
            return error;
        }
    }

    /**
     * Use this endpoint to enable a webhook URL for a store and select webhook event types that will be sent to this URL.
     * Note that **only one webhook configuration can be active for each private OAuth token** or app, calling this method will disable the previous webhook configuration.
     * Setting up the Catalog stock updated webhook requires passing products (currently only IDs are taken into account).
     * Stock update webhook will only include information for the products specified in the products param.
     *
     * @param payload
     * @returns CreateWebhookConfigResponse
     *
     */
    async setConfig(payload: CreateWebhookConfigRequest): Promise<CreateWebhookConfigResponse | Error> {
        try {
            const { result, error }: CreateWebhookConfigResponse = await this.printfulClient.post('/v2/webhooks', {
                store_id: this.storeId, ...payload
            });
            if(error) {
                this.logger.error(`[medusa-plugin-printful]: Error trying to set up Printful Webhook configurations : ${error.message}`);
                return new Error(error.message);
            }
            this.logger.success('mpp-webhooks', '[medusa-plugin-printful]: Successfully set up Printful Webhook configurations');
            return { result }
        } catch (error) {
            this.logger.error(`[medusa-plugin-printful]: Error trying to set up Printful Webhook configurations : ${error.message}`);
            this.logger.error(`[medusa-plugin-printful]: Stack trace: ${error.stack}`);
            return error;
        }
    }

    /**
     * Use this endpoint to create or replace specific event configuration for a store.
     * Setting up the Catalog stock updated webhook requires passing products (currently only IDs are taken into account).
     * Stock update webhook will only include information for the products specified in the products param.
     * @param eventType
     * @param payload
     */
    async setEvent(eventType: string, payload: Omit<SetWebhookEventRequest, 'type'>): Promise<SetWebhookEventResponse> {
        try {
            const { result }: SetWebhookEventResponse = await this.printfulClient.post(`/v2/webhooks/${eventType}`, {
                store_id: this.storeId, ...payload
            });
            this.logger.success('mpp-webhooks', '[medusa-plugin-printful]: Successfully set up Printful Webhook configurations');
            return { result };
        } catch (error) {
            this.logger.error(`[medusa-plugin-printful]: Error trying to set up Printful Webhook configurations : ${error.data}`);
            throw error;
        }
    }

    // async setEvent(eventType: string, payload: Omit<SetWebhookEventRequest, 'type'>): Promise<SetWebhookEventResponse> {
    //     try {
    //         const { result, error }: SetWebhookEventResponse = await this.printfulClient.post(`/v2/webhooks/${eventType}`, {
    //             store_id: this.storeId, ...payload
    //         });
    //         if (error) {
    //             this.logger.error(`[medusa-plugin-printful]: Error trying to set up Printful Webhook configurations : ${error.message}`);
    //             throw new Error(error.message);
    //         }
    //         this.logger.success('mpp-webhooks', '[medusa-plugin-printful]: Successfully set up Printful Webhook configurations');
    //         return { result };
    //     } catch (error) {
    //         this.logger.error(`[medusa-plugin-printful]: Error trying to set up Printful Webhook configurations : ${error.message}`);
    //         this.logger.error(`[medusa-plugin-printful]: Stack trace: ${error.stack}`);
    //         throw error;
    //     }
    // }



    getEventType(): string[] {
        return this.eventTypes;
    }
}

export default PrintfulWebhookService;
