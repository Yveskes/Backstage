import { PlaceholderPage } from "@/components/placeholder-page";
import { findNavItem } from "@/lib/navigation";

const item = findNavItem("/sponsors");

export default function SponsorsPage() {
  return (
    <PlaceholderPage
      title={item?.label ?? "Sponsors"}
      description={item?.description ?? ""}
    />
  );
}
