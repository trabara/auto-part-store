import { Module } from "@repo/dashboard/module";
import moduleDef from "../../../../modules/automotive";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

const CreatePage = () => {
  const { t } = useTranslation();
  const { entity } = useParams();

  const config = moduleDef.getFeature(entity!, t);

  return <Module.Create entity={entity!} config={config.pages.create} />;
};

export default CreatePage;
