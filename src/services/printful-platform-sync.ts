import { Logger, TransactionBaseService } from "@medusajs/medusa"
import { PrintfulClient } from "../utils/printful-request"

class PrintfulPlatformSyncService extends TransactionBaseService {

    private printfulClient: PrintfulClient;
    private readonly printfulStoreId: string;
    private logger: Logger;

    constructor(container, options) {
        super(container);

        this.printfulClient = new PrintfulClient(options.printfulAccessToken);
        this.printfulStoreId = options.printfulStoreId;
        this.logger = container.logger;
    }

    async getSyncProducts(queryParams?: { status: "synced" | "unsynced" | "all", search: string, offset: number, limit: number}){
        const { code , result, error } = await this.printfulClient.get(`/sync/products`, { store_id: this.printfulStoreId, ...queryParams });

        if(error){
            this.logger.error(`[medusa-plugin-printful]: Error fetching sync products from Printful store: Code: ${code} / ${result}`);
            return new Error(error.message)
        }
        return result;
    }
}
