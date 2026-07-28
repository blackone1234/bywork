import { PageHeader } from "@/components/admin/PageHeader";

function SkeletonBlock({ className }: { className: string }) {
  // bg-divider(#c7c7c7) — 페이지 배경(bg-page, #f8f9fb)과 색이 같으면 테두리 없는
  // 블록(배너/테이블 행)은 아예 안 보이는 버그가 실측(스크린샷)으로 확인돼 색을 분리함.
  return <div className={`animate-pulse rounded-[10px] bg-divider ${className}`} />;
}

/** A01 최초 구현(정적 목업)에는 로딩 개념이 없었다 — 실쿼리로 바뀌면서 신규 추가.
 * 레이아웃은 실제 화면과 동일한 형태(카드 5개/배너 1줄/테이블)로 채워서, 데이터가
 * 오는 순간 레이아웃이 덜컹거리며 바뀌지 않게 한다. */
export default function DashboardLoading() {
  return (
    <>
      <PageHeader breadcrumb={[{ label: "Dashboard", href: "/dashboard" }]} />

      <div className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-8 lg:gap-[40px] lg:px-[60px] lg:pt-[50px] lg:pb-[20px]">
        <div className="grid w-full grid-cols-2 gap-[10px] sm:grid-cols-3 lg:flex lg:items-start">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-[92px] flex-1" />
          ))}
        </div>

        <SkeletonBlock className="h-[52px] w-full" />

        <div className="flex w-full flex-col gap-[36px]">
          <SkeletonBlock className="mx-auto h-[22px] w-[200px]" />
          <div className="flex w-full flex-col gap-[12px]">
            <SkeletonBlock className="h-[36px] w-full" />
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonBlock key={i} className="h-[38px] w-full" />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
