import {
    createStep,
    createWorkflow,
    StepResponse,
    WorkflowResponse
} from "@medusajs/framework/workflows-sdk";
import { AUTHZ_MODULE, AuthzModuleService, CreateCategoryInput, CreateRoleInput } from "../modules/authz";


const createRbacRolesStep = createStep(
    "create-rbac-roles-step",
    async (input: CreateRoleInput[], { container }) => {

        const service = container.resolve<AuthzModuleService>(AUTHZ_MODULE);
        const roles = await service.createRoles(input);

        return new StepResponse({ roles }, { roleIds: roles.map(r => r.id) });
    },
    async (compensation, { container }) => {
        if (!compensation) return;

        const service = container.resolve<AuthzModuleService>(AUTHZ_MODULE);

        if (compensation.roleIds) {
            await service.deleteAuthzRoles(compensation.roleIds);
        }
    },
);

type CreateRbacRolesWorkflowInput = CreateRoleInput[];

export const createRbacRolesWorkflow = createWorkflow(
    "create-rbac-roles-workflow",
    function (input: CreateRbacRolesWorkflowInput) {
        const { roles } = createRbacRolesStep(input);

        return new WorkflowResponse({
            roles
        });
    },
);
