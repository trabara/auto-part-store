import { defineRouteConfig } from "@medusajs/admin-sdk";
import { CarFront } from "lucide-react";
import FitmentList from "~/features/fitment-list";

const FitmentsPage = () => {
  return <FitmentList />;
};

export const config = defineRouteConfig({
  label: "Fitments",
  icon: () => <CarFront size={15}/>
});

export default FitmentsPage;
