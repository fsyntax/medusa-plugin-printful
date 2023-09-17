import {Logger, ProductService, ProductVariant, ProductVariantService} from "@medusajs/medusa";
import PrintfulPlatformSync from "../services/printful-platform-sync";
import PrintfulProductService from "../services/printful-product";

class PrintfulSubscriber {

    private productVariantService: ProductVariantService;
    private printfulPlatformSyncService: PrintfulPlatformSync;
    private logger: Logger;
    private productService: ProductService;
    private printfulProductService: PrintfulProductService;

    constructor({ eventBusService, productService, productVariantService, printfulProductService, printfulPlatformSyncService, logger }) {
        eventBusService.subscribe("product.updated", this.handleMedusaProductUpdated)
        eventBusService.subscribe("product-variant.updated", this.handleMedusaVariantUpdated)

        this.productVariantService = productVariantService
        this.printfulPlatformSyncService = printfulPlatformSyncService
        this.productService = productService
        this.printfulProductService = printfulProductService
        this.logger = logger
    }

    handleMedusaProductUpdated = async (data) => {
        try {
            const product = await this.productService.retrieve(data.id, { relations: ['variants']})
            //@ts-ignore
            if(product.printful_id) {
                return await this.printfulProductService.modifySyncProduct(
                    //@ts-ignore
                    product.printful_id,
                    { sync_product: { name : product.title } }
                )

            }
        } catch (e) {
            this.logger.error("[medusa-plugin-printful]: Error while updating product in Printful: " + e)
        }
    }

    handleMedusaVariantUpdated = async (data) => {
        try {
            const variant: ProductVariant = await this.productVariantService.retrieve(data.id, { relations: ['prices']})
            //@ts-ignore
            if(variant.printful_id) {
                const result = await this.printfulPlatformSyncService.modifySyncVariant(
                    //@ts-ignore
                    variant.printful_id,
                    {
                        external_id: variant.id,
                        retail_price: (variant.prices[0].amount / 100).toFixed(2),
                        sku: variant.sku,
                    }
                )
                if(result)
                    this.logger.info("[medusa-plugin-printful]: Updated variant in Printful as well.")
            } else {
                this.logger.info("[medusa-plugin-printful]: Variant is not synced with Printful - skipping as no other actions are defined.")
            }
        } catch (error) {
            this.logger.error("[medusa-plugin-printful]: Error while updating variant in Printful: " + error)
        }

    }
}

export default PrintfulSubscriber
