import { toast } from "@medusajs/ui"
import { useMutation as useGenericMutation } from "./use-mutation"
import { classifyErrorCode, getErrorMessage, parseApiError } from "../utils/api-error"

/**
 * Configuration for update mutations
 */
export interface UpdateMutationConfig<TInput = any> {
  /** Query key(s) to invalidate after successful update */
  invalidateKeys: string[]
  /** Success message to display */
  successMessage?: string
  /** Error message to display */
  errorMessage?: string
  /** Update function that performs the actual update */
  updateFn: (input: TInput) => Promise<any>
  /** Additional mutation options */
  mutationOptions?: any
  /** Callback function to be called on successful mutation */
  onSuccess?: () => void
  /** Callback function to be called on mutation error */
  onFailure?: (error: Error) => void
}

/**
 * Return type from useUpdateMutation
 */
export interface UseUpdateMutationReturn<TInput = any> {
  /** Execute the update mutation */
  mutate: (input: TInput) => void
  /** Execute the update mutation with async/await */
  mutateAsync: (input: TInput) => Promise<any>
  /** Whether the mutation is currently running */
  isPending: boolean
  /** Whether the mutation succeeded */
  isSuccess: boolean
  /** Whether the mutation failed */
  isError: boolean
  /** Error object if mutation failed */
  error: any
}

export function useUpdateMutation({
  invalidateKeys,
  successMessage = "Item updated successfully",
  errorMessage = "Failed to update item",
  mutationOptions,
  updateFn,
  onSuccess: onSuccessCb,
  onFailure,
}: UpdateMutationConfig): UseUpdateMutationReturn {
  const mutation = useGenericMutation({
    mutationFn: updateFn,
    invalidateKeys: invalidateKeys.map((k) => [k]) as (string | number)[][],
    onSuccess: () => {
      toast.success(successMessage)
      onSuccessCb?.()
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
        onFailure?.(error)
      },
      ...mutationOptions,
    } as any,
  })

  return mutation as UseUpdateMutationReturn
}
