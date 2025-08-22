import { queryOptions } from '@tanstack/react-query';

const fetchUserRights = async (
  userId: string
): Promise<Array<{ formId: number }>> => {
  const response = await fetch(`/api/admin/user-rights/${userId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch user rights');
  }
  return response.json();
};

export const userRightsQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ['user-rights', userId],
    queryFn: () => fetchUserRights(userId),
    enabled: !!userId,
  });
