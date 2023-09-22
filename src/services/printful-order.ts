import {Logger, OrderService, TransactionBaseService} from "@medusajs/medusa";
import { PrintfulClient } from "../utils/printful-request";
import {ConfirmOrderResponse, CreateOrderRequest, CreateOrderResponse} from "../types/order/create-order";
import {Order} from "../types/shared";
import {UpdateOrderRequest, UpdateOrderResponse} from "../types/order/update-order";
import {GetOrderRequest} from "../types/order/get-order";


/**
 * PrintfulOrderService handles orders between Medusa and Printful and is responsible for managing orders through Printful.
 * Attention: It uses methods from both Printful API v1 and v2.
 *
 * @class PrintfulOrderService
 * @extends {TransactionBaseService}
 */

class PrintfulOrderService extends TransactionBaseService {
    private orderService: OrderService;
    private printfulClient: PrintfulClient;
    private printfulAccessToken: string;
    private storeId: string;
    private logger: Logger;

    constructor(container, options) {
        super(container);
        this.orderService = container.orderService;
        this.printfulClient = new PrintfulClient(options.printfulAccessToken);
        this.storeId = options.storeId;
        this.logger = options.logger;
    }

    async create(payload: CreateOrderRequest): Promise<Order | Error> {
        try {
            const { data, error }: CreateOrderResponse = await this.printfulClient.post(`v2/orders`, { store_id: this.storeId , ...payload} )
            if(error) {
                this.logger.error(`[medusa-plugin-printful]: Error creating order in printful: ${error.message}`);
                return new Error(error.message);
            }
            this.logger.info(`[medusa-plugin-printful]: Order ${data.id} created in printful! 🚀`);
            return data;
        } catch (error) {
            this.logger.error(`[medusa-plugin-printful]: Error creating order in printful: ${error.message}`);
            this.logger.error(`[medusa-plugin-printful]: Stack Trace: ${error.stack}`);
        }
    }

    async get(order_id: GetOrderRequest): Promise<Order | Error>{
        try {
            const { data, error } = await this.printfulClient.get(`v2/orders/${order_id}`, { store_id: this.storeId })
            if(error) {
                this.logger.error(`[medusa-plugin-printful]: Error getting order from printful: ${error.message}`);
                return new Error(error.message);
            }
            this.logger.info(`[medusa-plugin-printful]: Fetched order "${order_id}" from Printful`);
            return data;
        } catch (error) {
            this.logger.error(`[medusa-plugin-printful]: Error getting order from printful: ${error.message}`);
            this.logger.error(`[medusa-plugin-printful]: Stack Trace: ${error.stack}`);
            return error;
        }
    }

   async confirm(order_id: string | number): Promise<Order | Error>{
        try {
            const { data, error }: ConfirmOrderResponse = await this.printfulClient.post(`v2/orders/${order_id}/confirmation`, { store_id: this.storeId })
            if(error) {
                this.logger.error(`[medusa-plugin-printful]: Error confirming order in printful: ${error.message}`);
                return new Error(error.message);
            }
            this.logger.info(`[medusa-plugin-printful]: Order ${order_id} confirmed in printful`);
            return data;
        } catch (error) {
            this.logger.error(`[medusa-plugin-printful]: Error confirming order in printful: ${error.message}`);
            this.logger.error(`[medusa-plugin-printful]: Stack Trace: ${error.stack}`);
            return error;
        }
   }

   // todo: create interface
    async cancel(order_id: string | number): Promise<any>{
        try {
            const order = await this.printfulClient.delete(`orders/${order_id}`, { store_id: this.storeId })
            this.logger.info(`[medusa-plugin-printful]: Order ${order_id} cancelled in printful`);
            return order;
        } catch (error) {
            this.logger.error(`[medusa-plugin-printful]: Error cancelling order in printful: ${error.message}`);
            this.logger.error(`[medusa-plugin-printful]: Stack Trace: ${error.stack}`);
        }
    }

    /**
     *  Updates unsubmitted order and optionally submits it for the fulfillment.
     * Note that you need to post only the fields that need to be changed, not all required fields.
     * If items array is given in the update data, the items will be:
     * a) updated, if the update data contains the item id or external_id parameter that alreay exists
     * b) deleted, if the request doesn't contain the item with previously existing id
     * c) created as new if the id is not given or does not already exist
     * @param payload
     */
    async update(payload: UpdateOrderRequest): Promise<any> {
        try {
            const { result, error }: UpdateOrderResponse = await this.printfulClient.put(`orders/${payload.id}`, { store_id: this.storeId, ...payload })
            if(error) {
                this.logger.error(`[medusa-plugin-printful]: Error updating order in printful: ${error.message}`);
                return new Error(error.message);
            }
            this.logger.info(`[medusa-plugin-printful]: Order ${payload.id} updated in printful`);
            return result;
        }
        catch (e) {
            this.logger.error(`[medusa-plugin-printful]: Error updating order in printful: ${e.message}`);
            this.logger.error(`[medusa-plugin-printful]: Stack Trace: ${e.stack}`);

        }
    }
}

export default PrintfulOrderService;
