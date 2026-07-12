"use client";

import { useMemo, useState } from "react";
import { FileSpreadsheet, FileText, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type MutasiRow = {
  id: string;
  tanggal: string;
  jenis: "Masuk" | "Keluar";
  jumlah: number;
  kode_barang: string;
  nama_barang: string;
  satuan: string;
  kategori: string | null;
};

type PeriodType = "Mingguan" | "Bulanan" | "Triwulanan" | "Semesteran";

function startOfWeek(d: Date) {
  const date = new Date(d);
  const day = date.getDay(); // 0 = Minggu
  const diff = day === 0 ? -6 : 1 - day; // geser ke Senin
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function endOfWeek(d: Date) {
  const s = startOfWeek(d);
  const e = new Date(s);
  e.setDate(e.getDate() + 6);
  e.setHours(23, 59, 59, 999);
  return e;
}

export default function LaporanClient({ data }: { data: MutasiRow[] }) {
  const [periodType, setPeriodType] = useState<PeriodType>("Bulanan");
  const [refDate, setRefDate] = useState(new Date().toISOString().slice(0, 10));
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // yyyy-mm
  const [quarter, setQuarter] = useState(Math.ceil((new Date().getMonth() + 1) / 3));
  const [semester, setSemester] = useState(new Date().getMonth() < 6 ? 1 : 2);
  const [year, setYear] = useState(new Date().getFullYear());

  const { start, end, label } = useMemo(() => {
    if (periodType === "Mingguan") {
      const d = new Date(refDate);
      const s = startOfWeek(d);
      const e = endOfWeek(d);
      return {
        start: s,
        end: e,
        label: `${s.toLocaleDateString("id-ID")} – ${e.toLocaleDateString("id-ID")}`,
      };
    }
    if (periodType === "Bulanan") {
      const [y, m] = month.split("-").map(Number);
      const s = new Date(y, m - 1, 1);
      const e = new Date(y, m, 0, 23, 59, 59);
      return {
        start: s,
        end: e,
        label: s.toLocaleDateString("id-ID", { month: "long", year: "numeric" }),
      };
    }
    if (periodType === "Triwulanan") {
      const startMonth = (quarter - 1) * 3;
      const s = new Date(year, startMonth, 1);
      const e = new Date(year, startMonth + 3, 0, 23, 59, 59);
      return { start: s, end: e, label: `Triwulan ${quarter} ${year}` };
    }
    // Semesteran
    const startMonth = semester === 1 ? 0 : 6;
    const s = new Date(year, startMonth, 1);
    const e = new Date(year, startMonth + 6, 0, 23, 59, 59);
    return { start: s, end: e, label: `Semester ${semester} ${year}` };
  }, [periodType, refDate, month, quarter, semester, year]);

  const filtered = useMemo(
    () =>
      data.filter((d) => {
        const t = new Date(d.tanggal);
        return t >= start && t <= end;
      }),
    [data, start, end]
  );

  const summary = useMemo(() => {
    const map = new Map<
      string,
      { kode: string; nama: string; satuan: string; masuk: number; keluar: number }
    >();
    for (const row of filtered) {
      const key = row.kode_barang;
      if (!map.has(key)) {
        map.set(key, { kode: row.kode_barang, nama: row.nama_barang, satuan: row.satuan, masuk: 0, keluar: 0 });
      }
      const entry = map.get(key)!;
      if (row.jenis === "Masuk") entry.masuk += Number(row.jumlah);
      else entry.keluar += Number(row.jumlah);
    }
    return Array.from(map.values()).sort((a, b) => a.nama.localeCompare(b.nama));
  }, [filtered]);

  const totalMasuk = summary.reduce((s, r) => s + r.masuk, 0);
  const totalKeluar = summary.reduce((s, r) => s + r.keluar, 0);

  function handleExportExcel() {
    const rows = summary.map((r) => ({
      "Kode Barang": r.kode,
      "Nama Barang": r.nama,
      Satuan: r.satuan,
      "Total Masuk": r.masuk,
      "Total Keluar": r.keluar,
      "Selisih Bersih": r.masuk - r.keluar,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rekap");
    XLSX.writeFile(wb, `SISTA_Rekap_${periodType}_${label.replace(/\s/g, "_")}.xlsx`);
  }

  function handleExportPdf() {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text(`Laporan Rekap ${periodType} — ${label}`, 14, 15);
    autoTable(doc, {
      startY: 22,
      head: [["Kode", "Nama Barang", "Satuan", "Total Masuk", "Total Keluar", "Selisih"]],
      body: summary.map((r) => [r.kode, r.nama, r.satuan, r.masuk, r.keluar, r.masuk - r.keluar]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [27, 42, 61] },
    });
    doc.save(`SISTA_Rekap_${periodType}_${label.replace(/\s/g, "_")}.pdf`);
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-navy-100 p-4">
        <div className="flex flex-wrap gap-2 mb-4">
          {(["Mingguan", "Bulanan", "Triwulanan", "Semesteran"] as PeriodType[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriodType(p)}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium border transition ${
                periodType === p
                  ? "bg-navy-700 text-white border-navy-700"
                  : "border-navy-100 text-navy-600 hover:bg-navy-50"
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-end gap-3">
          {periodType === "Mingguan" && (
            <div>
              <label className="block text-xs font-medium text-navy-600 mb-1">Tanggal acuan (dalam minggu itu)</label>
              <input
                type="date"
                value={refDate}
                onChange={(e) => setRefDate(e.target.value)}
                className="rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-bronze-400"
              />
            </div>
          )}
          {periodType === "Bulanan" && (
            <div>
              <label className="block text-xs font-medium text-navy-600 mb-1">Bulan</label>
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-bronze-400"
              />
            </div>
          )}
          {periodType === "Triwulanan" && (
            <>
              <div>
                <label className="block text-xs font-medium text-navy-600 mb-1">Triwulan</label>
                <select
                  value={quarter}
                  onChange={(e) => setQuarter(Number(e.target.value))}
                  className="rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-bronze-400"
                >
                  {[1, 2, 3, 4].map((q) => (
                    <option key={q} value={q}>Triwulan {q}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-navy-600 mb-1">Tahun</label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="rounded-lg border border-navy-100 px-3 py-2 text-sm w-24 outline-none focus:border-bronze-400"
                />
              </div>
            </>
          )}
          {periodType === "Semesteran" && (
            <>
              <div>
                <label className="block text-xs font-medium text-navy-600 mb-1">Semester</label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(Number(e.target.value))}
                  className="rounded-lg border border-navy-100 px-3 py-2 text-sm outline-none focus:border-bronze-400"
                >
                  <option value={1}>Semester 1 (Jan–Jun)</option>
                  <option value={2}>Semester 2 (Jul–Des)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-navy-600 mb-1">Tahun</label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="rounded-lg border border-navy-100 px-3 py-2 text-sm w-24 outline-none focus:border-bronze-400"
                />
              </div>
            </>
          )}

          <div className="ml-auto flex gap-2">
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
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="tag-card bg-navy-700 text-white p-5">
          <p className="text-sm opacity-90">Periode</p>
          <p className="font-display font-bold text-lg leading-tight mt-1">{label}</p>
        </div>
        <div className="tag-card bg-good text-white p-5">
          <ArrowDownCircle className="w-5 h-5 mb-2 opacity-90" />
          <p className="font-display font-bold text-2xl">{totalMasuk}</p>
          <p className="text-sm opacity-90">Total unit masuk</p>
        </div>
        <div className="tag-card bg-bronze-400 text-white p-5">
          <ArrowUpCircle className="w-5 h-5 mb-2 opacity-90" />
          <p className="font-display font-bold text-2xl">{totalKeluar}</p>
          <p className="text-sm opacity-90">Total unit keluar</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-navy-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy-50 text-navy-600 text-left">
              <th className="px-4 py-3 font-medium font-mono text-xs">Kode</th>
              <th className="px-4 py-3 font-medium">Nama Barang</th>
              <th className="px-4 py-3 font-medium">Satuan</th>
              <th className="px-4 py-3 font-medium">Total Masuk</th>
              <th className="px-4 py-3 font-medium">Total Keluar</th>
              <th className="px-4 py-3 font-medium">Selisih Bersih</th>
            </tr>
          </thead>
          <tbody>
            {summary.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-navy-400">
                  Tidak ada transaksi pada periode ini.
                </td>
              </tr>
            ) : (
              summary.map((r) => (
                <tr key={r.kode} className="border-t border-navy-100 hover:bg-navy-50/50">
                  <td className="px-4 py-3 font-mono text-xs text-navy-600">{r.kode}</td>
                  <td className="px-4 py-3 text-navy-700 font-medium">{r.nama}</td>
                  <td className="px-4 py-3 text-navy-600">{r.satuan}</td>
                  <td className="px-4 py-3 text-good font-medium">+{r.masuk}</td>
                  <td className="px-4 py-3 text-bronze-600 font-medium">-{r.keluar}</td>
                  <td className="px-4 py-3 text-navy-700 font-medium">{r.masuk - r.keluar}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
