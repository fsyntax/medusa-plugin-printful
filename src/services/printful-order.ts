import {Logger, OrderService, TransactionBaseService} from "@medusajs/medusa";
import { PrintfulClient } from "../utils/printful-request";
import {
    ConfirmPrintfulOrderRes,
    CreatePrintfulOrderReq,
    CreatePrintfulOrderRes,
    GetPrintfulOrderRes
} from "../types/order/printfulOrder";


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

    async create(data: CreatePrintfulOrderReq): Promise<CreatePrintfulOrderRes> {
        try {
            const order = await this.printfulClient.post(`v2/orders`, { store_id: this.storeId ,...data} )
            this.logger.info(`[medusa-plugin-printful]: Order ${order.id} created in printful`);
            return order;
        } catch (error) {
            this.logger.error(`[medusa-plugin-printful]: Error creating order in printful: ${error.message}`);
            this.logger.error(`[medusa-plugin-printful]: Stack Trace: ${error.stack}`);
        }
    }

    async get(order_id: string | number): Promise<GetPrintfulOrderRes>{
        try {
            const order = await this.printfulClient.get(`v2/orders/${order_id}`, { store_id: this.storeId })
            this.logger.info(`[medusa-plugin-printful]: Order ${order_id} fetched from printful`);
            return order;
        } catch (error) {
            this.logger.error(`[medusa-plugin-printful]: Error getting order from printful: ${error.message}`);
            this.logger.error(`[medusa-plugin-printful]: Stack Trace: ${error.stack}`);
        }
    }

   async confirm(order_id: string | number): Promise<ConfirmPrintfulOrderRes>{
        try {
            const order = await this.printfulClient.post(`v2/orders/${order_id}/confirmation`, { store_id: this.storeId })
            this.logger.info(`[medusa-plugin-printful]: Order ${order_id} confirmed in printful`);
            return order;
        } catch (error) {
            this.logger.error(`[medusa-plugin-printful]: Error confirming order in printful: ${error.message}`);
            this.logger.error(`[medusa-plugin-printful]: Stack Trace: ${error.stack}`);
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
}

export default PrintfulOrderService;
