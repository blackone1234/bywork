"use client";

import { useEffect } from "react";

// body에 pinch-zoom 제스처를 막는 클래스를 건다 — /m/layout.tsx와 (admin)/layout.tsx
// 양쪽에서 렌더링된다(2026-07-23부터 관리자도 동일하게 잠금). viewport의
// userScalable:false만으로는 일부 브라우저가 완전히 존중하지 않는 경우가 있어, CSS
// touch-action으로 한 번 더 보강한다. 언마운트 시 클래스를 반드시 제거해서, 이 컴포넌트를
// 렌더링하지 않는 다른 세그먼트(/login, /reset-password, /forgot-password 등)에는
// 영향을 주지 않는다.
export function TouchActionLock() {
  useEffect(() => {
    document.body.classList.add("mobile-touch-lock");
    return () => {
      document.body.classList.remove("mobile-touch-lock");
    };
  }, []);

  return null;
}
