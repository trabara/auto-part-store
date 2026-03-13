import { Fitment } from "@/lib/types";
import { CarFront } from "lucide-react";
import AdvancedSearch from "./advanced-search";

export function FitmentCTA({ fitment }: { fitment: Fitment | null }) {
    return (
        <div className="flex flex-col lg:flex-row lg:items-start gap-10">
            {/* Left copy */}
            <div className="lg:w-80 shrink-0">
                <div className="flex items-center gap-2 mb-3">
                    <CarFront className="size-5 opacity-60" />
                    <span className="text-xs font-bold uppercase tracking-[0.25em] opacity-60">
                        My Garage
                    </span>
                </div>
                <p className="mt-0! text-3xl md:text-4xl font-extrabold uppercase tracking-tight leading-[1.05] mb-4 text-left">
                    Find Parts
                    <br />
                    For Your
                    <br />
                    Vehicle
                </p>
                <p
                    className="mt-0! text-sm leading-relaxed max-w-xs"
                    style={{ color: "rgba(255,255,255,0.6)" }}
                >
                    Select your make, model, and year to get an exact-fit parts list
                    for your car.
                </p>
                {fitment && (
                    <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 border border-white/20 text-xs font-semibold">
                        <span className="size-1.5 rounded-full bg-green-400 animate-pulse" />
                        {fitment.model.make.name} · {fitment.model.name} ·{" "}
                        {fitment.year_start}
                    </div>
                )}
            </div>

            {/* Right: search form — dark class forces dark-mode tokens on the tabs/inputs */}
            <div className="dark flex-1 bg-white/5 border border-white/10 p-6">
                <AdvancedSearch />
            </div>
        </div>
    );
}