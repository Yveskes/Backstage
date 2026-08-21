"use client";

type SaveBarProps = {
  dirty: boolean;
  saving: boolean;
  message?: string | null;
  error?: string | null;
  onSave: () => void;
  onReset?: () => void;
  /** Always show the Opslaan button, even when nothing changed yet. */
  alwaysShow?: boolean;
};

export function SaveBar({
  dirty,
  saving,
  message,
  error,
  onSave,
  onReset,
  alwaysShow = false,
}: SaveBarProps) {
  if (!alwaysShow && !dirty && !message && !error) {
    return null;
  }

  return (
    <div className="mt-5 flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={onSave}
        disabled={saving || (!dirty && alwaysShow && !error)}
        className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {saving ? "Opslaan..." : "Opslaan"}
      </button>
      {dirty && onReset ? (
        <button
          type="button"
          onClick={onReset}
          disabled={saving}
          className="rounded border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
        >
          Annuleren
        </button>
      ) : null}
      {dirty ? <p className="text-sm text-zinc-500">Niet opgeslagen.</p> : null}
      {message ? <p className="text-sm text-zinc-600">{message}</p> : null}
      {error ? (
        <p className="w-full rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">{error}</p>
      ) : null}
    </div>
  );
}
