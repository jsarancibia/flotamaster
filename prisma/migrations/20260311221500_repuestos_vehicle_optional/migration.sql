-- AlterTable
ALTER TABLE "repuestos" ALTER COLUMN "vehiculo_id" DROP NOT NULL;

-- DropForeignKey
ALTER TABLE "repuestos" DROP CONSTRAINT "repuestos_vehiculo_id_fkey";

-- AddForeignKey
ALTER TABLE "repuestos" ADD CONSTRAINT "repuestos_vehiculo_id_fkey" FOREIGN KEY ("vehiculo_id") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
