import { model } from "@medusajs/framework/utils";

const StoreDetails = model.define("store_details", {
  id: model.id().primaryKey(),
  logo_url: model.text().nullable(),
  map_url: model.text().nullable(),
  address: model.text().nullable(),
  contact_emails: model.json().nullable(),
  contact_phone_numbers: model.json().nullable(),
  social_links: model.json().nullable(),
});

export default StoreDetails;
