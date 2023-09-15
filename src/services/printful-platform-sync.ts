import {
    Logger,
    ProductService,
    SalesChannelService,
    ShippingProfileService,
    TransactionBaseService
} from "@medusajs/medusa"
import { PrintfulClient } from "../utils/printful-request"
import PrintfulCatalogService from "./printful-catalog";
import {CreateProductInput, CreateProductProductVariantInput} from "@medusajs/medusa/dist/types/product";
import {SyncVariant} from "../types/printfulGetSyncProducts";
import PrintfulProductService from "./printful-product";
import {kebabCase} from "lodash";

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
    private productService: ProductService;
    private printfulCatalogService: PrintfulCatalogService;
    private printfulProductService: PrintfulProductService;
    private salesChannelService: SalesChannelService;
    private shippingProfileService: ShippingProfileService;

    constructor(container, options) {
        super(container);

        this.productService = container.productService;
        this.printfulClient = new PrintfulClient(options.printfulAccessToken);
        this.storeId = options.storeId;
        this.logger = container.logger;
        this.printfulCatalogService = container.printfulCatalogService;
        this.printfulProductService = container.printfulProductService;
        this.salesChannelService = container.salesChannelService;
        this.shippingProfileService = container.shippingProfileService;

    }

    async getSyncProducts(queryParams?: { offset: number, status: "synced" | "unsynced" | "all", search: string, limit: number }) {

        try {
            const { result } = await this.printfulClient.get(`/sync/products`, {store_id: this.storeId, ...queryParams});


                // check every product in result if external_id starts with "prod_" and if not, add a new object "synced_medusa" with value false
                const resultWithSyncedMedusa = result.map((product) => {
                    if(!product.external_id.startsWith("prod_")) {
                        return {...product, synced_medusa: false}
                    } else {
                        return {...product, synced_medusa: true}
                    }
                })
                return resultWithSyncedMedusa;

        } catch (error) {
            this.logger.error(`[medusa-plugin-printful]: Error fetching sync products from Printful store: ${JSON.stringify(error)}`);
            return error;
        }
    }

    async getSingleSyncProduct(product_id: string | number) {
        try {
            const { result: { sync_product, sync_variant } } = await this.printfulClient.get(`/sync/products/${product_id}`, { store_id: this.storeId })
            return {
                sync_product,
                sync_variant
            };
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
            this.logger.info(`[medusa-plugin-printful]: Fetching sync variant from Printful store: ${variant_id}`);
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

    async syncProduct(printful_product_id: string | number) {
        try {
            const { result: { sync_product, sync_variant } } = await this.printfulClient.get(`/sync/products/${printful_product_id}`, { store_id: this.storeId })

            this.logger.info(`[medusa-plugin-printful]: Syncing product ${printful_product_id}.`, );

            const defaultShippingProfile = await this.shippingProfileService.retrieveDefault();
            const defaultSalesChannel = await this.salesChannelService.retrieveDefault();

            const medusaVariants: CreateProductProductVariantInput[] = sync_variant.map((variant: SyncVariant) => {
                return {
                    title: variant.name,
                    sku: variant.sku,
                    external_id: variant.id,
                    inventory_quantity: 300,
                    metadata: {
                        printful_variant_id: variant.id,
                    }
                }
            })

            const medusaProduct: CreateProductInput = {
                title: sync_product.name,
                handle: kebabCase(sync_product.name),
                thumbnail: sync_product.thumbnail_url,
                // options: buildProductOptions(),
                // images: this.buildProductImages(printfulSyncVariants),
                // tags: this.productTags ? productTags : [],
                // categories: productCategories,
                profile_id: defaultShippingProfile.id,
                external_id: sync_product.id,
                sales_channels: [{id: defaultSalesChannel.id}],
                metadata: {
                    printful_id: sync_product.id
                }
            }

            this.logger.info(`[medusa-plugin-printful]: Medusa product: ${JSON.stringify(medusaProduct)}`);

            const product =  await this.productService.create(medusaProduct)

            if(product) {
                const updatedExternalId = await this.printfulProductService.modifySyncProduct(
                    sync_product.id,
                    { name: sync_product.name, external_id: product.id }
                )
                return updatedExternalId;
            }

        } catch (e)
        {
            this.logger.error(`[medusa-plugin-printful]: Error syncing product in Printful store: ${JSON.stringify(e)}`);
            return e;
        }
    }

}

export default PrintfulPlatformSyncService
