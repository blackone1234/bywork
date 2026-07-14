/** S15(마이페이지) 아바타 — 이니셜 한 글자를 담는 원. */
export function MobileAvatar({ initial, size = 80 }: { initial: string; size?: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-[var(--mobile-radius-avatar)] border border-[var(--mobile-color-light-gray)] bg-[var(--mobile-color-avatar-bg)]"
      style={{ width: size, height: size }}
    >
      <span className="text-[length:var(--mobile-text-heading)] font-extrabold tracking-[var(--mobile-text-heading-tracking)] text-[var(--mobile-color-soft-gray)]">
        {initial}
      </span>
    </div>
  );
}
