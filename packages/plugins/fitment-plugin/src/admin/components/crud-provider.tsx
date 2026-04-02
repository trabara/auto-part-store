import { useState } from "react";
import { CrudContext } from "../context/crud-context";



export function EntityCrudProvider({ children, entityName }: { children: React.ReactNode, entityName: string }) {

  const [state, setState] = useState({
    entity: null,
    isCreate: false,
    isEdit: false
  })

  const setEntity = (entity: any) => {
    setState((prevState) => ({ ...prevState, entity }));
  }

  const setIsCreate = (isCreate: boolean) => {
    setState((prevState) => ({ ...prevState, isCreate }));
  }

  const setIsEdit = (isEdit: boolean) => {
    setState((prevState) => ({ ...prevState, isEdit }));
  }

  const edit = (entity: any) => {
    setEntity(entity);
    setIsEdit(true);
  }

  return (
    <CrudContext.Provider value={{ entity: state.entity, entityName, edit, isCreate: state.isCreate, isEdit: state.isEdit, setIsCreate, setIsEdit }}>
      {children}
    </CrudContext.Provider>
  )
}