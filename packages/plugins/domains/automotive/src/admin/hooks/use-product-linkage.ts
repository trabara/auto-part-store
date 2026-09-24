import { toast } from "@medusajs/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sdk } from "../lib/sdk";
import { AdminProductWithFitments } from "../routes/products/types";


/**
 * Return type from useProductLinkage
 */
export interface UseProductLinkageReturn {
  // Actions
  handleLinkProduct: (fitmentId: string, productId: string) => void;
  handleUnlinkProduct: (fitmentId: string, productId: string) => void;
  // Mutation states
  isLinking: boolean;
  isUnlinking: boolean;
}

/**
 * Helper to get selected products with link status
 */
export function getSelectedProducts<
  T extends { id: string; isLinked: boolean },
>(products: T[], rowSelection: Record<string, boolean>): T[] {
  const selectedIds = Object.keys(rowSelection);
  return products.filter((p) => selectedIds.includes(p.id));
}

/**
 * Reusable hook for product-fitment linkage operations
 *
 * Follows SRP: Handles ONLY product linkage/unlinkage logic
 * Follows OCP: Extensible via configuration
 * Follows DIP: Depends on abstractions (functions) not concretions
 *
 * @example
 * ```tsx
 * const {
 *   rowSelection,
 *   setRowSelection,
 *   handleLinkProduct,
 *   handleUnlinkProduct,
 *   handleBulkLink,
 *   handleBulkUnlink,
 *   hasLinkedSelected,
 *   hasUnlinkedSelected
 * } = useProductLinkage({
 *   fitmentId: "fit_123",
 *   linkFn: (ids) => sdk.client.fetch(`/admin/fitments/${fitmentId}/products`, {
 *     method: "POST",
 *     body: { product_ids: ids }
 *   }),
 *   unlinkFn: (id) => sdk.client.fetch(`/admin/fitments/${fitmentId}/products/${id}`, {
 *     method: "DELETE"
 *   })
 * });
 * ```
 */
const unlink = async (fitmentId: string, productId: string) => {
  return sdk.client.fetch(`/admin/fitments/${fitmentId}/products/${productId}`, {
    method: "DELETE",
  });
}

const link = async (fitmentId: string, productIds: string[]) => {
  return sdk.client.fetch(`/admin/fitments/${fitmentId}/products`, {
    method: "POST",
    body: { product_ids: productIds },
  });
}

export function useProductLinkage(): UseProductLinkageReturn {
  const queryClient = useQueryClient();

  const invalidateKeys = () => ["fitments", "products"].forEach((key) => {
    queryClient.invalidateQueries({ queryKey: [key] });
  });

  // Link products mutation
  const linkMutation = useMutation({
    mutationFn: ({ fitmentId, productIds }: { fitmentId: string, productIds: string[] }) => link(fitmentId, productIds),
    onSuccess: () => {
      toast.success("Products linked successfully");
      invalidateKeys();
    },
    onError: (error: any) => {
      toast.error("Failed to link products", {
        description: error.message || "An error occurred",
      });
    },
  });

  // Unlink single product mutation
  const unlinkMutation = useMutation({
    mutationFn: ({ fitmentId, productId }: { fitmentId: string, productId: string }) => unlink(fitmentId, productId),
    onSuccess: () => {
      toast.success("Product unlinked successfully");
      invalidateKeys();
    },
    onError: (error: any) => {
      toast.error("Failed to unlink product", {
        description: error.message || "An error occurred",
      });
    },
  });

  // Action handlers
  const handleLinkProduct = (fitmentId: string, productId: string) => {
    linkMutation.mutate({ fitmentId, productIds: [productId] });
  };

  const handleUnlinkProduct = (fitmentId: string, productId: string) => {
    unlinkMutation.mutate({ fitmentId, productId });
  };

  return {
    handleLinkProduct,
    handleUnlinkProduct,
    isLinking: linkMutation.isPending,
    isUnlinking: unlinkMutation.isPending,
  };
}
