import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Limpiando datos de prueba...\n')

  const result = await prisma.$transaction(async (tx) => {
    const expenses = await tx.expense.deleteMany({})
    const pagos = await tx.pagoSemanal.deleteMany({})
    const weeklyPayments = await tx.weeklyPayment.deleteMany({})
    const incomes = await tx.income.deleteMany({})
    const rentals = await tx.rental.deleteMany({})
    const repuestos = await tx.repuesto.deleteMany({})
    const maintenances = await tx.maintenance.deleteMany({})
    const drivers = await tx.driver.deleteMany({})
    const vehicles = await tx.vehicle.deleteMany({})

    return { expenses, pagos, weeklyPayments, incomes, rentals, repuestos, maintenances, drivers, vehicles }
  })

  console.log('Registros eliminados:')
  console.log(`  Gastos (expenses):     ${result.expenses.count}`)
  console.log(`  Pagos semanales:       ${result.pagos.count}`)
  console.log(`  Weekly payments:       ${result.weeklyPayments.count}`)
  console.log(`  Ingresos (incomes):    ${result.incomes.count}`)
  console.log(`  Alquileres (rentals):  ${result.rentals.count}`)
  console.log(`  Repuestos:             ${result.repuestos.count}`)
  console.log(`  Mantenimientos:        ${result.maintenances.count}`)
  console.log(`  Conductores:           ${result.drivers.count}`)
  console.log(`  Vehículos:             ${result.vehicles.count}`)

  const total = Object.values(result).reduce((a, b) => a + b.count, 0)
  console.log(`\nTotal: ${total} registros eliminados`)

  const users = await prisma.user.findMany({ select: { id: true, email: true, name: true } })
  console.log(`\nUsuarios preservados: ${users.length}`)
  users.forEach(u => console.log(`  - ${u.email} (${u.name || 'sin nombre'})`))

  console.log('\nBase de datos lista para producción.')
}

main()
  .catch(e => { console.error('Error:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
