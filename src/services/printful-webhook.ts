import { Logger, TransactionBaseService } from "@medusajs/medusa"
import { PrintfulClient } from "../utils/printful-request";
import {
    CreateWebhookConfigRequest,
    CreateWebhookConfigResponse,
    GetWebhookConfigResponse, SetWebhookEventRequest, SetWebhookEventResponse
} from "../types/webhook/webhook-config";
import crypto from 'crypto'

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
            // "catalog_stock_updated",
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
    async getConfig(): Promise<GetWebhookConfigResponse> {
        try {
            const result: GetWebhookConfigResponse = await this.printfulClient.get('/v2/webhooks', { store_id: this.storeId } );

            this.logger.success('mpp-webhooks', '[medusa-plugin-printful]: Successfully fetched Printful Webhook configurations');
            return  result
        } catch (error) {
            this.logger.error(`[medusa-plugin-printful]: Error fetching Printful Webhook configurations : ${error.data}`);
            throw error;
        }
    }

    /**
     * Verifies the HMAC signature for the incoming webhook request.
     * @param {string} rawBody - The raw request body as a string.
     * @param {string} incomingSignature - The 'X-Printful-Signature' header from the request.
     * @param {string} secretKey - Your Printful secret key.
     * @returns {boolean} - Returns true if the signature is valid, otherwise false.
     */
    verifySignature(rawBody: string, incomingSignature: string, secretKey: string): boolean {
        const hash = crypto
            .createHmac('sha256', secretKey)
            .update(rawBody)
            .digest('hex');

        return hash === incomingSignature;
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
            //TODO: replace url properly
            payload.events = this.eventTypes.map((type) => ({ type, url: 'http://localhost:9000' }));

            const result: CreateWebhookConfigResponse = await this.printfulClient.post('/v2/webhooks', {
                store_id: this.storeId,
                ...payload
            });
            this.logger.success('mpp-webhooks', '[medusa-plugin-printful]: Successfully set up Printful Webhook configurations');
            return result
        } catch (error) {
            this.logger.error(`[medusa-plugin-printful]: Error trying to set up Printful Webhook configurations : ${error.data}`);
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

    async disableEvent(eventType: string): Promise<any> {
        try {
           await this.printfulClient.delete(`/v2/webhooks/${eventType}`, {}, {
               store_id: this.storeId
           });
            this.logger.success('mpp-webhooks', '[medusa-plugin-printful]: Successfully disabled Printful Webhook configurations');

        } catch (error) {
            this.logger.error(`[medusa-plugin-printful]: Error trying to disable Printful Webhook configurations : ${error.data}`);
            throw error;
        }
    }

    getEventType(): string[] {
        return this.eventTypes;
    }
}

export default PrintfulWebhookService;
