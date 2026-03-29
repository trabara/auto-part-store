import { toast, usePrompt } from "@medusajs/ui";
import {
  useMutation,
  UseMutationOptions,
  useQueryClient,
} from "@tanstack/react-query";

/**
 * Configuration for delete mutations
 */
export interface DeleteMutationConfig {
  /** Query key(s) to invalidate after successful deletion */
  invalidateKeys: string[];
  /** Success message to display */
  successMessage?: string;
  /** Error message to display */
  errorMessage?: string;
  /** Delete function that performs the actual deletion */
  deleteFn: (id: string) => Promise<any>;
  /** Additional mutation options */
  mutationOptions?: Omit<
    UseMutationOptions<any, any, string[]>,
    "mutationFn" | "onSuccess" | "onError"
  >;
}

/**
 * Return type from useDeleteMutation
 */
export interface UseDeleteMutationReturn {
  /** Execute the delete mutation with async/await */
  mutateAsync: (...ids: string[]) => Promise<any>;
  /** Whether the mutation is currently running */
  isPending: boolean;
  /** Whether the mutation succeeded */
  isSuccess: boolean;
  /** Whether the mutation failed */
  isError: boolean;
  /** Error object if mutation failed */
  error: any;
}

/**
 * Reusable hook for delete mutations with toast notifications
 *
 * Follows SRP: Handles ONLY delete operations with notifications
 * Follows OCP: Extensible via configuration and callbacks
 * Follows DIP: Depends on abstractions (config interface) not concretions
 *
 * @example
 * ```tsx
 * const deleteMutation = useDeleteMutation({
 *   invalidateKeys: ["fitments"],
 *   successMessage: "Fitment deleted successfully",
 *   errorMessage: "Failed to delete fitment",
 *   deleteFn: ({ ids }) => Promise.all(ids.map((id) => sdk.client.fetch(`/admin/fitments/${id}`, { method: "DELETE" })))
 * });
 *
 * // In your component:
 * deleteMutation.mutate([fitmentId]);
 * ```
 */
export function useDeleteMutation({
  invalidateKeys,
  successMessage = "Item deleted successfully",
  errorMessage = "Failed to delete item",
  deleteFn,
  mutationOptions,
}: DeleteMutationConfig): UseDeleteMutationReturn {
  const queryClient = useQueryClient();
  const prompt = usePrompt();

  const mutation = useMutation({
    mutationFn: async (ids) => {
      const results = [];
      for (const id of ids) {
        const result = await deleteFn(id);
        results.push(result);
      }
      return results;
    },
    onSuccess: () => {
      toast.success(successMessage);
      // Invalidate all specified query keys
      invalidateKeys.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] });
      });
    },
    onError: (error) => {
      toast.error(errorMessage, {
        description: error?.message
      });
    },
    ...mutationOptions,
  });

  return {
    mutateAsync: async (...ids: string[]) => {
      const confirmed = await prompt({
        title: `Are you sure you want to delete ${ids.length} item(s)?`,
        description: "This action cannot be undone.",
        confirmText: "Delete",
        cancelText: "Cancel",
      })
      if (!confirmed) {
        return;
      }
      return mutation.mutateAsync(ids)
    },
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
  };
}
