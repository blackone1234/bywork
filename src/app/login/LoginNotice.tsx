"use client";

import { useSearchParams } from "next/navigation";

export function LoginNotice() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const message = searchParams.get("message");

  if (error) {
    return (
      <p role="alert" className="text-body font-semibold text-red-600">
        {error}
      </p>
    );
  }

  if (message) {
    return (
      <p role="status" className="text-body font-semibold text-sidebar-active">
        {message}
      </p>
    );
  }

  return null;
}
