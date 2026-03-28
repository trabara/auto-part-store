import { createContext, useContext } from "react";

type CrudContextType<TData> = {
    entity: TData | null,
    name: string,
    edit: (entity: TData) => void
    isEdit: boolean,
    isCreate: boolean,
    setIsEdit: (state: boolean) => void,
    setIsCreate: (state: boolean) => void
}

export const CrudContext = createContext<CrudContextType<any>>({
    entity: null,
    name: "",
    isEdit: false,
    isCreate: false,
    edit: () => { },
    setIsEdit: () => { },
    setIsCreate: () => { }
})

export const useCrudContext = <TData>() => {
    const context = useContext(CrudContext) as CrudContextType<TData>;

    if (!context) {
        throw new Error("useCrudContext must be used within a CrudProvider")
    }

    return context
}