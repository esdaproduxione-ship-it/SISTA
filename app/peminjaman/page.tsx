"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Boxes, CheckCircle2, Tag } from "lucide-react";

type AsetOption = {
  id: string;
  kode_barang: string;
  nama_barang: string;
  kondisi: string;
};

export default function PeminjamanAsetPage() {
  const supabase = createClient();
  const [items, setItems] = useState<AsetOption[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);

  const [asetId, setAsetId] = useState("");
  const [jenisPeminjam, setJenisPeminjam] = useState<"Internal OPD" | "Eksternal OPD">(
    "Internal OPD"
  );
  const [nama, setNama] = useState("");
  const [unitAsal, setUnitAsal] = useState("");
  const [noHp, setNoHp] = useState("");
  const [keperluan, setKeperluan] = useState("");
  const [rencanaKembali, setRencanaKembali] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.rpc("list_aset_untuk_peminjaman");
      if (!error && data) setItems(data);
      setLoadingItems(false);
    }
    load();
  }, []);

  const selected = items.find((i) => i.id === asetId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!asetId || !nama || !unitAsal || !keperluan || !rencanaKembali) {
      setError("Semua field wajib diisi (kecuali No. HP).");
      return;
    }

    setSubmitting(true);
    const { data, error } = await supabase.rpc("ajukan_peminjaman_aset", {
      p_aset_id: asetId,
      p_jenis_peminjam: jenisPeminjam,
      p_nama_peminjam: nama,
      p_unit_asal: unitAsal,
      p_no_hp: noHp || null,
      p_keperluan: keperluan,
      p_rencana_kembali: rencanaKembali,
    });
    setSubmitting(false);

    if (error) {
      setError(error.message.replace(/^.*ERROR:\s*/i, ""));
      return;
    }

    setSuccess(`Peminjaman aset "${data.nama_barang}" berhasil dicatat.`);
    setAsetId("");
    setNama("");
    setUnitAsal("");
    setNoHp("");
    setKeperluan("");
    setRencanaKembali("");

    const { data: refreshed } = await supabase.rpc("list_aset_untuk_peminjaman");
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
            Formulir Peminjaman Aset
          </h1>
          <p className="text-navy-400 text-sm mb-6">
            Untuk peminjaman internal OPD maupun eksternal OPD. Aset yang sedang
            dipinjam tidak akan muncul di daftar sampai dikembalikan.
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
                Jenis Peminjam
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(["Internal OPD", "Eksternal OPD"] as const).map((j) => (
                  <button
                    type="button"
                    key={j}
                    onClick={() => setJenisPeminjam(j)}
                    className={`py-2.5 rounded-lg border text-sm font-medium transition ${
                      jenisPeminjam === j
                        ? "bg-navy-700 text-white border-navy-700"
                        : "border-navy-100 text-navy-600 hover:bg-navy-50"
                    }`}
                  >
                    {j}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1.5">
                Aset yang Dipinjam
              </label>
              <select
                value={asetId}
                onChange={(e) => setAsetId(e.target.value)}
                className="w-full rounded-lg border border-navy-100 px-3.5 py-2.5 text-navy-700 outline-none focus:border-bronze-400 focus:ring-2 focus:ring-bronze-400/20"
              >
                <option value="">
                  {loadingItems ? "Memuat daftar aset..." : "Pilih aset"}
                </option>
                {items.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.nama_barang} — kondisi {i.kondisi}
                  </option>
                ))}
              </select>
              {selected && (
                <p className="text-xs text-navy-400 mt-1.5 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5" />
                  Kode {selected.kode_barang}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1.5">
                  Nama Peminjam
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
                  {jenisPeminjam === "Internal OPD" ? "Bidang" : "Instansi Asal"}
                </label>
                <input
                  type="text"
                  value={unitAsal}
                  onChange={(e) => setUnitAsal(e.target.value)}
                  className="w-full rounded-lg border border-navy-100 px-3.5 py-2.5 text-navy-700 outline-none focus:border-bronze-400 focus:ring-2 focus:ring-bronze-400/20"
                  placeholder={jenisPeminjam === "Internal OPD" ? "contoh: Bidang Umum" : "contoh: Dinas ABC"}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1.5">
                  No. HP (opsional)
                </label>
                <input
                  type="tel"
                  value={noHp}
                  onChange={(e) => setNoHp(e.target.value)}
                  className="w-full rounded-lg border border-navy-100 px-3.5 py-2.5 text-navy-700 outline-none focus:border-bronze-400 focus:ring-2 focus:ring-bronze-400/20"
                  placeholder="08xxxxxxxxxx"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1.5">
                  Rencana Tanggal Kembali
                </label>
                <input
                  type="date"
                  value={rencanaKembali}
                  onChange={(e) => setRencanaKembali(e.target.value)}
                  className="w-full rounded-lg border border-navy-100 px-3.5 py-2.5 text-navy-700 outline-none focus:border-bronze-400 focus:ring-2 focus:ring-bronze-400/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1.5">
                Keperluan Peminjaman
              </label>
              <textarea
                value={keperluan}
                onChange={(e) => setKeperluan(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-navy-100 px-3.5 py-2.5 text-navy-700 outline-none focus:border-bronze-400 focus:ring-2 focus:ring-bronze-400/20"
                placeholder="contoh: kegiatan rapat koordinasi eksternal"
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
              {submitting ? "Menyimpan..." : "Ajukan Peminjaman"}
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
