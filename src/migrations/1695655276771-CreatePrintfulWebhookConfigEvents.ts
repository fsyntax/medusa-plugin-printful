import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePrintfulWebhookConfigEvents1695655276771 implements MigrationInterface {
    name = 'CreatePrintfulWebhookConfigEvents1695655276771'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "printful_webhook_event" ("id" SERIAL NOT NULL, "type" character varying NOT NULL, "url" character varying, "config_id" character varying, CONSTRAINT "PK_63f425a39d48732f1b9ca947d72" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "printful_webhook_event" ADD CONSTRAINT "FK_0f6e9e796e1be257f2c3b75199e" FOREIGN KEY ("config_id") REFERENCES "printful_webhook_config"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "printful_webhook_event" DROP CONSTRAINT "FK_0f6e9e796e1be257f2c3b75199e"`);
        await queryRunner.query(`DROP TABLE "printful_webhook_event"`);
    }

}
