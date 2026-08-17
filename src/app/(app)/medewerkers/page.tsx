import { PlaceholderPage } from "@/components/placeholder-page";
import { findNavItem } from "@/lib/navigation";

const item = findNavItem("/medewerkers");

export default function MedewerkersPage() {
  return (
    <PlaceholderPage
      title={item?.label ?? "Medewerkers"}
      description={item?.description ?? ""}
    />
  );
}
