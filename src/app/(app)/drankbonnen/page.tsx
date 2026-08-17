import { PlaceholderPage } from "@/components/placeholder-page";
import { findNavItem } from "@/lib/navigation";

const item = findNavItem("/drankbonnen");

export default function DrankbonnenPage() {
  return (
    <PlaceholderPage
      title={item?.label ?? "Drankbonnen"}
      description={item?.description ?? ""}
    />
  );
}
