import { clearFitment, retreiveFitment } from "@/lib/data/fitments"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"
import { FitmentDialog } from "./fitment-dialog"

export default async function FitmentBadge({
  children,
  className,
}: {
  className?: string
  children?: React.ReactNode
}) {
  const fitment = await retreiveFitment()
  if (!fitment) {
    return <FitmentDialog>{children}</FitmentDialog>
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 border border-border text-xs font-semibold rounded-md",
        className
      )}
    >
      <span className="size-1.5 rounded-full bg-green-400 animate-pulse" />
      <span className="flex-1">
        {fitment.model.make.name} · {fitment.model.name} · {fitment.year_start}
      </span>

      <Button
        variant="ghost"
        size="icon"
        className="ml-2 size-2!"
        onClick={clearFitment}
      >
        <X className="" />
      </Button>
    </div>
  )
}
