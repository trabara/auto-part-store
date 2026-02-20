import { useState } from "react";
import { CrudContext } from "~/admin/context/crud-context";



export function CrudProvider({ children, entityName }: { children: React.ReactNode, entityName: string }) {
  const [entity, setEntity] = useState(null);
  const [isCreate, setIsCreate] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  const edit = (entity: any) => {
    setEntity(entity);
    setIsEdit(true);
  }

  return (
    <CrudContext.Provider value={{ entity, entityName, edit, isCreate, isEdit, setIsCreate, setIsEdit }}>
      {children}
    </CrudContext.Provider>
  )
}