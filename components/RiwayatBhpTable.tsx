"use client";

import { useState } from "react";
import { Search, ArrowDownCircle, ArrowUpCircle } from "lucide-react";

type RiwayatRow = {
  id: string;
  tanggal: string;
  jenis: "Masuk" | "Keluar";
  jumlah: number;
  sumber_tujuan: string | null;
  nama_pemohon: string | null;
  bidang_pemohon: string | null;
  keperluan: string | null;
  sumber_input: string;
  kode_barang: string;
  nama_barang: string;
  satuan: string;
  kategori: string | null;
};

export default function RiwayatBhpTable({ initialData }: { initialData: RiwayatRow[] }) {
  const [query, setQuery] = useState("");
  const [jenisFilter, setJenisFilter] = useState<"Semua" | "Masuk" | "Keluar">("Semua");

  const filtered = initialData.filter((r) => {
    const matchQuery = `${r.nama_barang} ${r.nama_pemohon ?? ""} ${r.bidang_pemohon ?? ""}`
      .toLowerCase()
      .includes(query.toLowerCase());
    const matchJenis = jenisFilter === "Semua" || r.jenis === jenisFilter;
    return matchQuery && matchJenis;
  });

  return (
    <div className="bg-white rounded-xl border border-navy-100 overflow-hidden">
      <div className="p-4 border-b border-navy-100 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-navy-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari barang atau pemohon..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-navy-100 text-sm outline-none focus:border-bronze-400 focus:ring-2 focus:ring-bronze-400/20"
          />
        </div>
        <div className="flex gap-2">
          {(["Semua", "Masuk", "Keluar"] as const).map((j) => (
            <button
              key={j}
              onClick={() => setJenisFilter(j)}
              className={`px-3 py-2 rounded-lg text-sm font-medium border transition ${
                jenisFilter === j
                  ? "bg-navy-700 text-white border-navy-700"
                  : "border-navy-100 text-navy-600 hover:bg-navy-50"
              }`}
            >
              {j}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy-50 text-navy-600 text-left">
              <th className="px-4 py-3 font-medium">Tanggal</th>
              <th className="px-4 py-3 font-medium">Barang</th>
              <th className="px-4 py-3 font-medium">Jenis</th>
              <th className="px-4 py-3 font-medium">Jumlah</th>
              <th className="px-4 py-3 font-medium">Pemohon / Sumber-Tujuan</th>
              <th className="px-4 py-3 font-medium">Keperluan</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-navy-400">
                  Belum ada transaksi.
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id} className="border-t border-navy-100 hover:bg-navy-50/50">
                  <td className="px-4 py-3 text-navy-600">
                    {new Date(r.tanggal).toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-navy-700">{r.nama_barang}</p>
                    <p className="font-mono text-xs text-navy-400">{r.kode_barang}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`flex items-center gap-1.5 w-fit px-2 py-1 rounded-full text-xs font-medium ${
                        r.jenis === "Masuk" ? "bg-good/10 text-good" : "bg-bronze-400/15 text-bronze-600"
                      }`}
                    >
                      {r.jenis === "Masuk" ? (
                        <ArrowDownCircle className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowUpCircle className="w-3.5 h-3.5" />
                      )}
                      {r.jenis}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-navy-700 font-medium">
                    {r.jumlah} {r.satuan}
                  </td>
                  <td className="px-4 py-3 text-navy-600">
                    {r.nama_pemohon ? (
                      <>
                        <p>{r.nama_pemohon}</p>
                        <p className="text-xs text-navy-400">{r.bidang_pemohon}</p>
                      </>
                    ) : (
                      r.sumber_tujuan ?? "-"
                    )}
                  </td>
                  <td className="px-4 py-3 text-navy-600">{r.keperluan ?? "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
