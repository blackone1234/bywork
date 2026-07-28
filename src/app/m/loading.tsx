import { Loader } from "@/components/shared/Loader";

// /m 하위 라우트 전체에 자동 적용된다(같은 원리, m/layout.tsx는 그대로 유지).
export default function MobileLoading() {
  return <Loader />;
}
