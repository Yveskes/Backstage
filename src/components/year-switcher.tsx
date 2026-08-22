import Link from "next/link";
import { FESTIVAL_YEARS } from "@/lib/festival-year";
import { pillClass } from "@/lib/pills";

export function YearSwitcher({
  year,
  hrefForYear,
}: {
  year: number;
  hrefForYear: (year: number) => string;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {FESTIVAL_YEARS.map((entry) => (
        <Link
          key={entry}
          href={hrefForYear(entry)}
          className={pillClass(entry === year)}
        >
          {entry}
        </Link>
      ))}
    </div>
  );
}
