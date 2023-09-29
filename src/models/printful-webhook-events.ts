import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
    Unique,
} from "typeorm";
import { PrintfulWebhookConfig } from "./printful-webhook-config";

@Entity()
@Unique(["config", "type"])
export class PrintfulWebhookEvent {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "varchar" })
    type: string;

    @Column({ type: "varchar", nullable: true })
    url: string | null;

    @Column({ type: "boolean", default: true })
    enabled: boolean;

    @ManyToOne(() => PrintfulWebhookConfig, (config) => config.events)
    @JoinColumn({ name: "config_id", referencedColumnName: "id" })
    config: PrintfulWebhookConfig;
}
