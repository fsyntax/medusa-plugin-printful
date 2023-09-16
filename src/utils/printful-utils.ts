import {PrintfulCatalogVariant} from "../types/printfulCatalogVariant";
import {CreateProductProductOption, CreateProductProductTagInput} from "@medusajs/medusa/dist/types/product";
import {PrintfulSyncProductVariant} from "../types/printfulSyncProduct";

export function buildProductImages(sync_variant: PrintfulSyncProductVariant[]): string[] {
    return sync_variant.flatMap(variant => (
        variant.files
            .filter(file => file.type === 'preview')
            .map(file => file.preview_url)
    )).filter((url, index, arr) => arr.indexOf(url) === index && url !== null && url !== '');
}

export function buildProductOptions(catalogVariants: PrintfulCatalogVariant[]): CreateProductProductOption[] {
    const hasSize = catalogVariants.some(({ size }) => size !== null);
    const hasColor = catalogVariants.some(({ color }) => color !== null);

    return [
        ...(hasSize ? [{ title: "size" }] : []),
        ...(hasColor ? [{ title: "color" }] : []),
    ];
}

export function buildProductTags(catalogVariants: PrintfulCatalogVariant[]): CreateProductProductTagInput[] {
    return Object.keys(
        catalogVariants.reduce((acc, variant) => {
            const { size, color } = variant;

            if (size && !acc[size]) {
                acc[size] = true;
            }
            if (color && !acc[color]) {
                acc[color] = true;
            }
            // if (type && !acc[type]) {
            //     acc[type] = true;
            // }

            return acc;
        }, {})
    ).map((value) => ({ value: capitalize(value) }));
}

function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export function convertToInteger(str: string): number {
    let numStr = str.replace(",", ".");
    return Math.round(parseFloat(numStr) * 100);
}
