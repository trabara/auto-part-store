import { toast, usePrompt } from "@medusajs/ui"
import { useMutation as useGenericMutation } from "./use-mutation"
import { classifyErrorCode, getErrorMessage, parseApiError } from "../lib/utils/api-error"

/**
 * Configuration for delete mutations
 */
export interface DeleteMutationConfig {
  /** Query key(s) to invalidate after successful deletion */
  invalidateKeys: string[]
  /** Success message to display */
  successMessage?: string
  /** Error message to display */
  errorMessage?: string
  /** Delete function that performs the actual deletion */
  deleteFn: (id: string) => Promise<any>
  /** Additional mutation options */
  mutationOptions?: any
}

/**
 * Return type from useDeleteMutation
 */
export interface UseDeleteMutationReturn {
  /** Execute the delete mutation with async/await */
  mutateAsync: (...ids: string[]) => Promise<any>
  /** Whether the mutation is currently running */
  isPending: boolean
  /** Whether the mutation succeeded */
  isSuccess: boolean
  /** Whether the mutation failed */
  isError: boolean
  /** Error object if mutation failed */
  error: any
}

/**
 * Reusable hook for delete mutations with toast notifications and confirmation prompt
 */
export function useDeleteMutation({
  invalidateKeys,
  successMessage = "Item deleted successfully",
  errorMessage = "Failed to delete item",
  deleteFn,
  mutationOptions,
}: DeleteMutationConfig): UseDeleteMutationReturn {
  const prompt = usePrompt()

  const mutation = useGenericMutation({
    mutationFn: async (ids: string[]) => {
      const results: unknown[] = []
      for (const id of ids) {
        const result = await deleteFn(id)
        results.push(result)
      }
      return results
    },
    invalidateKeys: invalidateKeys.map((k) => [k]) as (string | number)[][],
    onSuccess: () => {
      toast.success(successMessage)
    },
    options: {
      onError: (error: Error) => {
        const parsed = parseApiError(error)
        const category = classifyErrorCode(parsed.code)
        const description = getErrorMessage(error)

        if (category === "AUTH") {
          toast.error("Access denied", { description })
        } else if (category === "NOT_FOUND") {
          toast.warning("Not found", { description })
        } else {
          toast.error(errorMessage, { description })
        }
      },
      ...mutationOptions,
    } as any,
  })

  return {
    mutateAsync: async (...ids: string[]) => {
      const confirmed = await prompt({
        title: `Are you sure you want to delete ${ids.length} item(s)?`,
        description: "This action cannot be undone.",
        confirmText: "Delete",
        cancelText: "Cancel",
      })
      if (!confirmed) {
        return
      }
      return mutation.mutateAsync(ids)
    },
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
  }
}
