"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteOAuthProviderWorkflow = void 0;
const workflows_sdk_1 = require("@medusajs/framework/workflows-sdk");
const delete_oauth_provider_1 = require("./steps/delete-oauth-provider");
exports.deleteOAuthProviderWorkflow = (0, workflows_sdk_1.createWorkflow)("delete-oauth-provider-workflow", function (input) {
    const { deleted } = (0, delete_oauth_provider_1.deleteOAuthProviderStep)(input);
    return new workflows_sdk_1.WorkflowResponse({ deleted });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVsZXRlLW9hdXRoLXByb3ZpZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL3dvcmtmbG93cy9kZWxldGUtb2F1dGgtcHJvdmlkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEscUVBRzJDO0FBQzNDLHlFQUF3RTtBQUUzRCxRQUFBLDJCQUEyQixHQUFHLElBQUEsOEJBQWMsRUFDdkQsZ0NBQWdDLEVBQ2hDLFVBQVUsS0FBcUI7SUFDN0IsTUFBTSxFQUFFLE9BQU8sRUFBRSxHQUFHLElBQUEsK0NBQXVCLEVBQUMsS0FBSyxDQUFDLENBQUM7SUFDbkQsT0FBTyxJQUFJLGdDQUFnQixDQUFDLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQztBQUMzQyxDQUFDLENBQ0YsQ0FBQyJ9