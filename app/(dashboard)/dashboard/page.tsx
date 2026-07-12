import { createClient } from "@/lib/supabase/server";
import { Package, CheckCircle2, AlertTriangle, XCircle, Boxes, TrendingDown } from "lucide-react";
import PublicFormLinks from "@/components/PublicFormLinks";

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

export default async function DashboardPage() {
  const supabase = createClient();

  const { data: aset } = await supabase.from("v_dashboard_aset").select("*").single();
  const { data: bhp } = await supabase.from("v_dashboard_bhp").select("*").single();

  const statAset = [
    {
      label: "Total Aset",
      value: aset?.total_aset ?? 0,
      icon: Package,
      tone: "navy",
      kode: "TOTAL.AST",
    },
    {
      label: "Kondisi Baik",
      value: aset?.jumlah_baik ?? 0,
      icon: CheckCircle2,
      tone: "good",
      kode: "STATUS.OK",
    },
    {
      label: "Rusak Ringan",
      value: aset?.jumlah_rusak_ringan ?? 0,
      icon: AlertTriangle,
      tone: "warn",
      kode: "STATUS.RR",
    },
    {
      label: "Rusak Berat",
      value: aset?.jumlah_rusak_berat ?? 0,
      icon: XCircle,
      tone: "bad",
      kode: "STATUS.RB",
    },
  ];

  const toneMap: Record<string, string> = {
    navy: "bg-navy-700 text-white",
    good: "bg-good text-white",
    warn: "bg-warn text-white",
    bad: "bg-bad text-white",
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display font-bold text-2xl text-navy-700">Ringkasan</h1>
        <p className="text-navy-400 text-sm mt-1">
          Kondisi aset dan persediaan barang habis pakai secara real-time.
        </p>
      </div>

      <PublicFormLinks />

      <section>
        <p className="font-mono text-xs text-navy-400 tracking-widest mb-3">ASET TETAP</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statAset.map((s) => (
            <div
              key={s.label}
              className={`tag-card p-5 ${toneMap[s.tone]} relative`}
            >
              <s.icon className="w-5 h-5 mb-3 opacity-90" strokeWidth={2} />
              <p className="font-display font-bold text-3xl leading-none">{s.value}</p>
              <p className="text-sm opacity-90 mt-1">{s.label}</p>
              <p className="font-mono text-[10px] opacity-60 mt-3 tracking-wider">{s.kode}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl border border-navy-100 p-5">
          <p className="font-mono text-xs text-navy-400 tracking-widest mb-1">NILAI TOTAL</p>
          <p className="font-display font-bold text-3xl text-navy-700">
            {formatRupiah(aset?.total_nilai_aset ?? 0)}
          </p>
          <p className="text-sm text-navy-400 mt-1">Total nilai perolehan seluruh aset aktif</p>
        </div>

        <div className="bg-white rounded-xl border border-navy-100 p-5">
          <p className="font-mono text-xs text-navy-400 tracking-widest mb-1">BARANG HABIS PAKAI</p>
          <div className="flex items-center gap-3 mt-2">
            <div className="w-10 h-10 rounded-lg bg-navy-50 flex items-center justify-center">
              <Boxes className="w-5 h-5 text-navy-700" />
            </div>
            <div>
              <p className="font-display font-bold text-xl text-navy-700">
                {bhp?.total_jenis_barang ?? 0} jenis
              </p>
              <p className="text-xs text-navy-400">tercatat dalam sistem</p>
            </div>
          </div>
          {(bhp?.jumlah_stok_menipis ?? 0) > 0 && (
            <div className="flex items-center gap-2 mt-3 text-warn bg-warn/10 rounded-lg px-3 py-2 text-sm">
              <TrendingDown className="w-4 h-4" />
              {bhp?.jumlah_stok_menipis} jenis barang stoknya menipis
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
