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
 * 0에서 target까지 세는 카운트업 값을 반환한다. 마운트 시 1회만 재생하고, target이 바뀌어도
 * 재생하지 않는다(S13/S14는 실시간 갱신 요소가 없는 정적 집계 화면이라 이걸로 충분 — 그룹D
 * 확인 내용). prefers-reduced-motion이면 애니메이션 없이 바로 target을 반환한다.
 */
export function useCountUp(target: number, durationMs?: number): number {
  const [value, setValue] = useState(() => (prefersReducedMotion() ? target : 0));

  useEffect(() => {
    // 초기 state에서 이미 prefersReducedMotion()을 반영했다 — reduce면 target으로
    // 시작하므로 애니메이션 루프를 아예 안 돈다.
    if (prefersReducedMotion()) {
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
    // target/durationMs는 마운트 시점 값만 쓴다 — 정적 집계 화면이라 재생은 1회로 충분.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return value;
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
