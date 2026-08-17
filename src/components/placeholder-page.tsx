import { PageHeader } from "@/components/page-header";

type PlaceholderPageProps = {
  title: string;
  description: string;
};

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center">
        <p className="text-sm font-medium text-zinc-800">Nog in opbouw</p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
          Dit scherm is een placeholder. We vullen het later in met echte data en
          acties.
        </p>
      </div>
    </>
  );
}
