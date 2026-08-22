export function pillClass(selected: boolean) {
  return `inline-flex items-center gap-1.5 rounded-[4px] border px-2 py-0.5 text-xs ${
    selected
      ? "border-emerald-400 bg-emerald-200 font-medium text-emerald-950"
      : "border-zinc-300 bg-white text-zinc-600 hover:bg-zinc-50"
  } disabled:cursor-not-allowed disabled:opacity-60`;
}
