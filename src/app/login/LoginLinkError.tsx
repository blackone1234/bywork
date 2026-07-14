"use client";

import { useSearchParams } from "next/navigation";

/** /auth/confirm 같은 리다이렉트가 붙여주는 ?error=만 따로 읽는다 — useSearchParams는
 * Suspense 경계가 필요해서 폼 본체(useActionState)와 분리해뒀다. */
export function LoginLinkError() {
  const searchParams = useSearchParams();
  const linkError = searchParams.get("error");

  if (!linkError) return null;

  return (
    <p role="alert" className="text-body font-semibold text-red-600">
      {linkError}
    </p>
  );
}
