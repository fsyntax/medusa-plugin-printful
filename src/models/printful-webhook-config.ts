import {
    Entity,
    Column,
    PrimaryColumn,
    OneToMany,
    BeforeInsert,
} from "typeorm";
import { BaseEntity } from "@medusajs/medusa";
import { generateEntityId } from "@medusajs/medusa/dist/utils";
import { PrintfulWebhookEvent } from "./printful-webhook-events";

@Entity()
export class PrintfulWebhookConfig extends BaseEntity {
    @PrimaryColumn()
    id: string;

    @Column({ type: "varchar", nullable: true })
    default_url: string | null;

    @Column({ type: "varchar", nullable: true })
    public_key: string | null;

    @Column({ type: "varchar", nullable: true })
    secret_key: string | null;

    @Column({ type: "bigint", nullable: true })
    expires_at: number | null;

    @OneToMany(() => PrintfulWebhookEvent, (event) => event.config)
    events: PrintfulWebhookEvent[];

    @BeforeInsert()
    private beforeInsert(): void {
        this.id = generateEntityId(this.id, "printful_webhook_config");
    }
}
