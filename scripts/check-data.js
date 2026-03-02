const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkData() {
  try {
    console.log('Checking database...\n')
    
    const users = await prisma.user.findMany()
    console.log(`Users: ${users.length}`)
    
    const vehicles = await prisma.vehicle.findMany()
    console.log(`Vehicles: ${vehicles.length}`)
    
    const expenses = await prisma.expense.findMany()
    console.log(`Expenses: ${expenses.length}`)
    if (expenses.length > 0) {
      console.log('Sample expenses:', JSON.stringify(expenses.slice(0, 3), null, 2))
    }
    
    const payments = await prisma.weeklyPayment.findMany()
    console.log(`Weekly Payments: ${payments.length}`)
    if (payments.length > 0) {
      console.log('Sample payments:', JSON.stringify(payments.slice(0, 3), null, 2))
    }
    
    const incomes = await prisma.income.findMany()
    console.log(`Incomes: ${incomes.length}`)
    
    const maintenances = await prisma.maintenance.findMany()
    console.log(`Maintenances: ${maintenances.length}`)
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkData()
