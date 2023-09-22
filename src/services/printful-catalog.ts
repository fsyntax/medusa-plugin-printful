import {Logger, TransactionBaseService} from "@medusajs/medusa"
import { PrintfulClient } from "../utils/printful-request"
import {PrintfulCatalogVariantRes} from "../types/printfulCatalogVariant";
import {PrintfulCatalogProductRes} from "../types/printfulCatalogProduct";


/**
 * PrintfulCatalogService is responsible for fetching catalog data from the Printful API.
 * Attention: It uses methods from both Printful API v1 and v2.
 *
 * @class PrintfulCatalogService
 * @extends {TransactionBaseService}
 */
class PrintfulCatalogService extends TransactionBaseService {

    private printfulClient: PrintfulClient;
    private readonly printfulStoreId: string;
    private logger: Logger;

    constructor(container, options) {
        super(container);

        this.printfulClient = new PrintfulClient(options.printfulAccessToken);
        this.printfulStoreId = options.printfulStoreId;
        this.logger = container.logger;
    }


    async getProducts(category_id?: string){
        const { code , result, error } = await this.printfulClient.get('/products', { store_id: this.printfulStoreId });

        if(error){
            this.logger.error(`[medusa-plugin-printful]: Error fetching products from Printful catalog: ${error.message}`);
            return new Error(error.message)
        }
        return result;
    }

    async getProduct(product_id: string | number): Promise<PrintfulCatalogProductRes> {
        return await this.printfulClient.get(`/products/${product_id}`)
        // const { result, error } = await this.printfulClient.get(`/products/${product_id}`)
        //
        // if(error) {
        //     this.logger.error(`[medusa-plugin-printful]: Error fetching single product from Printful catalog: ${error.message}`);
        //     return result
        // }
        // return result;
    }

    async getVariant(variant_id: string | number): Promise<PrintfulCatalogVariantRes> {
        const { code , result, error } = await this.printfulClient.get(`/products/variant/${variant_id}`, {store_id: this.printfulStoreId});

        if(error){
            this.logger.error(`[medusa-plugin-printful]: Error product variant from Printful catalog: ${error.message}`);
            return result
        }
        return result;
    }

    async getProductSizeguide(product_id: string, unit?: "inches" | "cm") {
        const { code , result, error } = await this.printfulClient.get(`/products/${product_id}/sizes?${unit ?? 'cm'}`, {store_id: this.printfulStoreId});

        if(error){
            this.logger.error(`[medusa-plugin-printful]: Error fetching product size guide from Printful catalog: ${error.message}`);
            return new Error(error.message)
        }
        return result;
    }
}

export default PrintfulCatalogService
