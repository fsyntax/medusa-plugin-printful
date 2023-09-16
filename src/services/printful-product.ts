import { Logger, ProductService, TransactionBaseService } from "@medusajs/medusa"
import { PrintfulClient } from "../utils/printful-request"

interface SyncProductModifyPayload {
    name: string;
    thumbnail?: string;
    external_id?: string | number;
    is_ignored?: boolean;
}

class PrintfulProductService extends TransactionBaseService {

    private printfulClient: PrintfulClient;
    private readonly printfulStoreId: string;
    private logger: Logger;
    private productService: ProductService;

    constructor(container, options) {
        super(container);

        this.printfulClient = new PrintfulClient(options.printfulAccessToken);
        this.printfulStoreId = options.storeId;
        this.logger = container.logger;
        this.productService = container.productService;
    }

    async getSyncProducts(category_id?: string){
        const { code , result, error } = await this.printfulClient.get(`/store/products${category_id ? '?' + category_id : ''}`, { store_id: this.printfulStoreId });

        if(error){
            this.logger.error(`[medusa-plugin-printful]: Error fetching sync products from Printful store: Code: ${code} / ${result}`);
            return new Error(error.message)
        }
        return result;
    }

    async getSingleSyncProduct(product_id: string) {
        const { code , result, error } = await this.printfulClient.get(`/store/products/${product_id}`, { store_id: this.printfulStoreId })

        if(error) {
            this.logger.error(`[medusa-plugin-printful]: Error fetching single sync product from Printful store: ${code} / ${result}`);
            return new Error(result)
        }
        return result;
    }

    async deleteSyncProduct(product_id: string) {
        try {
            const { code } = await this.printfulClient.delete(`/store/products/${product_id}`, { store_id: this.printfulStoreId });

            if(code === 200) {
                this.logger.info(`[medusa-plugin-printful]: Deleted sync variant ${product_id} from Printful store.`);
                return true;
            }
            else {
                this.logger.error(`[medusa-plugin-printful]: Error deleting sync product from Printful store: Code: ${code}`);
                return new Error(code)
            }
        } catch (error) {
            this.logger.error(`[medusa-plugin-printful]: Error deleting sync product from Printful store: ${error.message}`);
            return new Error(error.message)
        }
    }



    async modifySyncProduct(product_id: string, payload: SyncProductModifyPayload) {

        const { code , result, error } = await this.printfulClient.put(
            `/store/products/${product_id}`,
            {
                store_id: this.printfulStoreId,
                sync_product: {...payload},
            });

        if(error){
            this.logger.error(`[medusa-plugin-printful]: Error modifying sync product in Printful store: Code: ${code} / ${result}`);
            return new Error(result)
        }

        return result;
    }

    async getSyncVariant(variant_id: string) {
        const { code , result, error } = await this.printfulClient.get(`/store/variants/${variant_id}`, {store_id: this.printfulStoreId});

        if(error){
            this.logger.error(`[medusa-plugin-printful]: Error fetching sync variant from Printful store: ${code} / ${error.message}`);
            return new Error(error.message)
        }
        return result;
    }


    async createSyncVariant(product_id: string, variant_id: string, retail_price: string, is_ignored: boolean, sku: string, files: any[], options: any[]) {
        const { code , result, error } = await this.printfulClient.post(
            `/store/products/${product_id}/variants`,
            { store_id: this.printfulStoreId, variant_id, retail_price, is_ignored, sku, files, options },
        );

        if(error){
            this.logger.error(`[medusa-plugin-printful]: Error creating sync variant in Printful store: ${code} / ${result}`);
            return new Error(result)
        }
        return result;
    }

    async deleteSyncVariant(variant_id: string) {
        try {
            const { code } = await this.printfulClient.delete(`/store/variants/${variant_id}`, { store_id: this.printfulStoreId });

            if(code === 200) {
                this.logger.info(`[medusa-plugin-printful]: Deleted sync variant ${variant_id} from Printful store.`);
                return true;
            }
            else {
                this.logger.error(`[medusa-plugin-printful]: Error deleting sync product from Printful store: Code: ${code}`);
                return new Error(code)
            }
        } catch (error) {
            this.logger.error(`[medusa-plugin-printful]: Error deleting sync variant from Printful store: ${error.message}`);
            return new Error(error.message)
        }
    }

    async modifySyncVariant(variant_id: string, payload: any) {
        const { code , result, error } = await this.printfulClient.put(`/store/variants/${variant_id}`, { store_id: this.printfulStoreId, ...payload });

        if(error){
            this.logger.error(`[medusa-plugin-printful]: Error modifying sync variant in Printful store: Code: ${code} / ${result}`);
            return new Error(result)
        }

        return result;
    }
}

export default PrintfulProductService
