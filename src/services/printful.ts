import {Product, ProductService, ProductVariant, TransactionBaseService} from "@medusajs/medusa"
import {EntityManager} from "typeorm"
import {PrintfulClient, request} from "printful-request"
import {
    CreateProductInput,
    CreateProductProductVariantInput, ProductSelector,
    UpdateProductInput
} from "@medusajs/medusa/dist/types/product";
import {ProductVariantPrice, UpdateProductVariantInput} from "@medusajs/medusa/dist/types/product-variant";
import {create, kebabCase} from "lodash";

// TODO: move to env
const PRINTFUL_ACCESS_TOKEN = "HhN1J8dFDwT4XxUolNUF5xQERHppnLy3fTWRitQA"
const PRINTFUL_STORE_ID = "9893380"

class PrintfulService extends TransactionBaseService {
    protected manager_: EntityManager
    protected transactionManager_: EntityManager
    private productService: ProductService;
    private printfulClient: any;
    private readonly storeId: any;
    private readonly printfulApiToken: any;
    private productVariantService: any;
    private shippingProfileService: any;
    private salesChannelService: any;

    constructor(container, options) {
        super(container);
        this.productService = container.productService;
        this.productVariantService = container.productVariantService;
        this.shippingProfileService = container.shippingProfileService;
        this.salesChannelService = container.salesChannelService;
        this.printfulClient = new PrintfulClient(PRINTFUL_ACCESS_TOKEN);
        this.storeId = PRINTFUL_STORE_ID;


    }

    async getScopes() {
        const scopes = await this.printfulClient.get("oauth/scopes");
        return scopes;
    }

    async syncPrintfulProducts() {
        // TODO: Add store id to env
        const products = []
        const {result: availableProducts} = await this.printfulClient.get("store/products", {store_id: this.storeId});

        for (let product of availableProducts) {
            const {
                result: {
                    sync_product,
                    sync_variants
                }
            } = await this.printfulClient.get(`sync/products/${product.id}`, {store_id: this.storeId});
            const builtProduct = {...sync_product, variants: sync_variants};
            products.push(builtProduct);
        }

        if (products.length > 0) {
            for (let product of products) {
                const existingProduct = await this.checkIfProductExists(product.id);
                if (existingProduct) {
                    // build the product object according to UpdateProductInput type

                    const productObj: UpdateProductInput = {
                        title: product.name,
                        thumbnail: product.thumbnail_url,
                    }
                    await this.productService.update(existingProduct.id, productObj);

                    const variantsObj = product.variants.map((variant) => {
                        return {
                            sku: variant.sku,
                            data: {
                                title: variant.name,
                                sku: variant.sku,
                                // options: {value: variant.id},
                            }
                        }
                    })

                    for (let variant of variantsObj) {
                        await this.updateVariantInMedusa(variant.sku, variant.data)
                    }


                } else {

                    const defaultShippingProfile = await this.shippingProfileService.retrieveDefault();
                    const defaultSalesChannel = await this.salesChannelService.retrieveDefault();
                    // build the product object according to CreateProductInput type
                    console.log(defaultSalesChannel)
                    const productObj: CreateProductInput = {
                        title: product.name,
                        handle: kebabCase(product.name),
                        thumbnail: product.thumbnail_url,
                        options: [{title: "Printful Variant"}],
                        profile_id: defaultShippingProfile.id,
                        external_id: product.id,
                        sales_channels: [{id: defaultSalesChannel.id}],
                        metadata: {
                            printful_id: product.id
                        }
                    }

                    // TODO: add ts typings
                    const productVariantsObj = product.variants.map((variant) => {
                        return {
                            title: variant.name,
                            sku: variant.sku,
                            external_id: variant.id,
                            options: {value: variant.id},
                            manage_inventory: false,
                            allow_backorder: true,
                            inventory_quantity: 100,
                            // prices: [{amount: parseInt(variant.retail_price, 10) * 100, currency_code: variant.currency}],
                            metadata: {
                                printful_id: variant.id
                            }
                        }
                    })

                    const productToPush = {
                        ...productObj,
                        variants: productVariantsObj
                    }

                    try {
                        await this.createProductInMedusa(productToPush);
                    } catch (e) {
                        console.log(e);
                    }
                }
            }
        }
        return this.productService.list({q: ''});

    }

    async checkIfProductExists(id: string) {
        const product = await this.productService.list({external_id: id});
        if (product.length > 0) {
            return product[0];
        }
        return false;
    }

    async createProductInMedusa(product: CreateProductInput) {
        const createdProduct = await this.productService.create(product);
        console.log(`Successfully created product ${createdProduct.title} in Medusa`)
        return createdProduct;
    }

    async updateProductInMedusa(productOrProductId: string, product: UpdateProductInput) {
        const updatedProduct = await this.productService.update(productOrProductId, product);
        console.log(`Successfully updated product ${updatedProduct.title} in Medusa`)

        return updatedProduct;
    }


    async createVariantInMedusa(productOrProductId: string | Product, variant: CreateProductProductVariantInput) {
        const createdVariant = await this.productVariantService.create(productOrProductId, variant);
        console.log(`Successfully created variant ${createdVariant.title} in Medusa`)

        return createdVariant;
    }

    async updateVariantInMedusa(variantSku: string, update: UpdateProductVariantInput) {
        const variant = await this.productVariantService.retrieveBySKU(variantSku);
        const updatedVariant = await this.productVariantService.update(variant.id, update);
        if (updatedVariant) {
            console.log(`Successfully updated variant ${updatedVariant.title} in Medusa`)
        } else {
            console.log(`Failed to update variant ${variant.title} in Medusa`)
        }
    }

    async updateVariantOptionValueInMedusa(variantId: string, optionId: string, optionValue: string) {
        const updatedVariant = await this.productVariantService.updateOptionValue(variantId, optionId, optionValue);
        return updatedVariant;
    }

    async updateVariantPricesInMedusa(variantId: string, prices: ProductVariantPrice) {
        const updatedVariant = await this.productVariantService.updatePrices(variantId, prices);
        return updatedVariant;

    }


}

export default PrintfulService;