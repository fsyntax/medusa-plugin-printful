export interface PrintfulCatalogProductVariant {
    id: number;
    product_id: number;
    name: string;
    size: string;
    color: string;
    color_code: string;
    color_code2?: string;  // Optional
    image: string;
    price: string;
    in_stock: boolean;
    availability_regions?: any;  // Optional, replace with the actual type if known
    availability_status: any[];  // Replace with the actual type if known
    material: Material[];
}
interface Material {
    name: string;
    percentage: number;
}


export interface PrintfulCatalogProductProduct {
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
    files: any[];  // Replace with the actual type if known
    options: any[];  // Replace with the actual type if known
    is_discontinued: boolean;
    avg_fulfillment_time: number;
    description: string;
    techniques: any[];  // Replace with the actual type if known
    origin_country: string;
}

export interface PrintfulCatalogProductRes {
    code: number;
    result: {
        product: PrintfulCatalogProductProduct;
        variants: PrintfulCatalogProductVariant[];
    };
    error?: {
        message?: string;
        reason?: string;
    }
}
