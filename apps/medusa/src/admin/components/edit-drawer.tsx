import { Drawer } from "@medusajs/ui";
import { useCrudContext } from "context/crud-context";

export function EditDrawer({ children }: { children: React.ReactNode }) {
    const { entity, entityName, isEdit, setIsEdit } = useCrudContext();

    if (!entity) {
        return null;
    }

    return (
        <Drawer open={isEdit} onOpenChange={setIsEdit}>
            <Drawer.Content>
                <Drawer.Header>
                    <Drawer.Title>Edit {entityName}</Drawer.Title>
                </Drawer.Header>
            </Drawer.Content>
            {children}
        </Drawer>
    )
}