import { EllipsisHorizontal, Pencil, Trash } from "@medusajs/icons";
import { Badge, Button, createDataTableColumnHelper, DropdownMenu, toast, usePrompt } from "@medusajs/ui";
import { CellContext } from "@tanstack/react-table";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, Unlink } from "lucide-react";
import { Fragment } from "react/jsx-runtime";
import { AdminFitmentWithProducts } from ".";
import { sdk } from "~/lib/sdk";
const columnHelper = createDataTableColumnHelper<AdminFitmentWithProducts>();

type CreateFitmentColumns = {
  productId?: string,
  onEdit?: (fitment: AdminFitmentWithProducts) => void,
  onDelete?: (fitment: AdminFitmentWithProducts) => void,
  onUnlink?: (fitment: AdminFitmentWithProducts) => void,
  onLink?: (fitment: AdminFitmentWithProducts) => void,
};

type Action = (context: CellContext<AdminFitmentWithProducts, unknown>) => { label: string, icon?: React.ElementType, onClick: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void };

export const createFitmentColumns = ({ productId, onEdit, onDelete, onUnlink, onLink }: CreateFitmentColumns = {}) => {

  const baseColumns: any[] = [
    columnHelper.accessor("model.make.name", {
      header: "Make",
      enableSorting: true,
      sortLabel: "Make",
      sortAscLabel: "A-Z",
      sortDescLabel: "Z-A",
    }),
    columnHelper.accessor("model.name", {
      header: "Model",
      enableSorting: true,
      sortLabel: "Model",
      sortAscLabel: "A-Z",
      sortDescLabel: "Z-A",
    }),
    columnHelper.accessor("engine.size", {
      header: "Engine Size",
      enableSorting: true,
      sortLabel: "Engine Size",
      sortAscLabel: "Smallest-Largest",
      sortDescLabel: "Largest-Smallest",
    }),
    columnHelper.accessor("engine.fuel", {
      header: "Fuel Type",
      enableSorting: true,
      sortLabel: "Fuel Type",
      sortAscLabel: "A-Z",
      sortDescLabel: "Z-A",
    }),
    columnHelper.accessor("doors", {
      header: "Doors",
      enableSorting: true,
      sortLabel: "Doors",
      sortAscLabel: "Fewest-Most",
      sortDescLabel: "Most-Fewest",
    }),
    columnHelper.accessor("body_style", {
      header: "Body Style",
      enableSorting: true,
      sortLabel: "Body Style",
      sortAscLabel: "A-Z",
      sortDescLabel: "Z-A",
    }),
    columnHelper.accessor("drive", {
      header: "Drive Type",
      enableSorting: true,
      sortLabel: "Drive Type",
      sortAscLabel: "A-Z",
      sortDescLabel: "Z-A",
    }),
    columnHelper.accessor("transmission", {
      header: "Transmission",
      enableSorting: true,
      sortLabel: "Transmission",
      sortAscLabel: "A-Z",
      sortDescLabel: "Z-A",
    }),
    columnHelper.accessor("year_start", {
      header: "Year Start",
      enableSorting: true,
      sortLabel: "Year Start",
      sortAscLabel: "Oldest-Newest",
      sortDescLabel: "Newest-Oldest",
    }),
    columnHelper.accessor("year_end", {
      header: "Year End",
      enableSorting: true,
      sortLabel: "Year End",
      sortAscLabel: "Oldest-Newest",
      sortDescLabel: "Newest-Oldest",
    }),
  ];


  const actions: Action[] = [];
  if (onEdit) {
    actions.push((context) => ({
      label: "Edit",
      icon: Pencil,
      onClick: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        e.stopPropagation();
        onEdit?.(context.row.original)
      },
    }));
  }

  if (productId) {
    baseColumns.push(columnHelper.display({
      id: "linked",
      header: "Linked",
      cell: (context) => {
        const fitment = context.row.original;
        const isLinked = fitment.products.some(p => p.id === productId);
        return (
          <Badge color={isLinked ? "green" : "grey"} size="small">
            {isLinked ? "Linked" : "Not Linked"}
          </Badge>
        )
      }
    }));

    actions.push((context) => {
      const queryClient = useQueryClient();

      const fitment = context.row.original;
      const isLinked = fitment.products.some(p => p.id === productId);

      const linkUnlinkMutation = useMutation({
        mutationFn: async () => {
          if (isLinked) {
            return sdk.client.fetch(
              `/admin/fitments/${fitment.id}/products/${productId}`,
              { method: "DELETE" },
            );
          } else {
            return sdk.client.fetch(`/admin/fitments/${fitment.id}/products`, {
              method: "POST",
              body: { product_ids: [productId] },
            });
          }
        },
        onSuccess: () => {
          if (isLinked) {
            toast.success("Product unlinked successfully");
            onUnlink?.(context.row.original);
          } else {
            toast.success("Product linked successfully");
            onLink?.(context.row.original);
          }
          queryClient.invalidateQueries({
            queryKey: ["fitments"],
          });
          queryClient.invalidateQueries({
            queryKey: [["products", { id: productId }]]
          });
        },
        onError: (error: any) => {
          if (isLinked) {
            toast.error("Failed to unlink product", {
              description: error.message || "An error occurred",
            });
          } else {
            toast.error("Failed to link product", {
              description: error.message || "An error occurred",
            });
          }
        },
      });

      return {
        label: isLinked ? "Unlink" : "Link",
        icon: isLinked ? Unlink : Link,
        onClick: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
          e.stopPropagation();
          linkUnlinkMutation.mutate();
        },
      }
    });
  }

  if (onDelete) {
    actions.push((context) => {
      const prompt = usePrompt();

      const handleDelete = async (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        e.stopPropagation();

        const confirmed = await prompt({
          title: "Delete Fitment",
          description: `Are you sure you want to delete the fitment for ${context.row.original.model.make.name} ${context.row.original.model.name} (${context.row.original.year_start}-${context.row.original.year_end})?`,
          confirmText: "Delete",
          cancelText: "Cancel",
          variant: "danger",
          verificationText: "DELETE",
        });

        if (confirmed) {
          onDelete?.(context.row.original);
        }
      }

      return {
        label: "Delete",
        icon: Trash,
        onClick: handleDelete,
      }
    });
  }

  const actionsColumn = columnHelper.display({
    id: "actions",
    header: "Actions",
    cell: (context) => {
      const actionItems = actions.map((getAction) => getAction(context));

      return (
        <DropdownMenu>
          <DropdownMenu.Trigger asChild className="p-2">
            <Button variant="transparent" size="small">
              <EllipsisHorizontal />
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content>
            {actionItems.map((action, index) => (
              <Fragment key={index}>
                <DropdownMenu.Item onClick={action.onClick}>
                  {action.icon && <action.icon className="size-4 me-2" />}
                  {action.label}
                </DropdownMenu.Item>
                {actionItems.length - 1 > index && <DropdownMenu.Separator key={`${index}-separator`} />}
              </Fragment>
            ))}
          </DropdownMenu.Content>
        </DropdownMenu>
      );
    },
  });



  baseColumns.push(actionsColumn);



  return baseColumns;
};