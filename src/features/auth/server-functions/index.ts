import { redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import bcrypt from 'bcryptjs'
import db from '@/drizzle/db'
import { useAppSession } from '@/lib/session'
import { authMiddleware } from '@/middlewares/auth-middleware'

export const loginFn = createServerFn({ method: 'POST' })
  .validator((d: { userName: string; password: string }) => d)
  .handler(async ({ data }) => {
    const user = await db.query.users.findFirst({
      where: (users, { eq, or }) =>
        or(eq(users.email, data.userName), eq(users.contact, data.userName)),
    })

    if (!user) {
      return { error: true, message: 'User not found', status: 404 }
    }

    if (!user.active) {
      return { error: true, message: 'Account is deactivated', status: 403 }
    }

    const isValid = await bcrypt.compare(data.password, user.password)

    if (!isValid) {
      return { error: true, message: 'Invalid credentials', status: 401 }
    }

    const session = await useAppSession()

    await session.update({
      email: user.email as string,
      id: user.id,
      hasAdminPriviledges: user.hasAdminPriviledges,
      name: user.name,
    })

    return { message: 'Login Success', status: 200 }
  })

export const logoutFn = createServerFn({ method: 'POST' }).handler(async () => {
  const session = await useAppSession()
  session.clear()
  throw redirect({
    href: '/login',
  })
})

export const getForms = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async () => {
    return await db.query.forms.findMany({
      columns: { id: true, formName: true, path: true, module: true },
      orderBy: (forms, { asc }) => [asc(forms.moduleId), asc(forms.menuOrder)],
    })
  })
