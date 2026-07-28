"use client";

import { useActionState, useEffect } from "react";
import { Button } from "@/components/admin/Button";
import { useToast } from "@/components/admin/ToastProvider";
import { refreshHolidays, type RefreshHolidaysState } from "./actions";

const INITIAL_STATE: RefreshHolidaysState = {};

export function RefreshHolidaysButton() {
  const [state, formAction, isPending] = useActionState(refreshHolidays, INITIAL_STATE);
  const { showToast } = useToast();

  useEffect(() => {
    if (state.success) {
      showToast("공휴일 데이터가 갱신되었습니다.");
    }
  }, [state, showToast]);

  return (
    <div className="flex flex-col items-end gap-2 self-start sm:self-auto">
      <form action={formAction}>
        <Button type="submit" disabled={isPending} className={isPending ? "cursor-not-allowed opacity-60" : ""}>
          {isPending ? (
            <span className="flex items-center gap-[8px]">
              <span
                aria-hidden
                className="size-[14px] animate-spin rounded-full border-2 border-current border-t-transparent"
              />
              갱신 중...
            </span>
          ) : (
            "공휴일 데이터 수동 갱신"
          )}
        </Button>
      </form>
      {/* 소요시간 안내 — 공공데이터포털 API를 12개월치 순차 호출(레이트리밋 회피, 기존
          설계)해서 실측 약 45초가 걸린다. 클릭 전에 미리 알 수 있도록 상시 노출. */}
      <p className="text-badge font-semibold text-muted">
        ※ 외부 API 특성상 갱신에 최대 1분 정도 소요될 수 있습니다.
      </p>
      {state.error ? (
        <p role="alert" className="text-body font-semibold text-red-600">
          {state.error}
        </p>
      ) : null}
    </div>
  );
}
