import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { assertAdminRequest } from "@/lib/admin-guard";

export type IpWhitelistEntry = {
  id: string;
  ipAddress: string;
  label: string;
};

export async function listIpWhitelist(): Promise<IpWhitelistEntry[]> {
  await assertAdminRequest();

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("ip_whitelist")
    .select("id, ip_address, label")
    .order("created_at", { ascending: true });

  if (error) throw new Error(`IP 화이트리스트를 불러오지 못했습니다: ${error.message}`);

  return (data ?? []).map((row) => ({
    id: row.id,
    ipAddress: row.ip_address,
    label: row.label ?? "",
  }));
}

export async function addIpWhitelistEntry(ipAddress: string, label: string) {
  await assertAdminRequest();

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("ip_whitelist")
    .insert({ ip_address: ipAddress, label: label || null });

  if (error) {
    throw new Error(
      error.code === "23505"
        ? "이미 등록된 IP입니다."
        : `IP 추가에 실패했습니다: ${error.message}`,
    );
  }
}

export async function deleteIpWhitelistEntry(id: string) {
  await assertAdminRequest();

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("ip_whitelist").delete().eq("id", id);

  if (error) throw new Error(`IP 삭제에 실패했습니다: ${error.message}`);
}
