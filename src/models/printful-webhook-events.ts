import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
} from "typeorm";
import { PrintfulWebhookConfig } from "./printful-webhook-config";

@Entity()
export class PrintfulWebhookEvent {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "varchar" })
    type: string;

    @Column({ type: "varchar", nullable: true })
    url: string | null;

    @ManyToOne(() => PrintfulWebhookConfig, (config) => config.events)
    @JoinColumn({ name: "config_id" })
    config: PrintfulWebhookConfig;
}
