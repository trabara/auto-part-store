import { cn } from "@repo/ui/lib/utils"
import { Akshar } from "next/font/google"

import { listCategories } from "@/lib/data/categories"
import ShoppingCartButton from "@/modules/cart/components/cart-button"
import CartList from "@/modules/cart/components/cart-sheet"
import { CategoryMenuSheet } from "@/modules/categories/components/category-menu-sheet"
import FitmentBadge from "@/modules/fitment/components/fitment-badge"
import { SimpleSearchWithForm } from "@/modules/search/components/simple-search-with-form"
import { Button } from "@repo/ui/components/button"
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from "@repo/ui/components/button-group"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@repo/ui/components/sheet"
import { Car, CarFront, Menu, Search, User } from "lucide-react"
import { Metadata } from "next/dist/lib/metadata/types/metadata-interface"
import Image from "next/image"
import Link from "next/link"

import "@/styles/globals.css"

const akshar = Akshar({
  subsets: ["latin"],
  weight: "400",
})

export const metadata: Metadata = {
  metadataBase: new URL("https://snapstore.com"),
  title: "SnapStore - Your One-Stop Shop for Auto Parts",
  description:
    "Discover a wide range of high-quality auto parts at SnapStore. Shop with confidence and get your vehicle back on the road in no time.",
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const categories = await listCategories().catch(() => [])

  return (
    <html lang="en" data-mode="light">
      <body className={cn(akshar.className, "h-screen")}>
        {/** Header */}
        <header className="relative h-22 xl:h-42.5">
          <div className="fixed inset-0 z-50 w-full h-fit">
            <div className="bg-primary">
              <div className="snap-container">
                <div className="hidden xl:block border-b border-b-accent/20 py-2">
                  <div className="space-x-2 flex justify-between items-center">
                    <div className="">
                      <Link href="/about-us">
                        <Button
                          variant="link"
                          size="sm"
                          className="text-accent"
                        >
                          About Us
                        </Button>
                      </Link>
                      <Link href="/faq">
                        <Button
                          variant="link"
                          size="sm"
                          className="text-accent"
                        >
                          FAQ
                        </Button>
                      </Link>
                      <Link href="/order-tracking">
                        <Button
                          variant="link"
                          size="sm"
                          className="text-accent"
                        >
                          Order Tracking
                        </Button>
                      </Link>
                    </div>
                    <div>🇹🇳</div>
                  </div>
                </div>

                <div className="xl:mt-4 flex justify-between space-x-4 py-2 xl:py-4">
                  <CategoryMenuSheet categories={categories}>
                    <Button
                      variant="ghost"
                      className="inline-flex items-center xl:hidden hover:bg-accent-foreground/10 text-accent"
                    >
                      <Menu />
                      <span className="hidden xl:block ml-2">
                        ALL CATEGORIES
                      </span>
                    </Button>
                  </CategoryMenuSheet>

                  <Link href="/">
                    <Image src="/logo.png" alt="Logo" width={150} height={50} />
                  </Link>

                  <FitmentBadge>
                    <Button
                      variant="ghost"
                      className="hidden xl:inline-flex text-secondary hover:bg-accent/50 cursor-pointer "
                    >
                      <CarFront />
                      My Garage
                    </Button>
                  </FitmentBadge>

                  {/** Search Input */}
                  <SimpleSearchWithForm className="hidden xl:block flex-1" />

                  {/** User Actions */}
                  <div className="flex space-x-2">
                    <Button className="hidden xl:flex hover:bg-accent/50 cursor-pointer">
                      <User />
                      <div className="flex-col text-left ml-2 hidden xl:flex">
                        <div className="">Account</div>
                        <div className="text-xs">Login / Register</div>
                      </div>
                    </Button>

                    <Sheet>
                      <SheetTrigger asChild>
                        <ShoppingCartButton />
                      </SheetTrigger>
                      <SheetContent side="right">
                        <SheetHeader>
                          <SheetTitle className="text-lg font-bold">
                            Shopping Cart
                          </SheetTitle>
                        </SheetHeader>
                        <CartList products={[]} />
                      </SheetContent>
                    </Sheet>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border-b border-b-accent">
              <div className="snap-container py-1">
                <CategoryMenuSheet categories={categories}>
                  <Button
                    variant="ghost"
                    className="hidden xl:inline-flex hover:bg-accent-foreground/10"
                  >
                    <Menu />
                    <span className="hidden xl:block ml-2">ALL CATEGORIES</span>
                  </Button>
                </CategoryMenuSheet>
                <ButtonGroup className="flex xl:hidden w-full">
                  <FitmentBadge>
                    <Button variant="ghost" className="flex-1">
                      <Car />
                      My Garage
                    </Button>
                  </FitmentBadge>

                  <ButtonGroupSeparator orientation="vertical" />
                  <Button variant="ghost" className="flex-1">
                    <Search />
                    Search Product
                  </Button>
                </ButtonGroup>
              </div>
            </div>
          </div>
        </header>
        {/** Main Content */}
        <main className="bg-accent/20">{children}</main>
        {/** Footer */}
        <footer className="bg-primary border-t border-t-accent-foreground/10">
          <div className="snap-container mt-10 py-6 text-secondary">
            <div className="flex justify-between">
              <Link href="/">
                <Image src="/logo.png" alt="Logo" width={150} height={50} />
              </Link>
              <div>
                <h3 className="font-semibold mb-2">Customer Service</h3>
                <ul className="space-y-1 text-sm">
                  <li>
                    <Link href="/help">Help & Contact</Link>
                  </li>
                  <li>
                    <Link href="/returns">Returns & Refunds</Link>
                  </li>
                  <li>
                    <Link href="/shipping">Shipping Info</Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">About Us</h3>
                <ul className="space-y-1 text-sm">
                  <li>
                    <Link href="/about">Our Story</Link>
                  </li>
                  <li>
                    <Link href="/careers">Careers</Link>
                  </li>
                  <li>
                    <Link href="/press">Press</Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Follow Us</h3>
                <ul className="space-y-1 text-sm">
                  <li>
                    <Link href="https://facebook.com">Facebook</Link>
                  </li>
                  <li>
                    <Link href="https://twitter.com">Twitter</Link>
                  </li>
                  <li>
                    <Link href="https://instagram.com">Instagram</Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className="text-center text-xs mt-4">
              &copy; {new Date().getFullYear()} Your Company. All rights
              reserved.
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
