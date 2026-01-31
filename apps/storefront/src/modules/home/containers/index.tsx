import { Card, CardContent, CardTitle } from "@/components/ui/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel"
import AdvancedSearch from "../../search/components/advanced-search"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowDown } from "lucide-react"
import ProductCard from "@/modules/products/components/card"

export default function HomeTemplate() {
  return (
    <div>
      <div className="flex flex-col-reverse md:flex-row md:gap-6">
        {/** Vehicle model Search */}

        <Card className="shadow-none border-accent-foreground/30 md:w-2/6">
          <CardContent className="h-full flex flex-col">
            <CardTitle className="text-2xl mb-4">
              Find your vehicle parts
            </CardTitle>

            <AdvancedSearch />
          </CardContent>
        </Card>

        {/** Hero */}
        <Carousel className="md:w-4/6">
          <CarouselContent>
            {Array.from(Array(4).keys()).map((_, index) => (
              <CarouselItem key={index}>
                <Image
                  className="object-contain"
                  src="https://placehold.co/600x400"
                  unoptimized
                  alt={`Slide ${index + 1}`}
                  width={660}
                  height={400}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-4" />
          <CarouselNext className="right-4" />
        </Carousel>
      </div>

      {/** Brands Section */}
      <section>
        <div className="mt-10 mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold border-b-2 border-b-primary">
            Shop by Brand
          </h2>
        </div>
        <div className="relative flex w-full snap-x snap-mandatory gap-6 overflow-x-auto">
          {Array.from(Array(10).keys()).map((_, index) => (
            <div key={index} className="shrink-0 snap-start scroll-mx-6">
              <Image
                src="https://placehold.co/80x80"
                unoptimized
                alt={`Brand ${index + 1}`}
                width={80}
                height={80}
              />
            </div>
          ))}
        </div>
      </section>

      {/** Product Promotions Section */}
      <section>
        <div className="mt-10 mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold border-b-2 border-b-primary">
            Promotions
          </h2>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {Array.from(Array(3).keys()).map((_, index) => (
            <ProductCard key={index} id={index.toString()} />
          ))}
        </div>
        <div className="flex justify-center mt-6">
          <Button variant="outline">
            Load More Promotions <ArrowDown />
          </Button>
        </div>
      </section>
    </div>
  )
}
