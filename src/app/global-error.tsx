"use client";

import "./globals.css";

/**
 * 루트 layout.tsx 자체가 렌더링 중 던지는 극히 드문 경우를 위한 최후의 fallback —
 * error.tsx는 "같은 세그먼트의 layout/template은 감싸지 않는다"(문서 확인, error.md)
 * 라서 루트 layout 자체의 에러는 error.tsx가 못 잡고 이 파일만 잡을 수 있다. 이
 * 파일이 활성화되면 루트 layout을 통째로 대체하므로 <html>/<body>와 글로벌
 * 스타일(globals.css)을 직접 import해야 한다(문서 명시).
 */
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="ko">
      <body className="flex min-h-screen w-full flex-col items-center justify-center gap-4 bg-white px-4 text-center">
        <p className="text-2xl font-bold text-black">문제가 발생했습니다</p>
        <p className="text-sm font-semibold text-gray-500">{error.message}</p>
        <button
          type="button"
          onClick={() => unstable_retry()}
          className="rounded-md bg-black px-6 py-3 text-sm font-semibold text-white"
        >
          다시 시도
        </button>
      </body>
    </html>
  );
}
