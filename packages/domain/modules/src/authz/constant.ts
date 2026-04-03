export const AUTHZ_MODULE = "authz";

export const EXCLUDED_RESOURCES = [
  { kind: "read", target: "/admin/auth" },
  { kind: "read", target: "/admin/stores" },
  { kind: "read", target: "/admin/feature-flags" },
  { kind: "read", target: "/admin/invites/accept" },
  { kind: "read", target: "/admin/notifications" },
  { kind: "read", target: "/admin/users/me" },
];
