import { MigrationInterface, QueryRunner } from "typeorm"

export class ProductExtendPrintfulId1694962785682 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product" ADD "printful_id" text`);

    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product" DROP COLUMN "printful_id"`);

    }

}
