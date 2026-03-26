import { defineRouteConfig } from "@medusajs/admin-sdk";

export default function RoleDetailsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Role Details</h1>
      {/* Role details content goes here */}
    </div>
  );
}

export const config = defineRouteConfig({
  label: "Role Details",
});
