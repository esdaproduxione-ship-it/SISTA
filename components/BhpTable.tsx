"use client";

import { useState, useRef } from "react";
import { Upload, FileSpreadsheet, FileText, Search, AlertTriangle } from "lucide-react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { createClient } from "@/lib/supabase/client";

type BhpRow = {
  id: string;
  kode_barang: string;
  nama_barang: string;
  kategori: string | null;
  satuan: string;
  stok_minimum: number;
  stok_saat_ini: number;
};

export default function BhpTable({
  initialData,
  canEdit,
}: {
  initialData: BhpRow[];
  canEdit: boolean;
}) {
  const [data] = useState<BhpRow[]>(initialData);
  const [query, setQuery] = useState("");
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const filtered = data.filter((b) =>
    `${b.nama_barang} ${b.kode_barang}`.toLowerCase().includes(query.toLowerCase())
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
        rows = JSON.parse(await file.text());
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

      const validRows = rows
        .filter((r) => r.kode_barang && r.nama_barang && r.satuan)
        .map((r) => ({
          kode_barang: String(r.kode_barang).trim(),
          nama_barang: String(r.nama_barang).trim(),
          kategori: r.kategori ? String(r.kategori).trim() : null,
          satuan: String(r.satuan).trim(),
          stok_minimum: r.stok_minimum ? Number(r.stok_minimum) : 0,
          stok_awal: r.stok_awal ? Number(r.stok_awal) : null,
        }));

      const invalidCount = rows.length - validRows.length;

      if (validRows.length > 0) {
        // Cek kode_barang mana yang sudah ada, supaya bisa dibedakan
        // antara "barang baru" (insert + stok awal) dan "barang lama"
        // (update data master saja, stok tidak ditimpa lewat import).
        const kodeList = validRows.map((r) => r.kode_barang);
        const { data: existing, error: existingError } = await supabase
          .from("bhp")
          .select("kode_barang")
          .in("kode_barang", kodeList);
        if (existingError) throw existingError;
        const existingSet = new Set((existing ?? []).map((e) => e.kode_barang));

        const rowsBaru = validRows
          .filter((r) => !existingSet.has(r.kode_barang))
          .map((r) => ({
            kode_barang: r.kode_barang,
            nama_barang: r.nama_barang,
            kategori: r.kategori,
            satuan: r.satuan,
            stok_minimum: r.stok_minimum,
            stok_saat_ini: r.stok_awal ?? 0,
          }));

        const rowsUpdate = validRows.filter((r) => existingSet.has(r.kode_barang));

        if (rowsBaru.length > 0) {
          const { error } = await supabase.from("bhp").insert(rowsBaru);
          if (error) throw error;
        }

        for (const r of rowsUpdate) {
          const { error } = await supabase
            .from("bhp")
            .update({
              nama_barang: r.nama_barang,
              kategori: r.kategori,
              satuan: r.satuan,
              stok_minimum: r.stok_minimum,
            })
            .eq("kode_barang", r.kode_barang);
          if (error) throw error;
        }

        const ringkasan = [
          rowsBaru.length > 0 ? `${rowsBaru.length} barang baru ditambahkan` : null,
          rowsUpdate.length > 0 ? `${rowsUpdate.length} barang lama diperbarui` : null,
          invalidCount > 0 ? `${invalidCount} baris dilewati (data tidak lengkap)` : null,
        ]
          .filter(Boolean)
          .join(", ");
        setImportMsg(ringkasan + ".");
        window.location.reload();
      } else {
        setImportMsg(
          "Tidak ada baris valid. Pastikan kolom kode_barang, nama_barang, satuan terisi."
        );
      }
    } catch (err: any) {
      setImportMsg(`Gagal impor: ${err.message ?? "format file tidak valid"}`);
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleDownloadTemplateCsv() {
    const contoh = [
      {
        kode_barang: "ATK-001",
        nama_barang: "Kertas HVS A4 80gsm",
        kategori: "Alat Tulis Kantor",
        satuan: "rim",
        stok_minimum: 10,
        stok_awal: 25,
      },
      {
        kode_barang: "ATK-002",
        nama_barang: "Tinta Printer Hitam",
        kategori: "Alat Tulis Kantor",
        satuan: "pcs",
        stok_minimum: 5,
        stok_awal: 12,
      },
    ];
    const csv = Papa.unparse(contoh);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template_import_bhp.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleDownloadTemplateJson() {
    const contoh = [
      {
        kode_barang: "ATK-001",
        nama_barang: "Kertas HVS A4 80gsm",
        kategori: "Alat Tulis Kantor",
        satuan: "rim",
        stok_minimum: 10,
        stok_awal: 25,
      },
      {
        kode_barang: "ATK-002",
        nama_barang: "Tinta Printer Hitam",
        kategori: "Alat Tulis Kantor",
        satuan: "pcs",
        stok_minimum: 5,
        stok_awal: 12,
      },
    ];
    const blob = new Blob([JSON.stringify(contoh, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template_import_bhp.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleExportExcel() {
    const rows = filtered.map((b) => ({
      "Kode Barang": b.kode_barang,
      "Nama Barang": b.nama_barang,
      Kategori: b.kategori ?? "-",
      Satuan: b.satuan,
      "Stok Minimum": b.stok_minimum,
      "Stok Saat Ini": b.stok_saat_ini,
      Status: b.stok_saat_ini <= b.stok_minimum ? "Menipis" : "Aman",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Barang Habis Pakai");
    XLSX.writeFile(wb, `SISTA_BHP_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  function handleExportPdf() {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text("Kartu Stok Barang Habis Pakai - SISTA", 14, 15);
    autoTable(doc, {
      startY: 22,
      head: [["Kode", "Nama Barang", "Kategori", "Satuan", "Stok Min", "Stok Saat Ini", "Status"]],
      body: filtered.map((b) => [
        b.kode_barang,
        b.nama_barang,
        b.kategori ?? "-",
        b.satuan,
        b.stok_minimum,
        b.stok_saat_ini,
        b.stok_saat_ini <= b.stok_minimum ? "Menipis" : "Aman",
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [27, 42, 61] },
    });
    doc.save(`SISTA_BHP_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  return (
    <div className="bg-white rounded-xl border border-navy-100 overflow-hidden">
      <div className="p-4 border-b border-navy-100 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-navy-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nama atau kode barang..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-navy-100 text-sm outline-none focus:border-bronze-400 focus:ring-2 focus:ring-bronze-400/20"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {canEdit && (
            <>
              <input ref={fileInputRef} type="file" accept=".csv,.json" className="hidden" onChange={handleFileChange} />
              <button
                onClick={handleDownloadTemplateCsv}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-navy-100 text-sm font-medium text-navy-600 hover:bg-navy-50 transition"
                title="Unduh contoh format CSV yang sesuai dengan aplikasi"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Template CSV
              </button>
              <button
                onClick={handleDownloadTemplateJson}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-navy-100 text-sm font-medium text-navy-600 hover:bg-navy-50 transition"
                title="Unduh contoh format JSON yang sesuai dengan aplikasi"
              >
                <FileText className="w-4 h-4" />
                Template JSON
              </button>
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
          <button onClick={handleExportExcel} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-navy-100 text-sm font-medium text-navy-700 hover:bg-navy-50 transition">
            <FileSpreadsheet className="w-4 h-4" />
            Excel
          </button>
          <button onClick={handleExportPdf} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-navy-100 text-sm font-medium text-navy-700 hover:bg-navy-50 transition">
            <FileText className="w-4 h-4" />
            PDF
          </button>
        </div>
      </div>

      {canEdit && (
        <p className="px-4 py-2 text-xs text-navy-400 border-b border-navy-100 bg-navy-50/50">
          Kolom yang didukung: <code className="font-mono">kode_barang</code>,{" "}
          <code className="font-mono">nama_barang</code>,{" "}
          <code className="font-mono">satuan</code> (wajib),{" "}
          <code className="font-mono">kategori</code>,{" "}
          <code className="font-mono">stok_minimum</code>,{" "}
          <code className="font-mono">stok_awal</code> (opsional). Kode barang yang
          sudah ada otomatis diperbarui datanya, bukan diduplikasi; stok hanya diisi
          dari <code className="font-mono">stok_awal</code> untuk barang baru.
        </p>
      )}

      {importMsg && (
        <p className="px-4 py-2 text-sm bg-bronze-50 text-navy-700 border-b border-navy-100">{importMsg}</p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy-50 text-navy-600 text-left">
              <th className="px-4 py-3 font-medium font-mono text-xs">Kode</th>
              <th className="px-4 py-3 font-medium">Nama Barang</th>
              <th className="px-4 py-3 font-medium">Kategori</th>
              <th className="px-4 py-3 font-medium">Satuan</th>
              <th className="px-4 py-3 font-medium">Stok Saat Ini</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-navy-400">
                  Belum ada data barang. Gunakan tombol "Import CSV/JSON" untuk menambahkan data.
                </td>
              </tr>
            ) : (
              filtered.map((b) => {
                const menipis = b.stok_saat_ini <= b.stok_minimum;
                return (
                  <tr key={b.id} className="border-t border-navy-100 hover:bg-navy-50/50">
                    <td className="px-4 py-3 font-mono text-xs text-navy-600">{b.kode_barang}</td>
                    <td className="px-4 py-3 text-navy-700 font-medium">{b.nama_barang}</td>
                    <td className="px-4 py-3 text-navy-600">{b.kategori ?? "-"}</td>
                    <td className="px-4 py-3 text-navy-600">{b.satuan}</td>
                    <td className="px-4 py-3 text-navy-700 font-medium">{b.stok_saat_ini}</td>
                    <td className="px-4 py-3">
                      {menipis ? (
                        <span className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-warn/10 text-warn w-fit">
                          <AlertTriangle className="w-3 h-3" />
                          Menipis
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-good/10 text-good w-fit">
                          Aman
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
