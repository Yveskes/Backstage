import { PlaceholderPage } from "@/components/placeholder-page";
import { findNavItem } from "@/lib/navigation";

const item = findNavItem("/documenten");

export default function DocumentenPage() {
  return (
    <PlaceholderPage
      title={item?.label ?? "Documenten"}
      description={item?.description ?? ""}
    />
  );
}
