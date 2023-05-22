import {
    ProductService,
    ProductVariantService, SalesChannelService, ShippingOptionService,
    ShippingProfileService,
    TransactionBaseService
} from "@medusajs/medusa"
import {EntityManager} from "typeorm"
import {PrintfulClient} from "../utils/printful-request"
import {blue, green, greenBright, red, yellow} from "colorette";

class PrintfulSyncService extends TransactionBaseService {
    // @ts-ignore
    protected manager_: EntityManager
    // @ts-ignore
    protected transactionManager_: EntityManager
    private productService: ProductService;
    private printfulClient: any;
    private readonly storeId: any;
    private readonly enableSync: boolean;
    private productVariantService: ProductVariantService;
    private shippingProfileService: ShippingProfileService;
    private salesChannelService: SalesChannelService;
    private shippingOptionService: ShippingOptionService
    private regionService: any;
    private printfulService: any;
    private printfulWebhooksService: any;
    private readonly batchSize: number;
    private productsQueueService: any;

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
        this.batchSize = options.batchSize || 5;
        this.productsQueueService = container.productsQueueService;
        if (this.enableSync) {
            setTimeout(async () => {
                await this.syncPrintfulProducts()
            }, 3000)
        }
        if (options.enableWebhooks) {
            this.printfulWebhooksService.createWebhooks().then().catch(e => {
                console.log(red("Error creating Printful Webhooks!"), e)
            });
        }

    }

    async getScopes() {
        return await this.printfulClient.get("oauth/scopes");
    }

    async syncPrintfulProducts() {
        const delay = 10000;
        console.log(`${greenBright("[medusa-plugin-printful]:")} Hey! Initial ${yellow("Printful synchronization")} has been started with a batch size of ${yellow(this.batchSize)}! This might take a while.. `);

        const { result: syncableProducts } = await this.printfulClient.get("store/products", {store_id: this.storeId});

        if (syncableProducts.length > 0) {
            console.log(`${blue("[medusa-plugin-printful]: ")} Found ${syncableProducts.length} products to sync!`);
            let jobsData = [];
            for (let i = 0; i < syncableProducts.length; i += this.batchSize) {
                const batch = syncableProducts.slice(i, i + this.batchSize);
                jobsData = jobsData.concat(batch.map(product => ({
                    name: `sync-${product.id}`,
                    data: product
                })));

                if (jobsData.length >= this.batchSize || i + this.batchSize >= syncableProducts.length) {
                    console.log(`${blue("[medusa-plugin-printful]: ")} Adding ${jobsData.length} jobs to the queue.`);
                    await this.productsQueueService.addBulkJobs(jobsData);
                    console.log(`${green("[medusa-plugin-printful]: ")} Successfully added ${jobsData.length} jobs to the queue.`);
                    jobsData = [];
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        console.log(`${green("[medusa-plugin-printful]: ")} Finished scheduling Printful product synchronization jobs.`);
    }


    async createPrintfulRegions() {

        console.log("You've triggered the createPrintfulRegions function! Preparing to create regions.. 🗺️")

        const printfulCountries = await this.printfulService.getCountryList();
        let nestedCountries = {};
        printfulCountries.forEach(country => {
            if (!nestedCountries[country.region]) {
                nestedCountries[country.region] = [country];
            } else {
                nestedCountries[country.region].push(country);
            }
        });

        console.log(`Fetched ${printfulCountries.length} available countries from Printful! ✅`)

        const existingRegions = await this.regionService.list();
        console.info(`Found ${existingRegions.length} existing regions in Medusa! Preparing to delete them.. 🚮`)
        if (existingRegions.length > 0) {
            await Promise.all(existingRegions.map(async region => {
                await this.regionService.delete(region.id);
                console.log(`Deleted region ${region.name}! ✅`)
            }))
        }

        console.log("Creating new regions.. ⚙️")
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
                // exclude 'AN' from countries - since it doesn't exist anymore
                if (regionData.countries.includes('AN')) {
                    regionData.countries = regionData.countries.filter(country => country !== 'AN');
                }
                console.log(`Creating region ${regionData.name} with ${regionData.countries.length} countries.. ⚙️`, regionData)
                return await this.regionService.create(regionData);
            })
        );
        console.log("Successfully created all regions available from Printful! ✅")
        return {printfulCountries, createdRegions};
    }

}

export default PrintfulSyncService;
