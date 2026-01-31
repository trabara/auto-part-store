import { Button } from "@/components/ui/button"
import { Field, FieldContent, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search } from "lucide-react"

export default function AdvancedSearch() {
  return (
    <form
      action="/search"
      method="GET"
      className="flex flex-col flex-1 justify-between"
    >
      <Tabs defaultValue="vin" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="model">Model</TabsTrigger>
          <TabsTrigger value="vin">VIN</TabsTrigger>
          <TabsTrigger value="plate">License Plate</TabsTrigger>
        </TabsList>
        <TabsContent value="model" className="mt-2">
          <div className="flex flex-col space-y-2">
            <Field>
              <FieldLabel>Manufacturer</FieldLabel>
              <FieldContent>
                <Select name="man" required>
                  <SelectTrigger className="w-full bg-white">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024">2024</SelectItem>
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel>Model</FieldLabel>
              <FieldContent>
                <Select name="model" required>
                  <SelectTrigger className="w-full bg-white">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024">2024</SelectItem>
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel>Year</FieldLabel>
              <FieldContent>
                <Select name="year" required>
                  <SelectTrigger className="w-full bg-white">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024">2024</SelectItem>
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>
          </div>
        </TabsContent>
        <TabsContent value="vin" className="mt-2">
          <Field>
            <FieldLabel>Enter Your VIN</FieldLabel>
            <FieldContent>
              <Input
                name="vin"
                type="text"
                placeholder="Vehicle Identification Number"
                className="bg-white"
                required
              />
            </FieldContent>
          </Field>
        </TabsContent>
        <TabsContent value="plate" className="mt-2">
          <Field>
            <FieldLabel>Enter Your License Plate</FieldLabel>
            <FieldContent>
              <Input
                name="plate"
                type="text"
                placeholder="License Plate Number"
                className="bg-white"
                required
              />
            </FieldContent>
          </Field>
        </TabsContent>
      </Tabs>

      <Button className="w-full mt-4" type="submit">
        Search Parts
        <Search />
      </Button>
    </form>
  )
}
