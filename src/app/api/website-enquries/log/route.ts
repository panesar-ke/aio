import db from '@/drizzle/db';
import { websiteEnquiryDedup } from '@/drizzle/schema';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const schema = z.object({
  fingerprint: z.string().min(1, 'Finger print is required').max(255),
  senderEmail: z.string().email({ message: 'Invalid email address' }),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = schema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: 'Invalid data passed!', success: false },
      { status: 400 },
    );
  }

  try {
    await db
      .insert(websiteEnquiryDedup)
      .values({
        senderEmail: result.data.senderEmail,
        fingerPrint: result.data.fingerprint,
      })
      .onConflictDoNothing()
      .execute();

    return NextResponse.json({ success: true, error: null }, { status: 201 });
  } catch (error) {
    console.error('🔥🔥', error);
    return NextResponse.json(
      { error: 'Internal Server Error', success: false },
      { status: 500 },
    );
  }
}
