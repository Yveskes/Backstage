import { ExpenseClaims } from "@/components/expense-claims";
import { PageHeader } from "@/components/page-header";
import { ProfileForm } from "@/components/profile-form";

export default function ProfielPage() {
  return (
    <>
      <PageHeader
        title="Mijn profiel"
        description="Pas je gegevens aan en dien onkosten in."
      />
      <div className="space-y-6">
        <ProfileForm />
        <ExpenseClaims />
      </div>
    </>
  );
}
