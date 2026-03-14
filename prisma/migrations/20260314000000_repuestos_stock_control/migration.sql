-- Rename cantidad to cantidad_comprada
ALTER TABLE "repuestos" RENAME COLUMN "cantidad" TO "cantidad_comprada";

-- Add cantidad_actual column
ALTER TABLE "repuestos" ADD COLUMN "cantidad_actual" INTEGER NOT NULL DEFAULT 0;

-- Set cantidad_actual = cantidad_comprada for existing rows
UPDATE "repuestos" SET "cantidad_actual" = "cantidad_comprada";
