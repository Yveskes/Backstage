import Link from "next/link";
import { FESTIVAL_YEARS } from "@/lib/festival-year";

export function YearSwitcher({
  year,
  hrefForYear,
}: {
  year: number;
  hrefForYear: (year: number) => string;
}) {
  return (
    <div className="flex rounded-lg border border-zinc-200 bg-white p-1">
      {FESTIVAL_YEARS.map((entry) => (
        <Link
          key={entry}
          href={hrefForYear(entry)}
          className={`rounded-md px-3 py-1.5 text-sm ${
            entry === year ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-50"
          }`}
        >
          {entry}
        </Link>
      ))}
    </div>
  );
}
