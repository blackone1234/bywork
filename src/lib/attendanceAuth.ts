import "server-only";
import { headers } from "next/headers";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { AuthMethodDb } from "@/lib/employees";

export type AttendanceAuthResult =
  | { ok: true; method: "ip" | "gps" }
  | {
      ok: false;
      reason: "ip_mismatch" | "gps_out_of_range" | "no_coords" | "manual_approval_required";
    };

/**
 * Vercel 서버리스 환경에서 클라이언트 IP는 요청 객체가 아니라 x-forwarded-for 헤더로
 * 온다(첫 번째 값이 실제 클라이언트, 이후는 프록시 체인) — Vercel 공식 권장 방식.
 * 로컬 dev 서버는 이 헤더를 안 넣어서 null이 나오는 게 정상이다(IP 검증은 로컬에서
 * 직접 테스트하려면 헤더를 수동으로 주입해야 한다).
 */
async function getClientIp(): Promise<string | null> {
  const requestHeaders = await headers();
  const forwardedFor = requestHeaders.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]!.trim();
  }
  return requestHeaders.get("x-real-ip");
}

async function checkIp(): Promise<boolean> {
  const ip = await getClientIp();
  if (!ip) return false;

  const supabase = createSupabaseAdminClient();
  const { data } = await supabase.from("ip_whitelist").select("id").eq("ip_address", ip).maybeSingle();
  return !!data;
}

/** 두 좌표 사이 거리(m) — 지구를 구로 근사하는 haversine 공식. */
function haversineDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const EARTH_RADIUS_M = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_M * c;
}

async function checkGps(lat: number, lng: number): Promise<boolean> {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("company_settings")
    .select("gps_latitude, gps_longitude, gps_radius_m")
    .eq("id", 1)
    .single();

  if (data?.gps_latitude == null || data?.gps_longitude == null || data?.gps_radius_m == null) {
    return false;
  }

  const distance = haversineDistanceMeters(lat, lng, data.gps_latitude, data.gps_longitude);
  return distance <= data.gps_radius_m;
}

/**
 * byWORK_관리자웹_최종개발명세서.md:63 원문 인용: "IP 1차 + GPS 2차 + 관리자 수동 승인
 * 폴백" 로직. hybrid는 IP를 먼저 검사하고 실패하면 GPS를 검사하는 순차 폴백이다 —
 * 단순 AND(둘 다 필요)도 아니고 순서 없는 OR도 아니다.
 *
 * "관리자 수동 승인 폴백"과 auth_method='manual_approval'은 이번 그룹(B) 범위에서
 * 완전히 제외하기로 확인받았다 — attendance_status에 승인대기 상태가 없고 관리자 쪽
 * 승인 큐/버튼 UI가 전혀 없어서, 새 UI+스키마가 필요한 별도 규모의 작업이기 때문이다.
 * 그래서 hybrid에서 IP/GPS 둘 다 실패하거나 auth_method가 애초에 manual_approval이면
 * manual_approval_required를 반환하고, 호출부는 이 경우 attendance_records에 아무것도
 * 쓰지 않고 안내 메시지만 보여준다.
 */
export async function verifyAttendanceAuth(
  authMethod: AuthMethodDb,
  coords: { lat: number; lng: number } | null,
): Promise<AttendanceAuthResult> {
  if (authMethod === "manual_approval") {
    return { ok: false, reason: "manual_approval_required" };
  }

  if (authMethod === "ip_only") {
    return (await checkIp()) ? { ok: true, method: "ip" } : { ok: false, reason: "ip_mismatch" };
  }

  if (authMethod === "gps_only") {
    if (!coords) return { ok: false, reason: "no_coords" };
    return (await checkGps(coords.lat, coords.lng))
      ? { ok: true, method: "gps" }
      : { ok: false, reason: "gps_out_of_range" };
  }

  // hybrid: IP 1차 → 실패 시 GPS 2차 → 그것도 실패하면 관리자 수동승인 폴백(이번 그룹 범위 밖).
  if (await checkIp()) {
    return { ok: true, method: "ip" };
  }
  if (coords && (await checkGps(coords.lat, coords.lng))) {
    return { ok: true, method: "gps" };
  }
  return { ok: false, reason: "manual_approval_required" };
}
