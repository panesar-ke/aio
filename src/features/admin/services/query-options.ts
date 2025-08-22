import { queryOptions } from '@tanstack/react-query';

type UserRightsResponse = {
  error: string | null;
  data?: Array<{ formId: number }>;
};

const fetchUserRights = async (
  userId: string
): Promise<Array<{ formId: number }>> => {
  const response = await fetch(`/api/admin/user-rights/${userId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch user rights');
  }

  const result: UserRightsResponse = await response.json();

  if (result.error) {
    throw new Error(result.error);
  }

  return result.data || [];
};

export const userRightsQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ['user-rights', userId],
    queryFn: () => fetchUserRights(userId),
    enabled: !!userId,
  });
