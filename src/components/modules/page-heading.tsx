export function PageHeading({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-5">
      <h1 className="font-display text-2xl font-semibold text-white">{title}</h1>
      {description ? <p className="mt-1 text-sm text-slate-300">{description}</p> : null}
    </div>
  );
}
