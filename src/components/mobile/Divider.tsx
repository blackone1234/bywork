export function MobileDivider({ className = "" }: { className?: string }) {
  return <hr className={`w-full border-t border-[var(--mobile-color-light-gray)] ${className}`} />;
}
