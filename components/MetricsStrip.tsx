type Metric = {
  value: string;
  label: string;
};

export function MetricsStrip({ items }: { items: Metric[] }) {
  return (
    <div className="grid grid-cols-1 divide-y divide-line rounded-2xl border border-line bg-white sm:grid-cols-3 sm:divide-y-0 sm:divide-x">
      {items.map((m) => (
        <div key={m.label} className="px-6 py-7 text-center sm:text-left">
          <div className="text-3xl font-semibold tracking-tight text-ink md:text-4xl">{m.value}</div>
          <p className="mt-2 text-sm text-muted">{m.label}</p>
        </div>
      ))}
    </div>
  );
}
