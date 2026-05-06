"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.upsertOAuthProviderWorkflow = void 0;
const workflows_sdk_1 = require("@medusajs/framework/workflows-sdk");
const upsert_oauth_provider_1 = require("./steps/upsert-oauth-provider");
exports.upsertOAuthProviderWorkflow = (0, workflows_sdk_1.createWorkflow)("upsert-oauth-provider-workflow", function (input) {
    const { config } = (0, upsert_oauth_provider_1.upsertOAuthProviderStep)(input);
    return new workflows_sdk_1.WorkflowResponse({ config });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXBzZXJ0LW9hdXRoLXByb3ZpZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL3dvcmtmbG93cy91cHNlcnQtb2F1dGgtcHJvdmlkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEscUVBRzJDO0FBQzNDLHlFQUd1QztBQUUxQixRQUFBLDJCQUEyQixHQUFHLElBQUEsOEJBQWMsRUFDdkQsZ0NBQWdDLEVBQ2hDLFVBQVUsS0FBbUM7SUFDM0MsTUFBTSxFQUFFLE1BQU0sRUFBRSxHQUFHLElBQUEsK0NBQXVCLEVBQUMsS0FBSyxDQUFDLENBQUM7SUFDbEQsT0FBTyxJQUFJLGdDQUFnQixDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQztBQUMxQyxDQUFDLENBQ0YsQ0FBQyJ9