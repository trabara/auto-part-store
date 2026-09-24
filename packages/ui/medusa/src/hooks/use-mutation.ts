/**
 * useMutation — generic mutation primitive.
 *
 * Pure mutation with query invalidation. No UI side effects (toasts, navigation).
 * Intended as a building block for app-specific action hooks that add business logic.
 *
 * Usage:
 * ```ts
 * // Generic primitive (no side effects)
 * const { mutate, isPending } = useMutation({
 *   mutationFn: (data) => sdk.repairRequests.create(data),
 *   invalidateKeys: [["repair-requests"]],
 * })
 * ```
 *
 * App-specific action (adds toast + navigation):
 * ```ts
 * function useCreateRepairRequest() {
 *   const qc = useQueryClient()
 *   const navigate = useNavigate()
 *   return useMutation({
 *     mutationFn: (data) => sdk.repairRequests.create(data),
 *     invalidateKeys: [["repair-requests"]],
 *     onSuccess: () => { toast.success("Created"); navigate("/admin/repair-requests") },
 *   })
 * }
 * ```
 */

import {
  useMutation as useTanStackMutation,
  type UseMutationOptions,
  useQueryClient,
} from "@tanstack/react-query"

export type MutationConfig<TData, TError, TVariables, TContext> = {
  mutationFn: (variables: TVariables) => Promise<TData>
  /** Query keys to invalidate on success */
  invalidateKeys?: (string | (string | number)[])[]
  /** Additional TanStack mutation options (onSuccess, onError, etc.) */
  options?: Omit<
    UseMutationOptions<TData, TError, TVariables, TContext>,
    "mutationFn" | "onSuccess"
  >
  /** Custom onSuccess handler called after invalidation */
  onSuccess?: (
    data: TData,
    variables: TVariables,
    context: TContext | undefined,
  ) => void | Promise<void>
}

export function useMutation<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown,
>(config: MutationConfig<TData, TError, TVariables, TContext>) {
  const queryClient = useQueryClient()

  return useTanStackMutation({
    mutationFn: config.mutationFn,
    onSuccess: async (data, variables, context) => {
      // Invalidate all specified query keys
      if (config.invalidateKeys) {
        await Promise.all(
          config.invalidateKeys.map((key) =>
            queryClient.invalidateQueries({
              queryKey: Array.isArray(key) ? key : [key],
            }),
          ),
        )
      }
      // Run custom onSuccess handler
      await config.onSuccess?.(data, variables, context)
    },
    ...config.options,
  })
}
