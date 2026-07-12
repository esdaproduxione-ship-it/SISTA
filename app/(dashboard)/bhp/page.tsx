import { createClient } from "@/lib/supabase/server";
import BhpTable from "@/components/BhpTable";

export default async function BhpPage() {
  const supabase = createClient();

  const { data: bhp } = await supabase
    .from("bhp")
    .select("id, kode_barang, nama_barang, kategori, satuan, stok_minimum, stok_saat_ini")
    .order("nama_barang", { ascending: true });

  const { data: role } = await supabase.rpc("fn_current_role");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-navy-700">Barang Habis Pakai</h1>
        <p className="text-navy-400 text-sm mt-1">
          Kartu stok otomatis — mutasi masuk/keluar langsung memperbarui sisa stok.
        </p>
      </div>

      <BhpTable initialData={bhp ?? []} canEdit={role === "admin" || role === "super_admin"} />
    </div>
  );
}
