import { Column, Entity } from "typeorm"
import {Product as MedusaProduct } from "@medusajs/medusa"

@Entity()
export class Product extends MedusaProduct {
    @Column({
        type: 'boolean'
    })
    synced: boolean

    @Column({
        type: 'text',
        nullable: true
    })
    printful_id: string
}
