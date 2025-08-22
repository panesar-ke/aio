import type { NextApiRequest, NextApiResponse } from 'next';
import { eq } from 'drizzle-orm';
import db from '@/drizzle/db';
import { userRights } from '@/drizzle/schema';

type ResponseData = {
  error: string | null;
  data?: Array<{ formId: number }>;
};

export async function handler(
  request: NextApiRequest,
  response: NextApiResponse<ResponseData>
) {
  if (request.method === 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = request.query;

    if (!userId) {
      return response.status(400).json({ error: 'User ID is required' });
    }

    const rights = await db
      .select({
        formId: userRights.formId,
      })
      .from(userRights)
      .where(eq(userRights.userId, userId as string));

    return response.status(200).json({ data: rights, error: null });
  } catch (error) {
    console.error('Error fetching user rights:', error);
    return response.status(500).json({ error: 'Failed to fetch user rights' });
  }
}
