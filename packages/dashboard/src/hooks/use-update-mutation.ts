import { toast } from "@medusajs/ui";
import {
    useMutation,
    UseMutationOptions,
    useQueryClient,
} from "@tanstack/react-query";

/**
 * Configuration for update mutations
 */
export interface UpdateMutationConfig<TInput = any> {
    /** Query key(s) to invalidate after successful update */
    invalidateKeys: string[];
    /** Success message to display */
    successMessage?: string;
    /** Error message to display */
    errorMessage?: string;
    /** Additional mutation options */
    mutationOptions?: Omit<
        UseMutationOptions<any, any, TInput>,
        "mutationFn" | "onSuccess" | "onError"
    >;
    /** Update function that performs the actual update */
    updateFn: (input: TInput) => Promise<any>;
    /** Callback function to be called on successful mutation */
    onSuccess?: () => void;
    /** Callback function to be called on mutation error */
    onFailure?: (error: any) => void;


}


/**
 * Return type from useUpdateMutation
 */
export interface UseUpdateMutationReturn<TInput = any> {
    /** Execute the update mutation */
    mutate: (input: TInput) => void;
    /** Execute the update mutation with async/await */
    mutateAsync: (input: TInput) => Promise<any>;
    /** Whether the mutation is currently running */
    isPending: boolean;
    /** Whether the mutation succeeded */
    isSuccess: boolean;
    /** Whether the mutation failed */
    isError: boolean;
    /** Error object if mutation failed */
    error: any;
}


export function useUpdateMutation({
    invalidateKeys,
    successMessage = "Item updated successfully",
    errorMessage = "Failed to update item",
    mutationOptions,
    updateFn,
    onSuccess,
    onFailure,
}: UpdateMutationConfig): UseUpdateMutationReturn {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: updateFn,
        onSuccess: () => {
            toast.success(successMessage);
            queryClient.invalidateQueries({ queryKey: invalidateKeys });
            onSuccess?.();

        },
        onError: (error: any) => {
            toast.error(errorMessage, {
                description: error.message || "An error occurred",
            });
            onFailure?.(error);
        },
        ...mutationOptions,
    });

    return mutation;
}