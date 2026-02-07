import Link from "next/link"
import Logo from "./app-logo"

export default function Footer() {
  return (
    <footer className="bg-primary border-t border-t-accent-foreground/10">
      <div className="snap-container mt-10 py-6 text-secondary">
        <div className="flex justify-between">
          <Logo />
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
          &copy; {new Date().getFullYear()} Your Company. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
