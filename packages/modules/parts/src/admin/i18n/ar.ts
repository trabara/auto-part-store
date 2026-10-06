import type { SameShape } from "@repo/framework/core";
import type { en } from "./en";

export const ar: SameShape<typeof en> = {
  name: "قطع الغيار",
  features: { brand: "العلامات التجارية", part_number: "أرقام القطع" },
  steps: {
    part_number: { number: "الرقم" },
  },
  entities: {
    Brand: {
      name: "علامة تجارية",
      plural: "العلامات التجارية",
      fields: { name: "الاسم", slug: "المعرّف النصي", logo: "الشعار", kind: "النوع", partNumbers: "أرقام القطع" },
      values: {
        kind: { AFTERMARKET: "قطع بديلة", OE: "قطع أصلية (OE)", BOTH: "أصلية وبديلة" },
      },
    },
    PartNumber: {
      name: "رقم قطعة",
      plural: "أرقام القطع",
      fields: { variant: "القطعة", brand: "العلامة التجارية", type: "النوع", number: "الرقم", number_normalized: "مفتاح البحث" },
      values: {
        type: { MPN: "رقم المصنّع", OE: "الرقم الأصلي (OE)", AFTERMARKET: "رقم منافس", PREVIOUS: "رقم سابق" },
      },
    },
  },
};
