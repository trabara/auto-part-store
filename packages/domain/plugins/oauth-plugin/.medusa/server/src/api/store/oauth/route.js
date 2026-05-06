"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "GET", {
    enumerable: true,
    get: function() {
        return GET;
    }
});
const _oauth = require("@repo/domain-modules/oauth");
const GET = async (req, res)=>{
    const service = req.scope.resolve(_oauth.OAUTH_MODULE);
    const configs = await service.listOAuthProviderConfigs({
        enabled: true
    }, {
        select: [
            "provider"
        ]
    });
    res.status(200).json({
        enabled_providers: configs.map((c)=>c.provider)
    });
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9hcGkvc3RvcmUvb2F1dGgvcm91dGUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTWVkdXNhUmVxdWVzdCwgTWVkdXNhUmVzcG9uc2UgfSBmcm9tIFwiQG1lZHVzYWpzL2ZyYW1ld29ya1wiO1xuaW1wb3J0IHsgT0FVVEhfTU9EVUxFLCBPQXV0aFByb3ZpZGVyU2VydmljZSB9IGZyb20gXCJAcmVwby9kb21haW4tbW9kdWxlcy9vYXV0aFwiO1xuXG5leHBvcnQgY29uc3QgR0VUID0gYXN5bmMgKHJlcTogTWVkdXNhUmVxdWVzdCwgcmVzOiBNZWR1c2FSZXNwb25zZSkgPT4ge1xuICAgIGNvbnN0IHNlcnZpY2UgPSByZXEuc2NvcGUucmVzb2x2ZTxPQXV0aFByb3ZpZGVyU2VydmljZT4oT0FVVEhfTU9EVUxFKTtcbiAgICBjb25zdCBjb25maWdzID0gYXdhaXQgc2VydmljZS5saXN0T0F1dGhQcm92aWRlckNvbmZpZ3MoeyBlbmFibGVkOiB0cnVlIH0sIHsgc2VsZWN0OiBbXCJwcm92aWRlclwiXSB9KTtcbiAgICByZXMuc3RhdHVzKDIwMCkuanNvbih7IGVuYWJsZWRfcHJvdmlkZXJzOiBjb25maWdzLm1hcChjID0+IGMucHJvdmlkZXIpIH0pO1xufVxuIl0sIm5hbWVzIjpbIkdFVCIsInJlcSIsInJlcyIsInNlcnZpY2UiLCJzY29wZSIsInJlc29sdmUiLCJPQVVUSF9NT0RVTEUiLCJjb25maWdzIiwibGlzdE9BdXRoUHJvdmlkZXJDb25maWdzIiwiZW5hYmxlZCIsInNlbGVjdCIsInN0YXR1cyIsImpzb24iLCJlbmFibGVkX3Byb3ZpZGVycyIsIm1hcCIsImMiLCJwcm92aWRlciJdLCJtYXBwaW5ncyI6Ijs7OzsrQkFHYUE7OztlQUFBQTs7O3VCQUZzQztBQUU1QyxNQUFNQSxNQUFNLE9BQU9DLEtBQW9CQztJQUMxQyxNQUFNQyxVQUFVRixJQUFJRyxLQUFLLENBQUNDLE9BQU8sQ0FBdUJDLG1CQUFZO0lBQ3BFLE1BQU1DLFVBQVUsTUFBTUosUUFBUUssd0JBQXdCLENBQUM7UUFBRUMsU0FBUztJQUFLLEdBQUc7UUFBRUMsUUFBUTtZQUFDO1NBQVc7SUFBQztJQUNqR1IsSUFBSVMsTUFBTSxDQUFDLEtBQUtDLElBQUksQ0FBQztRQUFFQyxtQkFBbUJOLFFBQVFPLEdBQUcsQ0FBQ0MsQ0FBQUEsSUFBS0EsRUFBRUMsUUFBUTtJQUFFO0FBQzNFIn0=