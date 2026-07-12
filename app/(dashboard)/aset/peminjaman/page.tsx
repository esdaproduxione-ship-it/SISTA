import { createClient } from "@/lib/supabase/server";
import PeminjamanTable from "@/components/PeminjamanTable";

export default async function PeminjamanAsetPage() {
  const supabase = createClient();

  const { data: peminjaman } = await supabase
    .from("v_peminjaman_aset_detail")
    .select("*")
    .order("tanggal_pinjam", { ascending: false });

  const { data: role } = await supabase.rpc("fn_current_role");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-navy-700">Peminjaman Aset</h1>
        <p className="text-navy-400 text-sm mt-1">
          Pantau aset yang sedang dipinjam (internal maupun eksternal OPD) dan tandai saat sudah dikembalikan.
        </p>
      </div>

      <PeminjamanTable
        initialData={peminjaman ?? []}
        canEdit={role === "admin" || role === "super_admin"}
      />
    </div>
  );
}
