"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { ModalSuccessIcon } from "@/components/admin/ModalScreen";

const AUTO_DISMISS_MS = 2500;

type ToastEntry = { id: string; message: string };

type ToastContextValue = {
  showToast: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

/** 성공 토스트를 띄우고 싶은 컴포넌트는 이 훅 하나만 쓰면 된다 — 개별 컴포넌트가
 * 더 이상 자기만의 토스트 state/타이머를 갖지 않는다(전역 스택이 다 관리). */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast는 ToastProvider 내부에서만 사용할 수 있습니다.");
  }
  return ctx;
}

function ToastItem({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      role="status"
      className="toast-enter flex items-center gap-[12px] rounded-md border border-black bg-white px-[20px] py-[16px] shadow-[2px_4px_2px_rgba(0,0,0,0.2)]"
    >
      <ModalSuccessIcon />
      <p className="text-body font-semibold text-black">{message}</p>
    </div>
  );
}

/**
 * 전역 토스트 스택. A11 파일럿 때는 화면마다 로컬 state 하나(단일 <Toast>)뿐이라,
 * 폼 두 개를 2.5초 안에 연달아 저장하면 같은 자리에 토스트 두 개가 겹쳐 뜨는 문제가
 * 있었다(CLAUDE.md에 기록된 기존 한계) — A06(여러 행을 빠르게 연속 승인/반려)에서는
 * 이 상황이 훨씬 자주 나올 수 있어 배열 기반 스택으로 승격했다. `(admin)/layout.tsx`
 * 에서 한 번만 마운트해서 전체 관리자 화면이 이 스택 하나를 공유한다 — 화면별
 * 컴포넌트는 더 이상 자기 위치에 <Toast>를 직접 렌더링하지 않는다.
 *
 * 새 토스트는 배열 맨 앞에 추가한다 → top-right 앵커 기준으로 새 토스트가 모서리에
 * 더 가까운 상단에 나타나고, 기존 토스트들이 아래로 밀려나는 방향을 택했다 — 알림이
 * "지금 이 자리에서 막 도착했다"는 감각과 더 맞고, 반대로 아래에 추가하면 새 토스트가
 * 이미 쌓인 토스트들 밑에서 잘 안 보이는 위치에 나타나는 느낌이 들어서다.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);

  const showToast = useCallback((message: string) => {
    const id = crypto.randomUUID();
    setToasts((current) => [{ id, message }, ...current]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-[20px] right-[20px] z-50 flex flex-col gap-[12px]">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} message={toast.message} onDismiss={() => dismiss(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
