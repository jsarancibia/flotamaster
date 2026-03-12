-- CreateTable
CREATE TABLE "repuestos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "vehiculo_id" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precio_unitario" DOUBLE PRECISION NOT NULL,
    "fecha_compra" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "proveedor" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "repuestos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "repuestos_vehiculo_id_idx" ON "repuestos"("vehiculo_id");

-- CreateIndex
CREATE INDEX "repuestos_fecha_compra_idx" ON "repuestos"("fecha_compra");

-- AddForeignKey
ALTER TABLE "repuestos" ADD CONSTRAINT "repuestos_vehiculo_id_fkey" FOREIGN KEY ("vehiculo_id") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
