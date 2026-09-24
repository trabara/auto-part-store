import { toast } from "@medusajs/ui"
import { useMutation as useGenericMutation } from "./use-mutation"
import { classifyErrorCode, getErrorMessage, parseApiError } from "../lib/utils/api-error"

/**
 * Configuration for create mutations
 */
export interface CreateMutationConfig<TInput = any> {
  /** Query key(s) to invalidate after successful create */
  invalidateKeys: string[]
  /** Success message to display */
  successMessage?: string
  /** Error message to display */
  errorMessage?: string
  /** Create function that performs the actual create */
  createFn: (input: TInput) => Promise<any>
  /** Additional mutation options */
  mutationOptions?: any
}

/**
 * Return type from useCreateMutation
 */
export interface UseCreateMutationReturn<TInput = any> {
  /** Execute the create mutation */
  mutate: (input: TInput) => void
  /** Execute the create mutation with async/await */
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

export function useCreateMutation({
  invalidateKeys,
  successMessage = "Item created successfully",
  errorMessage = "Failed to create item",
  createFn,
  mutationOptions,
}: CreateMutationConfig): UseCreateMutationReturn {
  const mutation = useGenericMutation({
    mutationFn: createFn,
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

  return mutation as UseCreateMutationReturn
}
