import { Button } from "@/components/ui/button";
import { clearFitment, retreiveFitment } from "@/lib/data/fitments";
import { CarFront, X } from "lucide-react";
import { FitmentDialog } from "./fitment-dialog";

export default async function FitmentBadge({ children }: { children: React.ReactNode }) {
    const currentFitment = await retreiveFitment()
    if (!currentFitment) {
        return <FitmentDialog>
            {children}
        </FitmentDialog>
    }

    return <div className="text-accent flex items-center space-x-2 border border-accent/20 rounded-md px-3 py-1">
        <CarFront className="mr-2" />
        <div>
            {currentFitment.year_start} - {currentFitment.year_end} {'>'} {currentFitment.model.make.name} {'>'} {currentFitment.model.name}
        </div>
        <Button variant='ghost' size="icon-xs" onClick={clearFitment}>
            <X />
        </Button>
    </div>
}