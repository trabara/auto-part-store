import { toast } from "@medusajs/ui";
import {
    useMutation,
    UseMutationOptions,
    useQueryClient,
} from "@tanstack/react-query";

/**
 * Configuration for create mutations
 */
export interface CreateMutationConfig<TInput = any> {
    /** Query key(s) to invalidate after successful create */
    invalidateKeys: string[];
    /** Success message to display */
    successMessage?: string;
    /** Error message to display */
    errorMessage?: string;
    /** Create function that performs the actual create */
    createFn: (input: TInput) => Promise<any>;
    /** Additional mutation options */
    mutationOptions?: Omit<
        UseMutationOptions<any, any, TInput>,
        "mutationFn" | "onSuccess" | "onError"
    >;
}


/**
 * Return type from useCreateMutation
 */
export interface UseCreateMutationReturn<TInput = any> {
    /** Execute the create mutation */
    mutate: (input: TInput) => void;
    /** Execute the create mutation with async/await */
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


export function useCreateMutation({
    invalidateKeys,
    successMessage = "Item created successfully",
    errorMessage = "Failed to create item",
    createFn,
    mutationOptions,
}: CreateMutationConfig): UseCreateMutationReturn {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: createFn,
        onSuccess: () => {
            toast.success(successMessage);
            invalidateKeys.forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
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