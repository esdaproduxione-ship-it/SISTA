import { createClient } from "@/lib/supabase/server";
import AsetTable from "@/components/AsetTable";

export default async function AsetPage() {
  const supabase = createClient();

  const { data: aset } = await supabase
    .from("aset")
    .select(
      "id, nomor_register, nama_barang, merk_tipe, tahun_perolehan, nilai_perolehan, kondisi, status, sedang_dipinjam, kode_akun_bmd(kode, nama_klasifikasi), ruangan(nama_ruangan), penanggung_jawab"
    )
    .order("created_at", { ascending: false });

  const { data: role } = await supabase.rpc("fn_current_role");

  const asetFormatted = (aset ?? []).map((item: any) => ({
    ...item,
    kode_akun_bmd: Array.isArray(item.kode_akun_bmd)
      ? item.kode_akun_bmd[0] ?? null
      : item.kode_akun_bmd,
    ruangan: Array.isArray(item.ruangan) ? item.ruangan[0] ?? null : item.ruangan,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-navy-700">Aset Tetap</h1>
          <p className="text-navy-400 text-sm mt-1">
            Data barang modal, kondisi, penanggung jawab, dan riwayat pemeliharaan.
          </p>
        </div>
      </div>

      <AsetTable initialData={asetFormatted} canEdit={role === "admin" || role === "super_admin"} />
    </div>
  );
}
