const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const email = 'admin@flotamaster.com'
  const password = 'admin123'

  const existing = await prisma.user.findUnique({ where: { email } })

  if (existing) {
    console.log('Usuario admin ya existe:', email)
    return
  }

  const hashed = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: {
      email,
      password: hashed,
      name: 'Administrador'
    }
  })

  console.log('Usuario admin creado:')
  console.log('  email:', user.email)
  console.log('  contraseña:', password)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

