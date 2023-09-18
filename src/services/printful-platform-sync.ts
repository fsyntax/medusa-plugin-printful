import {
    Logger,
    Product,
    ProductService,
    ProductVariantService,
    SalesChannelService,
    ShippingProfileService,
    TransactionBaseService
} from "@medusajs/medusa"
import {PrintfulClient} from "../utils/printful-request"
import PrintfulCatalogService from "./printful-catalog";
import PrintfulProductService from "./printful-product";
import {GetSyncProductRes, PrintfulSyncProductProduct, PrintfulSyncProductVariant} from "../types/printfulSyncProduct";
import {PrintfulCatalogProductRes, PrintfulCatalogProductVariant} from "../types/printfulCatalogProduct";
import {buildProductImages, buildProductOptions, buildProductTags, convertToInteger} from "../utils/printful-utils";
import {CreateProductVariantInput} from "@medusajs/medusa/dist/types/product-variant";
import {EntityManager} from "typeorm";
import {kebabCase} from "lodash";
import {CreateProductInput} from "@medusajs/medusa/dist/types/product";

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



/**
 * PrintfulPlatformSyncService handles product sync between Medusa and Printful.
 * Attention: This service still uses all methods from Printful API v1 - v2, wich will merge products and ecommerce platform api together, is targeted to Q4 2023.
 *
 * @class PrintfulPlatformSyncService
 * @extends {TransactionBaseService}
 */

class PrintfulPlatformSyncService extends TransactionBaseService {

    private printfulClient: PrintfulClient;
    private readonly storeId: string;
    private logger: Logger;
    private productService: ProductService;
    private printfulCatalogService: PrintfulCatalogService;
    private printfulProductService: PrintfulProductService;
    private salesChannelService: SalesChannelService;
    private shippingProfileService: ShippingProfileService;
    private productVariantService: ProductVariantService;

    constructor(container, options) {
        super(container);

        this.productService = container.productService;
        this.productVariantService = container.productVariantService;
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
            return result.map((product) => {
                    if (!product.external_id.startsWith("prod_")) {
                        return {...product, synced_medusa: false}
                    } else {
                        return {...product, synced_medusa: true}
                    }
                });

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


    async modifySyncVariant(printful_variant_id: string | number, modifyOptions: ModifyVariantOptions) {
        try {
            const { result } = await this.printfulClient.post(`/sync/variant/${printful_variant_id}`, {
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
            this.logger.info(`[medusa-plugin-printful]: Starting sync for product ${printful_product_id}.`);
        try {

            const syncProductRes: GetSyncProductRes = await this.printfulClient.get(`/sync/products/${printful_product_id}`, { store_id: this.storeId });
            if (!syncProductRes || syncProductRes.code !== 200 || !syncProductRes.result) {
                return new Error(`API Error: Invalid response from sync product API. Code: ${syncProductRes?.code}`);
            }

            const { result: syncResult } = syncProductRes;
            const sync_product: PrintfulSyncProductProduct = syncResult.sync_product;
            const sync_variants: PrintfulSyncProductVariant[] = syncResult.sync_variants;

            const catalogProductRes: PrintfulCatalogProductRes = await this.printfulCatalogService.getProduct(sync_variants[0].product.product_id);
            const { result: { product: catalog_product, variants: catalog_variants } } = catalogProductRes;

            this.logger.info(`[medusa-plugin-printful]: Syncing product ${printful_product_id}.`,);

            const defaultShippingProfile = await this.shippingProfileService.retrieveDefault();
            const defaultSalesChannel = await this.salesChannelService.retrieveDefault();

            const catalogVariantLookup: Record<string, PrintfulCatalogProductVariant> = {};

            catalog_variants.forEach(catalogVariant => {
                catalogVariantLookup[catalogVariant.id.toString()] = catalogVariant;
            });

            const medusaProduct: CreateProductInput = {
                // @ts-ignore
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
                synced: true,
                printful_id: sync_product.id as string,
                sales_channels: [
                    { id: defaultSalesChannel.id }
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

            let productAlreadyExists;

            try {
                productAlreadyExists = await this.productService.retrieveByExternalId(sync_product.id as string);
            } catch (e) {
                if (e.message === `Product with external_id: ${sync_product.id as string} was not found`) {
                    this.logger.info(`[medusa-plugin-printful]: Product with id ${printful_product_id} does not exist in Medusa. Proceeding to create a new one.`);
                } else {
                    this.logger.error(`[medusa-plugin-printful]: An error occurred while retrieving product by external ID: ${e.message}`);
                }
            }

            if(productAlreadyExists) {
                this.logger.info(`[medusa-plugin-printful]: Product with id ${printful_product_id} already exists in Medusa. Attempting to sync & update.`);

                const syncedMedusaProduct: Product = await this.productService.update(
                    productAlreadyExists.id as string,

                    { external_id: sync_product.id as string,
                        //@ts-ignore
                        printful_id: sync_product.id as string,
                        synced: true
                    }
                );

                if(syncedMedusaProduct) {
                    this.logger.success('[product-sync]', `[medusa-plugin-printful]: Successfully synced ${syncedMedusaProduct.title}! 🚀`);
                    return await this.printfulProductService.modifySyncProduct(
                        sync_product.id as string,
                        { sync_product: { name: syncedMedusaProduct.title, external_id: syncedMedusaProduct.id } }
                    );
                }

            } else {
                this.logger.info(`[medusa-plugin-printful]: Attempting to create product with id: ${printful_product_id}.`);

                const newCreatedProduct: Product = await this.atomicPhase_(async (manager: EntityManager) => {
                    // @ts-ignore
                    const product = await this.productService.create(medusaProduct)

                    const productOptionLookup: Record<string, string> = {};
                    product.options.forEach(option => {
                        productOptionLookup[option.title] = option.id;
                    });

                    if (product) {
                        this.logger.info(`[medusa-plugin-printful]: Successfully created product ${printful_product_id}! Attempting to create variants.`);

                        const medusaVariantPromises: Promise<CreateProductVariantInput>[] = sync_variants.map(async (variant: PrintfulSyncProductVariant) => {
                            const correspondingCatalogVariant: PrintfulCatalogProductVariant = catalogVariantLookup[variant.product.variant_id.toString()];
                            const options: { option_id: string, value: string }[] = [];

                            if (correspondingCatalogVariant?.size) {
                                options.push({
                                    option_id: productOptionLookup["size"],
                                    value: correspondingCatalogVariant.size
                                });
                            }

                            if (correspondingCatalogVariant?.color) {
                                options.push({
                                    option_id: productOptionLookup["color"],
                                    value: correspondingCatalogVariant.color
                                });
                            }

                            return {
                                title: variant.name,
                                sku: variant.sku,
                                inventory_quantity: 300,
                                // TODO: find a more elegant solution for material
                                material: correspondingCatalogVariant.material.length > 0 ? correspondingCatalogVariant.material[0].name : null,
                                printful_id: variant.id.toString(),
                                options,
                                prices: [{
                                    amount: convertToInteger(variant.retail_price),
                                    currency_code: variant.currency.toLowerCase()
                                }],
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

                        const medusaVariants: CreateProductVariantInput[] = await Promise.all(medusaVariantPromises);

                        const variants = await Promise.all(medusaVariants.map(async (variant: CreateProductVariantInput) => {
                            return await this.productVariantService.create(product.id as string, variant);
                        }));

                        if (variants) {
                            return product;
                        }
                    }

                });

                if (newCreatedProduct) {
                    this.logger.success('[product-creation]', `[medusa-plugin-printful]: Successfully synced ${newCreatedProduct.title}! 🚀`);
                    return await this.printfulProductService.modifySyncProduct(
                        sync_product.id as string,
                        { sync_product: { name: newCreatedProduct.title, external_id: newCreatedProduct.id } }
                    );
                }
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

    async desyncProduct(printful_product_id: string | number, product_name: string) {
        try {
            this.logger.info(`[medusa-plugin-printful]: Starting desync for product ${printful_product_id}.`);

            const medusaProduct = await this.productService.retrieveByExternalId(printful_product_id.toString());
            if(medusaProduct) {
                // @ts-ignore
                const updatedMedusaProduct = await this.productService.update(medusaProduct.id as string, { synced: false });
                if(updatedMedusaProduct) {
                    this.logger.info(`[medusa-plugin-printful]: Successfully desynced "${updatedMedusaProduct.title}" from Printful!`);
                    return await this.printfulProductService.modifySyncProduct(printful_product_id.toString(), { sync_product: { name: product_name, external_id: '' } });

                }
            }

        } catch (e) {
            if (e instanceof Error) {
                this.logger.error(`[medusa-plugin-printful]: Error desyncing product in Printful store: ${e.message}`);
                this.logger.error(`[medusa-plugin-printful]: Stack Trace: ${e.stack}`);
            } else {
                this.logger.error(`[medusa-plugin-printful]: An unknown error occurred while desyncing product in Printful store.`);
                this.logger.error(`[medusa-plugin-printful]: Error Object: ${JSON.stringify(e)}`);
            }
            return e;
        }
    }
}

export default PrintfulPlatformSyncService
