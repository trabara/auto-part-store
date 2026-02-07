import { Button } from "@/components/ui/button"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

import { ArrowRight } from "lucide-react"
import Image from "next/image"
import AdvancedSearch from "../../search/components/advanced-search"
import { ProductGridItem } from "@/modules/products/components/product-item"

export default function HomeTemplate() {
  return (
    <div className="py-6">
      <div className="snap-container">
        <div className="flex flex-col-reverse gap-6 md:flex-row">
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
      </div>

      <div className="snap-container">
        {/** Brands Section */}
        {/* <section>
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
        </section> */}

        {/** Product Promotions Section */}
        <section className="mt-4">
          <div className="mt-10 mb-6 flex items-center justify-between">
            <div className="flex flex-col flex-1 md:flex-row md:items-center">
              <h2 className="mr-4 text-2xl font-semibold border-b-2 border-b-primary">
                Best Seller
              </h2>
              <div className="mt-4 md:mt-0 flex space-x-2">
                {["Engine", "Brakes", "Suspension", "Lighting"].map(
                  (category) => (
                    <Button key={category} size="xs" variant="outline">
                      {category}
                    </Button>
                  )
                )}
              </div>
            </div>
            <Button
              variant="link"
              className="hidden md:inline-flex items-center"
            >
              View All
              <ArrowRight className="ml-2" />
            </Button>
          </div>
          <Carousel opts={{ align: "start" }}>
            <CarouselContent className="pb-4">
              {Array.from(Array(5).keys()).map((_, index) => (
                <CarouselItem
                  key={index}
                  className="basis-1/1 md:basis-1/2 lg:basis-1/3"
                >
                  <ProductGridItem />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-4" />
            <CarouselNext className="right-4" />
          </Carousel>
        </section>
      </div>
    </div>
  )
}
