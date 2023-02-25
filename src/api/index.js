import { Router } from "express"

export default () => {
    const router = Router()

    router.get("/", async (req, res) => {
        res.json({
            message: "Hello Medusa!",
        })
    })

    router.get("/hello-product", async (req, res) => {
        const printfulService = req.scope.resolve("printfulService")
        const productService = req.scope.resolve("productService")

        res.json({
            // printfulClient: await printfulService.getScopes(),
            products: await printfulService.syncPrintfulProducts(),
        })
    })


    return router;
}