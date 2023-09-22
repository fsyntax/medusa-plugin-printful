export interface GetProductSizeGuideResponse {
    data?: {
        product_id: number;
        available_sizes: string[];
        size_tables: SizeTable[];
    };
    error?: {
        reason: string
        message: string
    },
    code?: number;
    _links: {
        self: {
            href: string;
        };
        product_details: {
            href: string;
        };
    };
}

export interface SizeTable {
    type: string;
    unit: string;
    description: string;
    image_url: string;
    image_description: string;
    measurements: SizeMeasurement[];
}

export interface SizeMeasurement {
    type_label: string;
    values: SizeValue[];
}

export interface SizeValue {
    size: string;
    value?: string;
    min_value?: string;
    max_value?: string;
}

export interface GetProductSizeGuideRequest {
    id: number;
    unit?: 'inches' | 'cm';
}
