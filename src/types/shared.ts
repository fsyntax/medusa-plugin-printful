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
