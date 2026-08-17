import { PlaceholderPage } from "@/components/placeholder-page";
import { findNavItem } from "@/lib/navigation";

const item = findNavItem("/social");

export default function SocialPage() {
  return (
    <PlaceholderPage
      title={item?.label ?? "Social media"}
      description={item?.description ?? ""}
    />
  );
}
