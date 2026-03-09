import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL
  const password = process.env.SEED_ADMIN_PASSWORD

  if (!email || !password) {
    throw new Error('Missing SEED_ADMIN_EMAIL or SEED_ADMIN_PASSWORD')
  }

  const hashedPassword = await bcrypt.hash(password, 10)
  
  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      password: hashedPassword,
      name: 'Administrador'
    }
  })

  console.log('Admin created:', admin)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
