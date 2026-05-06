"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get UpsertOAuthProviderSchema () {
        return UpsertOAuthProviderSchema;
    },
    get adminOAuthProvidersMiddlewares () {
        return adminOAuthProvidersMiddlewares;
    }
});
const _framework = require("@medusajs/framework");
const _zod = require("@medusajs/framework/zod");
const UpsertOAuthProviderSchema = _zod.z.object({
    provider: _zod.z.string(),
    client_id: _zod.z.string(),
    client_secret: _zod.z.string(),
    callback_url: _zod.z.string().url(),
    success_redirect_url: _zod.z.string().url(),
    enabled: _zod.z.boolean().default(false)
});
const adminOAuthProvidersMiddlewares = [
    {
        matcher: "/admin/oauth-providers",
        methods: [
            "GET"
        ]
    },
    {
        matcher: "/admin/oauth-providers",
        methods: [
            "POST"
        ],
        middlewares: [
            (0, _framework.validateAndTransformBody)(UpsertOAuthProviderSchema)
        ]
    },
    {
        matcher: "/admin/oauth-providers/:id",
        methods: [
            "DELETE"
        ]
    }
];

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9hcGkvYWRtaW4vb2F1dGgtcHJvdmlkZXJzL21pZGRsZXdhcmVzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gIE1pZGRsZXdhcmVSb3V0ZSxcbiAgdmFsaWRhdGVBbmRUcmFuc2Zvcm1Cb2R5XG59IGZyb20gXCJAbWVkdXNhanMvZnJhbWV3b3JrXCI7XG5pbXBvcnQgeyB6IH0gZnJvbSBcIkBtZWR1c2Fqcy9mcmFtZXdvcmsvem9kXCI7XG5cbmV4cG9ydCBjb25zdCBVcHNlcnRPQXV0aFByb3ZpZGVyU2NoZW1hID0gei5vYmplY3Qoe1xuICBwcm92aWRlcjogei5zdHJpbmcoKSxcbiAgY2xpZW50X2lkOiB6LnN0cmluZygpLFxuICBjbGllbnRfc2VjcmV0OiB6LnN0cmluZygpLFxuICBjYWxsYmFja191cmw6IHouc3RyaW5nKCkudXJsKCksXG4gIHN1Y2Nlc3NfcmVkaXJlY3RfdXJsOiB6LnN0cmluZygpLnVybCgpLFxuICBlbmFibGVkOiB6LmJvb2xlYW4oKS5kZWZhdWx0KGZhbHNlKSxcbn0pO1xuXG5leHBvcnQgdHlwZSBVcHNlcnRPQXV0aFByb3ZpZGVyQm9keSA9IHouaW5mZXI8dHlwZW9mIFVwc2VydE9BdXRoUHJvdmlkZXJTY2hlbWE+O1xuXG5cbmV4cG9ydCBjb25zdCBhZG1pbk9BdXRoUHJvdmlkZXJzTWlkZGxld2FyZXM6IE1pZGRsZXdhcmVSb3V0ZVtdID0gW1xuICB7XG4gICAgbWF0Y2hlcjogXCIvYWRtaW4vb2F1dGgtcHJvdmlkZXJzXCIsXG4gICAgbWV0aG9kczogW1wiR0VUXCJdLFxuICB9LFxuICB7XG4gICAgbWF0Y2hlcjogXCIvYWRtaW4vb2F1dGgtcHJvdmlkZXJzXCIsXG4gICAgbWV0aG9kczogW1wiUE9TVFwiXSxcbiAgICBtaWRkbGV3YXJlczogW1xuICAgICAgdmFsaWRhdGVBbmRUcmFuc2Zvcm1Cb2R5KFVwc2VydE9BdXRoUHJvdmlkZXJTY2hlbWEpLFxuICAgIF0sXG4gIH0sXG4gIHtcbiAgICBtYXRjaGVyOiBcIi9hZG1pbi9vYXV0aC1wcm92aWRlcnMvOmlkXCIsXG4gICAgbWV0aG9kczogW1wiREVMRVRFXCJdLFxuICB9LFxuXTtcbiJdLCJuYW1lcyI6WyJVcHNlcnRPQXV0aFByb3ZpZGVyU2NoZW1hIiwiYWRtaW5PQXV0aFByb3ZpZGVyc01pZGRsZXdhcmVzIiwieiIsIm9iamVjdCIsInByb3ZpZGVyIiwic3RyaW5nIiwiY2xpZW50X2lkIiwiY2xpZW50X3NlY3JldCIsImNhbGxiYWNrX3VybCIsInVybCIsInN1Y2Nlc3NfcmVkaXJlY3RfdXJsIiwiZW5hYmxlZCIsImJvb2xlYW4iLCJkZWZhdWx0IiwibWF0Y2hlciIsIm1ldGhvZHMiLCJtaWRkbGV3YXJlcyIsInZhbGlkYXRlQW5kVHJhbnNmb3JtQm9keSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7UUFNYUE7ZUFBQUE7O1FBWUFDO2VBQUFBOzs7MkJBZk47cUJBQ1c7QUFFWCxNQUFNRCw0QkFBNEJFLE1BQUMsQ0FBQ0MsTUFBTSxDQUFDO0lBQ2hEQyxVQUFVRixNQUFDLENBQUNHLE1BQU07SUFDbEJDLFdBQVdKLE1BQUMsQ0FBQ0csTUFBTTtJQUNuQkUsZUFBZUwsTUFBQyxDQUFDRyxNQUFNO0lBQ3ZCRyxjQUFjTixNQUFDLENBQUNHLE1BQU0sR0FBR0ksR0FBRztJQUM1QkMsc0JBQXNCUixNQUFDLENBQUNHLE1BQU0sR0FBR0ksR0FBRztJQUNwQ0UsU0FBU1QsTUFBQyxDQUFDVSxPQUFPLEdBQUdDLE9BQU8sQ0FBQztBQUMvQjtBQUtPLE1BQU1aLGlDQUFvRDtJQUMvRDtRQUNFYSxTQUFTO1FBQ1RDLFNBQVM7WUFBQztTQUFNO0lBQ2xCO0lBQ0E7UUFDRUQsU0FBUztRQUNUQyxTQUFTO1lBQUM7U0FBTztRQUNqQkMsYUFBYTtZQUNYQyxJQUFBQSxtQ0FBd0IsRUFBQ2pCO1NBQzFCO0lBQ0g7SUFDQTtRQUNFYyxTQUFTO1FBQ1RDLFNBQVM7WUFBQztTQUFTO0lBQ3JCO0NBQ0QifQ==