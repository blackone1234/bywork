"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const MAX_DURATION_MS = 8000;
// 페이지 전환이 워낙 빨라서(프리페치된 라우트 등) 진행바가 뜨자마자 사라져 거의 안
// 보인다는 피드백 — 시작 후 최소 이만큼은 무조건 보이게 강제한다.
const MIN_VISIBLE_MS = 500;

/**
 * App Router엔 Pages Router의 Router.events 같은 전역 네비게이션 이벤트가 없다
 * (useLinkStatus는 <Link> 하나당 pending만 추적, 전역 신호 아님 — 문서 확인).
 * 내부(same-origin) <a> 클릭을 캡처 단계에서 감지해 "시작"으로, pathname/searchParams
 * 변경을 "완료"로 간주하는 방식으로 직접 구현한다.
 *
 * 알려진 범위 제한: <Link> 클릭 기반 내비게이션만 감지한다. 서버 액션 제출 후 redirect()
 * (로그인 성공 등)는 폼 제출 자체가 안 잡히므로 진행바가 안 뜬다 — 이번 범위 밖.
 */
function ProgressBarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState(false);
  // trickle/safety 타이머를 클릭 리스너(시작)와 pathname 감시(완료) 두 이펙트가
  // 공유해야 해서 ref로 뺀다 — 안 그러면 완료 처리 쪽에서 시작 쪽이 돌려둔 인터벌을
  // 못 지워서, 진행바를 0%로 되돌린 직후 트리클이 계속 값을 올리는 버그가 생긴다.
  const trickleTimer = useRef<number | null>(null);
  const safetyTimer = useRef<number | null>(null);
  const minVisibleTimer = useRef<number | null>(null);
  const startedAt = useRef<number>(0);

  function clearTimers() {
    if (trickleTimer.current) window.clearInterval(trickleTimer.current);
    if (safetyTimer.current) window.clearTimeout(safetyTimer.current);
    if (minVisibleTimer.current) window.clearTimeout(minVisibleTimer.current);
    trickleTimer.current = null;
    safetyTimer.current = null;
    minVisibleTimer.current = null;
  }

  function finish() {
    if (trickleTimer.current) window.clearInterval(trickleTimer.current);
    if (safetyTimer.current) window.clearTimeout(safetyTimer.current);
    trickleTimer.current = null;
    safetyTimer.current = null;

    const elapsed = Date.now() - startedAt.current;
    const remaining = Math.max(MIN_VISIBLE_MS - elapsed, 0);

    minVisibleTimer.current = window.setTimeout(() => {
      setWidth(100);
      window.setTimeout(() => {
        setVisible(false);
        setWidth(0);
      }, 200);
    }, remaining);
  }

  useEffect(() => {
    function start() {
      setVisible(true);
      setWidth(15);
      clearTimers();
      startedAt.current = Date.now();
      // 트리클(trickle) — 목표에 점점 느려지며 다가가되 100%까지는 절대 안 채운다
      // (실제 완료는 pathname/searchParams 변경으로만 판단).
      trickleTimer.current = window.setInterval(() => {
        setWidth((current) => (current < 80 ? current + (80 - current) * 0.1 : current));
      }, 200);
      safetyTimer.current = window.setTimeout(finish, MAX_DURATION_MS);
    }

    function handleClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as HTMLElement | null)?.closest("a");
      if (!anchor) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;

      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;

      start();
    }

    document.addEventListener("click", handleClick, true);
    return () => {
      document.removeEventListener("click", handleClick, true);
      clearTimers();
    };
  }, []);

  useEffect(() => {
    // pathname/searchParams가 바뀌었다 = 네비게이션이 실제로 끝났다. 최초 마운트
    // 시에는 width가 이미 0이라 무해하다. finish()가 이제 setTimeout 안에서만
    // setState하므로(MIN_VISIBLE_MS 대기) set-state-in-effect 룰에 안 걸린다.
    // width는 의도적으로 deps에서 뺀다 — trickle 애니메이션 중에도 width가 계속
    // 바뀌는데, 그때마다 이 이펙트가 재실행되면 pathname이 그대로인데도 finish()가
    // 잘못 호출된다(이 이펙트는 오직 실제 경로 변경에만 반응해야 한다).
    if (width > 0) {
      finish();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  return <div className="nav-progress-bar" style={{ width: `${width}%`, opacity: visible ? 1 : 0 }} aria-hidden />;
}

export function NavigationProgressBar() {
  return (
    <Suspense fallback={null}>
      <ProgressBarInner />
    </Suspense>
  );
}
