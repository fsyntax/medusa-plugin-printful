import {ProductService, TransactionBaseService} from "@medusajs/medusa"
import {EntityManager} from "typeorm"
import {PrintfulClient} from "printful-request"
import {CreateProductInput, UpdateProductInput} from "@medusajs/medusa/dist/types/product";
import {UpdateProductVariantInput} from "@medusajs/medusa/dist/types/product-variant";
import {kebabCase} from "lodash";

class PrintfulSyncService extends TransactionBaseService {
    protected manager_: EntityManager
    protected transactionManager_: EntityManager
    private productService: ProductService;
    private printfulClient: any;
    private readonly storeId: any;
    private readonly enableSync: Boolean;
    private productVariantService: any;
    private shippingProfileService: any;
    private salesChannelService: any;
    private shippingOptionService: any;
    private regionService: any;
    private printfulService: any;
    private printfulWebhooksService: any;

    constructor(container, options) {
        super(container);
        this.productService = container.productService;
        this.productVariantService = container.productVariantService;
        this.shippingProfileService = container.shippingProfileService;
        this.shippingOptionService = container.shippingOptionService;
        this.salesChannelService = container.salesChannelService;
        this.regionService = container.regionService;
        this.printfulService = container.printfulService;
        this.printfulClient = new PrintfulClient(options.printfulAccessToken);
        this.storeId = options.storeId;
        this.enableSync = options.enableSync;
        this.printfulWebhooksService = container.printfulWebhooksService;

        if (this.enableSync) {
            setTimeout(async () => {
                await this.syncPrintfulProducts()
            }, 3000)
        }
        if (options.enableWebhooks) {
            this.printfulWebhooksService.createWebhooks().then().catch(e => {
                throw new Error("Error creating Printful Webhooks")
            });
        }

    }

    async getScopes() {
        return await this.printfulClient.get("oauth/scopes");
    }

    async syncPrintfulProducts() {
        console.info("Heya! Starting to sync products from Printful! 👀")
        const {result: syncableProducts} = await this.printfulClient.get("store/products", {store_id: this.storeId});

        for (let product of syncableProducts) {
            const existingProduct = await this.checkIfProductExists(product.id.toString());
            if (existingProduct) {
                console.log(`Product ${existingProduct.title} already exists in Medusa! Preparing to update.. 🚧`)
                await this.printfulService.updateProduct(product, "fromPrintful", null);
            } else {
                console.log(`Product ${product.name} does not exist in Medusa! Preparing to create.. ⚙️`)
                await this.printfulService.createProductInMedusa(product);
            }
        }
        return "Syncing done!"
    }


    async addProductOptions(productId, optionTitle) {
        try {
            await this.productService.addOption(productId, optionTitle);
        } catch (e) {
            console.log("An error occurred while trying to an option!", e);
        }
    }

    async addVariantOptionValue(variantId, optionId, value) {
        try {
            await this.productVariantService.addOptionValue(variantId, optionId, value);
        } catch (e) {
            console.log("An error occurred while trying to add option value!", e);
        }
    }

    async updateVariantCurrencyPrice(sku: string, price: string) {
        const {id} = await this.productVariantService.retrieveBySKU(sku);
        // convert price string to number
        const priceNumber = parseInt(price, 10);
        const updatedVariant = await this.productVariantService.setCurrencyPrice(id, {
            amount: priceNumber * 100,
            currency_code: "EUR"
        });
    }

    async createPrintfulRegions() {
        const printfulCountries = await this.printfulService.getCountryList();
        let nestedCountries = {};
        printfulCountries.forEach(country => {
            if (!nestedCountries[country.region]) {
                nestedCountries[country.region] = [country];
            } else {
                nestedCountries[country.region].push(country);
            }
        });

        const createdRegions = await Promise.all(
            Object.keys(nestedCountries).map(async regionName => {
                const regionData = {
                    name: regionName.charAt(0).toUpperCase() + regionName.slice(1),
                    currency_code: "EUR",
                    tax_rate: 0,
                    payment_providers: ["stripe"],
                    fulfillment_providers: ["printful"],
                    countries: nestedCountries[regionName].map(country => country.code),
                };
                // exclude 'AN' from countries - since it doens't exist in anymore
                if (regionData.countries.includes('AN')) {
                    regionData.countries = regionData.countries.filter(country => country !== 'AN');
                }
                console.log(regionData)
                return await this.regionService.create(regionData);
            })
        );
        return {printfulCountries, createdRegions};
    }


    async checkIfProductExists(id: string) {
        try {
            const product = await this.productService.retrieveByExternalId(id, {relations: ['variants']});
            if (product) {
                return product;
            }
        } catch (e) {
            return false;
        }
    }


}

export default PrintfulSyncService;