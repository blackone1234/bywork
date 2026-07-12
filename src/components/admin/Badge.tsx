export function Badge({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-sm px-[var(--space-12)] py-[var(--space-8)] text-badge font-semibold ${className}`}
    >
      {children}
    </span>
  );
}
