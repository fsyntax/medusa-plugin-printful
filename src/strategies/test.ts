import {
    AbstractBatchJobStrategy,
    BatchJobService, Product, ProductStatus,
} from "@medusajs/medusa"
import {EntityManager} from "typeorm"

class PublishStrategy extends AbstractBatchJobStrategy {
    static identifier = "publish-products-strategy"
    static batchType = "publish-products"

    protected batchJobService_: BatchJobService
    private productService_: any;

    async preProcessBatchJob(batchJobId: string): Promise<void> {
        return await this.atomicPhase_(
            async (transactionManager) => {
                const batchJob = (await this.batchJobService_
                    .withTransaction(transactionManager)
                    .retrieve(batchJobId))

                const count = await this.productService_
                    .withTransaction(transactionManager)
                    .count({
                        status: ProductStatus.DRAFT,
                    })

                await this.batchJobService_
                    .withTransaction(transactionManager)
                    .update(batchJob, {
                        result: {
                            advancement_count: 0,
                            count,
                            stat_descriptors: [
                                {
                                    key: "product-publish-count",
                                    name: "Number of products to publish",
                                    message:
                                        `${count} product(s) will be published.`,
                                },
                            ],
                        },
                    })
            })
    }

    async processJob(batchJobId: string): Promise<void> {
        return await this.atomicPhase_(
            async (transactionManager) => {
                const productServiceTx = this.productService_
                    .withTransaction(transactionManager)

                const productList = await productServiceTx
                    .list({
                        status: [ProductStatus.DRAFT],
                    })

                for (const product of productList) {
                    await productServiceTx
                        .update(product.id, {
                            status: ProductStatus.PUBLISHED,
                        })
                }

                await this.batchJobService_
                    .withTransaction(transactionManager)
                    .update(batchJobId, {
                        result: {
                            advancement_count: productList.length,
                        },
                    })
            }
        )
    }

    buildTemplate(): Promise<string> {
        throw new Error("Method not implemented.")
    }

    protected manager_: EntityManager
    protected transactionManager_: EntityManager

}

export default PublishStrategy