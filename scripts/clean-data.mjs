/**
 * Limpieza completa de datos operativos para entrega final.
 * Orden respeta FKs (tablas hijas primero). NO modifica la tabla User.
 * Uso: node scripts/clean-data.mjs  (o npx prisma db execute con el SQL si prefieres)
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Limpiando datos operativos (entrega final)...\n')

  const result = await prisma.$transaction(async (tx) => {
    const expenses = await tx.expense.deleteMany({})
    const maintenances = await tx.maintenance.deleteMany({})
    const rentals = await tx.rental.deleteMany({})
    const weeklyPayments = await tx.weeklyPayment.deleteMany({})
    const pagosSemanales = await tx.pagoSemanal.deleteMany({})
    const incomes = await tx.income.deleteMany({})
    const repuestos = await tx.repuesto.deleteMany({})
    const drivers = await tx.driver.deleteMany({})
    const vehicles = await tx.vehicle.deleteMany({})

    return {
      expenses,
      maintenances,
      rentals,
      weeklyPayments,
      pagosSemanales,
      incomes,
      repuestos,
      drivers,
      vehicles,
    }
  })

  console.log('Registros eliminados:')
  console.log(`  Gastos:               ${result.expenses.count}`)
  console.log(`  Mantenimientos:       ${result.maintenances.count}`)
  console.log(`  Alquileres:           ${result.rentals.count}`)
  console.log(`  Weekly payments:      ${result.weeklyPayments.count}`)
  console.log(`  Pagos semanales:      ${result.pagosSemanales.count}`)
  console.log(`  Ingresos:             ${result.incomes.count}`)
  console.log(`  Repuestos:            ${result.repuestos.count}`)
  console.log(`  Conductores:          ${result.drivers.count}`)
  console.log(`  Vehículos:            ${result.vehicles.count}`)

  const total = Object.values(result).reduce((a, b) => a + b.count, 0)
  console.log(`\nTotal: ${total} registros eliminados.`)

  const users = await prisma.user.findMany({ select: { id: true, email: true, name: true } })
  console.log(`\nUsuarios preservados (autenticación intacta): ${users.length}`)
  users.forEach((u) => console.log(`  - ${u.email} (${u.name || 'sin nombre'})`))

  const remaining = await Promise.all([
    prisma.expense.count(),
    prisma.maintenance.count(),
    prisma.vehicle.count(),
    prisma.driver.count(),
  ])
  const allZero = remaining.every((c) => c === 0)
  console.log(allZero ? '\nVerificación: tablas operativas vacías. Sin registros huérfanos.' : '\nAdvertencia: revisar conteos restantes.')

  console.log('\nBase de datos lista para entrega final.')
}

main()
  .catch(e => { console.error('Error:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
