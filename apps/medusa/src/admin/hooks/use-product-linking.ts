import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@medusajs/ui";
import { useMemo, useState } from "react";

/**
 * Configuration for product linking operations
 */
export interface ProductLinkingConfig {
  /** Function to link products */
  linkFn: (productIds: string[]) => Promise<any>;
  /** Function to unlink a single product */
  unlinkFn: (productId: string) => Promise<any>;
  /** Query keys to invalidate after operations */
  invalidateKeys?: string[];
}

/**
 * Return type from useProductLinking
 */
export interface UseProductLinkingReturn {
  // Row selection state
  rowSelection: Record<string, boolean>;
  setRowSelection: (selection: Record<string, boolean>) => void;

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
 * Reusable hook for product-fitment linking operations
 *
 * Follows SRP: Handles ONLY product linking/unlinking logic
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
 * } = useProductLinking({
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
export function useProductLinking({
  linkFn,
  unlinkFn,
  invalidateKeys = ["products", "fitment-products"],
}: ProductLinkingConfig): UseProductLinkingReturn {
  const queryClient = useQueryClient();
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

  // Link products mutation
  const linkMutation = useMutation({
    mutationFn: linkFn,
    onSuccess: () => {
      toast.success("Products linked successfully");
      invalidateKeys.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [[key]] });
      });
      setRowSelection({});
    },
    onError: (error: any) => {
      toast.error("Failed to link products", {
        description: error.message || "An error occurred",
      });
    },
  });

  // Unlink single product mutation
  const unlinkMutation = useMutation({
    mutationFn: unlinkFn,
    onSuccess: () => {
      toast.success("Product unlinked successfully");
      invalidateKeys.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [[key]] });
      });
      setRowSelection({});
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
      return Promise.all(productIds.map(unlinkFn));
    },
    onSuccess: () => {
      toast.success("Products unlinked successfully");
      invalidateKeys.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [[key]] });
      });
      setRowSelection({});
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
    const selectedIds = Object.keys(rowSelection);
    linkMutation.mutate(selectedIds);
  };

  const handleBulkUnlink = () => {
    const selectedIds = Object.keys(rowSelection);
    bulkUnlinkMutation.mutate(selectedIds);
  };

  // Compute selected products count
  const selectedProductsCount = useMemo(() => {
    return Object.keys(rowSelection).length;
  }, [rowSelection]);

  return {
    rowSelection,
    setRowSelection,
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
