import { defineRouteConfig } from "@medusajs/admin-sdk";
import {
  Button,
  FocusModal,
  Heading
} from "@medusajs/ui";
import { useNavigate } from "react-router-dom";
import { RoleCreateForm } from "../../../../../components/forms/role-create-form";

const RoleCreatePage = () => {
  const navigate = useNavigate();

  const handleClose = () => {
    navigate("/rbac/roles");
  };

  return (
    <FocusModal open onOpenChange={handleClose}>
      <FocusModal.Content>
        <form>
          <FocusModal.Header>
            <Heading level="h2">Create Role</Heading>
            <div className="flex items-center justify-end gap-x-2">
              <Button
                variant="secondary"
                size="small"
                type="button"
                onClick={handleClose}
              >
                Cancel
              </Button>
            </div>
          </FocusModal.Header>
          <FocusModal.Body className="flex flex-col items-center py-16 p-6">
            <div className="w-full max-w-md">
              <RoleCreateForm onClose={handleClose} />
            </div>
          </FocusModal.Body>
        </form>
      </FocusModal.Content>
    </FocusModal>
  );
};

export const config = defineRouteConfig({
  label: "Create Role",
});

export default RoleCreatePage;
