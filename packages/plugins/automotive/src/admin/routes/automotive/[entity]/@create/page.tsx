import { MedusaCrud } from "@repo/medusa-ui";
import moduleDef from "../../../../modules/automotive";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

const CreatePage = () => {
  const { t } = useTranslation();
  const { entity } = useParams();

  const config = moduleDef.getFeature(entity!, t);

  return <MedusaCrud.Create entity={entity!} config={config.pages.create} />;
};

export default CreatePage;
