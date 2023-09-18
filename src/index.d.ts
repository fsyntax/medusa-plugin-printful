declare module "@medusajs/medusa/dist/models/product" {
    interface Product {
        synced: boolean;
        printful_id?: string;
    }
}

declare module "@medusajs/medusa/dist/types/product" {
    interface UpdateProductInput {
        synced: boolean;
        printful_id?: string;
    }
    interface CreateProductInput {
        synced: boolean;
        printful_id?: string;
    }
}

declare module "@medusajs/medusa/dist/models/product-variant" {
    interface ProductVariant {
        printful_id?: string;
    }
}
declare module "@medusajs/medusa/dist/models/product-variant" {
    interface CreateProductVariantInput {
        printful_id?: string;
    }
    interface UpdateProductVariantInput {
        printful_id?: string;
    }
}



