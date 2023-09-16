export interface PrintfulCatalogVariantProduct {
    id: number;
    main_category_id: number;
    type: string;
    type_name: string;
    title: string;
    brand: string;
    model: string;
    image: string;
    variant_count: number;
    currency: string;
    files: any[]; // Replace with the actual type if known
    options: any[]; // Replace with the actual type if known
    is_discontinued: boolean;
    avg_fulfillment_time: number;
    description: string;
    techniques: any[]; // Replace with the actual type if known
    origin_country: string;
}

export interface PrintfulCatalogVariant {
    id: number;
    product_id: number;
    name: string;
    size: string;
    color: string;
    color_code: string;
    color_code2?: string;
    image: string;
    price: string;
    in_stock: boolean;
    availability_regions?: any;
    availability_status: any[];
    material: Material[];
}

interface Material {
    name: string;
    percentage: number;
}

export interface PrintfulCatalogVariantRes {
    code: number;
    result: {
        variant: PrintfulCatalogVariant;
        product: PrintfulCatalogVariantProduct;
    };
    error?: {
        message?: string;
        reason?: string;
    }
}
