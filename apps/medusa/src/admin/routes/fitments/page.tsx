import { defineRouteConfig } from "@medusajs/admin-sdk";
import FitmentList from "~/features/fitment-list";

const FitmentsPage = () => {
  return <FitmentList />;
};

export const config = defineRouteConfig({
  label: "Fitments",
});

export default FitmentsPage;
