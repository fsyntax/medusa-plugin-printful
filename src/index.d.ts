declare module "@medusajs/medusa/dist/models/product" {
    interface Product {
        synced: boolean;
    }
}

declare module "@medusajs/medusa/dist/types/product" {
    interface UpdateProductInput {
        synced: boolean;
    }
    interface CreateProductInput {
        synced: boolean;
    }
    interface PriceProduct {
        synced: boolean;
    }
}
