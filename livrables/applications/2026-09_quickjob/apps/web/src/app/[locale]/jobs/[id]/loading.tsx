export default function JobDetailLoading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="h-5 w-32 animate-pulse rounded bg-neutral-200" />
      <div className="mt-4 rounded-xl border border-neutral-200 p-6">
        <div className="h-7 w-2/3 animate-pulse rounded bg-neutral-200" />
        <div className="mt-4 h-6 w-24 animate-pulse rounded-full bg-neutral-200" />
        <div className="mt-6 h-9 w-40 animate-pulse rounded bg-neutral-200" />
        <div className="mt-8 space-y-3">
          <div className="h-4 w-full animate-pulse rounded bg-neutral-200" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-neutral-200" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-neutral-200" />
        </div>
      </div>
    </div>
  );
}
