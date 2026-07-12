import { ReactNode } from "react";
import { Boxes, LucideIcon } from "lucide-react";

type Langkah = {
  label: string;
  desc: string;
};

export default function PublicFormShell({
  icon: Icon,
  eyebrow,
  title,
  description,
  langkah,
  nomorFormulir,
  children,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  langkah: Langkah[];
  nomorFormulir: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-canvas">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col lg:flex-row">
        {/* Panel kiri — informasi & konteks */}
        <div className="relative bg-navy-700 px-6 py-10 sm:px-10 sm:py-14 lg:w-[42%] lg:px-12 lg:py-16">
          <div className="mx-auto flex h-full max-w-md flex-col lg:mx-0">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-bronze-400/15">
                <Boxes className="h-4.5 w-4.5 text-bronze-200" strokeWidth={2.5} />
              </div>
              <span className="font-display text-lg font-bold text-white">SISTA</span>
            </div>

            <p className="mt-10 font-mono text-xs uppercase tracking-widest text-bronze-200/80">
              {eyebrow}
            </p>
            <h1 className="mt-3 font-display text-3xl font-bold leading-tight text-white sm:text-4xl">
              {title}
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-navy-100/70">
              {description}
            </p>

            <div className="mt-10 flex items-start gap-3">
              <Icon className="mt-0.5 h-4.5 w-4.5 shrink-0 text-bronze-200" strokeWidth={2} />
              <p className="font-mono text-xs text-navy-100/60">{nomorFormulir}</p>
            </div>

            <ol className="mt-8 space-y-5">
              {langkah.map((l, i) => (
                <li key={l.label} className="flex gap-4">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-bronze-200/30 font-mono text-[11px] text-bronze-200">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-white">{l.label}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-navy-100/55">
                      {l.desc}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-auto pt-12 text-xs leading-relaxed text-navy-100/45">
              Bagian Perekonomian dan Sumber Daya Alam
              <br />
              Sekretariat Daerah Kota Batu
            </div>
          </div>
        </div>

        {/* Perforasi — pemisah ala sobekan bon fisik */}
        <div className="hidden lg:block ticket-perforation" />
        <div className="lg:hidden ticket-perforation-h" />

        {/* Panel kanan — formulir */}
        <div className="flex flex-1 items-center justify-center px-6 py-12 sm:px-10 lg:px-12">
          <div className="w-full max-w-lg">{children}</div>
        </div>
      </div>
    </main>
  );
}
