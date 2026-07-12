"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, PackageSearch, ClipboardList } from "lucide-react";
import PublicFormShell from "@/components/PublicFormShell";

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

    const { data: refreshed } = await supabase.rpc("list_bhp_untuk_pengambilan");
    if (refreshed) setItems(refreshed);
  }

  return (
    <PublicFormShell
      icon={PackageSearch}
      eyebrow="Formulir Publik · Tanpa Login"
      title="Pengambilan Barang Persediaan"
      description="Isi formulir ini setiap kali mengambil ATK, kertas, tinta printer, atau barang habis pakai lainnya. Data akan tercatat otomatis di kartu stok."
      nomorFormulir="Kartu Stok Digital — Real-time"
      langkah={[
        {
          label: "Pilih barang & jumlah",
          desc: "Sisa stok ditampilkan langsung dari sistem.",
        },
        {
          label: "Isi data pemohon",
          desc: "Nama, bidang, dan keperluan pengambilan.",
        },
        {
          label: "Tercatat otomatis",
          desc: "Stok berkurang seketika, tanpa proses manual.",
        },
      ]}
    >
      <div className="rounded-xl border border-navy-100 bg-white p-6 sm:p-8">
        <div className="mb-6 flex items-center gap-2 text-navy-400">
          <ClipboardList className="h-4 w-4" />
          <span className="text-xs font-medium uppercase tracking-wide">
            Detail Pengambilan
          </span>
        </div>

        {success && (
          <div className="mb-5 flex items-start gap-2 rounded-lg bg-good/10 px-4 py-3 text-sm text-good">
            <CheckCircle2 className="mt-0.5 h-4.5 w-4.5 shrink-0" />
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy-700">
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
              <p className="mt-1.5 flex items-center gap-1 text-xs text-navy-400">
                <PackageSearch className="h-3.5 w-3.5" />
                Kode {selected.kode_barang} · satuan {selected.satuan}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy-700">
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
              <label className="mb-1.5 block text-sm font-medium text-navy-700">
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
              <label className="mb-1.5 block text-sm font-medium text-navy-700">
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
            <label className="mb-1.5 block text-sm font-medium text-navy-700">
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
            <p className="rounded-lg bg-bad/10 px-3 py-2 text-sm text-bad">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-navy-700 py-2.5 font-medium text-white transition hover:bg-navy-600 disabled:opacity-60"
          >
            {submitting ? "Menyimpan..." : "Catat Pengambilan"}
          </button>
        </form>
      </div>

      <p className="mt-4 text-center text-xs text-navy-400">
        Formulir ini tidak memerlukan login. Data tersimpan otomatis di sistem SISTA.
      </p>
    </PublicFormShell>
  );
}
