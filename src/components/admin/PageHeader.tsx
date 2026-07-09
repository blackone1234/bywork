export function PageHeader({ breadcrumb }: { breadcrumb: string[] }) {
  return (
    <div className="flex w-full items-start px-[60px] pt-[50px]">
      <div className="flex w-full items-center justify-between border-b-3 border-black pb-[14px]">
        <div className="flex items-center gap-[8px]">
          {breadcrumb.map((segment, index) => {
            const isLast = index === breadcrumb.length - 1;
            return (
              <span key={segment} className="flex items-center gap-[8px]">
                {index > 0 ? (
                  <span className="text-[20px] text-muted">›</span>
                ) : null}
                <span
                  className={
                    isLast
                      ? "text-[32px] font-extrabold tracking-[-0.64px] text-black"
                      : "text-[20px] font-semibold tracking-[-0.4px] text-muted"
                  }
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
