"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Boxes, CheckCircle2, PackageSearch } from "lucide-react";

type BhpOption = {
  id: string;
  kode_barang: string;
  nama_barang: string;
  satuan: string;
  stok_saat_ini: number;
};

export default function PengambilanBarangPage() {
  const supabase = createClient();
  const [items, setItems] = useState<BhpOption[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);

  const [bhpId, setBhpId] = useState("");
  const [jumlah, setJumlah] = useState("");
  const [nama, setNama] = useState("");
  const [bidang, setBidang] = useState("");
  const [keperluan, setKeperluan] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.rpc("list_bhp_untuk_pengambilan");
      if (!error && data) setItems(data);
      setLoadingItems(false);
    }
    load();
  }, []);

  const selected = items.find((i) => i.id === bhpId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!bhpId || !jumlah || !nama || !bidang || !keperluan) {
      setError("Semua field wajib diisi.");
      return;
    }

    setSubmitting(true);
    const { data, error } = await supabase.rpc("catat_pengambilan_bhp", {
      p_bhp_id: bhpId,
      p_jumlah: Number(jumlah),
      p_nama_pemohon: nama,
      p_bidang_pemohon: bidang,
      p_keperluan: keperluan,
    });
    setSubmitting(false);

    if (error) {
      setError(error.message.replace(/^.*ERROR:\s*/i, ""));
      return;
    }

    setSuccess(
      `Berhasil mencatat pengambilan "${data.nama_barang}" sebanyak ${data.jumlah}.`
    );
    setBhpId("");
    setJumlah("");
    setNama("");
    setBidang("");
    setKeperluan("");

    // refresh daftar stok
    const { data: refreshed } = await supabase.rpc("list_bhp_untuk_pengambilan");
    if (refreshed) setItems(refreshed);
  }

  return (
    <main className="min-h-screen bg-canvas flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-2.5 mb-6 justify-center">
          <div className="w-9 h-9 rounded-lg bg-navy-700 flex items-center justify-center">
            <Boxes className="w-4.5 h-4.5 text-bronze-400" strokeWidth={2.5} />
          </div>
          <span className="font-display font-bold text-xl text-navy-700">SISTA</span>
        </div>

        <div className="bg-white rounded-xl border border-navy-100 p-6 sm:p-8">
          <h1 className="font-display font-bold text-xl text-navy-700 mb-1">
            Formulir Pengambilan Barang Persediaan
          </h1>
          <p className="text-navy-400 text-sm mb-6">
            Isi formulir ini setiap kali mengambil ATK, kertas, tinta printer, atau
            barang habis pakai lainnya. Data akan tercatat otomatis di kartu stok.
          </p>

          {success && (
            <div className="flex items-start gap-2 bg-good/10 text-good rounded-lg px-4 py-3 mb-4 text-sm">
              <CheckCircle2 className="w-4.5 h-4.5 shrink-0 mt-0.5" />
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1.5">
                Nama Barang
              </label>
              <select
                value={bhpId}
                onChange={(e) => setBhpId(e.target.value)}
                className="w-full rounded-lg border border-navy-100 px-3.5 py-2.5 text-navy-700 outline-none focus:border-bronze-400 focus:ring-2 focus:ring-bronze-400/20"
              >
                <option value="">
                  {loadingItems ? "Memuat daftar barang..." : "Pilih barang"}
                </option>
                {items.map((i) => (
                  <option key={i.id} value={i.id} disabled={i.stok_saat_ini <= 0}>
                    {i.nama_barang} — sisa stok {i.stok_saat_ini} {i.satuan}
                    {i.stok_saat_ini <= 0 ? " (stok kosong)" : ""}
                  </option>
                ))}
              </select>
              {selected && (
                <p className="text-xs text-navy-400 mt-1.5 flex items-center gap-1">
                  <PackageSearch className="w-3.5 h-3.5" />
                  Kode {selected.kode_barang} · satuan {selected.satuan}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1.5">
                Jumlah Diambil
              </label>
              <input
                type="number"
                min={1}
                step="any"
                value={jumlah}
                onChange={(e) => setJumlah(e.target.value)}
                className="w-full rounded-lg border border-navy-100 px-3.5 py-2.5 text-navy-700 outline-none focus:border-bronze-400 focus:ring-2 focus:ring-bronze-400/20"
                placeholder="contoh: 2"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1.5">
                  Nama Pemohon
                </label>
                <input
                  type="text"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  className="w-full rounded-lg border border-navy-100 px-3.5 py-2.5 text-navy-700 outline-none focus:border-bronze-400 focus:ring-2 focus:ring-bronze-400/20"
                  placeholder="Nama lengkap"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1.5">
                  Bidang/Unit
                </label>
                <input
                  type="text"
                  value={bidang}
                  onChange={(e) => setBidang(e.target.value)}
                  className="w-full rounded-lg border border-navy-100 px-3.5 py-2.5 text-navy-700 outline-none focus:border-bronze-400 focus:ring-2 focus:ring-bronze-400/20"
                  placeholder="contoh: Sekretariat"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1.5">
                Keperluan
              </label>
              <textarea
                value={keperluan}
                onChange={(e) => setKeperluan(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-navy-100 px-3.5 py-2.5 text-navy-700 outline-none focus:border-bronze-400 focus:ring-2 focus:ring-bronze-400/20"
                placeholder="contoh: keperluan surat menyurat bulan Juli"
              />
            </div>

            {error && (
              <p className="text-bad text-sm bg-bad/10 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-navy-700 text-white font-medium py-2.5 hover:bg-navy-600 transition disabled:opacity-60"
            >
              {submitting ? "Menyimpan..." : "Catat Pengambilan"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-navy-400 mt-4">
          Formulir ini tidak memerlukan login. Data tersimpan otomatis di sistem SISTA.
        </p>
      </div>
    </main>
  );
}
