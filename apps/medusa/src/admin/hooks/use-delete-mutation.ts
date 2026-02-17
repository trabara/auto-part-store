import {
  useMutation,
  useQueryClient,
  UseMutationOptions,
} from "@tanstack/react-query";
import { toast } from "@medusajs/ui";

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
    UseMutationOptions<any, any, string>,
    "mutationFn" | "onSuccess" | "onError"
  >;
}

/**
 * Return type from useDeleteMutation
 */
export interface UseDeleteMutationReturn {
  /** Execute the delete mutation */
  mutate: (id: string) => void;
  /** Execute the delete mutation with async/await */
  mutateAsync: (id: string) => Promise<any>;
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
 *   deleteFn: (id) => sdk.client.fetch(`/admin/fitments/${id}`, { method: "DELETE" })
 * });
 *
 * // In your component:
 * deleteMutation.mutate(fitmentId);
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

  const mutation = useMutation({
    mutationFn: deleteFn,
    onSuccess: () => {
      toast.success(successMessage);
      // Invalidate all specified query keys
      invalidateKeys.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] });
      });
    },
    onError: (error: any) => {
      toast.error(errorMessage, {
        description: error?.message || "An error occurred",
      });
    },
    ...mutationOptions,
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
  };
}
