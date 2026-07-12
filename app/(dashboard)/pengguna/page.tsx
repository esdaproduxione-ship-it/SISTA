import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const roleLabel: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  viewer: "Viewer",
};

export default async function PenggunaPage() {
  const supabase = createClient();
  const { data: role } = await supabase.rpc("fn_current_role");

  if (role !== "super_admin") {
    redirect("/dashboard");
  }

  const { data: users } = await supabase
    .from("app_users")
    .select("id, nama_lengkap, username, role, bidang, is_active")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-navy-700">Kelola Pengguna</h1>
        <p className="text-navy-400 text-sm mt-1">
          Tambah, ubah role, atau nonaktifkan akun pengguna aplikasi.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-navy-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy-50 text-navy-600 text-left">
              <th className="px-4 py-3 font-medium">Nama</th>
              <th className="px-4 py-3 font-medium">Username</th>
              <th className="px-4 py-3 font-medium">Bidang</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {(users ?? []).map((u) => (
              <tr key={u.id} className="border-t border-navy-100">
                <td className="px-4 py-3 font-medium text-navy-700">{u.nama_lengkap}</td>
                <td className="px-4 py-3 font-mono text-xs text-navy-600">{u.username}</td>
                <td className="px-4 py-3 text-navy-600">{u.bidang ?? "-"}</td>
                <td className="px-4 py-3 text-navy-600">{roleLabel[u.role]}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      u.is_active ? "bg-good/10 text-good" : "bg-bad/10 text-bad"
                    }`}
                  >
                    {u.is_active ? "Aktif" : "Nonaktif"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-navy-400">
        Catatan: penambahan pengguna baru memerlukan pembuatan akun di Supabase Auth
        terlebih dahulu (lewat dashboard Supabase atau fungsi admin API), lalu mengisi
        profil di tabel <code className="font-mono">app_users</code>.
      </p>
    </div>
  );
}
