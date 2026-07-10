export function PageHeader({ breadcrumb }: { breadcrumb: string[] }) {
  return (
    <div className="flex w-full items-start px-4 pt-6 sm:px-8 lg:px-[60px] lg:pt-[50px]">
      <div className="flex w-full flex-wrap items-center justify-between gap-3 border-b-2 border-black pb-3 lg:border-b-3 lg:pb-[14px]">
        <div className="flex flex-wrap items-center gap-2 sm:gap-[20px]">
          {breadcrumb.map((segment, index) => {
            const isLast = index === breadcrumb.length - 1;
            return (
              <span key={segment} className="flex items-center gap-2 sm:gap-[20px]">
                {index > 0 ? <span className="text-[16px] text-line sm:text-[20px]">›</span> : null}
                <span
                  className={`text-[20px] font-extrabold tracking-[-0.4px] sm:text-[26px] sm:tracking-[-0.52px] lg:text-[32px] lg:tracking-[-0.64px] ${
                    isLast ? "text-black" : "text-line"
                  }`}
                >
                  {segment}
                </span>
              </span>
            );
          })}
        </div>

        <button
          type="button"
          className="flex items-center gap-[10px]"
          aria-label="관리자 계정 메뉴"
        >
          <span className="flex size-[36px] items-center justify-center rounded-full bg-avatar-bg text-[15px] font-bold text-avatar-text">
            A
          </span>
          <span className="text-muted">▾</span>
        </button>
      </div>
    </div>
  );
}
