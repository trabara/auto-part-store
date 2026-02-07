import { cn } from "@/lib/utils"
// import { getBaseURL } from "@lib/util/env"
// import { Metadata } from "next"

import { Akshar } from "next/font/google"
import AppHeader from "./components/app-header"
import AppFooter from "./components/app-footer"

import '@/styles/globals.css'

const akshar = Akshar({
  subsets: ["latin"],
  weight: "400",
})

// export const metadata: Metadata = {
//   metadataBase: new URL(getBaseURL()),
// }

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" data-mode="light">
      <body className={cn(akshar.className, "h-screen")}>
        {/** Header */}
        <AppHeader className="h-48"/>
        {/** Main Content */}
        <div className="pt-48 pb-6 bg-accent/20">
          <main className="snap-container">{props.children}</main>
        </div>
        {/** Footer */}
        <AppFooter />
      </body>
    </html>
  )
}
