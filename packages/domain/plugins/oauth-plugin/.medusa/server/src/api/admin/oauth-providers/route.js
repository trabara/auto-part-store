"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = exports.GET = void 0;
const oauth_1 = require("@repo/domain-modules/oauth");
const workflows_1 = require("../../../workflows");
const GET = async (req, res) => {
    const service = req.scope.resolve(oauth_1.OAUTH_MODULE);
    const configs = await service.listOAuthProviderConfigs();
    res.json({ oauth_providers: configs });
};
exports.GET = GET;
const POST = async (req, res) => {
    const { result } = await (0, workflows_1.upsertOAuthProviderWorkflow)(req.scope).run({
        input: req.validatedBody,
    });
    res.status(200).json({ oauth_provider: result.config });
};
exports.POST = POST;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL29hdXRoLXByb3ZpZGVycy9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSxzREFBcUY7QUFDckYsa0RBQWlFO0FBRzFELE1BQU0sR0FBRyxHQUFHLEtBQUssRUFBRSxHQUFrQixFQUFFLEdBQW1CLEVBQUUsRUFBRTtJQUNuRSxNQUFNLE9BQU8sR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBdUIsb0JBQVksQ0FBQyxDQUFDO0lBQ3RFLE1BQU0sT0FBTyxHQUFHLE1BQU0sT0FBTyxDQUFDLHdCQUF3QixFQUFFLENBQUM7SUFDekQsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLGVBQWUsRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDO0FBQ3pDLENBQUMsQ0FBQztBQUpXLFFBQUEsR0FBRyxPQUlkO0FBRUssTUFBTSxJQUFJLEdBQUcsS0FBSyxFQUN2QixHQUEyQyxFQUMzQyxHQUFtQixFQUNuQixFQUFFO0lBQ0YsTUFBTSxFQUFFLE1BQU0sRUFBRSxHQUFHLE1BQU0sSUFBQSx1Q0FBMkIsRUFBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDO1FBQ2xFLEtBQUssRUFBRSxHQUFHLENBQUMsYUFBYTtLQUN6QixDQUFDLENBQUM7SUFDSCxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLGNBQWMsRUFBRSxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztBQUMxRCxDQUFDLENBQUM7QUFSVyxRQUFBLElBQUksUUFRZiJ9