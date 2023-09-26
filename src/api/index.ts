import express, { Router } from "express"
import { getConfigFile, parseCorsOrigins} from "medusa-core-utils";
import { ConfigModule } from "@medusajs/medusa/dist/types/global";
import cors from "cors";
import { registerOverriddenValidators } from "@medusajs/medusa"
import {
  AdminPostProductsReq as MedusaAdminPostProductsReq,
} from "@medusajs/medusa/dist/api/routes/admin/products/create-product"
import { IsString } from "class-validator"




export default (rootDirectory, options) => {
  const storeRouter = Router()
  const adminRouter = Router()

  class AdminPostProductsReq extends MedusaAdminPostProductsReq {
    @IsString()
    custom_field: string
  }

  registerOverriddenValidators(AdminPostProductsReq)

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

  adminRouter.options('/admin/printful/sync_products/:product_id', cors(adminCorsOptions))
    adminRouter.get('/admin/printful/sync_products/:product_id', cors(adminCorsOptions), async (req, res) => {
      const printfulPlatformSyncService = req.scope.resolve('printfulPlatformSyncService')
      const sync_product = await printfulPlatformSyncService.getSingleSyncProduct(req.params.product_id)
      res.json(sync_product)
    })

  adminRouter.options('/admin/printful/sync_products/:product_id/modify', cors(adminCorsOptions))
  adminRouter.post('/admin/printful/sync_products/:product_id/modify', cors(adminCorsOptions), async (req, res) => {
    const printfulProductService = req.scope.resolve('printfulProductService')
    const sync_product = await printfulProductService.modifySyncProduct(req.params.product_id, req.body)
    return res.json(sync_product);
  })

  adminRouter.options('/admin/printful/sync_products/:product_id/sync', cors(adminCorsOptions))
  adminRouter.post('/admin/printful/sync_products/:product_id/sync', cors(adminCorsOptions), async (req, res) => {
    const printfulPlatformSyncService = req.scope.resolve('printfulPlatformSyncService')
    const product = await printfulPlatformSyncService.syncProduct(req.body.product_id ? req.body.product_id : req.params.product_id)
    return res.json(product);
  })

  adminRouter.options('/admin/printful/sync_products/:product_id/desync', cors(adminCorsOptions))
  adminRouter.post('/admin/printful/sync_products/:product_id/desync', cors(adminCorsOptions), async (req, res) => {

    const printfulPlatformSyncService = req.scope.resolve('printfulPlatformSyncService')
    const result = await printfulPlatformSyncService.desyncProduct(req.params.product_id, req.body.name)
    return res.json(result);
  })

  adminRouter.options('/admin/printful/sync_variant/:variant_id', cors(adminCorsOptions))
    adminRouter.get('/admin/printful/sync_variant/:variant_id', cors(adminCorsOptions), async (req, res) => {
        const printfulPlatformSyncService = req.scope.resolve('printfulPlatformSyncService')
        const sync_variant = await printfulPlatformSyncService.getSyncVariant(req.params.variant_id)
        res.json(sync_variant)
    })

  adminRouter.options('/admin/printful/webhook/set', cors(adminCorsOptions))
  adminRouter.post('/admin/printful/webhook/set', cors(adminCorsOptions), async (req, res) => {
    const printfulWebhookService = req.scope.resolve('printfulWebhookService')
    try {
        const { default_url, public_key } = req.body
        const result = await printfulWebhookService.setConfig({default_url, public_key});
        if(result.error) {
          res.status(400).json({ error: result });
        }
        res.json(result);
    }
    catch (error) {
        res.status(400).json({ error: error.data });
    }
  })

  adminRouter.options('/admin/printful/webhook/get', cors(adminCorsOptions))
    adminRouter.get('/admin/printful/webhook/get', cors(adminCorsOptions), async (req, res) => {
      const printfulWebhookService = req.scope.resolve('printfulWebhookService')
      const savedConfig = await printfulWebhookService.getSavedConfig()
      if(savedConfig) {
        res.json(savedConfig)
      } else {
      const config = await printfulWebhookService.getConfig()
      res.json(config)
      }
    })

  adminRouter.options('/admin/printful/webhook/set_event', cors(adminCorsOptions))
  adminRouter.post('/admin/printful/webhook/set_event', cors(adminCorsOptions), async (req, res) => {
    const printfulWebhookService = req.scope.resolve('printfulWebhookService')
    const { type, url, params } = req.body as any

    try {
      const result = await printfulWebhookService.setEvent(type, { url, params });
      res.json(result);
    } catch (error) {
      console.error(error);
      res.status(400).json({ error: error.data });
    }
  });

  adminRouter.options('/admin/printful/webhook/disable_event', cors(adminCorsOptions))
  adminRouter.post('/admin/printful/webhook/disable_event', cors(adminCorsOptions), async (req, res) => {
    const printfulWebhookService = req.scope.resolve('printfulWebhookService')
    try {
        const result = await printfulWebhookService.disableEvent(req.body.eventType);
      res.status(204).end();
    }
    catch (e) {
        console.error(e);
        res.status(400).json({ error: e.data });
    }
  });


  adminRouter.options('/admin/printful/webhook/get_events', cors(adminCorsOptions))
  adminRouter.get('/admin/printful/webhook/get_events', cors(adminCorsOptions), async (req, res) => {
    const printfulWebhookService = req.scope.resolve('printfulWebhookService')
    const query = req.query as any
    console.log(query)
    res.json(query)
  })

  adminRouter.options('/admin/printful/webhook/events', cors(adminCorsOptions))
  adminRouter.post('/admin/printful/webhook/events', cors(adminCorsOptions), async (req, res) => {
    const printfulWebhookService = req.scope.resolve('printfulWebhookService')

    console.log(req)
    // Capture the raw body and the signature from the headers
    const rawBody = req.rawBody; // Make sure you capture this before any middleware
    const incomingSignature = req.headers['x-printful-signature'];

    // Printful secret key
    const secretKey = 'supersecret';
console.log(rawBody, incomingSignature, secretKey)
    return res.json({rawBody, incomingSignature, secretKey})
    // Verify the signature
    if (printfulWebhookService.verifySignature(rawBody, incomingSignature, secretKey)) {
      // Signature is valid, process the webhook event
    } else {
      // Invalid signature, ignore the event
      return res.status(401).send('Invalid signature');
    }
  });

  return [adminRouter, storeRouter]
}
