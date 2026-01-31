import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import ShoppingCartButton from "@/modules/cart/components/cart-button"
import { CategoryNavMenu } from "@/modules/categories/components/category-nav-menu"
import { PRODUCT_CATEGORIES } from "@/modules/categories/data/productCategories"
import { SimpleSearchWithForm } from "@/modules/search/components/simple-search-with-form"
import { MapPin, Menu, Phone, Truck, User } from "lucide-react"
import Link from "next/link"
import Logo from "./app-logo"

export default function AppHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-b-accent-foreground/10 bg-primary">
      <div className="bg-accent">
        <div className="snap-container space-x-2 flex justify-end">
          <Button
            variant="ghost"
            className="hover:bg-accent/50 cursor-pointer text-xs"
          >
            <Truck />
            Track your order
          </Button>

          <Button
            variant="ghost"
            className="hover:bg-accent/50 cursor-pointer text-xs"
          >
            <MapPin />
            Store Location
          </Button>

          <Button
            variant="ghost"
            className="hover:bg-accent/50 cursor-pointer text-xs"
          >
            <Phone />
            Call Us +1 234 567 890
          </Button>
        </div>
      </div>

      <div className="snap-container py-4">
        <div className="hidden md:flex justify-between py-2">
          <Logo />
        </div>

        <div className="md:mt-4 flex justify-between space-x-4">
          <div className="hidden md:block">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="font-semibold">
                    <Menu className="mr-2 size-4" />
                    <span className="hidden md:block">ALL CATEGORIES</span>
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <nav className="md:w-50">
                      {PRODUCT_CATEGORIES.map((category) => (
                        <CategoryNavMenu
                          key={category.id}
                          category={category}
                        />
                      ))}
                    </nav>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <Button className="md:hidden hover:bg-accent/50 cursor-pointer">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <nav className="flex flex-col gap-4 p-4">
                <div className="flex flex-col gap-2">
                  <h3 className="font-semibold text-sm">ALL CATEGORIES</h3>
                  {PRODUCT_CATEGORIES.map((category) => (
                    <CategoryNavMenu key={category.id} category={category} />
                  ))}
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="font-semibold text-sm">SETTINGS</h3>
                </div>
              </nav>
            </SheetContent>
          </Sheet>

          {/** Search Input */}

          <div className="flex-1 relative flex items-center justify-center">
            <SimpleSearchWithForm className="hidden md:block flex-1" />
            <Logo className="block md:hidden h-full object-contain" />
          </div>

          {/** User Actions */}

          <div className="flex space-x-2">
            <Button className="hidden md:flex hover:bg-accent/50 cursor-pointer">
              <User />
              <div className="flex-col text-left ml-2 hidden md:flex">
                <div className="">Account</div>
                <div className="text-xs">Login / Register</div>
              </div>
            </Button>

            <Link href="/cart" className="block md:hidden">
              <ShoppingCartButton />
            </Link>

            <div className="hidden md:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <ShoppingCartButton />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuGroup>
                    <DropdownMenuSeparator />
                  </DropdownMenuGroup>
                  <DropdownMenuGroup>
                    <Button className="w-full">Checkout</Button>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
