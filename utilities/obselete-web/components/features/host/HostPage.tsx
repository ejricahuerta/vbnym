import { HostStepperClient } from "@/components/features/host/HostStepperClient";
import { SixBackPageShell } from "@/components/shared/SixBackPageShell";
import { createClient } from "@/lib/supabase/server";

export async function HostPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <SixBackPageShell
      title="Host your game"
      subtitle="Four-section host flow with Type → Details → Payment → Publish."
    >
      <HostStepperClient signedIn={Boolean(user)} />
    </SixBackPageShell>
  );
}
