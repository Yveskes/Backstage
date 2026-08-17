import { PlaceholderPage } from "@/components/placeholder-page";
import { findNavItem } from "@/lib/navigation";

const item = findNavItem("/facturen");

export default function FacturenPage() {
  return (
    <PlaceholderPage
      title={item?.label ?? "Facturen"}
      description={item?.description ?? ""}
    />
  );
}
