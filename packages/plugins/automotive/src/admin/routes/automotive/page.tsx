import { defineRouteConfig } from "@medusajs/admin-sdk";

export default function Page() {
  return <></>;
}

export const handle = {
  breadcrumb: () => {
    return "Automotive";
  },
};

export const config = defineRouteConfig({
  label: "Automotive",
});
