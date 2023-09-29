import { MigrationInterface, QueryRunner } from "typeorm"

export class ProductVariantExtendPrintfulId1694967905666 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_variant" ADD "printful_id" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_variant" DROP COLUMN "printful_id"`);
    }

}

