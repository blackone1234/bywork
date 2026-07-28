import { Loader } from "@/components/shared/Loader";

// (admin) 하위 라우트 전체에 자동 적용된다 — loading.tsx는 같은 세그먼트의
// layout.tsx(사이드바/GNB)는 감싸지 않고 그 안의 page.tsx만 감싸므로, 전환 중에도
// 사이드바는 그대로 유지되고 콘텐츠 영역만 이 로더로 바뀐다(Next.js 문서 확인).
export default function AdminLoading() {
  return <Loader />;
}
