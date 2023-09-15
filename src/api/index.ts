import express, { Router } from "express"
import { getConfigFile, parseCorsOrigins} from "medusa-core-utils";
import { ConfigModule } from "@medusajs/medusa/dist/types/global";
import cors from "cors";

export default (rootDirectory, options) => {
  const storeRouter = Router()
  const adminRouter = Router()

  storeRouter.use(express.json())
  storeRouter.use(express.urlencoded({ extended: true }))
  adminRouter.use(express.json())
  adminRouter.use(express.urlencoded({ extended: true }))

  const { configModule } = getConfigFile<ConfigModule>(rootDirectory, 'medusa-config')
  const { projectConfig } = configModule

  const adminCorsOptions = {
    origin: projectConfig.admin_cors.split(","),
    credentials: true,
  }
  const storeCorsOptions = {
    origin: projectConfig.store_cors.split(","),
    credentials: true,
  }


  adminRouter.options('/admin/printful/sync_products', cors(adminCorsOptions))
  adminRouter.get('/admin/printful/sync_products', cors(adminCorsOptions), async (req, res) => {
    const printfulPlatformSyncService = req.scope.resolve('printfulPlatformSyncService')

    if(req.query.product_id) {
      const sync_prodct = await printfulPlatformSyncService.getSingleSyncProduct(req.query.product_id as string)
      res.json(sync_prodct)
    } else {
      const sync_products = await printfulPlatformSyncService.getSyncProducts(req.query as any)
      res.json(sync_products)
    }
  })

  adminRouter.options('/admin/printful/sync_products/:product_id/modify', cors(adminCorsOptions))
  adminRouter.post('/admin/printful/sync_products/:product_id/modify', cors(adminCorsOptions), async (req, res) => {
    const printfulProductService = req.scope.resolve('printfulProductService')
    console.log("req.body", req.body)
    const sync_product = await printfulProductService.modifySyncProduct(req.params.product_id, req.body)
    console.log("sync_product", sync_product)
    return res.json(sync_product);
  })

  adminRouter.options('/admin/printful/sync_products/:product_id', cors(adminCorsOptions))
    adminRouter.get('/admin/printful/sync_products/:product_id', cors(adminCorsOptions), async (req, res) => {
      const printfulPlatformSyncService = req.scope.resolve('printfulPlatformSyncService')
      const sync_product = await printfulPlatformSyncService.getSingleSyncProduct(req.params.product_id)

      res.json(sync_product)
    })

  adminRouter.options('/admin/printful/sync_variant/:variant_id', cors(adminCorsOptions))
    adminRouter.get('/admin/printful/sync_variant/:variant_id', cors(adminCorsOptions), async (req, res) => {
        const printfulPlatformSyncService = req.scope.resolve('printfulPlatformSyncService')
        const sync_variant = await printfulPlatformSyncService.getSyncVariant(req.params.variant_id)

        res.json(sync_variant)

    })

  return [adminRouter, storeRouter]
}
