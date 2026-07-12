import { createClient } from "@/lib/supabase/server";
import LaporanClient from "@/components/LaporanClient";

export default async function LaporanPage() {
  const supabase = createClient();

  const { data: mutasi } = await supabase
    .from("v_mutasi_bhp_detail")
    .select("*")
    .order("tanggal", { ascending: true });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-navy-700">Laporan Rekap Periodik</h1>
        <p className="text-navy-400 text-sm mt-1">
          Rekap barang masuk/keluar per periode — mingguan, bulanan, triwulanan, atau semesteran.
        </p>
      </div>

      <LaporanClient data={mutasi ?? []} />
    </div>
  );
}
