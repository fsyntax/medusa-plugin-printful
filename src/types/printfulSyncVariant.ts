export interface Product {
    variant_id: number;
    product_id: number;
    image: string;
    name: string;
}

export interface Options {
    // Empty object, add fields as needed
}

export interface File {
    // Empty object, add fields as needed
}

export interface PrintfulSyncVariantVariant {
    id: number;
    external_id: string;
    sync_product_id: number;
    name: string;
    synced: boolean;
    variant_id: number;
    retail_price: string;
    currency: string;
    is_ignored: boolean;
    sku: string;
    product: Product;
    files: File[];  // Empty array, add fields as needed
    options: Options[];  // Empty array, add fields as needed
    main_category_id: number;
    warehouse_product_variant_id: number;
}

export interface PrintfulSyncVariantProduct {
    id: number;
    external_id: string;
    name: string;
    variants: number;
    synced: number;
    thumbnail_url: string;
    is_ignored: boolean;
}

export interface GetSyncVariantRes {
    code: number;
    result: {
        sync_variant: PrintfulSyncVariantVariant;
        sync_product: PrintfulSyncVariantProduct;
    };
    error?: {
        message?: string;
        reason?: string;
    };
}

export interface ModifyPrintfulSyncVariantPayload {
    id?: number;
    external_id?: string;
    variant_id?: number;
    retail_price?: string;
    is_ignored?: boolean;
    sku?: string;
    files?: File[];
    options?: Options[];
}
