import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import z from 'zod';
import type { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import db from '@/drizzle/db';

const bodySchema = z.object({
  currentPassword: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  const body = await req.json();

  try {
    const validation = bodySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Enter current password' },
        { status: 400 }
      );
    }

    const dbUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, user.id),
      columns: {
        id: true,
        password: true,
      },
    });

    if (!dbUser)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const isValid = await bcrypt.compare(
      validation.data.currentPassword,
      dbUser.password
    );
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid current password' },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('🔥🔥', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
