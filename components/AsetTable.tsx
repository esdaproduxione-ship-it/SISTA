"use client";

import { useState, useRef } from "react";
import { Upload, Download, FileSpreadsheet, FileText, Search } from "lucide-react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { createClient } from "@/lib/supabase/client";

type AsetRow = {
  id: string;
  nomor_register: string;
  kode_lokasi: string | null;
  nama_barang: string;
  merk_tipe: string | null;
  tahun_perolehan: number | null;
  nilai_perolehan: number;
  kondisi: "Baik" | "Rusak Ringan" | "Rusak Berat";
  status: string;
  sedang_dipinjam: boolean;
  kode_akun_bmd: { kode: string; nama_klasifikasi: string } | null;
  ruangan: { nama_ruangan: string } | null;
  penanggung_jawab: string | null;
};

const kondisiStyle: Record<string, string> = {
  Baik: "bg-good/10 text-good",
  "Rusak Ringan": "bg-warn/10 text-warn",
  "Rusak Berat": "bg-bad/10 text-bad",
};

// Kode register sesuai Pasal 7 Permendagri 108/2016:
// kode lokasi & tahun perolehan + kode barang & nomor urut pendaftaran.
// Fallback ke format lama (kode akun + nomor register) selama kode_lokasi
// belum diisi untuk aset tersebut (masa transisi, lihat migration 0006).
function formatKodeRegister(a: AsetRow): string {
  if (a.kode_akun_bmd && a.kode_lokasi && a.tahun_perolehan) {
    return `${a.kode_lokasi}.${a.tahun_perolehan}.${a.kode_akun_bmd.kode}.${a.nomor_register}`;
  }
  if (a.kode_akun_bmd) {
    return `${a.kode_akun_bmd.kode}.${a.nomor_register}`;
  }
  return a.nomor_register;
}

export default function AsetTable({
  initialData,
  canEdit,
}: {
  initialData: AsetRow[];
  canEdit: boolean;
}) {
  const [data, setData] = useState<AsetRow[]>(initialData);
  const [query, setQuery] = useState("");
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const filtered = data.filter((a) =>
    `${a.nama_barang} ${a.nomor_register} ${a.penanggung_jawab ?? ""}`
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportMsg(null);

    try {
      let rows: any[] = [];

      if (file.name.endsWith(".json")) {
        const text = await file.text();
        rows = JSON.parse(text);
      } else {
        rows = await new Promise((resolve, reject) => {
          Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (res) => resolve(res.data),
            error: reject,
          });
        });
      }

      // Validasi minimal: field wajib harus ada
      const invalid = rows.filter((r) => !r.nama_barang || !r.nomor_register);
      if (invalid.length > 0) {
        setImportMsg(
          `${invalid.length} baris dilewati karena field 'nama_barang' atau 'nomor_register' kosong.`
        );
      }

      const validRows = rows
        .filter((r) => r.nama_barang && r.nomor_register)
        .map((r) => ({
          nomor_register: String(r.nomor_register),
          nama_barang: r.nama_barang,
          merk_tipe: r.merk_tipe ?? null,
          tahun_perolehan: r.tahun_perolehan ? Number(r.tahun_perolehan) : null,
          nilai_perolehan: r.nilai_perolehan ? Number(r.nilai_perolehan) : 0,
          kondisi: r.kondisi ?? "Baik",
          penanggung_jawab: r.penanggung_jawab ?? null,
        }));

      if (validRows.length > 0) {
        const { error } = await supabase.from("aset").insert(validRows);
        if (error) throw error;
        setImportMsg((prev) =>
          `${validRows.length} data aset berhasil diimpor.` +
          (prev ? " " + prev : "")
        );
        // refresh sederhana
        window.location.reload();
      }
    } catch (err: any) {
      setImportMsg(`Gagal impor: ${err.message ?? "format file tidak valid"}`);
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleExportExcel() {
    const rows = filtered.map((a) => ({
      "Kode Barang": formatKodeRegister(a),
      "Nama Barang": a.nama_barang,
      "Merk/Tipe": a.merk_tipe ?? "-",
      "Tahun Perolehan": a.tahun_perolehan ?? "-",
      "Nilai Perolehan": a.nilai_perolehan,
      Kondisi: a.kondisi,
      Ruangan: a.ruangan?.nama_ruangan ?? "-",
      "Penanggung Jawab": a.penanggung_jawab ?? "-",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Aset Tetap");
    XLSX.writeFile(wb, `SISTA_Aset_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  function handleExportPdf() {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text("Daftar Aset Tetap - SISTA", 14, 15);
    autoTable(doc, {
      startY: 22,
      head: [["Kode Barang", "Nama Barang", "Tahun", "Nilai Perolehan", "Kondisi", "Ruangan", "PJ"]],
      body: filtered.map((a) => [
        formatKodeRegister(a),
        a.nama_barang,
        a.tahun_perolehan ?? "-",
        new Intl.NumberFormat("id-ID").format(a.nilai_perolehan),
        a.kondisi,
        a.ruangan?.nama_ruangan ?? "-",
        a.penanggung_jawab ?? "-",
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [27, 42, 61] },
    });
    doc.save(`SISTA_Aset_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  return (
    <div className="bg-white rounded-xl border border-navy-100 overflow-hidden">
      <div className="p-4 border-b border-navy-100 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-navy-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nama barang, kode, atau PJ..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-navy-100 text-sm outline-none focus:border-bronze-400 focus:ring-2 focus:ring-bronze-400/20"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {canEdit && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.json"
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                onClick={handleImportClick}
                disabled={importing}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-navy-100 text-sm font-medium text-navy-700 hover:bg-navy-50 transition"
              >
                <Upload className="w-4 h-4" />
                {importing ? "Mengimpor..." : "Import CSV/JSON"}
              </button>
            </>
          )}
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-navy-100 text-sm font-medium text-navy-700 hover:bg-navy-50 transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Excel
          </button>
          <button
            onClick={handleExportPdf}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-navy-100 text-sm font-medium text-navy-700 hover:bg-navy-50 transition"
          >
            <FileText className="w-4 h-4" />
            PDF
          </button>
        </div>
      </div>

      {importMsg && (
        <p className="px-4 py-2 text-sm bg-bronze-50 text-navy-700 border-b border-navy-100">
          {importMsg}
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy-50 text-navy-600 text-left">
              <th className="px-4 py-3 font-medium font-mono text-xs">Kode Barang</th>
              <th className="px-4 py-3 font-medium">Nama Barang</th>
              <th className="px-4 py-3 font-medium">Tahun</th>
              <th className="px-4 py-3 font-medium">Nilai Perolehan</th>
              <th className="px-4 py-3 font-medium">Kondisi</th>
              <th className="px-4 py-3 font-medium">Ruangan</th>
              <th className="px-4 py-3 font-medium">Penanggung Jawab</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-navy-400">
                  Belum ada data aset. Gunakan tombol "Import CSV/JSON" untuk menambahkan data.
                </td>
              </tr>
            ) : (
              filtered.map((a) => (
                <tr key={a.id} className="border-t border-navy-100 hover:bg-navy-50/50">
                  <td className="px-4 py-3 font-mono text-xs text-navy-600">
                    {formatKodeRegister(a)}
                  </td>
                  <td className="px-4 py-3 text-navy-700 font-medium">{a.nama_barang}</td>
                  <td className="px-4 py-3 text-navy-600">{a.tahun_perolehan ?? "-"}</td>
                  <td className="px-4 py-3 text-navy-600">
                    {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(a.nilai_perolehan)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${kondisiStyle[a.kondisi]}`}>
                      {a.kondisi}
                    </span>
                    {a.sedang_dipinjam && (
                      <span className="ml-1.5 px-2 py-1 rounded-full text-xs font-medium bg-navy-700/10 text-navy-700">
                        Dipinjam
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-navy-600">{a.ruangan?.nama_ruangan ?? "-"}</td>
                  <td className="px-4 py-3 text-navy-600">{a.penanggung_jawab ?? "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
