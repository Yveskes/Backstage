import { PlaceholderPage } from "@/components/placeholder-page";
import { findNavItem } from "@/lib/navigation";

const item = findNavItem("/instellingen");

export default function InstellingenPage() {
  return (
    <PlaceholderPage
      title={item?.label ?? "Instellingen"}
      description={item?.description ?? ""}
    />
  );
}
