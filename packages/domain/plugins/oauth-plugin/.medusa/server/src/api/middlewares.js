"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return _default;
    }
});
const _framework = require("@medusajs/framework");
const _middlewares = require("./admin/oauth-providers/middlewares");
const _default = (0, _framework.defineMiddlewares)({
    routes: [
        ..._middlewares.adminOAuthProvidersMiddlewares
    ]
});

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9hcGkvbWlkZGxld2FyZXMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZGVmaW5lTWlkZGxld2FyZXMgfSBmcm9tIFwiQG1lZHVzYWpzL2ZyYW1ld29ya1wiO1xuaW1wb3J0IHsgYWRtaW5PQXV0aFByb3ZpZGVyc01pZGRsZXdhcmVzIH0gZnJvbSBcIi4vYWRtaW4vb2F1dGgtcHJvdmlkZXJzL21pZGRsZXdhcmVzXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZU1pZGRsZXdhcmVzKHtcbiAgcm91dGVzOiBbXG4gICAgLi4uYWRtaW5PQXV0aFByb3ZpZGVyc01pZGRsZXdhcmVzLFxuICBdLFxufSk7XG4iXSwibmFtZXMiOlsiZGVmaW5lTWlkZGxld2FyZXMiLCJyb3V0ZXMiLCJhZG1pbk9BdXRoUHJvdmlkZXJzTWlkZGxld2FyZXMiXSwibWFwcGluZ3MiOiI7Ozs7K0JBR0E7OztlQUFBOzs7MkJBSGtDOzZCQUNhO01BRS9DLFdBQWVBLElBQUFBLDRCQUFpQixFQUFDO0lBQy9CQyxRQUFRO1dBQ0hDLDJDQUE4QjtLQUNsQztBQUNIIn0=