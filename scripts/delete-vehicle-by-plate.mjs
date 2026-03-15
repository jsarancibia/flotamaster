/**
 * Elimina un vehículo por placa (y todos sus registros asociados).
 * Uso: node scripts/delete-vehicle-by-plate.mjs "GX LH 48"
 * Requiere .env con POSTGRES_PRISMA_URL
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const plate = process.argv[2]?.trim()
if (!plate) {
  console.error('Uso: node scripts/delete-vehicle-by-plate.mjs "PLACA"')
  process.exit(1)
}

async function main() {
  const vehicle = await prisma.vehicle.findFirst({
    where: {
      plate: { equals: plate, mode: 'insensitive' }
    },
    select: { id: true, plate: true }
  })

  if (!vehicle) {
    const normalized = plate.replace(/\s+/g, '').toUpperCase()
    const byNormalized = await prisma.vehicle.findMany({ select: { id: true, plate: true } })
    const match = byNormalized.find((v) => v.plate.replace(/\s+/g, '').toUpperCase() === normalized)
    if (match) {
      console.log('Vehículo encontrado (placa normalizada):', match.plate)
      await deleteVehicle(match.id)
      console.log('Vehículo eliminado correctamente.')
      return
    }
    console.error('No se encontró ningún vehículo con la placa:', plate)
    process.exit(1)
  }

  await deleteVehicle(vehicle.id)
  console.log('Vehículo', vehicle.plate, 'eliminado correctamente.')
}

async function deleteVehicle(id) {
  await prisma.$transaction(async (tx) => {
    const maintIds = await tx.maintenance.findMany({ where: { vehicleId: id }, select: { id: true } }).then((r) => r.map((m) => m.id))
    await tx.expense.deleteMany({
      where: { OR: [{ vehicleId: id }, { maintenanceId: { in: maintIds } }] }
    })
    await tx.maintenance.deleteMany({ where: { vehicleId: id } })
    await tx.rental.deleteMany({ where: { vehicleId: id } })
    await tx.weeklyPayment.deleteMany({ where: { vehicleId: id } })
    await tx.pagoSemanal.deleteMany({ where: { vehiculoId: id } })
    await tx.income.deleteMany({ where: { vehicleId: id } })
    await tx.repuesto.updateMany({ where: { vehiculoId: id }, data: { vehiculoId: null } })
    await tx.driver.updateMany({ where: { vehicleId: id }, data: { vehicleId: null } })
    await tx.vehicle.delete({ where: { id } })
  })
}

main()
  .catch((e) => {
    console.error('Error:', e.message || e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
