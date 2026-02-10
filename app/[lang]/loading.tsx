export default function LangLoading() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
      {/* Spinner - prominent on phone */}
      <div className="h-12 w-12 rounded-full border-2 border-zinc-200 border-t-black animate-spin md:h-10 md:w-10" />
      <p className="text-sm text-zinc-500">Loading…</p>
    </div>
  );
}
