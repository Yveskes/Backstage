import { type ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
};

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">{description}</p>
        ) : null}
      </div>
      {actions}
    </header>
  );
}
