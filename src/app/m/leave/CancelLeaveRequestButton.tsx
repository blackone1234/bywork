"use client";

import { useState, useTransition } from "react";
import { cancelLeaveRequestAction } from "./actions";

/**
 * S10/S12 취소 버튼 — canCancel(employeeLeaveRequests.ts)이 true인 행에만 부모가
 * 조건부로 렌더링한다(조건 미충족 시 숨김, CD 확정). Figma에 없는 신규 UI라 톤을
 * 낮춘 작은 텍스트 버튼(outline-warm 계열 색)으로 구현.
 *
 * useActionState + <form action> 선언적 방식을 안 쓴다 — 취소 성공 시 서버 액션의
 * revalidatePath가 이 행을 다시 그리는데, 그 시점에 canCancel이 false로 바뀌어
 * 부모(page.tsx)가 이 컴포넌트 자체를 트리에서 제거해버려서(A08 "확인완료"에서
 * 겪었던 것과 같은 unmount-kills-feedback 버그의 모바일 버전), useEffect로
 * state.success를 기다렸다가 alert를 띄우는 방식이 컴포넌트가 사라지는 타이밍과
 * 경쟁해서 실제 라이브 테스트에서 알럿이 아예 안 뜨는 것으로 확인됨(취소 자체는
 * 정상 반영됨 — 피드백만 유실). 서버 액션을 폼 바인딩 없이 직접 호출해서 await
 * 직후 같은 콜백 안에서 즉시 alert를 띄우면, React가 취소 결과로 트리를 다시
 * 그리기 전에 alert가 동기적으로 먼저 실행되므로 이 경쟁 자체가 사라진다.
 */
export function CancelLeaveRequestButton({ requestId, dateLabel }: { requestId: string; dateLabel: string }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!window.confirm("정말 취소하시겠습니까?")) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.set("requestId", requestId);
      const result = await cancelLeaveRequestAction({}, formData);

      if (result.success) {
        setError(null);
        window.alert(`${dateLabel} 연차신청이 취소되었습니다.`);
      } else {
        setError(result.error ?? "취소에 실패했습니다.");
      }
    });
  }

  return (
    <div className="flex flex-col items-start gap-[6px]">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="rounded-[8px] px-[12px] py-[6px] text-[length:var(--mobile-text-badge)] font-semibold tracking-[var(--mobile-text-badge-tracking)] text-[var(--mobile-color-warm-gray)] shadow-[inset_0_0_0_1px_var(--mobile-color-warm-gray)] disabled:opacity-50"
      >
        신청취소
      </button>
      {error ? (
        <p role="alert" className="text-[length:var(--mobile-text-caption)] tracking-[var(--mobile-text-caption-tracking)] text-[var(--mobile-color-notification)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
