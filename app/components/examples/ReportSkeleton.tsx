// Placeholder report page: the outline of a dashboard with no data in it.
// Fluid, so it fills whatever 16:9 box it is given. Shown behind the gate.

const bars = [38, 52, 46, 61, 57, 70, 66, 78, 74, 88, 83, 95];

export default function ReportSkeleton() {
  return (
    <div aria-hidden className="@container h-full w-full">
      <div className="flex h-full w-full flex-col gap-[2.5cqw] bg-[#F6F3EE] p-[2.5cqw] text-[1.25cqw]">
        <div className="flex items-center justify-between">
          <div className="h-[0.9em] w-[28%] rounded-sm bg-[#1d1b1a]/80" />
          <div className="h-[0.7em] w-[14%] rounded-sm bg-[#1d1b1a]/15" />
        </div>
        <div className="grid grid-cols-4 gap-[2%]">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col gap-[0.5em] rounded-md bg-white p-[6%]">
              <div className="h-[0.5em] w-1/2 rounded-sm bg-[#1d1b1a]/15" />
              <div className={`h-[1.2em] w-3/4 rounded-sm ${i === 0 ? "bg-[#7a1f2e]/70" : "bg-[#1d1b1a]/70"}`} />
              <div className="h-[0.5em] w-1/3 rounded-sm bg-[#1d1b1a]/10" />
            </div>
          ))}
        </div>
        <div className="grid min-h-0 flex-1 grid-cols-[1.6fr_1fr] gap-[2%]">
          <div className="flex flex-col gap-[4%] rounded-md bg-white p-[3%]">
            <div className="h-[0.6em] w-1/3 rounded-sm bg-[#1d1b1a]/20" />
            <div className="flex flex-1 items-end gap-[2.5%]">
              {bars.map((h, i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-t-sm ${i === bars.length - 1 ? "bg-[#7a1f2e]/75" : "bg-[#1d1b1a]/20"}`}
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-[6%] rounded-md bg-white p-[5%]">
            <div className="h-[0.6em] w-1/2 rounded-sm bg-[#1d1b1a]/20" />
            {[92, 80, 71, 64, 55, 47, 40].map((w, i) => (
              <div key={i} className="flex items-center gap-[4%]">
                <div className="h-[0.5em] w-[28%] rounded-sm bg-[#1d1b1a]/15" />
                <div className="h-[0.7em] rounded-sm bg-[#1d1b1a]/25" style={{ width: `${w * 0.6}%` }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
