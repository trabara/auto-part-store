"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteOAuthProviderStep = void 0;
const workflows_sdk_1 = require("@medusajs/framework/workflows-sdk");
const oauth_1 = require("@repo/domain-modules/oauth");
exports.deleteOAuthProviderStep = (0, workflows_sdk_1.createStep)("delete-oauth-provider-step", async (input, { container }) => {
    const service = container.resolve(oauth_1.OAUTH_MODULE);
    const [existing] = await service.listOAuthProviderConfigs({ id: input.id });
    if (!existing) {
        return new workflows_sdk_1.StepResponse({ deleted: false }, null);
    }
    await service.deleteOAuthProviderConfigs([input.id]);
    return new workflows_sdk_1.StepResponse({ deleted: true }, { config: existing });
}, async (compensation, { container }) => {
    if (!compensation?.config)
        return;
    const service = container.resolve(oauth_1.OAUTH_MODULE);
    await service.createOAuthProviderConfigs([compensation.config]);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVsZXRlLW9hdXRoLXByb3ZpZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL3dvcmtmbG93cy9zdGVwcy9kZWxldGUtb2F1dGgtcHJvdmlkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEscUVBQTZFO0FBQzdFLHNEQUFxRjtBQUV4RSxRQUFBLHVCQUF1QixHQUFHLElBQUEsMEJBQVUsRUFLL0MsNEJBQTRCLEVBQzVCLEtBQUssRUFBRSxLQUFLLEVBQUUsRUFBRSxTQUFTLEVBQUUsRUFBRSxFQUFFO0lBQzdCLE1BQU0sT0FBTyxHQUFHLFNBQVMsQ0FBQyxPQUFPLENBQXVCLG9CQUFZLENBQUMsQ0FBQztJQUV0RSxNQUFNLENBQUMsUUFBUSxDQUFDLEdBQUcsTUFBTSxPQUFPLENBQUMsd0JBQXdCLENBQUMsRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFFNUUsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQ2QsT0FBTyxJQUFJLDRCQUFZLENBQUMsRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLEVBQUUsSUFBVyxDQUFDLENBQUM7SUFDM0QsQ0FBQztJQUVELE1BQU0sT0FBTyxDQUFDLDBCQUEwQixDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFFckQsT0FBTyxJQUFJLDRCQUFZLENBQUMsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLENBQUMsQ0FBQztBQUNuRSxDQUFDLEVBQ0QsS0FBSyxFQUFFLFlBQVksRUFBRSxFQUFFLFNBQVMsRUFBRSxFQUFFLEVBQUU7SUFDcEMsSUFBSSxDQUFDLFlBQVksRUFBRSxNQUFNO1FBQUUsT0FBTztJQUVsQyxNQUFNLE9BQU8sR0FBRyxTQUFTLENBQUMsT0FBTyxDQUF1QixvQkFBWSxDQUFDLENBQUM7SUFDdEUsTUFBTSxPQUFPLENBQUMsMEJBQTBCLENBQUMsQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztBQUNsRSxDQUFDLENBQ0YsQ0FBQyJ9