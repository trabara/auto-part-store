import { MedusaService } from "@medusajs/framework/utils";
import * as Models from "./models";

class MediaModuleService extends MedusaService(Models) {}

export default MediaModuleService;
