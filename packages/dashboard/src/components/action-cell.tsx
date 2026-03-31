import { EllipsisHorizontal } from "@medusajs/icons";
import { DropdownMenu, IconButton } from "@medusajs/ui";
import { CellContext } from '@tanstack/react-table';
import { RowAction } from "../types/config";

const ActionCell = ({ info, actions }: { info: CellContext<any, any>, actions: RowAction<any>[] }) => {

    return (
        <DropdownMenu>
            <DropdownMenu.Trigger asChild>
                <IconButton variant="transparent" className="h-7 w-7 p-1">
                    <EllipsisHorizontal />
                </IconButton>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content>
                {actions.map((action) => {
                    if (action.render) {
                        return action.render(info.row.original)
                    }
                    return (
                        <DropdownMenu.Item
                            key={action.id}
                            className="[&_svg]:text-ui-fg-subtle flex items-center gap-x-2"
                            onClick={() => action.onClick?.(info.row.original)}
                        >
                            {action.icon}
                            <span>{action.label}</span>
                        </DropdownMenu.Item>
                    )
                })}
            </DropdownMenu.Content>
        </DropdownMenu>
    )
}

export default ActionCell