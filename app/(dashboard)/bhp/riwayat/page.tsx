import { createClient } from "@/lib/supabase/server";
import RiwayatBhpTable from "@/components/RiwayatBhpTable";

export default async function RiwayatBhpPage() {
  const supabase = createClient();

  const { data: riwayat } = await supabase
    .from("v_mutasi_bhp_detail")
    .select("*")
    .order("tanggal", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-navy-700">
          Riwayat Pengambilan &amp; Mutasi Barang
        </h1>
        <p className="text-navy-400 text-sm mt-1">
          Seluruh transaksi barang masuk/keluar, termasuk yang dicatat lewat formulir publik.
        </p>
      </div>

      <RiwayatBhpTable initialData={riwayat ?? []} />
    </div>
  );
}
