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
import { TFunction } from "i18next";
import { Link, Unlink } from "lucide-react";
import { useTranslation } from "react-i18next";
import { sdk } from "../lib/sdk";
import { AdminFitmentWithProducts } from "../routes/fitments/types";

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
};


function LinkActionCell({
  context,
  productId,
  onUnlink,
  onLink,
}: LinkActionCellProps) {
  const { t } = useTranslation();
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
        toast.success(t("fitment.toast.unlinked"));
        onUnlink?.(fitment);
      } else {
        toast.success(t("fitment.toast.linked"));
        onLink?.(fitment);
      }
      queryClient.invalidateQueries({ queryKey: ["fitments"] });
      queryClient.invalidateQueries({
        queryKey: ["products", { id: productId }],
      });
    },
    onError: (error: any) => {
      if (isLinked) {
        toast.error(t("fitment.toast.unlinkError"), {
          description: error.message || t("fitment.toast.errorOccurred"),
        });
      } else {
        toast.error(t("fitment.toast.linkError"), {
          description: error.message || t("fitment.toast.errorOccurred"),
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
      {isLinked ? t("common.unlink") : t("common.link")}
    </DropdownMenu.Item>
  );
}

type DeleteActionCellProps = {
  context: CellContext<AdminFitmentWithProducts, unknown>;
  onDelete: (fitment: AdminFitmentWithProducts) => void;
};

function DeleteActionCell({ context, onDelete }: DeleteActionCellProps) {
  const prompt = usePrompt();
  const { t } = useTranslation();

  const handleDelete = async (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => {
    e.stopPropagation();

    const confirmed = await prompt({
      title: t("fitment.delete.title"),
      description: t("fitment.delete.description", {
        make: context.row.original.model.make.name,
        model: context.row.original.model.name,
        yearStart: context.row.original.year_start,
        yearEnd: context.row.original.year_end,
      }),
      confirmText: t("fitment.delete.confirm"),
      cancelText: t("fitment.delete.cancel"),
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
      {t("common.delete")}
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
};

function ActionsCell({
  context,
  productId,
  onEdit,
  onDelete,
  onUnlink,
  onLink,
}: ActionsCellProps) {
  const hasLink = !!productId;
  const hasSeparatorBeforeLink = !!onEdit && hasLink;
  const hasSeparatorBeforeDelete = !!onDelete && (!!onEdit || hasLink);
  const { t } = useTranslation();
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
            {t("common.edit")}
          </DropdownMenu.Item>
        )}
        {hasSeparatorBeforeLink && <DropdownMenu.Separator />}
        {hasLink && (
          <LinkActionCell
            context={context}
            productId={productId!}
            onUnlink={onUnlink}
            onLink={onLink}
          />
        )}
        {hasSeparatorBeforeDelete && <DropdownMenu.Separator />}
        {onDelete && (
          <DeleteActionCell context={context} onDelete={onDelete} />

        )}
      </DropdownMenu.Content>
    </DropdownMenu>
  );
}

// ─── Column factory ───────────────────────────────────────────────────────────

export const createFitmentColumns = (t: TFunction, {
  productId,
  onEdit,
  onDelete,
  onUnlink,
  onLink,
}: CreateFitmentColumns = {}) => {

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
      header: t("fitment.column.make"),
      enableSorting: true,
      sortLabel: t("fitment.column.make"),
      sortAscLabel: t("fitment.sort.az"),
      sortDescLabel: t("fitment.sort.za"),
    }),
    columnHelper.accessor("model.name", {
      header: t("fitment.column.model"),
      enableSorting: true,
      sortLabel: t("fitment.column.model"),
      sortAscLabel: t("fitment.sort.az"),
      sortDescLabel: t("fitment.sort.za"),
    }),
    columnHelper.accessor("engine.size", {
      header: t("fitment.column.engineSize"),
      enableSorting: true,
      sortLabel: t("fitment.column.engineSize"),
      sortAscLabel: t("fitment.sort.smallestLargest"),
      sortDescLabel: t("fitment.sort.largestSmallest"),
    }),
    columnHelper.accessor("engine.fuel", {
      header: t("fitment.column.fuelType"),
      enableSorting: true,
      sortLabel: t("fitment.column.fuelType"),
      sortAscLabel: t("fitment.sort.az"),
      sortDescLabel: t("fitment.sort.za"),
    }),
    columnHelper.accessor("doors", {
      header: t("fitment.column.doors"),
      enableSorting: true,
      sortLabel: t("fitment.column.doors"),
      sortAscLabel: t("fitment.sort.fewestMost"),
      sortDescLabel: t("fitment.sort.mostFewest"),
    }),
    columnHelper.accessor("body_style", {
      header: t("fitment.column.bodyStyle"),
      enableSorting: true,
      sortLabel: t("fitment.column.bodyStyle"),
      sortAscLabel: t("fitment.sort.az"),
      sortDescLabel: t("fitment.sort.za"),
    }),
    columnHelper.accessor("drive", {
      header: t("fitment.column.driveType"),
      enableSorting: true,
      sortLabel: t("fitment.column.driveType"),
      sortAscLabel: t("fitment.sort.az"),
      sortDescLabel: t("fitment.sort.za"),
    }),
    columnHelper.accessor("transmission", {
      header: t("fitment.column.transmission"),
      enableSorting: true,
      sortLabel: t("fitment.column.transmission"),
      sortAscLabel: t("fitment.sort.az"),
      sortDescLabel: t("fitment.sort.za"),
    }),
    columnHelper.accessor("year_start", {
      header: t("fitment.column.yearStart"),
      enableSorting: true,
      sortLabel: t("fitment.column.yearStart"),
      sortAscLabel: t("fitment.sort.oldestNewest"),
      sortDescLabel: t("fitment.sort.newestOldest"),
    }),
    columnHelper.accessor("year_end", {
      header: t("fitment.column.yearEnd"),
      cell: (context) => {
        const yearEnd = context.getValue();
        return yearEnd ? yearEnd : t("common.present");
      },
      enableSorting: true,
      sortLabel: t("fitment.column.yearEnd"),
      sortAscLabel: t("fitment.sort.oldestNewest"),
      sortDescLabel: t("fitment.sort.newestOldest"),
    }),
  ];

  if (productId) {
    baseColumns.push(
      columnHelper.display({
        id: "linked",
        header: t("fitment.column.linked"),
        cell: (context) => {
          const fitment = context.row.original;
          const isLinked = fitment.products.some((p) => p.id === productId);
          return (
            <Badge color={isLinked ? "green" : "grey"} size="small">
              {isLinked
                ? t("fitment.column.linked.yes")
                : t("fitment.column.linked.no")}
            </Badge>
          );
        },
      }),
    );
  }

  baseColumns.push(
    columnHelper.display({
      id: "actions",
      header: t("common.actions"),
      cell: (context) => (
        <ActionsCell
          context={context}
          productId={productId}
          onEdit={onEdit}
          onDelete={onDelete}
          onUnlink={onUnlink}
          onLink={onLink}
        />
      ),
    }),
  );

  return baseColumns;
};
