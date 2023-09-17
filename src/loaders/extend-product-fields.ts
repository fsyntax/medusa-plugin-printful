export default async function () {
    const imports = (await import(
        "@medusajs/medusa/dist/api/routes/store/products/index"
        )) as any
    imports.allowedStoreProductsFields = [
        ...imports.allowedStoreProductsFields,
        "synced",
    ]
    imports.defaultStoreProductsFields = [
        ...imports.defaultStoreProductsFields,
        "synced",
    ]
}
