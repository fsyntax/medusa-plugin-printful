import { Logger, TransactionBaseService } from "@medusajs/medusa"
import { PrintfulClient } from "../utils/printful-request"
import {GetProductResponse, GetProductsResponse} from "../types/catalog/products";
import { Product, Variant } from "../types/shared";
import {GetProductSizeGuideResponse} from "../types/catalog/size-guide";
import {GetProductVariantResponse, GetProductVariantsResponse} from "../types/catalog/variants";


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


    async getProducts(category_id?: string): Promise<Product[] | Error>{
        try {
            const { data, error }: GetProductsResponse = await this.printfulClient.get('/v2/catalog-products', { store_id: this.printfulStoreId });
            if(!data){
                this.logger.error(`[medusa-plugin-printful]: Error fetching products from Printful catalog: ${error.message}`);
                return new Error(error.message)
            }
            return data;
        }
        catch (e) {
            this.logger.error(`[medusa-plugin-printful]: Error fetching product from catalog: ${e.message}`);
            this.logger.error(`[medusa-plugin-printful]: Stack Trace: ${e.stack}`);
            return e
        }
    }

    async getProduct(product_id: string | number): Promise<Product | Error> {
        try {
            const { data, error }: GetProductResponse = await this.printfulClient.get(`/v2/catalog-products/${product_id}`)
            if(error) {
                this.logger.error(`[medusa-plugin-printful]: Error fetching product from Printful catalog: ${error.message}`);
                return new Error(error.message)
            }
            return data;
        }
        catch (e) {
            this.logger.error(`[medusa-plugin-printful]: Error fetching product from catalog: ${e.message}`);
            this.logger.error(`[medusa-plugin-printful]: Stack Trace: ${e.stack}`);
            return e
        }
    }

    async getVariant(variant_id: string | number): Promise<Variant | Error> {
        try {
            const { data, error }: GetProductVariantResponse = await this.printfulClient.get(`/v2/catalog-variants/${variant_id}`, {store_id: this.printfulStoreId});

            if(error){
                this.logger.error(`[medusa-plugin-printful]: Error product variant from Printful catalog: ${error.message}`);
                return data
            }
            return data;
        }
        catch (e) {
            this.logger.error(`[medusa-plugin-printful]: Error fetching product variant from catalog: ${e.message}`);
            this.logger.error(`[medusa-plugin-printful]: Stack Trace: ${e.stack}`);
        }
    }


    async getProductVariants(product_id: string | number): Promise<Variant[] | Error> {
        try {
            const { data, error }: GetProductVariantsResponse = await this.printfulClient.get(`/v2/catalog-products/${product_id}/variants`, {store_id: this.printfulStoreId});
            if(error){
                this.logger.error(`[medusa-plugin-printful]: Error fetching product variants from Printful catalog: ${error.message}`);
                return new Error(error.message)
            }
            return data;
        }
        catch (e) {
            this.logger.error(`[medusa-plugin-printful]: Error fetching product variants from catalog: ${e.message}`);
            this.logger.error(`[medusa-plugin-printful]: Stack Trace: ${e.stack}`);
            return e
        }
    }

    async getProductSizeGuide(product_id: string | number, unit?: string): Promise<GetProductSizeGuideResponse | Error> {
        try {
            const response: GetProductSizeGuideResponse = await this.printfulClient.get(`/v2/catalog-products/${product_id}/sizes`)
            if(response.error) {
                this.logger.error(`[medusa-plugin-printful]: Error fetching product size guide from Printful catalog: ${response.error.message}`);
                return new Error(response.error.message)
            }
            return response;
        }
        catch (e) {
            this.logger.error(`[medusa-plugin-printful]: Error fetching product size guide from catalog: ${e.message}`);
            this.logger.error(`[medusa-plugin-printful]: Stack Trace: ${e.stack}`);
            return e
        }
    }

}

export default PrintfulCatalogService
