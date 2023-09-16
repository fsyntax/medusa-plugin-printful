import {
    Logger,
    ProductService,
    SalesChannelService,
    ShippingProfileService,
    TransactionBaseService
} from "@medusajs/medusa"
import {PrintfulClient} from "../utils/printful-request"
import {buildProductImages, buildProductOptions, buildProductTags, convertToInteger} from "../utils/printful-utils";
import PrintfulCatalogService from "./printful-catalog";
import {CreateProductInput, CreateProductProductVariantInput} from "@medusajs/medusa/dist/types/product";
import {GetSyncProductRes, PrintfulSyncProductProduct, PrintfulSyncProductVariant} from "../types/printfulSyncProduct";
import PrintfulProductService from "./printful-product";
import {kebabCase} from "lodash";
import {PrintfulCatalogProductRes, PrintfulCatalogProductVariant} from "../types/printfulCatalogProduct";

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
            this.logger.info(`[medusa-plugin-printful]: Starting sync for product ${printful_product_id}.`);

            const syncProductRes: GetSyncProductRes = await this.printfulClient.get(`/sync/products/${printful_product_id}`, { store_id: this.storeId });
            if (!syncProductRes || syncProductRes.code !== 200 || !syncProductRes.result) {
                return new Error(`API Error: Invalid response from sync product API. Code: ${syncProductRes?.code}`);
            }

            const { result: syncResult } = syncProductRes;

            const sync_product: PrintfulSyncProductProduct = syncResult.sync_product;
            const sync_variants: PrintfulSyncProductVariant[] = syncResult.sync_variants;

            // this.logger.info(`[medusa-plugin-printful]: : ${sync_variants[0].product.product_id}`);

            const catalogProductRes: PrintfulCatalogProductRes = await this.printfulCatalogService.getProduct(sync_variants[0].product.product_id);

            // this.logger.info(`[medusa-plugin-printful]: : ${JSON.stringify(catalogProductRes)}`);
            //
            //
            const { result: { product: catalog_product, variants: catalog_variants } } = catalogProductRes;

            this.logger.info(`[medusa-plugin-printful]: Syncing product ${printful_product_id}.`,);

            const defaultShippingProfile = await this.shippingProfileService.retrieveDefault();
            const defaultSalesChannel = await this.salesChannelService.retrieveDefault();

            const catalogVariantLookup: Record<string, PrintfulCatalogProductVariant> = {};

            // console.log("Sync Variant IDs:", sync_variants.map(v => v.product.variant_id.toString()));
            // console.log("Catalog Variant IDs:", catalog_variants.map(v => v.id.toString()));

            catalog_variants.forEach(catalogVariant => {
                catalogVariantLookup[catalogVariant.id.toString()] = catalogVariant;
            });

            const medusaVariants: CreateProductProductVariantInput[] = sync_variants.map((variant: PrintfulSyncProductVariant): CreateProductProductVariantInput => {

                const correspondingCatalogVariant: PrintfulCatalogProductVariant = catalogVariantLookup[variant.product.variant_id.toString()];

                const options: { value: string }[] = [];
                if (correspondingCatalogVariant?.size) {
                    options.push({value: correspondingCatalogVariant.size});
                }
                if (correspondingCatalogVariant?.color) {
                    options.push({value: correspondingCatalogVariant.color});
                }

                return {
                    title: variant.name,
                    sku: variant.sku,
                    inventory_quantity: 300,
                    material: correspondingCatalogVariant ? JSON.stringify(correspondingCatalogVariant.material) : '',
                    // options,
                    // prices: [{
                    //     amount: convertToInteger(variant.retail_price),
                    //     currency_code: variant.currency.toLowerCase()
                    // }],
                    metadata: {
                        printful: {
                            variant_id: variant.id,
                            catalog_variant_id: correspondingCatalogVariant.id,
                            sync_product_id: variant.sync_product_id,
                            preview_url: variant.files[0].preview_url,
                        }
                    }
                };
            });

            const medusaProduct: CreateProductInput = {
                title: sync_product.name,
                handle: kebabCase(sync_product.name),
                thumbnail: sync_product.thumbnail_url,
                options: buildProductOptions(catalog_variants),
                images: buildProductImages(sync_variants),
                tags: buildProductTags(catalog_variants),
                description: catalog_product.description,
                type: { value: catalog_product.type },
                // categories: TODO: implement / refactor
                origin_country: catalog_product.origin_country,
                profile_id: defaultShippingProfile.id,
                external_id: sync_product.id as string,
                variants: medusaVariants,
                sales_channels: [
                    {id: defaultSalesChannel.id}
                ],
                metadata: {
                    printful: {
                        catalog_id: catalog_product.id,
                        sync_product_id: sync_product.id,
                        catalog_title: catalog_product.title,
                        brand: catalog_product.brand,
                        model: catalog_product.model,
                    }
                }
            }


            this.logger.info(`[medusa-plugin-printful]: Attempting to create product with id: ${printful_product_id}.`);

            const product =  await this.productService.create(medusaProduct)

            if(product) {
                this.logger.info(`[medusa-plugin-printful]: Successfully synced product ${printful_product_id}.`);
                return await this.printfulProductService.modifySyncProduct(
                    sync_product.id as string,
                    {name: product.title, external_id: product.id}
                );
            }
        } catch (e) {
            if (e instanceof Error) {
                this.logger.error(`[medusa-plugin-printful]: Error syncing product in Printful store: ${e.message}`);
                this.logger.error(`[medusa-plugin-printful]: Stack Trace: ${e.stack}`);
            } else {
                this.logger.error(`[medusa-plugin-printful]: An unknown error occurred while syncing product in Printful store.`);
                this.logger.error(`[medusa-plugin-printful]: Error Object: ${JSON.stringify(e)}`);
            }
            return e;
        }
    }
}

export default PrintfulPlatformSyncService
