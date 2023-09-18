import {Logger, OrderService, TransactionBaseService} from "@medusajs/medusa";
import { PrintfulClient } from "../utils/printful-request";
import {CreatePrintfulOrderReq, CreatePrintfulOrderRes} from "../types/printfulOrder";


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
            const order = await this.printfulClient.post(`v2/orders`, {...data})
            console.log(order)
            return order;
        } catch (error) {
            this.logger.error(`[medusa-plugin-printful]: Error creating order in printful: ${error.message}`);
            this.logger.error(`[medusa-plugin-printful]: Stack Trace: ${error.stack}`);
        }
    }


    async update(data) {
        console.log("update", data)
        return Promise.resolve({})
    }

    async retrieve(id, options = {}) {
        console.log("retrieve", id, options)
        return Promise.resolve({})
    }

    async list(options = {}) {
        console.log("list", options)
        return Promise.resolve({})
    }

    async delete(id, options = {}) {
        console.log("delete", id, options)
        return Promise.resolve({})
    }
}

export default PrintfulOrderService;
