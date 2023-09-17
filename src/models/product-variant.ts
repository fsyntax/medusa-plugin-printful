import { Column, Entity } from "typeorm"
import { ProductVariant as MedusaProductVariant } from "@medusajs/medusa";

@Entity()
export class ProductVariant extends MedusaProductVariant {
    @Column({
        type: 'text',
        nullable: true
    })
    printful_id: string
}
