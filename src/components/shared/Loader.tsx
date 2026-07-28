/**
 * loading.tsx(라우트 전환 스켈레톤) 전용 로더 — 관리자/모바일 공용.
 * 마크업/애니메이션/색상은 사용자가 준 원본(Uiverse.io by Nawsome,
 * https://uiverse.io/Nawsome/young-goat-78) 그대로(globals.css의 .shared-loader-ring*
 * 참고). MIT 라이선스 전문은 /public/licenses/nawsome-loader-LICENSE.txt 참고.
 * 화면 중앙에 오도록 min-h-screen으로 세로 중앙 정렬.
 */
export function Loader() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center">
      {/* 기존 120px의 70% 크기로 축소(사용자 요청) — viewBox는 그대로라 링 굵기/비율은 유지된다. */}
      <svg width="84" height="84" viewBox="0 0 240 240" role="status" aria-label="로딩 중">
        <circle
          className="shared-loader-ring shared-loader-ring--a"
          cx="120"
          cy="120"
          r="105"
          fill="none"
          stroke="#000"
          strokeWidth="20"
          strokeDasharray="0 660"
          strokeDashoffset="-330"
          strokeLinecap="round"
        />
        <circle
          className="shared-loader-ring shared-loader-ring--b"
          cx="120"
          cy="120"
          r="35"
          fill="none"
          stroke="#000"
          strokeWidth="20"
          strokeDasharray="0 220"
          strokeDashoffset="-110"
          strokeLinecap="round"
        />
        <circle
          className="shared-loader-ring shared-loader-ring--c"
          cx="85"
          cy="120"
          r="70"
          fill="none"
          stroke="#000"
          strokeWidth="20"
          strokeDasharray="0 440"
          strokeLinecap="round"
        />
        <circle
          className="shared-loader-ring shared-loader-ring--d"
          cx="155"
          cy="120"
          r="70"
          fill="none"
          stroke="#000"
          strokeWidth="20"
          strokeDasharray="0 440"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
