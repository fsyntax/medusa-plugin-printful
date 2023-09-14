import express, { Router } from 'express'
import { getConfigFile, parseCorsOrigins } from 'medusa-core-utils'
import { ConfigModule } from '@medusajs/medusa/dist/types/global'
import cors from 'cors'
import authenticate from '@medusajs/medusa/dist/api/middlewares/authenticate'
import {sync} from "rimraf";

const bodyParser = require('body-parser')

export default (rootDirectory: string) => {
  const { configModule } = getConfigFile<ConfigModule>(rootDirectory, 'medusa-config')
  const { projectConfig } = configModule
  const router = Router()

  const storeCorsOptions = {
    origin: projectConfig.store_cors.split(','),
    credentials: true,
  }
  const adminCorsOptions = {
    origin: projectConfig.admin_cors.split(','),
    credentials: true,
  }

  router.use(express.json())
  router.use(express.urlencoded({ extended: true }))


  router.options('/admin/printful/create_webhooks', cors(adminCorsOptions))
  router.get('/admin/printful/create_webhooks', cors(adminCorsOptions), authenticate(), async (req, res) => {
    const printfulWebhookService = req.scope.resolve('printfulWebhooksService')
    res.json({
      message: await printfulWebhookService.createWebhooks(),
    })
  })

  router.options('/admin/printful/send_order', cors(adminCorsOptions))
  router.get('/admin/printful/send_order', cors(adminCorsOptions), authenticate(), async (req, res) => {
    const printfulService = req.scope.resolve('printfulService')
    const orderService = req.scope.resolve('orderService')
    const { order_id } = req.query
    const  order  = await orderService.retrieve(order_id, { relations: ["items","items.variant", "shipping_methods", "shipping_address"] })
    if (order) {
      await printfulService.createPrintfulOrder(order)
    }
    res.json({
      message: "Order sent to printful - check your server logs & printful dashboard",
    })
  })

  router.options('/admin/printful/sync_products', cors(adminCorsOptions))
  router.get('/admin/printful/sync_products', cors(adminCorsOptions), authenticate(), async (req, res) => {
    const printfulService = req.scope.resolve('printfulPlatformSyncService')

    const sync_products = await printfulService.getSyncProducts()

    res.json(sync_products)
  })

  router.options('/admin/printful/sync', cors(adminCorsOptions))
  router.get('/admin/printful/sync', cors(adminCorsOptions), async (req, res) => {
    const printfulService = req.scope.resolve('printfulSyncService')

    res.json({
      res: await printfulService.syncPrintfulProducts(),
    })
  })

  router.options('/store/printful/shipping-rates', cors(storeCorsOptions))
  router.post('/store/printful/shipping-rates', cors(storeCorsOptions), async (req, res) => {
    const printfulService = req.scope.resolve('printfulService')
    res.json({
      res: await printfulService.getShippingRates(req.body),
    })
  })

  // router.options('/store/printful/countries', cors(storeCorsOptions))
  router.get('/store/printful/countries', async (req, res) => {
    const printfulService = req.scope.resolve('printfulService')
    const countries = await printfulService.getCountryList()
    res.json({
      countries,
    })
  })

  router.options('/admin/printful/create_regions', cors(adminCorsOptions))
  router.get('/admin/printful/create_regions', cors(adminCorsOptions), async (req, res) => {
    const printfulSyncService = req.scope.resolve('printfulSyncService')
    const { createdRegions, printfulCountries } = await printfulSyncService.createPrintfulRegions()
    res.json({
      createdRegions,
      printfulCountriesRaw: printfulCountries,

    })
  })

  router.get('/initial-countries', async (req, res) => {
    const printfulSyncService = req.scope.resolve('printfulSyncService')
    const countries = await printfulSyncService.createPrintfulRegions()
    res.json({
      countries,
    })
  })

  router.use(bodyParser.json())
  router.post('/printful/webhook', async (req, res) => {
    try {
      const data = req.body
      const printfulWebhookService = req.scope.resolve('printfulWebhooksService')
      await printfulWebhookService.handleWebhook(data)

      res.status(200).send({ message: 'Received the webhook data successfully' })
    }
    catch (error) {
      console.error(error)
      res.status(500).send({ error: 'An error occurred while processing the webhook data' })
    }
  })

  return router
}
