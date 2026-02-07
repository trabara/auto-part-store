import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import ShoppingCartButton from "@/modules/cart/components/cart-button"
import CartList from "@/modules/cart/components/cart-sheet"
// import { listCategories } from "@/modules/categories/actions"
import { ButtonGroup, ButtonGroupSeparator } from "@/components/ui/button-group"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { CategoryMenuButton } from "@/modules/categories/components/category-menu-button"
import { SimpleSearchWithForm } from "@/modules/search/components/simple-search-with-form"
import { Car, Search, User } from "lucide-react"
import Logo from "./app-logo"
import Link from "next/link"

export default async function AppHeader({ className }: { className?: string }) {
  // const productCategories = await listCategories()

  return (
    <header className="relative">
      <div className={cn("fixed inset-0 z-50 w-full", className)}>
        <div className="bg-primary">
          <div className="snap-container">
            <div className="hidden xl:block border-b border-b-accent/20 py-2">
              <div className="space-x-2 flex justify-between items-center">
                <div className="">
                  <Link href="/about-us">
                    <Button variant="link" size="sm" className="text-accent">
                      About Us
                    </Button>
                  </Link>
                  <Link href="/faq">
                    <Button variant="link" size="sm" className="text-accent">
                      FAQ
                    </Button>
                  </Link>
                  <Link href="/order-tracking">
                    <Button variant="link" size="sm" className="text-accent">
                      Order Tracking
                    </Button>
                  </Link>
                </div>
                <div>🇹🇳</div>
              </div>
            </div>

            <div className="xl:mt-4 flex justify-between space-x-4 py-2 lg:py-4">
              <CategoryMenuButton
                side="left"
                className="xl:hidden hover:bg-accent-foreground/10 text-accent"
                categories={[]}
              />

              <Logo />

              <Dialog>
                <DialogTrigger asChild>
                  <Button className="hidden xl:flex hover:bg-accent/50 cursor-pointer">
                    <Car />
                    <div className="flex-col text-left ml-2 hidden xl:flex">
                      <div className="">Add Vehicle</div>
                      <div className="text-xs">My Garage</div>
                    </div>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form>
                    <DialogHeader>
                      <DialogTitle>Find the Right Parts Faster</DialogTitle>
                      <DialogDescription>
                        Having the right automotive parts and car accessories
                        will help you to boost your travel comfort and go on the
                        long-distance journey comfortably that you have been
                        planning.
                      </DialogDescription>
                    </DialogHeader>

                    <DialogFooter>
                      <Button variant="ghost">Cancel</Button>
                      <Button>Add Vehicle</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

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
          <div className="snap-container">
            <CategoryMenuButton
              side="left"
              className="hidden xl:inline-flex hover:bg-accent-foreground/10"
              categories={[]}
            />
            <ButtonGroup className="flex xl:hidden w-full">
              <Button
                variant="ghost"
                className="flex-1 hover:bg-accent-foreground/10"
              >
                <Car />
                My Garage
              </Button>
              <ButtonGroupSeparator orientation="vertical" />
              <Button
                variant="ghost"
                className="flex-1 hover:bg-accent-foreground/10"
              >
                <Search />
                Search Product
              </Button>
            </ButtonGroup>
          </div>
        </div>
      </div>
    </header>
  )
}
