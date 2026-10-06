"use client";

import { useEffect, useState } from "react";

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/** 값 크기에 비례해 살짝 길게 — 큰 숫자가 너무 빨리 휙 지나가지 않도록. */
function durationForTarget(target: number): number {
  if (target >= 1000) return 1200;
  if (target >= 100) return 1000;
  return 800;
}

/**
 * 0에서 target까지 세는 카운트업 값을 반환한다. target이 바뀔 때마다 다시 0에서
 * 재생한다 — S13/S14는 월 이동 시 서버 컴포넌트가 새 props만 내려주고 같은 위치의
 * 컴포넌트 인스턴스는 그대로 유지되므로(리마운트 아님), "마운트 시 1회만" 가정은
 * 월 페이저로 이동해도 값이 처음 본 달에 영구히 고정되는 버그였다(주별 근무시간은
 * useCountUp을 안 써서 매번 정상 반영되는 것과 비교해 발견). prefers-reduced-motion이면
 * 애니메이션 없이 바로 target을 반환한다.
 */
export function useCountUp(target: number, durationMs?: number): number {
  const reducedMotion = prefersReducedMotion();
  const [value, setValue] = useState(() => (reducedMotion ? target : 0));

  useEffect(() => {
    // reduce면 애니메이션 루프를 안 돌고, 아래 return문에서 target을 직접 반환한다
    // (setValue를 effect 본문에서 동기 호출하면 안 된다는 린트 규칙 때문에 여기선
    // state를 안 건드림).
    if (reducedMotion) {
      return;
    }

    const duration = durationMs ?? durationForTarget(target);
    const start = performance.now();
    let raf = 0;

    function tick(now: number) {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / duration);
      setValue(Math.round(target * easeOutCubic(t)));
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      }
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs, reducedMotion]);

  return reducedMotion ? target : value;
}

/**
 * 마운트 후 다음 프레임에 true로 바뀌는 플래그 — 막대그래프 채우기처럼 "0%로 렌더 후
 * CSS transition으로 실제값까지 채우기"를 트리거할 때 쓴다. prefers-reduced-motion이면
 * 처음부터 true(애니메이션 없이 바로 최종 상태).
 */
export function useMotionReveal(): boolean {
  const [revealed, setRevealed] = useState(() => prefersReducedMotion());

  useEffect(() => {
    // 초기 state에서 이미 반영됨 — reduce면 처음부터 true라 여기서 더 할 일이 없다.
    if (prefersReducedMotion()) {
      return;
    }
    const raf = requestAnimationFrame(() => setRevealed(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  return revealed;
}
