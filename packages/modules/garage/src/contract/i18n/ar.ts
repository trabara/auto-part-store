import type { SameShape } from "@repo/framework/core";
import type { en } from "./en";

export const ar: SameShape<typeof en> = {
  name: "المرآب",
  features: { customer_vehicle: "المرآب" },
  steps: {},
  messages: {},
  entities: {
    CustomerVehicle: {
      name: "مركبة في المرآب",
      plural: "المرآب",
      fields: {
        customer: "العميل",
        vehicle: "المركبة",
        nickname: "الاسم المستعار",
        vin: "رقم الهيكل (VIN)",
        registration: "رقم التسجيل",
        is_default: "المركبة الافتراضية",
        build_year: "سنة الصنع",
        build_month: "شهر الصنع",
      },
    },
  },
};
