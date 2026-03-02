const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function cleanFinancialData() {
  try {
    console.log('Cleaning financial data...')
    
    await prisma.expense.deleteMany({})
    console.log('✓ Deleted all expenses')
    
    await prisma.maintenance.deleteMany({})
    console.log('✓ Deleted all maintenance records')
    
    await prisma.weeklyPayment.deleteMany({})
    console.log('✓ Deleted all weekly payments')
    
    await prisma.income.deleteMany({})
    console.log('✓ Deleted all incomes')
    
    await prisma.rental.deleteMany({})
    console.log('✓ Deleted all rentals')
    
    console.log('\n✅ Financial data cleaned successfully!')
    console.log('✅ Users and authentication data preserved.')
    
  } catch (error) {
    console.error('Error cleaning data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

cleanFinancialData()
