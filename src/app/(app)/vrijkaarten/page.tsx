import { PlaceholderPage } from "@/components/placeholder-page";
import { findNavItem } from "@/lib/navigation";

const item = findNavItem("/vrijkaarten");

export default function VrijkaartenPage() {
  return (
    <PlaceholderPage
      title={item?.label ?? "Vrijkaarten"}
      description={item?.description ?? ""}
    />
  );
}
