import type { NextRequest } from 'next/server';

import { NextResponse } from 'next/server';
import z from 'zod';

import db from '@/drizzle/db';
import { verifyPassword } from '@/features/auth/utils/password';
import { getCurrentUserOrNull } from '@/lib/session';

const bodySchema = z.object({
  currentPassword: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const user = await getCurrentUserOrNull();
  if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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

    // Uses verifyPassword rather than a direct bcrypt.compare so a legacy
    // hash-of-lowercased-input still verifies against the as-typed password.
    // No needsRehash handling: this is a read-only validation endpoint and
    // should not have a database write side effect.
    const verification = await verifyPassword(
      validation.data.currentPassword,
      dbUser.password
    );
    if (!verification.ok) {
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
