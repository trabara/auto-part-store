import { cn } from "@/lib/utils"
import { Akshar } from "next/font/google"
import Footer from "../components/app-footer"
import Header from "../components/app-header"

const akshar = Akshar({
  subsets: ["latin"],
  weight: "400",
})

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={cn(akshar.className, "h-screen")}>
      {/** Header */}
      <Header />
      {/** Main Content */}
      <div className="bg-accent/20">
        <main className="snap-container md:py-6">{children}</main>
      </div>
      {/** Footer */}
      <Footer />
    </div>
  )
}
