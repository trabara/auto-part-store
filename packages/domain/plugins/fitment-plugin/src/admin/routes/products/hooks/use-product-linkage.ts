import { toast } from "@medusajs/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { sdk } from "../../../lib/sdk";
import { AdminProductWithFitments } from "../types";

/**
 * Configuration for product linkage operations
 */
export interface ProductLinkageConfig {
  /** The ID of the fitment to link/unlink products */
  fitmentId: string;
  /** The list of selected products for linking/unlinking */
  selectedProducts: AdminProductWithFitments[];
}

/**
 * Return type from useProductLinkage
 */
export interface UseProductLinkageReturn {
  // Actions
  handleLinkProduct: (productId: string) => void;
  handleUnlinkProduct: (productId: string) => void;
  handleBulkLink: () => void;
  handleBulkUnlink: () => void;

  // Status flags for bulk operations
  hasLinkedSelected: boolean;
  hasUnlinkedSelected: boolean;
  selectedProductsCount: number;

  // Mutation states
  isLinking: boolean;
  isUnlinking: boolean;
  isBulkUnlinking: boolean;
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

export function useProductLinkage({
  fitmentId,
  selectedProducts
}: ProductLinkageConfig): UseProductLinkageReturn {
  const queryClient = useQueryClient();

  const invalidateKeys = () => ["fitments", "products"].forEach((key) => {
    queryClient.invalidateQueries({ queryKey: [key] });
  });

  // Link products mutation
  const linkMutation = useMutation({
    mutationFn: (productIds: string[]) => link(fitmentId, productIds),
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
    mutationFn: (productId: string) => unlink(fitmentId, productId),
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

  // Bulk unlink mutation
  const bulkUnlinkMutation = useMutation({
    mutationFn: async (productIds: string[]) => {
      return Promise.all(productIds.map((id) => unlink(fitmentId, id)));
    },
    onSuccess: () => {
      toast.success("Products unlinked successfully");
      invalidateKeys();
    },
    onError: (error: any) => {
      toast.error("Failed to unlink products", {
        description: error.message || "An error occurred",
      });
    },
  });

  // Action handlers
  const handleLinkProduct = (productId: string) => {
    linkMutation.mutate([productId]);
  };

  const handleUnlinkProduct = (productId: string) => {
    unlinkMutation.mutate(productId);
  };

  const handleBulkLink = () => {
    const selectedIds = selectedProducts.map((product) => product.id);
    linkMutation.mutate(selectedIds);
  };

  const handleBulkUnlink = () => {
    const selectedIds = selectedProducts.map((product) => product.id);
    bulkUnlinkMutation.mutate(selectedIds);
  };

  // Compute selected products count
  const selectedProductsCount = useMemo(() => {
    return selectedProducts.length;
  }, [selectedProducts]);

  return {
    handleLinkProduct,
    handleUnlinkProduct,
    handleBulkLink,
    handleBulkUnlink,
    // Status flags computed externally by caller using getSelectedProducts helper
    hasLinkedSelected: false,
    hasUnlinkedSelected: false,
    selectedProductsCount,
    isLinking: linkMutation.isPending,
    isUnlinking: unlinkMutation.isPending,
    isBulkUnlinking: bulkUnlinkMutation.isPending,
  };
}
