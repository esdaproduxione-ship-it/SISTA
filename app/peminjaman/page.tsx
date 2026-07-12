"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, Tag, Boxes, ClipboardList } from "lucide-react";
import PublicFormShell from "@/components/PublicFormShell";

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
    <PublicFormShell
      icon={Boxes}
      eyebrow="Formulir Publik · Tanpa Login"
      title="Peminjaman Aset"
      description="Untuk peminjaman internal OPD maupun eksternal OPD. Aset yang sedang dipinjam tidak akan muncul di daftar sampai dikembalikan."
      nomorFormulir="Buku Peminjaman Digital — Real-time"
      langkah={[
        {
          label: "Pilih aset yang tersedia",
          desc: "Hanya aset dengan status siap pinjam yang muncul.",
        },
        {
          label: "Isi data peminjam",
          desc: "Jenis peminjam, unit asal, dan keperluan.",
        },
        {
          label: "Tercatat otomatis",
          desc: "Status aset berubah menjadi dipinjam seketika.",
        },
      ]}
    >
      <div className="rounded-xl border border-navy-100 bg-white p-6 sm:p-8">
        <div className="mb-6 flex items-center gap-2 text-navy-400">
          <ClipboardList className="h-4 w-4" />
          <span className="text-xs font-medium uppercase tracking-wide">
            Detail Peminjaman
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
              Jenis Peminjam
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(["Internal OPD", "Eksternal OPD"] as const).map((j) => (
                <button
                  type="button"
                  key={j}
                  onClick={() => setJenisPeminjam(j)}
                  className={`rounded-lg border py-2.5 text-sm font-medium transition ${
                    jenisPeminjam === j
                      ? "border-navy-700 bg-navy-700 text-white"
                      : "border-navy-100 text-navy-600 hover:bg-navy-50"
                  }`}
                >
                  {j}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy-700">
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
              <p className="mt-1.5 flex items-center gap-1 text-xs text-navy-400">
                <Tag className="h-3.5 w-3.5" />
                Kode {selected.kode_barang}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy-700">
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
              <label className="mb-1.5 block text-sm font-medium text-navy-700">
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
              <label className="mb-1.5 block text-sm font-medium text-navy-700">
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
              <label className="mb-1.5 block text-sm font-medium text-navy-700">
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
            <label className="mb-1.5 block text-sm font-medium text-navy-700">
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
            <p className="rounded-lg bg-bad/10 px-3 py-2 text-sm text-bad">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-navy-700 py-2.5 font-medium text-white transition hover:bg-navy-600 disabled:opacity-60"
          >
            {submitting ? "Menyimpan..." : "Ajukan Peminjaman"}
          </button>
        </form>
      </div>

      <p className="mt-4 text-center text-xs text-navy-400">
        Formulir ini tidak memerlukan login. Data tersimpan otomatis di sistem SISTA.
      </p>
    </PublicFormShell>
  );
}
