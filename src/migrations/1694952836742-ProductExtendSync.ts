import { MigrationInterface, QueryRunner } from "typeorm"

export class ProductExtendSync1694952836742 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product" ADD "synced" boolean DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "product" ADD "printful_id" text DEFAULT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product" DROP COLUMN "synced"`);
        await queryRunner.query(`ALTER TABLE "product" DROP COLUMN "printful_id"`);
    }

}
