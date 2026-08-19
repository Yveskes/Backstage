import Link from "next/link";
import { MediaLibrary } from "@/components/media-library";
import { PageHeader } from "@/components/page-header";
import { YearSwitcher } from "@/components/year-switcher";
import { parseFestivalYear } from "@/lib/festival-year";

type MediaVideoPageProps = {
  searchParams: Promise<{ jaar?: string | string[] }>;
};

export default async function MediaVideoPage({ searchParams }: MediaVideoPageProps) {
  const { jaar } = await searchParams;
  const year = parseFestivalYear(jaar);

  return (
    <>
      <p className="text-sm text-zinc-500">
        <Link href="/media" className="hover:text-zinc-800">
          Media
        </Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-800">Video</span>
      </p>

      <PageHeader
        title="Video"
        description="Video's per festivaljaar. Open groot om te bekijken of te downloaden."
        actions={<YearSwitcher year={year} hrefForYear={(nextYear) => `/media/video?jaar=${nextYear}`} />}
      />

      <MediaLibrary kind="video" year={year} />
    </>
  );
}
