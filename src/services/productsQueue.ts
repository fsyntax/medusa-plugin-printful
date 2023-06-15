import {Queue, Worker, Job} from 'bullmq';
import {TransactionBaseService, EventBusService, ProductService, Logger} from "@medusajs/medusa";
import {blue, blueBright, yellow} from "colorette";
import {ConnectionOptions} from "bullmq";

const redisUrlParse = require('redis-url-parse');

class ProductsQueueService extends TransactionBaseService {
    private eventBusService_: EventBusService;
    private printfulService_: any;
    private queue_: Queue;
    private productWorker_: Worker;
    private productService: ProductService;
    private logger_: Logger;
    private redisURL_: string;

    constructor(container, options) {
        super(container);
        this.printfulService_ = container.printfulService;
        this.eventBusService_ = container.eventBusService;
        this.productService = container.productService;
        this.manager_ = container.manager;
        this.logger_ = container.logger;
        this.redisURL_ = options.redisURL;
        const redisConfig = redisUrlParse(this.redisURL_);
        this.queue_ = new Queue('printful-products', {
            connection: redisConfig,

        });
        console.log(this.queue_)
        this.queue_.obliterate().then(() => {
            console.log(`${blueBright("[medusa-plugin-printful]:")} Queue obliterated!`)
        })


        this.productWorker_ = new Worker("printful-products",
            async (job: Job) => {
                try {
                    this.logger_.info(`Processing job #${job.id}`);
                    console.info(`${blueBright("[medusa-plugin-printful]:")} Processing job #${job.id} - [${job.data.id}] ${blueBright(job.data.name)}`)
                    const {id} = job.data;

                    const {sync_product, sync_variants} = await this.printfulService_.getSyncProduct(id);
                    const products = await this.productService.list({external_id: id});

                    if (products.length === 1) {
                        console.log(`${blue("[medusa-plugin-printful]:")} Updating product with external ID ${id}`)
                        const existingProduct = await this.productService.retrieve(products[0].id, {relations: ["variants", "options"]});
                        console.log(`${blue("[medusa-plugin-printful]:")} Retrieved product with ID ${existingProduct.id} from Medusa, trying to update it`)
                        return await this.printfulService_.updateMedusaProduct({
                            sync_product,
                            sync_variants,
                            medusa_product: existingProduct
                        }, "fromPrintful", null)
                    } else if (products.length === 0) {
                        return await this.printfulService_.createMedusaProduct({sync_product, sync_variants})
                    }
                } catch (e) {
                    console.error(`Job failed with ID ${job.id}: ${e.result}`);
                    if (e.code === 429) {
                        const duration = parseInt(e.error.message.match(/try again after (\d+)/)[1]);
                        console.log(`${yellow("[medusa-plugin-printful]:")} Rate limit reached. Pausing queue for ${yellow(duration)} seconds.`);
                        await this.queue_.pause();
                        setTimeout(() => this.queue_.resume(), duration * 1000);
                    } else {
                        throw e.result
                    }
                }
            },
            {
                connection: redisConfig,
                concurrency: 1,
                limiter: {max: 300, duration: 1000},

            });
    }

    async addJob(productPayload) {
        console.log(`${blue("[medusa-plugin-printful]:")} Adding job to queue!`)
        await this.queue_.add("printful-product-webhook-event", productPayload);
    }

    async addBulkJobs(jobsData) {
        console.log(`[medusa-plugin-printful]: Attempting to add jobs to the queue.`);
        await this.queue_.addBulk(jobsData);
        console.log(`[medusa-plugin-printful]: Successfully added ${jobsData.length} jobs to the queue.`);
    }

    parseRedisURL(redisURL) {
        const url = new URL(redisURL);

        const redisConfig = {
            host: url.hostname,
            port: parseInt(url.port),
            db: parseInt(url.pathname.substr(1)),
        };

        if (url.username || url.password) {
            redisConfig.password = url.password;
        }

        if (isNaN(redisConfig.db)) {
            redisConfig.db = 0; // Set the default database to 0
        }

        return redisConfig;
    }


}

export default ProductsQueueService;
