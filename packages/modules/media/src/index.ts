import { MediaModuleService } from "@services"
import { Module } from "@medusajs/framework/utils"

export const MEDIA_MODULE = "media"

export default Module(MEDIA_MODULE, {
    service: MediaModuleService,
})