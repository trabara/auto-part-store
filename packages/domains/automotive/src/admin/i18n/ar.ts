import type { SameShape } from "@repo/framework/core";
import type { en } from "./en";

export const ar: SameShape<typeof en> = {
  messages: {
    attributes: {
      body_style: "نوع الهيكل",
      doors: "الأبواب",
      drive: "نظام الدفع",
      transmission: "ناقل الحركة",
      trim: "الفئة",
      year_start: "سنة بداية الإنتاج",
      year_end: "سنة نهاية الإنتاج",
      engine: {
        code: "رمز المحرك",
        fuel: "الوقود",
        layout: "ترتيب المحرك",
        cylinders: "الأسطوانات",
        displacement_cc: "سعة المحرك",
        power_kw: "القوة",
        power_hp: "القوة (حصان)",
        name: "تقنية المحرك",
      },
      generation: {
        name: "الجيل",
        code: "رمز الجيل",
        model: { name: "الطراز", category: "فئة المركبة", make: { name: "الصانع" } },
      },
    },
    attributeGroups: { vehicle: "المركبة", engine: "المحرك", model: "الطراز" },
    widgets: {
      fitments: {
        title: "المركبات المتوافقة",
        description: "المركبات التي تناسبها هذه النسخة، حسب الموضع.",
        production: "الإنتاج",
        editConditions: "تعديل الشروط",
      },
      garage: { title: "المرآب", description: "المركبات التي حفظها هذا العميل.", yes: "نعم" },
      partNumbers: {
        title: "أرقام القطع",
        description: "رقم الصانع، أرقام OE، الأرقام المنافسة والسابقة.",
        noBrand: "بدون علامة تجارية",
      },
    },
  },
};
