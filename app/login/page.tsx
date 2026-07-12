"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Boxes } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // resolve username -> email via RPC (pola sama seperti project sebelumnya)
    const { data: email, error: rpcError } = await supabase.rpc(
      "get_email_by_username",
      { p_username: username }
    );

    if (rpcError || !email) {
      setError("Username tidak ditemukan atau akun tidak aktif.");
      setLoading(false);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError("Username atau password salah.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="min-h-screen grid lg:grid-cols-2">
      {/* Panel kiri: identitas */}
      <div className="hidden lg:flex flex-col justify-between bg-navy-700 text-white p-12 relative overflow-hidden">
        <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-bronze-400/10" />
        <div className="absolute -right-10 top-40 w-64 h-64 rounded-full bg-bronze-400/10" />

        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-lg bg-bronze-400 flex items-center justify-center">
            <Boxes className="w-5 h-5 text-navy-900" strokeWidth={2.5} />
          </div>
          <span className="font-display font-bold text-xl tracking-tight">SISTA</span>
        </div>

        <div className="relative z-10">
          <p className="font-mono text-bronze-200 text-sm tracking-widest mb-3">
            02.06.02.05.01 — REG. AKTIF
          </p>
          <h1 className="font-display font-bold text-4xl leading-tight mb-4">
            Setiap aset punya&nbsp;jejak.
            <br />
            Setiap stok punya&nbsp;catatan.
          </h1>
          <p className="text-navy-100 max-w-md">
            Sistem Informasi Stok dan Aset membantu OPD mencatat, memantau, dan
            melaporkan aset tetap serta barang habis pakai secara akurat dan
            transparan.
          </p>
        </div>

        <p className="text-navy-100/60 text-sm relative z-10">
          © {new Date().getFullYear()} SISTA. Dikembangkan untuk kebutuhan internal OPD.
        </p>
      </div>

      {/* Panel kanan: form login */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-lg bg-navy-700 flex items-center justify-center">
              <Boxes className="w-5 h-5 text-bronze-400" strokeWidth={2.5} />
            </div>
            <span className="font-display font-bold text-xl text-navy-700">SISTA</span>
          </div>

          <h2 className="font-display font-bold text-2xl text-navy-700 mb-1">
            Masuk ke akun
          </h2>
          <p className="text-navy-400 text-sm mb-8">
            Gunakan username dan password yang terdaftar.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1.5">
                Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-lg border border-navy-100 px-3.5 py-2.5 text-navy-700 outline-none focus:border-bronze-400 focus:ring-2 focus:ring-bronze-400/20 transition"
                placeholder="nama.pengguna"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-navy-100 px-3.5 py-2.5 text-navy-700 outline-none focus:border-bronze-400 focus:ring-2 focus:ring-bronze-400/20 transition"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-bad text-sm bg-bad/10 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-navy-700 text-white font-medium py-2.5 hover:bg-navy-600 transition disabled:opacity-60"
            >
              {loading ? "Memproses..." : "Masuk"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
