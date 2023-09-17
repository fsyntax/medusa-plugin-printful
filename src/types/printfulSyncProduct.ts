export interface FileOptions {
    // Empty object, add fields as needed
}

export interface File {
    type: string;
    id: number;
    url: string;
    options: FileOptions[];
    hash: string;
    filename: string;
    mime_type: string;
    size: number;
    width: number;
    height: number;
    dpi: number;
    status: string;
    created: number;
    thumbnail_url: string;
    preview_url: string;
    visible: boolean;
    is_temporary: boolean;
}

export interface Product {
    variant_id: number;
    product_id: number;
    image: string;
    name: string;
}

export interface Options {
    // Empty object, add fields as needed
}

export interface PrintfulSyncProductVariant {
    id: number | string;
    external_id: string | number;
    sync_product_id: number;
    name: string;
    synced: boolean;
    variant_id: number;
    retail_price: string;
    currency: string;
    is_ignored: boolean;
    sku: string;
    product: Product;
    files: File[];
    options: Options[];
    main_category_id: number;
    warehouse_product_variant_id: number;
}

export interface PrintfulSyncProductProduct {
    id: number | string;
    external_id: string;
    name: string;
    variants: number;
    synced: number;
    thumbnail_url: string
    is_ignored: boolean;
}


export interface GetSyncProductRes {
    code: number;
    result: {
        sync_product: PrintfulSyncProductProduct;
        sync_variants: PrintfulSyncProductVariant[];
    };
    error?: {
        message?: string;
        reason?: string;
    }
}

