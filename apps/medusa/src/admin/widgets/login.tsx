import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useAsRef } from "@repo/ui/hooks/use-as-ref"
import { useLayoutEffect } from "react"

const Login = () => {
    const logoElemRef = useAsRef(() => {
        const elem = document.querySelector("#medusa > div > div > div > div.\\[\\&\\>div\\]\\:bg-ui-bg-field.\\[\\&\\>div\\]\\:text-ui-fg-subtle.\\[\\&\\>div\\]\\:flex.\\[\\&\\>div\\]\\:items-center.\\[\\&\\>div\\]\\:justify-center.size-12.\\[\\&\\>div\\]\\:size-11.\\[\\&\\>div\\]\\:rounded-\\[10px\\].bg-ui-button-neutral.shadow-buttons-neutral.after\\:button-neutral-gradient.relative.mb-4.flex.h-\\[50px\\].w-\\[50px\\].items-center.justify-center.rounded-xl.after\\:inset-0.after\\:content-\\[\\'\\'\\] > div")
        const parent = elem?.parentElement
        elem?.remove()
        return parent
    })

    const welcomeElemRef = useAsRef(() => {
        return document.querySelector("#medusa > div > div > div > div.mb-4.flex.flex-col.items-center > h1")
    })

    useLayoutEffect(() => {
        welcomeElemRef.current()?.remove()

        const logoContainer = logoElemRef.current()
        const img = document.createElement('img')
        img.classList.add('p-1')
        // @ts-ignore
        img.src = import.meta.env.VITE_STORE_LOGO_URL
        img.style.maxWidth = "100%"
        img.style.maxHeight = "100%"
        logoContainer?.appendChild(img)
        // headingContainer?.appendChild(document.createTextNode("Welcome to Medusa Admin"))
    }, [])
}

export const config = defineWidgetConfig({
    zone: "login.after",
})

export default Login