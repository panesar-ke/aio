import { redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import bcrypt from 'bcryptjs'
import db from '@/drizzle/db'
import { useAppSession } from '@/lib/session'

export const loginFn = createServerFn({ method: 'POST' })
  .validator((d: { userName: string; password: string }) => d)
  .handler(async ({ data }) => {
    const user = await db.query.users.findFirst({
      where: (users, { eq, or }) =>
        or(eq(users.email, data.userName), eq(users.contact, data.userName)),
    })

    if (!user) {
      return { success: false, message: 'User not found', status: 404 }
    }

    if (!user.active) {
      return { success: false, message: 'Account is deactivated', status: 403 }
    }

    const isValid = await bcrypt.compare(data.password, user.password)

    if (!isValid) {
      return { success: false, message: 'Invalid credentials', status: 401 }
    }

    const session = await useAppSession()

    await session.update({
      email: user.email as string,
      id: user.id,
      hasAdminPriviledges: user.hasAdminPriviledges,
      name: user.name,
    })

    return { success: true, message: 'Login Success', status: 200 }
  })

export const logoutFn = createServerFn({ method: 'POST' }).handler(async () => {
  const session = await useAppSession()
  session.clear()
  throw redirect({
    href: '/login',
  })
})
