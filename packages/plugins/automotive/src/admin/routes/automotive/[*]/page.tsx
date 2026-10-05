// src/admin/routes/automotive/[*]/page.tsx  (no config here)
import { ModuleRouter ,} from "@repo/framework/admin";
import automotive from "../../../modules/automotive";

// const render = createRender(); // define once at module level so its identity is stable
export default function AutomotiveSplat() {
  return <ModuleRouter module={automotive} />;
}
