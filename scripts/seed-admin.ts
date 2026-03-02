import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@flotamaster.com' },
    update: {},
    create: {
      email: 'admin@flotamaster.com',
      password: hashedPassword,
      name: 'Administrador'
    }
  })

  console.log('Admin created:', admin)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
