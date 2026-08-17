import { PageHeader } from "@/components/page-header";
import { ProfileForm } from "@/components/profile-form";

export default function ProfielPage() {
  return (
    <>
      <PageHeader
        title="Mijn profiel"
        description="Pas je gegevens, profielfoto en wachtwoord aan."
      />
      <ProfileForm />
    </>
  );
}
