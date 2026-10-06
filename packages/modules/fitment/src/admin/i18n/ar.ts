import type { SameShape } from "@repo/framework/core";
import type { en } from "./en";

export const ar: SameShape<typeof en> = {
  name: "التوافق",
  features: {
    fitment: "التوافقات",
    fitment_position: "المواضع",
    automotive_attribute: "خصائص المركبة",
  },
  steps: {
    fitment: { application: "التطبيق", production: "فترة الإنتاج" },
  },
  entities: {
    Fitment: {
      name: "توافق",
      plural: "التوافقات",
      fields: {
        variant: "القطعة",
        vehicle: "المركبة",
        position: "الموضع",
        quantity: "الكمية",
        from_year: "من سنة",
        from_month: "من شهر",
        to_year: "إلى سنة",
        to_month: "إلى شهر",
        notes: "ملاحظات",
        conditions_summary: "الشروط",
      },
    },
    FitmentPosition: {
      name: "موضع",
      plural: "المواضع",
      fields: { code: "الرمز", name: "الاسم", category: "الفئة", fitments: "التوافقات" },
    },
    AutomotiveAttribute: {
      name: "خاصية مركبة",
      plural: "خصائص المركبة",
      fields: { code: "حقل المركبة", name: "الاسم", data_type: "النوع", default_unit: "الوحدة", category: "الفئة" },
      values: {
        data_type: {
          string: "نص",
          number: "رقم",
          boolean: "نعم / لا",
          date: "تاريخ",
          enum: "قائمة قيم",
          array: "قائمة",
          object: "كائن",
        },
      },
    },
  },
};
