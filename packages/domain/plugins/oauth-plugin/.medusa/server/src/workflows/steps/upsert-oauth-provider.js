"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.upsertOAuthProviderStep = void 0;
const workflows_sdk_1 = require("@medusajs/framework/workflows-sdk");
const oauth_1 = require("@repo/domain-modules/oauth");
exports.upsertOAuthProviderStep = (0, workflows_sdk_1.createStep)("upsert-oauth-provider-step", async (input, { container }) => {
    const service = container.resolve(oauth_1.OAUTH_MODULE);
    const [existing] = await service.listOAuthProviderConfigs({
        provider: input.provider,
    });
    let config;
    let isNew = false;
    if (existing) {
        [config] = await service.updateOAuthProviderConfigs([
            { id: existing.id, ...input },
        ]);
    }
    else {
        [config] = await service.createOAuthProviderConfigs([input]);
        isNew = true;
    }
    return new workflows_sdk_1.StepResponse({ config }, { id: config.id, isNew });
}, async (compensation, { container }) => {
    if (!compensation)
        return;
    const service = container.resolve(oauth_1.OAUTH_MODULE);
    if (compensation.isNew) {
        await service.deleteOAuthProviderConfigs([compensation.id]);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXBzZXJ0LW9hdXRoLXByb3ZpZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL3dvcmtmbG93cy9zdGVwcy91cHNlcnQtb2F1dGgtcHJvdmlkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEscUVBQTZFO0FBQzdFLHNEQUFxRjtBQWF4RSxRQUFBLHVCQUF1QixHQUFHLElBQUEsMEJBQVUsRUFLL0MsNEJBQTRCLEVBQzVCLEtBQUssRUFBRSxLQUFLLEVBQUUsRUFBRSxTQUFTLEVBQUUsRUFBRSxFQUFFO0lBQzdCLE1BQU0sT0FBTyxHQUFHLFNBQVMsQ0FBQyxPQUFPLENBQXVCLG9CQUFZLENBQUMsQ0FBQztJQUV0RSxNQUFNLENBQUMsUUFBUSxDQUFDLEdBQUcsTUFBTSxPQUFPLENBQUMsd0JBQXdCLENBQUM7UUFDeEQsUUFBUSxFQUFFLEtBQUssQ0FBQyxRQUFRO0tBQ3pCLENBQUMsQ0FBQztJQUVILElBQUksTUFBVyxDQUFDO0lBQ2hCLElBQUksS0FBSyxHQUFHLEtBQUssQ0FBQztJQUVsQixJQUFJLFFBQVEsRUFBRSxDQUFDO1FBQ2IsQ0FBQyxNQUFNLENBQUMsR0FBRyxNQUFNLE9BQU8sQ0FBQywwQkFBMEIsQ0FBQztZQUNsRCxFQUFFLEVBQUUsRUFBRSxRQUFRLENBQUMsRUFBRSxFQUFFLEdBQUcsS0FBSyxFQUFFO1NBQzlCLENBQUMsQ0FBQztJQUNMLENBQUM7U0FBTSxDQUFDO1FBQ04sQ0FBQyxNQUFNLENBQUMsR0FBRyxNQUFNLE9BQU8sQ0FBQywwQkFBMEIsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDN0QsS0FBSyxHQUFHLElBQUksQ0FBQztJQUNmLENBQUM7SUFFRCxPQUFPLElBQUksNEJBQVksQ0FBQyxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLE1BQU0sQ0FBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztBQUNoRSxDQUFDLEVBQ0QsS0FBSyxFQUFFLFlBQVksRUFBRSxFQUFFLFNBQVMsRUFBRSxFQUFFLEVBQUU7SUFDcEMsSUFBSSxDQUFDLFlBQVk7UUFBRSxPQUFPO0lBRTFCLE1BQU0sT0FBTyxHQUFHLFNBQVMsQ0FBQyxPQUFPLENBQXVCLG9CQUFZLENBQUMsQ0FBQztJQUV0RSxJQUFJLFlBQVksQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUN2QixNQUFNLE9BQU8sQ0FBQywwQkFBMEIsQ0FBQyxDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQzlELENBQUM7QUFDSCxDQUFDLENBQ0YsQ0FBQyJ9