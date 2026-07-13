import { PageHeader } from "@/components/admin/PageHeader";
import { getCompanySettings } from "@/lib/companySettings";
import { getLeavePolicy } from "@/lib/leavePolicies";
import { listIpWhitelist } from "@/lib/ipWhitelist";
import { WorkSettingsTabs } from "./WorkSettingsTabs";

export const dynamic = "force-dynamic";

export default async function WorkSettingsPage() {
  const [companySettings, policyType, ipWhitelist] = await Promise.all([
    getCompanySettings(),
    getLeavePolicy(),
    listIpWhitelist(),
  ]);

  return (
    <>
      <PageHeader breadcrumb={["Dashboard", "근무설정"]} />

      <div className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-8 lg:gap-[40px] lg:px-[60px] lg:pt-[50px] lg:pb-[20px]">
        <WorkSettingsTabs
          companySettings={companySettings}
          policyType={policyType}
          ipWhitelist={ipWhitelist}
        />
      </div>
    </>
  );
}
