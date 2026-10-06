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
  messages: {
    conditions: {
      operators: {
        eq: "هو", neq: "ليس", gt: "أكبر من", gte: "لا يقل عن", lt: "أقل من", lte: "لا يزيد عن",
        between: "بين", in: "أحد", not_in: "ليس من",
      },
      validation: {
        and: "و",
        or: "أو",
        root: "الشروط",
        group: "المجموعة {{n}}",
        tooDeep: "يمكن تداخل المجموعات حتى {{max}} مستويات كحد أقصى.",
        unknownAttribute: "«{{code}}» ليست خاصية معروفة.",
        badOperator: "لا يمكن استخدام «{{op}}» مع {{attr}}.",
        needsValues: "{{attr}}: مطلوب قيمة واحدة على الأقل.",
        needsSingle: "{{attr}}: مطلوب قيمة واحدة فقط.",
        needsValue: "{{attr}}: القيمة مطلوبة.",
        badValue: "{{attr}}: {{value}} ليست قيمة صالحة.",
        notNumber: "{{attr}}: يجب أن تكون رقمًا.",
        needsUpper: "{{attr}}: الحد الأعلى مطلوب.",
        upperBelow: "{{attr}}: الحد الأعلى أقل من الحد الأدنى.",
      },
      editor: {
        fitsWhen: "متوافق عندما تتحقق",
        all: "كل",
        any: "أي من",
        ofTheseMatch: "الشروط التالية:",
        condition: "شرط",
        group: "مجموعة",
        removeCondition: "إزالة الشرط",
        removeGroup: "إزالة المجموعة",
        from: "من",
        to: "إلى",
        value: "القيمة",
        listPlaceholder: "مفصولة بفواصل، مثل GTI, R-Line",
      },
      drawer: {
        title: "شروط التوافق",
        description: "حدّد تكوينات المركبة التي تناسبها هذه القطعة (مثل الدفع الأمامي فقط).",
        none: "لا توجد شروط: القطعة تناسب جميع تكوينات المركبة.",
        addFirst: "إضافة شرط",
        summary: "الملخص",
        noConditions: "لا توجد شروط",
        removeAll: "إزالة الكل",
        saved: "تم حفظ الشروط",
        removed: "تمت إزالة الشروط",
        saveFailed: "تعذّر حفظ الشروط",
      },
      section: { title: "الشروط", none: "لا شيء: تناسب جميع تكوينات المركبة." },
    },
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
