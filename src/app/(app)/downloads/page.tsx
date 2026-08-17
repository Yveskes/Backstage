import { PlaceholderPage } from "@/components/placeholder-page";
import { findNavItem } from "@/lib/navigation";

const item = findNavItem("/downloads");

export default function DownloadsPage() {
  return (
    <PlaceholderPage
      title={item?.label ?? "Downloads"}
      description={item?.description ?? ""}
    />
  );
}
