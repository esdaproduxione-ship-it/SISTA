import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase
      .from("app_users")
      .select("nama_lengkap, role, bidang")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  return (
    <div className="min-h-screen flex bg-canvas">
      <Sidebar role={profile?.role ?? "viewer"} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          nama={profile?.nama_lengkap ?? "Pengguna"}
          role={profile?.role ?? "viewer"}
        />
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
