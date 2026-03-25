import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { StoreDetailsForm } from "../modules/store";

const StoreDetailsWidget = () => {
  return <StoreDetailsForm />;
};

export const config = defineWidgetConfig({
  zone: 'store.details.after',
});

export default StoreDetailsWidget;
