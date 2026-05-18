type RideRouteSummaryProps = {
  pickupLabel: string;
  dropLabel: string;
  compact?: boolean;
};

export function RideRouteSummary({
  pickupLabel,
  dropLabel,
  compact = false,
}: RideRouteSummaryProps) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center pt-1" aria-hidden>
        <span className="h-3 w-3 rounded-full bg-brand ring-4 ring-brand/15" />
        <span className="my-1 min-h-[1.25rem] w-0 flex-1 border-l-2 border-dashed border-border" />
        <span className="text-lg leading-none">🚗</span>
        <span className="my-1 min-h-[1.25rem] w-0 flex-1 border-l-2 border-dashed border-border" />
        <span className="h-3 w-3 rounded-full bg-orange-500 ring-4 ring-orange-500/15" />
      </div>

      <div className={`min-w-0 flex-1 ${compact ? "space-y-2" : "space-y-4"}`}>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-subtle">Pickup</p>
          <p className={`font-semibold text-foreground ${compact ? "text-sm" : "text-base"}`}>
            {pickupLabel}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-subtle">Drop</p>
          <p className={`font-semibold text-foreground ${compact ? "text-sm" : "text-base"}`}>
            {dropLabel}
          </p>
        </div>
      </div>
    </div>
  );
}
