import {
    useMutation,
    useQueryClient,
    UseMutationOptions,
} from "@tanstack/react-query";
import { toast } from "@medusajs/ui";

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
    /** Update function that performs the actual update */
    updateFn: (input: TInput) => Promise<any>;
    /** Additional mutation options */
    mutationOptions?: Omit<
        UseMutationOptions<any, any, TInput>,
        "mutationFn" | "onSuccess" | "onError"
    >;
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
    updateFn,
    mutationOptions,
}: UpdateMutationConfig): UseUpdateMutationReturn {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: updateFn,
        onSuccess: () => {
            toast.success(successMessage);
            invalidateKeys.forEach((key) => queryClient.invalidateQueries({ queryKey: [[key]] }));
        },
        onError: (error: any) => {
            toast.error(errorMessage, {
                description: error.message || "An error occurred",
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