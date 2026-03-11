import { EllipsisHorizontal, Pencil, Trash } from "@medusajs/icons";
import {
  Badge,
  Button,
  Checkbox,
  createDataTableColumnHelper,
  DropdownMenu,
  toast,
  usePrompt,
} from "@medusajs/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CellContext } from "@tanstack/react-table";
import { Link, Unlink } from "lucide-react";
import { Fragment } from "react/jsx-runtime";
import { TFunction } from "i18next";
import { sdk } from "../../../../lib/sdk";
import { AdminFitmentWithProducts } from "../types";
const columnHelper = createDataTableColumnHelper<AdminFitmentWithProducts>();

type CreateFitmentColumns = {
  productId?: string;
  onEdit?: (fitment: AdminFitmentWithProducts) => void;
  onDelete?: (fitment: AdminFitmentWithProducts) => void;
  onUnlink?: (fitment: AdminFitmentWithProducts) => void;
  onLink?: (fitment: AdminFitmentWithProducts) => void;
  t?: TFunction;
};

type Action = (context: CellContext<AdminFitmentWithProducts, unknown>) => {
  label: string;
  icon?: React.ElementType;
  onClick: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
};

export const createFitmentColumns = ({
  productId,
  onEdit,
  onDelete,
  onUnlink,
  onLink,
  t,
}: CreateFitmentColumns = {}) => {
  const tr = (key: string, options?: Record<string, unknown>) =>
    (t ? t(key, options as any) : key) as string;
  const baseColumns: any[] = [
    columnHelper.display({
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          onClick={(e) => e.stopPropagation()}
        />
      ),
    }),

    columnHelper.accessor("model.make.name", {
      header: tr("fitment.column.make"),
      enableSorting: true,
      sortLabel: tr("fitment.column.make"),
      sortAscLabel: tr("fitment.sort.az"),
      sortDescLabel: tr("fitment.sort.za"),
    }),
    columnHelper.accessor("model.name", {
      header: tr("fitment.column.model"),
      enableSorting: true,
      sortLabel: tr("fitment.column.model"),
      sortAscLabel: tr("fitment.sort.az"),
      sortDescLabel: tr("fitment.sort.za"),
    }),
    columnHelper.accessor("engine.size", {
      header: tr("fitment.column.engineSize"),
      enableSorting: true,
      sortLabel: tr("fitment.column.engineSize"),
      sortAscLabel: tr("fitment.sort.smallestLargest"),
      sortDescLabel: tr("fitment.sort.largestSmallest"),
    }),
    columnHelper.accessor("engine.fuel", {
      header: tr("fitment.column.fuelType"),
      enableSorting: true,
      sortLabel: tr("fitment.column.fuelType"),
      sortAscLabel: tr("fitment.sort.az"),
      sortDescLabel: tr("fitment.sort.za"),
    }),
    columnHelper.accessor("doors", {
      header: tr("fitment.column.doors"),
      enableSorting: true,
      sortLabel: tr("fitment.column.doors"),
      sortAscLabel: tr("fitment.sort.fewestMost"),
      sortDescLabel: tr("fitment.sort.mostFewest"),
    }),
    columnHelper.accessor("body_style", {
      header: tr("fitment.column.bodyStyle"),
      enableSorting: true,
      sortLabel: tr("fitment.column.bodyStyle"),
      sortAscLabel: tr("fitment.sort.az"),
      sortDescLabel: tr("fitment.sort.za"),
    }),
    columnHelper.accessor("drive", {
      header: tr("fitment.column.driveType"),
      enableSorting: true,
      sortLabel: tr("fitment.column.driveType"),
      sortAscLabel: tr("fitment.sort.az"),
      sortDescLabel: tr("fitment.sort.za"),
    }),
    columnHelper.accessor("transmission", {
      header: tr("fitment.column.transmission"),
      enableSorting: true,
      sortLabel: tr("fitment.column.transmission"),
      sortAscLabel: tr("fitment.sort.az"),
      sortDescLabel: tr("fitment.sort.za"),
    }),
    columnHelper.accessor("year_start", {
      header: tr("fitment.column.yearStart"),
      enableSorting: true,
      sortLabel: tr("fitment.column.yearStart"),
      sortAscLabel: tr("fitment.sort.oldestNewest"),
      sortDescLabel: tr("fitment.sort.newestOldest"),
    }),
    columnHelper.accessor("year_end", {
      header: tr("fitment.column.yearEnd"),
      cell: (context) => {
        const yearEnd = context.getValue();
        return yearEnd ? yearEnd : tr("common.present");
      },
      enableSorting: true,
      sortLabel: tr("fitment.column.yearEnd"),
      sortAscLabel: tr("fitment.sort.oldestNewest"),
      sortDescLabel: tr("fitment.sort.newestOldest"),
    }),
  ];

  const actions: Action[] = [];
  if (onEdit) {
    actions.push((context) => ({
      label: tr("common.edit"),
      icon: Pencil,
      onClick: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        e.stopPropagation();
        onEdit?.(context.row.original);
      },
    }));
  }

  if (productId) {
    baseColumns.push(
      columnHelper.display({
        id: "linked",
        header: tr("fitment.column.linked"),
        cell: (context) => {
          const fitment = context.row.original;
          const isLinked = fitment.products.some((p) => p.id === productId);
          return (
            <Badge color={isLinked ? "green" : "grey"} size="small">
              {isLinked
                ? tr("fitment.column.linked.yes")
                : tr("fitment.column.linked.no")}
            </Badge>
          );
        },
      }),
    );

    actions.push((context) => {
      const queryClient = useQueryClient();

      const fitment = context.row.original;
      const isLinked = fitment.products.some((p) => p.id === productId);

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
            toast.success(tr("fitment.toast.unlinked"));
            onUnlink?.(context.row.original);
          } else {
            toast.success(tr("fitment.toast.linked"));
            onLink?.(context.row.original);
          }
          queryClient.invalidateQueries({
            queryKey: ["fitments"],
          });
          queryClient.invalidateQueries({
            queryKey: ["products", { id: productId }],
          });
        },
        onError: (error: any) => {
          if (isLinked) {
            toast.error(tr("fitment.toast.unlinkError"), {
              description: error.message || tr("fitment.toast.errorOccurred"),
            });
          } else {
            toast.error(tr("fitment.toast.linkError"), {
              description: error.message || tr("fitment.toast.errorOccurred"),
            });
          }
        },
      });

      return {
        label: isLinked ? tr("common.unlink") : tr("common.link"),
        icon: isLinked ? Unlink : Link,
        onClick: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
          e.stopPropagation();
          linkUnlinkMutation.mutate();
        },
      };
    });
  }

  if (onDelete) {
    actions.push((context) => {
      const prompt = usePrompt();

      const handleDelete = async (
        e: React.MouseEvent<HTMLDivElement, MouseEvent>,
      ) => {
        e.stopPropagation();

        const confirmed = await prompt({
          title: tr("fitment.delete.title"),
          description: tr("fitment.delete.description", {
            make: context.row.original.model.make.name,
            model: context.row.original.model.name,
            yearStart: context.row.original.year_start,
            yearEnd: context.row.original.year_end,
          }),
          confirmText: tr("fitment.delete.confirm"),
          cancelText: tr("fitment.delete.cancel"),
          variant: "danger",
          verificationText: "DELETE",
        });

        if (confirmed) {
          onDelete?.(context.row.original);
        }
      };

      return {
        label: tr("common.delete"),
        icon: Trash,
        onClick: handleDelete,
      };
    });
  }

  const actionsColumn = columnHelper.display({
    id: "actions",
    header: tr("common.actions"),
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
                {actionItems.length - 1 > index && (
                  <DropdownMenu.Separator key={`${index}-separator`} />
                )}
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
