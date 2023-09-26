import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePrintfulWebhookConfig1695638322774 implements MigrationInterface {
    name = 'CreatePrintfulWebhookConfig1695638322774'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "printful_webhook_config" ("id" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "default_url" character varying, "public_key" character varying, "secret_key" character varying, "expires_at" bigint, CONSTRAINT "PK_0cdf946329bec2d76be4e1d6b96" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "printful_webhook_config"`);
    }

}
