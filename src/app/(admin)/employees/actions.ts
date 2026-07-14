"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { authMethodToDb, findEmployeeByEmail, formatDateDot } from "@/lib/employees";
import { assertAdminRequest } from "@/lib/admin-guard";
import { getRequestOrigin } from "@/lib/origin";

export type RehireCandidate = {
  id: string;
  name: string;
  terminationDate: string;
};

export type FormActionState = { error?: string; rehireCandidate?: RehireCandidate };

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

  // 같은 이메일의 기존 레코드가 있으면 재직중/휴직중인지 퇴사한 직원인지에 따라 갈라진다 —
  // 퇴사자라면 새 auth 계정을 만들 필요가 없으므로(재입사 처리에서 기존 계정을 재사용한다)
  // Supabase Auth를 건드리기 전에 먼저 확인한다.
  const existing = await findEmployeeByEmail(email);
  if (existing) {
    if (existing.employmentStatus === "terminated") {
      return {
        rehireCandidate: {
          id: existing.id,
          name: existing.name,
          terminationDate: existing.terminationDate
            ? formatDateDot(existing.terminationDate)
            : "-",
        },
      };
    }
    return { error: "이미 등록된 이메일입니다." };
  }

  const supabase = createSupabaseAdminClient();

  // 1) Supabase Auth 계정을 먼저 만들면서 초대 메일을 발송한다.
  //    (등록 즉시 계정 생성 + 초대 메일 발송을 한 번에 처리 — 자세한 설계 이유는 대화 참고)
  const origin = await getRequestOrigin();
  const { data: invited, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
    email,
    { redirectTo: `${origin}/auth/confirm?next=/reset-password` },
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
  //    (계정만 만들어지고 인사 기록은 없는 상태로 남지 않도록). 위에서 이미 이메일 중복을
  //    확인했지만, 동시 요청 같은 경쟁 상태에 대비해 unique 제약 위반도 그대로 처리한다.
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

export async function rehireEmployee(employeeId: string, formData: FormData) {
  await assertAdminRequest();

  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const emailLocal = String(formData.get("emailLocal") ?? "").trim();
  const hireDate = String(formData.get("hireDate") ?? "").trim();

  if (!name || !emailLocal || !hireDate) {
    throw new Error("이름, 이메일, 입사일은 필수입니다.");
  }

  const email = `${emailLocal}@by-bk.com`;
  const supabase = createSupabaseAdminClient();

  // 기존 auth_user_id는 그대로 두고 인사 정보만 새 값으로 되돌린다. employment_status가
  // 여전히 'terminated'인 행만 매칭시켜, 다이얼로그가 떠 있는 동안 다른 관리자가 이미
  // 처리해버린 경우를 감지한다.
  const { data, error } = await supabase
    .from("employees")
    .update({
      name,
      phone: phone || null,
      hire_date: hireDate,
      employment_status: "active",
      termination_date: null,
    })
    .eq("id", employeeId)
    .eq("employment_status", "terminated")
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(`재입사 처리에 실패했습니다: ${error.message}`);
  }
  if (!data) {
    throw new Error("이미 다른 상태로 변경된 직원입니다. 목록을 새로고침해주세요.");
  }

  // A04의 "비밀번호 초기화 메일 발송"과 동일한 로직을 재사용해 자동으로 한 번 트리거한다.
  await sendPasswordResetEmail(email);

  revalidatePath("/employees");
  revalidatePath(`/employees/${employeeId}`);
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
  const origin = await getRequestOrigin();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/confirm?next=/reset-password`,
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
