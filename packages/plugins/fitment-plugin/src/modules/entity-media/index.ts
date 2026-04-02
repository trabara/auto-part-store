import EntityMediaModuleService from "./service"
import { Module } from "@medusajs/framework/utils"

export const ENTITY_MEDIA_MODULE = "entityMedia"

export default Module(ENTITY_MEDIA_MODULE, {
    service: EntityMediaModuleService,
})