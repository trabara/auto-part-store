import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { HeartIcon } from "lucide-react"
import Image from "next/image"
import { useState } from "react"

export default function ProductCard({ id }: { id: string }) {
  const [liked, setLiked] = useState<boolean>(false)

  return (
    <div className="relative max-w-md rounded-xl bg-gradient-to-r from-neutral-600 to-violet-300 pt-0 shadow-lg">
      <div className="flex h-60 items-center justify-center">
        <Image
          src="https://placehold.co/300x240"
          alt="Shoes"
          width={300}
          height={240}
          className="w-75"
        />
      </div>
      <Button
        size="icon"
        onClick={() => setLiked(!liked)}
        className="bg-primary/10 hover:bg-primary/20 absolute top-4 right-4 rounded-full"
      >
        <HeartIcon
          className={cn(
            liked ? "fill-destructive stroke-destructive" : "stroke-white"
          )}
        />
        <span className="sr-only">Like</span>
      </Button>
      <Card className="border-none">
        <CardHeader>
          <CardTitle>Nike Jordan Air Rev</CardTitle>
          <CardDescription className="flex items-center gap-2">
            {/** variants selection */}
            <Select>
              <SelectTrigger className="w-full bg-white">
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
                {["8", "8.5", "9", "9.5", "10", "10.5", "11", "11.5", "12"].map(
                  (size) => (
                    <SelectItem key={size} value={size}>
                      {size}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
            <Badge className="ml-auto">In Stock</Badge>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <h3 className="text-sm font-medium uppercase text-secondary-foreground">
            Brand Name
          </h3>
          <p>
            Crossing hardwood comfort with off-court flair. &apos;80s-Inspired
            construction, bold details and nothin&apos;-but-net style.
          </p>
        </CardContent>
        <CardFooter className="justify-between gap-3 max-sm:flex-col max-sm:items-stretch">
          <div className="flex flex-col">
            <span className="text-sm font-medium uppercase">Price</span>
            <div className="flex items-center gap-2">
              <span className="text-xl font-semibold">$69.99</span>
              <span className="text-sm text-muted-foreground line-through">
                $99.99
              </span>
            </div>
          </div>
          <Button size="lg">Add to cart</Button>
        </CardFooter>
      </Card>
    </div>
  )
}
