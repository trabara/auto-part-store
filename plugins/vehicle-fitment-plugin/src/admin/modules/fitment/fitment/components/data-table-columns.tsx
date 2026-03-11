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

// ─── Proper React cell components (hooks used at top level) ──────────────────

type LinkActionCellProps = {
  context: CellContext<AdminFitmentWithProducts, unknown>;
  productId: string;
  onUnlink?: (fitment: AdminFitmentWithProducts) => void;
  onLink?: (fitment: AdminFitmentWithProducts) => void;
  tr: (key: string, opts?: Record<string, unknown>) => string;
};

function LinkActionCell({
  context,
  productId,
  onUnlink,
  onLink,
  tr,
}: LinkActionCellProps) {
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
        onUnlink?.(fitment);
      } else {
        toast.success(tr("fitment.toast.linked"));
        onLink?.(fitment);
      }
      queryClient.invalidateQueries({ queryKey: ["fitments"] });
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

  return (
    <DropdownMenu.Item
      className="gap-x-2"
      onClick={(e) => {
        e.stopPropagation();
        linkUnlinkMutation.mutate();
      }}
    >
      {isLinked ? <Unlink className="size-4" /> : <Link className="size-4" />}
      {isLinked ? tr("common.unlink") : tr("common.link")}
    </DropdownMenu.Item>
  );
}

type DeleteActionCellProps = {
  context: CellContext<AdminFitmentWithProducts, unknown>;
  onDelete: (fitment: AdminFitmentWithProducts) => void;
  tr: (key: string, opts?: Record<string, unknown>) => string;
};

function DeleteActionCell({ context, onDelete, tr }: DeleteActionCellProps) {
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
      onDelete(context.row.original);
    }
  };

  return (
    <DropdownMenu.Item className="gap-x-2" onClick={handleDelete}>
      <Trash className="size-4" />
      {tr("common.delete")}
    </DropdownMenu.Item>
  );
}

// ─── Actions cell renderer ────────────────────────────────────────────────────

type ActionsCellProps = {
  context: CellContext<AdminFitmentWithProducts, unknown>;
  productId?: string;
  onEdit?: (fitment: AdminFitmentWithProducts) => void;
  onDelete?: (fitment: AdminFitmentWithProducts) => void;
  onUnlink?: (fitment: AdminFitmentWithProducts) => void;
  onLink?: (fitment: AdminFitmentWithProducts) => void;
  tr: (key: string, opts?: Record<string, unknown>) => string;
};

function ActionsCell({
  context,
  productId,
  onEdit,
  onDelete,
  onUnlink,
  onLink,
  tr,
}: ActionsCellProps) {
  const hasLink = !!productId;
  const hasSeparatorBeforeLink = !!onEdit && hasLink;
  const hasSeparatorBeforeDelete = !!onDelete && (!!onEdit || hasLink);

  return (
    <DropdownMenu>
      <DropdownMenu.Trigger asChild className="p-2">
        <Button variant="transparent" size="small">
          <EllipsisHorizontal />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        {onEdit && (
          <DropdownMenu.Item
            className="gap-x-2"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(context.row.original);
            }}
          >
            <Pencil className="size-4" />
            {tr("common.edit")}
          </DropdownMenu.Item>
        )}
        {hasSeparatorBeforeLink && <DropdownMenu.Separator />}
        {hasLink && (
          <LinkActionCell
            context={context}
            productId={productId!}
            onUnlink={onUnlink}
            onLink={onLink}
            tr={tr}
          />
        )}
        {hasSeparatorBeforeDelete && <DropdownMenu.Separator />}
        {onDelete && (
          <DeleteActionCell context={context} onDelete={onDelete} tr={tr} />
        )}
      </DropdownMenu.Content>
    </DropdownMenu>
  );
}

// ─── Column factory ───────────────────────────────────────────────────────────

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
  }

  baseColumns.push(
    columnHelper.display({
      id: "actions",
      header: tr("common.actions"),
      cell: (context) => (
        <ActionsCell
          context={context}
          productId={productId}
          onEdit={onEdit}
          onDelete={onDelete}
          onUnlink={onUnlink}
          onLink={onLink}
          tr={tr}
        />
      ),
    }),
  );

  return baseColumns;
};
