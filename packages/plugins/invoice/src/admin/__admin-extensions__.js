
      // Auto-generated index file for Medusa Admin UI extensions
    import WidgetComponent0, { config as WidgetConfig0 } from "/Users/oussamabelhadjali/Projects/trabara/auto-part-store/packages/plugins/invoice/src/admin/widgets/order-invoice-widget.tsx"

const widgetModule = { widgets: [
  {
    Component: WidgetComponent0,
    zone: ["order.details.side.before"],
    widgetId: "Widget-5f17"
}
] }
    import RouteComponent0, { config as HandleConfig0 } from "/Users/oussamabelhadjali/Projects/trabara/auto-part-store/packages/plugins/invoice/src/admin/routes/settings/invoice-config/page.tsx"

const routeModule = { routes: [
    {
    Component: RouteComponent0,
    path: "/settings/invoice-config",
    handle: { label: HandleConfig0.label, translationNs: HandleConfig0.translationNs }
  }
]
 }
    import { config as RouteConfig0 } from "/Users/oussamabelhadjali/Projects/trabara/auto-part-store/packages/plugins/invoice/src/admin/routes/settings/invoice-config/page.tsx"

const menuItemModule = { menuItems: [
    {
    label: RouteConfig0.label,
    icon: undefined,
    path: "/settings/invoice-config",
    nested: undefined,
    rank: undefined,
    translationNs: RouteConfig0.translationNs
  }
]
 }
    

const formModule = { customFields: {
  
} }
    

const displayModule = { 
    displays: {
      
    }
   }
    import { deepMerge } from "@medusajs/admin-shared"
import i18nTranslations0 from "/Users/oussamabelhadjali/Projects/trabara/auto-part-store/packages/plugins/invoice/src/admin/i18n/index.ts"

const i18nModule = { resources: i18nTranslations0 }
    

const cellRendererModule = {}
    

const layoutModule = { layouts: [
  
] }
    

const searchEntityModule = {}

    const plugin = {
      widgetModule,
      routeModule,
      menuItemModule,
      formModule,
      displayModule,
      i18nModule,
      cellRendererModule,
      layoutModule,
      searchEntityModule
    }

    export default plugin
    