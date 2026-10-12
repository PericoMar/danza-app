import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/providers/AuthProvider";
import { fetchProfile, saveProfile, type ProfileFields } from "@/services/profile";

export const profileKeys = {
  all: ["profile"] as const,
  detail: (userId: string | undefined) => [...profileKeys.all, userId] as const,
};

/** The signed-in user's editable profile, plus a mutation that keeps the cache in sync. */
export function useProfile() {
  const { session } = useAuth();
  const userId: string | undefined = session?.user?.id;
  const email: string = session?.user?.email ?? "";
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: profileKeys.detail(userId),
    queryFn: () => fetchProfile(userId!),
    enabled: !!userId,
  });

  const mutation = useMutation({
    mutationFn: (fields: ProfileFields) => saveProfile(userId!, fields),
    onSuccess: (saved) => {
      queryClient.setQueryData(profileKeys.detail(userId), saved);
    },
  });

  return {
    email,
    profile: query.data,
    isLoading: query.isLoading,
    loadError: query.error,
    save: mutation.mutateAsync,
  };
}
