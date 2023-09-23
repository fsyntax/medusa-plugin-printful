export interface Product {
    id: number;
    main_category_id?: number;
    type?: string;
    name?: string;
    brand?: string;
    model?: string;
    image?: string;
    variant_count?: number;
    is_discontinued?: boolean;
    description?: string;
    techniques?: Technique[];
    design_placements?: DesignPlacement[];
    product_options?: ProductOption[];
    _links?: ProductLinks;
}

export interface Technique {
    key: string;
    display_name: string;
    is_default: boolean;
}

export interface DesignPlacement {
    placement: string;
    technique: string;
    print_area_width: number;
    print_area_height: number;
    layers?: Layer[];
    options?: PlacementOption[];
}

export interface Layer {
    type: string;
    options: PlacementOption[];
}

export interface PlacementOption {
    name: string;
    techniques: string[] | null;
    type: string;
    values: boolean[];
}

export interface ProductOption {
    name: string;
    techniques: string[];
    type: string;
    values: boolean[];
}

export interface ProductLinks {
    self: {
        href: string;
    };
    variants?: {
        href: string;
    };
    categories?: {
        href: string;
    };
    product_prices?: {
        href: string;
    };
    product_sizes?: {
        href: string;
    };
    product_images?: {
        href: string;
    };
}

export interface Variant {
    id: number;
    product_id: number;
    name: string;
    size: string;
    color: string;
    color_code: string;
    color_code2: string;
    image: string;
    availability: Availability[];
}

export interface Availability {
    region: string;
    status: string;
}

export interface Recipient {
    name: string;
    company?: string;
    address1: string;
    address2?: string;
    city: string;
    state_code?: string;
    state_name?: string;
    country_code: string;
    country_name: string;
    zip: string;
    phone?: string;
    email?: string;
    tax_number?: string;
}

export interface Order {
    id: number;
    external_id: string | null;
    store_id: number;
    shipping: string;
    status: string;
    created_at: string; // Date-time format
    updated_at: string; // Date-time format
    recipient: Recipient;
    costs: {
        retail_costs: {
            calculation_status: string; // Enum: "done", "calculating", "failed"
            currency: string;
            subtotal: string | null;
            discount: string;
            shipping: string;
            vat: string;
            tax: string;
            total: string | null;
        };
    };
    items: OrderItem[];
    customization?: {
        gift?: {
            subject: string;
            message: string;
        };
        packing_slip?: {
            email: string;
            phone: string;
            message: string;
            logo_url: string;
            store_name: string;
            custom_order_id: string;
        };
    };
    links: object;
}

export interface OrderItem {
    id: number;
    external_id: string;
    quantity: number;
    retail_price: string;
    name: string;
    product_options?: {
        name: string;
        value: any;
    }[];
    placements?: {
        placement: string;
        technique: string;
        layers: any[]; // You can replace 'any' with a more specific type if needed
        placement_options: any[]; // You can replace 'any' with a more specific type if needed
    }[];
    _links: {
        self: {
            href: string;
        };
    };
    variant_id: number;
    source: string;
}

export interface WebhookEventData {
    type: string;
    occurred_at: string;
    retries: number;
    store_id: number;
    data: Record<string, any>;
}
