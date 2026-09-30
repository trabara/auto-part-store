import { MedusaCrud } from "@repo/medusa-ui";
import { useParams } from "react-router-dom";
import moduleDef from "../../../../../modules/automotive";
import { useTranslation } from "react-i18next";
const VehicleEngineEditPage = () => {
  const { entity } = useParams();
  const { t } = useTranslation();
  const feature = moduleDef.getFeature(entity!, t);
  
  return (
    <MedusaCrud.Edit
      initialData={{}}
      entity={entity!}
      config={feature.pages.update}
    />
  );
};

export default VehicleEngineEditPage;
