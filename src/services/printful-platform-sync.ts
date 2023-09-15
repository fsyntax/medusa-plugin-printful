import { Logger, TransactionBaseService } from "@medusajs/medusa"
import { PrintfulClient } from "../utils/printful-request"

interface ModifyVariantOptions {
    id?: number;
    external_id?: string;
    variant_id?: number;
    retail_price?: string;
    is_ignored?: boolean;
    sku?: string;
    files?: any[];
    options?: any[];
}

class PrintfulPlatformSyncService extends TransactionBaseService {

    private printfulClient: PrintfulClient;
    private readonly storeId: string;
    private logger: Logger;

    constructor(container, options) {
        super(container);

        this.printfulClient = new PrintfulClient(options.printfulAccessToken);
        this.storeId = options.storeId;
        this.logger = container.logger;
    }

    async getSyncProducts(queryParams?: { offset: number, status: "synced" | "unsynced" | "all", search: string, limit: number }) {

        try {
            const { result } = await this.printfulClient.get(`/sync/products`, {store_id: this.storeId, ...queryParams});
            return result;
        } catch (error) {
            this.logger.error(`[medusa-plugin-printful]: Error fetching sync products from Printful store: ${JSON.stringify(error)}`);
            return error;
        }
    }

    async getSingleSyncProduct(product_id: string | number) {
        try {
            const { result } = await this.printfulClient.get(`/sync/products/${product_id}`, { store_id: this.storeId })
            return result;
        } catch (error) {
            this.logger.error(`[medusa-plugin-printful]: Error fetching single sync product from Printful store: ${JSON.stringify(error)}`);
            return error;
        }
    }

    async deleteSyncProduct(product_id: string | number) {
        try {
            const { code } = await this.printfulClient.delete(`/sync/products/${product_id}`, { store_id: this.storeId });

            if(code === 200) {
                this.logger.info(`[medusa-plugin-printful]: Deleted sync variant ${product_id} from Printful store.`);
                return true;
            }
            else {
                this.logger.error(`[medusa-plugin-printful]: Error deleting sync product from Printful store: Code: ${code}`);
                return code
            }
        } catch (error) {
            this.logger.error(`[medusa-plugin-printful]: Error deleting sync product from Printful store: ${error.message}`);
            return error
        }
    }

    async getSyncVariant(variant_id: string | number) {
        try {
            const { result } = await this.printfulClient.get(`/sync/variants/${variant_id}`, { store_id: this.storeId });
            return result;
        } catch (error) {
            this.logger.error(`[medusa-plugin-printful]: Error fetching sync variant from Printful store: ${JSON.stringify(error)}`);
            return error;
        }
    }


    async modifySyncVariant(variant_id: string | number, modifyOptions: ModifyVariantOptions) {
        try {
            const { result } = await this.printfulClient.post(`/sync/variant/${variant_id}`, {
                store_id: this.storeId,
                ...modifyOptions
            });
            return result;
        } catch (error) {
            this.logger.error(`[medusa-plugin-printful]: Error modifying sync variant in Printful store: ${JSON.stringify(error)}`);
            return error;
        }
    }

    async deleteSyncVariant(variant_id: string | number) {
        try {
            return await this.printfulClient.delete(`/sync/variant/${variant_id}`, { store_id: this.storeId });
        } catch (e) {
            this.logger.error(`[medusa-plugin-printful]: Error deleting sync variant in Printful store: ${JSON.stringify(e)}`);
            return e;
        }
    }

    async syncProduct(product_id: string | number) {
        //
    }

}

export default PrintfulPlatformSyncService
