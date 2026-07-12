"use client";

import { useState } from "react";
import { Copy, Check, ClipboardList, HandCoins } from "lucide-react";

export default function PublicFormLinks() {
  const [copied, setCopied] = useState<string | null>(null);

  function copy(path: string) {
    const url = `${window.location.origin}${path}`;
    navigator.clipboard.writeText(url);
    setCopied(path);
    setTimeout(() => setCopied(null), 1500);
  }

  const links = [
    {
      path: "/pengambilan",
      label: "Formulir Pengambilan Barang",
      desc: "Bagikan ke staf untuk mencatat pengambilan ATK/BHP",
      icon: ClipboardList,
    },
    {
      path: "/peminjaman",
      label: "Formulir Peminjaman Aset",
      desc: "Bagikan untuk peminjaman internal maupun eksternal OPD",
      icon: HandCoins,
    },
  ];

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {links.map((l) => (
        <div key={l.path} className="bg-white rounded-xl border border-navy-100 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-bronze-50 flex items-center justify-center shrink-0">
            <l.icon className="w-5 h-5 text-bronze-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-navy-700">{l.label}</p>
            <p className="text-xs text-navy-400">{l.desc}</p>
          </div>
          <button
            onClick={() => copy(l.path)}
            className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-navy-100 text-xs font-medium text-navy-700 hover:bg-navy-50 transition"
          >
            {copied === l.path ? (
              <>
                <Check className="w-3.5 h-3.5 text-good" /> Tersalin
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" /> Salin Link
              </>
            )}
          </button>
        </div>
      ))}
    </div>
  );
}
