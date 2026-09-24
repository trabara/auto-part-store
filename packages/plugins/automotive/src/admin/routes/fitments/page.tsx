import { defineRouteConfig } from "@medusajs/admin-sdk";
import { CarFront } from "lucide-react";

export default function FitementPage() {
  return <></>;
}

export const config = defineRouteConfig({
  label: "Automotive",
  icon: () => <CarFront size={15} />,
});
