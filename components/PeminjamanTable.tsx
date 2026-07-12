"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Search, CornerDownLeft, X } from "lucide-react";

type PeminjamanRow = {
  id: string;
  jenis_peminjam: string;
  nama_peminjam: string;
  unit_asal: string;
  no_hp: string | null;
  keperluan: string;
  tanggal_pinjam: string;
  rencana_tanggal_kembali: string;
  tanggal_kembali_aktual: string | null;
  kondisi_saat_pinjam: string | null;
  kondisi_saat_kembali: string | null;
  status: "Dipinjam" | "Dikembalikan" | "Terlambat";
  keterangan: string | null;
  nama_barang: string;
  kode_barang: string;
};

const statusStyle: Record<string, string> = {
  Dipinjam: "bg-navy-700/10 text-navy-700",
  Terlambat: "bg-bad/10 text-bad",
  Dikembalikan: "bg-good/10 text-good",
};

export default function PeminjamanTable({
  initialData,
  canEdit,
}: {
  initialData: PeminjamanRow[];
  canEdit: boolean;
}) {
  const [data, setData] = useState(initialData);
  const [query, setQuery] = useState("");
  const [modalId, setModalId] = useState<string | null>(null);
  const [kondisiKembali, setKondisiKembali] = useState("Baik");
  const [keteranganKembali, setKeteranganKembali] = useState("");
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  const filtered = data.filter((p) =>
    `${p.nama_barang} ${p.nama_peminjam} ${p.unit_asal}`
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  async function handleTandaiKembali(id: string) {
    setSaving(true);
    const { error } = await supabase.rpc("tandai_aset_dikembalikan", {
      p_peminjaman_id: id,
      p_kondisi_saat_kembali: kondisiKembali,
      p_keterangan: keteranganKembali || null,
    });
    setSaving(false);
    if (!error) {
      setModalId(null);
      setKeteranganKembali("");
      window.location.reload();
    }
  }

  return (
    <div className="bg-white rounded-xl border border-navy-100 overflow-hidden">
      <div className="p-4 border-b border-navy-100">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-navy-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari aset atau peminjam..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-navy-100 text-sm outline-none focus:border-bronze-400 focus:ring-2 focus:ring-bronze-400/20"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy-50 text-navy-600 text-left">
              <th className="px-4 py-3 font-medium">Aset</th>
              <th className="px-4 py-3 font-medium">Peminjam</th>
              <th className="px-4 py-3 font-medium">Jenis</th>
              <th className="px-4 py-3 font-medium">Tgl Pinjam</th>
              <th className="px-4 py-3 font-medium">Rencana Kembali</th>
              <th className="px-4 py-3 font-medium">Status</th>
              {canEdit && <th className="px-4 py-3 font-medium">Aksi</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={canEdit ? 7 : 6} className="px-4 py-10 text-center text-navy-400">
                  Belum ada data peminjaman.
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id} className="border-t border-navy-100 hover:bg-navy-50/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-navy-700">{p.nama_barang}</p>
                    <p className="font-mono text-xs text-navy-400">{p.kode_barang}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-navy-700">{p.nama_peminjam}</p>
                    <p className="text-xs text-navy-400">{p.unit_asal}</p>
                  </td>
                  <td className="px-4 py-3 text-navy-600">{p.jenis_peminjam}</td>
                  <td className="px-4 py-3 text-navy-600">
                    {new Date(p.tanggal_pinjam).toLocaleDateString("id-ID")}
                  </td>
                  <td className="px-4 py-3 text-navy-600">
                    {new Date(p.rencana_tanggal_kembali).toLocaleDateString("id-ID")}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyle[p.status]}`}>
                      {p.status}
                    </span>
                  </td>
                  {canEdit && (
                    <td className="px-4 py-3">
                      {p.status !== "Dikembalikan" && (
                        <button
                          onClick={() => setModalId(p.id)}
                          className="flex items-center gap-1.5 text-xs font-medium text-navy-700 border border-navy-100 rounded-lg px-2.5 py-1.5 hover:bg-navy-50"
                        >
                          <CornerDownLeft className="w-3.5 h-3.5" />
                          Tandai Kembali
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalId && (
        <div className="fixed inset-0 bg-navy-900/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-navy-700">Konfirmasi Pengembalian</h3>
              <button onClick={() => setModalId(null)}>
                <X className="w-4.5 h-4.5 text-navy-400" />
              </button>
            </div>

            <label className="block text-sm font-medium text-navy-700 mb-1.5">
              Kondisi aset saat dikembalikan
            </label>
            <select
              value={kondisiKembali}
              onChange={(e) => setKondisiKembali(e.target.value)}
              className="w-full rounded-lg border border-navy-100 px-3.5 py-2.5 text-navy-700 outline-none focus:border-bronze-400 focus:ring-2 focus:ring-bronze-400/20 mb-3"
            >
              <option value="Baik">Baik</option>
              <option value="Rusak Ringan">Rusak Ringan</option>
              <option value="Rusak Berat">Rusak Berat</option>
            </select>

            <label className="block text-sm font-medium text-navy-700 mb-1.5">
              Catatan (opsional)
            </label>
            <textarea
              value={keteranganKembali}
              onChange={(e) => setKeteranganKembali(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-navy-100 px-3.5 py-2.5 text-navy-700 outline-none focus:border-bronze-400 focus:ring-2 focus:ring-bronze-400/20 mb-4"
              placeholder="contoh: ada goresan kecil di casing"
            />

            <button
              onClick={() => handleTandaiKembali(modalId)}
              disabled={saving}
              className="w-full rounded-lg bg-navy-700 text-white font-medium py-2.5 hover:bg-navy-600 transition disabled:opacity-60"
            >
              {saving ? "Menyimpan..." : "Konfirmasi Dikembalikan"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
