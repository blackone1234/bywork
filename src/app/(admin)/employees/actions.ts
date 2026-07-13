"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { authMethodToDb } from "@/lib/employees";
import { assertAdminRequest } from "@/lib/admin-guard";

async function getOrigin() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
  return `${protocol}://${host}`;
}

export type FormActionState = { error?: string };

export async function createEmployee(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  await assertAdminRequest();

  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const emailLocal = String(formData.get("emailLocal") ?? "").trim();
  const hireDate = String(formData.get("hireDate") ?? "").trim();

  if (!name || !emailLocal || !hireDate) {
    return { error: "이름, 이메일, 입사일은 필수입니다." };
  }

  const email = `${emailLocal}@by-bk.com`;
  const supabase = createSupabaseAdminClient();

  // 1) Supabase Auth 계정을 먼저 만들면서 초대 메일을 발송한다.
  //    (등록 즉시 계정 생성 + 초대 메일 발송을 한 번에 처리 — 자세한 설계 이유는 대화 참고)
  const origin = await getOrigin();
  const { data: invited, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
    email,
    { redirectTo: `${origin}/reset-password` },
  );

  if (inviteError || !invited?.user) {
    const alreadyExists = inviteError?.code === "email_exists";
    return {
      error: alreadyExists
        ? "이미 가입된 이메일입니다."
        : `계정 초대 메일 발송에 실패했습니다: ${inviteError?.message ?? "알 수 없는 오류"}`,
    };
  }

  // 2) employees 행을 auth_user_id와 함께 저장한다. 실패하면 방금 만든 auth 계정을 되돌린다
  //    (계정만 만들어지고 인사 기록은 없는 상태로 남지 않도록).
  const { error: insertError } = await supabase.from("employees").insert({
    name,
    email,
    phone: phone || null,
    hire_date: hireDate,
    auth_user_id: invited.user.id,
  });

  if (insertError) {
    await supabase.auth.admin.deleteUser(invited.user.id);
    return {
      error: insertError.code === "23505"
        ? "이미 등록된 이메일입니다."
        : `직원 저장에 실패했습니다: ${insertError.message}`,
    };
  }

  revalidatePath("/employees");
  redirect("/employees");
}

export async function updateEmployeeAuthMethod(employeeId: string, formData: FormData) {
  await assertAdminRequest();

  const authMethod = String(formData.get("authMethod") ?? "");
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase
    .from("employees")
    .update({ auth_method: authMethodToDb(authMethod) })
    .eq("id", employeeId);

  if (error) {
    throw new Error(`직원 정보 저장에 실패했습니다: ${error.message}`);
  }

  revalidatePath(`/employees/${employeeId}`);
  redirect(`/employees/${employeeId}`);
}

export async function sendPasswordResetEmail(email: string) {
  await assertAdminRequest();

  const supabase = createSupabaseAdminClient();
  const origin = await getOrigin();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/reset-password`,
  });

  if (error) {
    throw new Error(`비밀번호 초기화 메일 발송에 실패했습니다: ${error.message}`);
  }
}

export async function terminateEmployee(employeeId: string) {
  await assertAdminRequest();

  const supabase = createSupabaseAdminClient();

  const { error } = await supabase
    .from("employees")
    .update({
      employment_status: "terminated",
      termination_date: new Date().toISOString().slice(0, 10),
    })
    .eq("id", employeeId);

  if (error) {
    throw new Error(`퇴사 처리에 실패했습니다: ${error.message}`);
  }

  revalidatePath("/employees");
  revalidatePath(`/employees/${employeeId}`);
  redirect("/employees");
}
