import {AbstractBatchJobStrategy, BatchJobService, BatchJob} from "@medusajs/medusa"
import {EntityManager} from "typeorm"
import {PrintfulClient} from "../utils/printful-request"


class SyncStrategy extends AbstractBatchJobStrategy {

    static identifier = "printful-sync-strategy"
    static batchType = "printful-sync"

    protected batchJobService_: BatchJobService
    protected logger_: any;
    protected productService_: any;
    protected printfulClient: any;
    protected storeId: any;
    protected manager_: EntityManager
    protected transactionManager_: EntityManager

    constructor(container, options) {
        super(container);
        this.productService_ = container.productService;
        this.batchJobService_ = container.batchJobService;
        this.logger_ = container.logger;
        this.storeId = options.storeId;
        this.printfulClient = new PrintfulClient(options.printfulAccessToken);

    }


    async preProcessBatchJob(batchJobId: string): Promise<void> {
        return await this.atomicPhase_(
            async (transactionManager) => {

                const batchJob = (await this.batchJobService_
                    .withTransaction(transactionManager)
                    .retrieve(batchJobId))

                const {result} = await this.printfulClient
                    .withTransaction(transactionManager)
                    .get("sync/products", {store_id: this.storeId});


                await this.batchJobService_
                    .withTransaction(transactionManager)
                    .update(batchJob, {
                        result: {
                            advancement_count: 0,
                            syncableProducts: result,
                            stat_descriptors: [
                                {
                                    key: "product-publish-count",
                                    name: "Number of products to publish",
                                    message:
                                        `${result.length} product(s) will be published.`,
                                },
                            ],
                        },
                    })
            })
    }

    async processJob(batchJobId: string): Promise<void> {
        return this.logger_.info("Processing printful sync batch job", {batchJobId})
        // throw new Error("Method not implemented.")
    }

    async buildTemplate(): Promise<string> {
        console.log("Building template")
        return ""
    }


}

export default SyncStrategy;