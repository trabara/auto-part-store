import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Drawer, Heading } from "@medusajs/ui";
import { useNavigate, useParams } from "react-router-dom";
import { RoleEditForm } from "../../../../../../components/forms/role-edit-form";


const RoleEditPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const handleClose = () => {
    navigate(`/rbac/roles/${id}`);
  };

  if (!id) {
    return null;
  }

  return (
    <Drawer open={true} onOpenChange={handleClose}>
      <Drawer.Content asChild>
        <form className="flex flex-col h-full">
          <Drawer.Header>
            <Heading level="h2">Edit Role</Heading>
          </Drawer.Header>
          <Drawer.Body>
            <div className="w-full max-w-md">
              <RoleEditForm roleId={id} onClose={handleClose} />
            </div>
          </Drawer.Body>
        </form>
      </Drawer.Content>
    </Drawer>
  );
};

export const config = defineRouteConfig({
  label: "Edit Role",
});

export default RoleEditPage;
