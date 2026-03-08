import { Button } from "@repo/ui/components/button"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@repo/ui/components/carousel"

import { Marquee, MarqueeContent } from "@repo/ui/components/marquee"
import { retreiveFitment } from "@/lib/data/fitments"
import { ArrowRight } from "lucide-react"
import Image from "next/image"

export default async function HomeTemplate() {
  const fitment = await retreiveFitment()
  console.log("Fitment ID from cookie:", fitment)

  return (
    <div className="space-y-4">
      {/** Hero */}
      <Carousel className="bg-accent/50">
        <CarouselContent>
          {Array.from(Array(4).keys()).map((_, index) => (
            <CarouselItem key={index} className="h-96">
              <Image
                className="object-contain"
                unoptimized
                src="https://placehold.co/600x400"
                alt={`Slide ${index + 1}`}
                fill
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-4" />
        <CarouselNext className="right-4" />
      </Carousel>

      <Marquee className="snap-container">
        <MarqueeContent>
          {Array.from(Array(10).keys()).map((_, index) => (
            <Image
              key={index}
              unoptimized
              className="mr-2 object-contain"
              src="https://placehold.co/200x50"
              alt={`Marquee Item ${index + 1}`}
              width={200}
              height={50}
            />
          ))}
        </MarqueeContent>
      </Marquee>

      {/** Vehicle model Search */}
      {/* <div className="snap-container">
        <Card className="shadow-none border-accent-foreground/10">
          <CardContent className="h-full flex flex-col px-4!">
            <CardTitle className="text-4xl mb-4">
              Find your vehicle parts
            </CardTitle>

            <AdvancedSearch />
          </CardContent>
        </Card>
      </div> */}


      {/** Product Promotions Section */}
      <section className="snap-container">
        <div className="mt-10 mb-6 flex items-center justify-between">
          <div className="flex flex-col flex-1 md:flex-row md:items-center">
            <h2 className="mr-4 text-2xl font-semibold border-b-2 border-b-primary">
              Best Seller
            </h2>
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
                {/* <ProductGridItem product={}/> */}
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-4" />
          <CarouselNext className="right-4" />
        </Carousel>
      </section>

    </div>
  )
}
