import { MedusaService } from "@medusajs/framework/utils"
import EntityImage from "./models/entity-image"

class EntityMediaModuleService extends MedusaService({
    EntityImage,
}) { }

export default EntityMediaModuleService