"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Boxes,
  Users,
  LogOut,
  History,
  HandCoins,
  BarChart3,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const menu = [
  { href: "/dashboard", label: "Ringkasan", icon: LayoutDashboard },
  { href: "/aset", label: "Aset Tetap", icon: Package },
  { href: "/aset/peminjaman", label: "Peminjaman Aset", icon: HandCoins },
  { href: "/bhp", label: "Barang Habis Pakai", icon: Boxes },
  { href: "/bhp/riwayat", label: "Riwayat Pengambilan", icon: History },
  { href: "/laporan", label: "Laporan Rekap", icon: BarChart3 },
];

export default function Sidebar({ role }: { role: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="w-64 shrink-0 bg-navy-700 text-white flex flex-col">
      <div className="px-6 py-5 flex items-center gap-2.5 border-b border-white/10">
        <div className="w-8 h-8 rounded-md bg-bronze-400 flex items-center justify-center">
          <Boxes className="w-4.5 h-4.5 text-navy-900" strokeWidth={2.5} />
        </div>
        <span className="font-display font-bold text-lg tracking-tight">SISTA</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {menu.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                active
                  ? "bg-bronze-400 text-navy-900"
                  : "text-navy-100 hover:bg-white/5"
              }`}
            >
              <Icon className="w-4.5 h-4.5" strokeWidth={2} />
              {item.label}
            </Link>
          );
        })}

        {role === "super_admin" && (
          <Link
            href="/pengguna"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
              pathname === "/pengguna"
                ? "bg-bronze-400 text-navy-900"
                : "text-navy-100 hover:bg-white/5"
            }`}
          >
            <Users className="w-4.5 h-4.5" strokeWidth={2} />
            Kelola Pengguna
          </Link>
        )}
      </nav>

      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-navy-100 hover:bg-white/5 transition w-full"
        >
          <LogOut className="w-4.5 h-4.5" strokeWidth={2} />
          Keluar
        </button>
      </div>
    </aside>
  );
}
