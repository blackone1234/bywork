import { notFound } from "next/navigation";

/**
 * /m/* 중 어떤 명시적 라우트에도 안 걸리는 경로를 전부 잡아서 notFound()를 던진다.
 * 이렇게 명시적으로 던져야 가장 가까운 not-found.tsx(src/app/m/not-found.tsx)가
 * 적용된다 — 진짜 "URL이 아예 안 매치되는" 404는 nested not-found.tsx가 아니라
 * 항상 루트 not-found.tsx로 간다는 걸 실측으로 확인한 뒤 이 방식으로 우회했다
 * (node_modules/next/dist/docs/.../not-found.md: "root app/not-found.js...
 * handle any unmatched URLs" — nested는 명시적 notFound() 호출에만 적용).
 */
export default function MobileCatchAll() {
  notFound();
}
