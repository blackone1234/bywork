import { Button } from "@/components/admin/Button";

/**
 * 전역 404 — 관리자 쪽(및 /login, /reset-password 등 /m 밖 전체)에서 존재하지 않는
 * 경로에 접속하거나 어느 세그먼트에서든 notFound()가 호출됐을 때 이 파일이 잡는다
 * (단, /m/* 은 src/app/m/not-found.tsx가 더 가까운 경계라 그쪽이 대신 처리한다).
 * Figma에 관리자용 404 디자인이 따로 없어서(E06은 모바일 전용) 기존 admin 에러 화면
 * (dashboard/error.tsx)과 톤을 맞춰 새로 구성 — 별도 확인 없이 직접 결정.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-[16px] bg-page px-4 py-6">
      <p className="text-heading font-bold text-black">페이지를 찾을 수 없습니다</p>
      <p className="text-body font-semibold text-muted">
        요청하신 페이지가 존재하지 않거나 삭제됐습니다.
      </p>
      <Button href="/dashboard" variant="primary">
        대시보드로 이동
      </Button>
    </div>
  );
}
