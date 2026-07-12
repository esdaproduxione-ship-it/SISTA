const roleLabel: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  viewer: "Viewer",
};

export default function Topbar({
  nama,
  role,
}: {
  nama: string;
  role: string;
}) {
  return (
    <header className="h-16 border-b border-navy-100 bg-white flex items-center justify-between px-6 lg:px-8">
      <div />
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium text-navy-700 leading-tight">{nama}</p>
          <p className="text-xs text-navy-400 leading-tight">
            {roleLabel[role] ?? role}
          </p>
        </div>
        <div className="w-9 h-9 rounded-full bg-navy-700 text-white flex items-center justify-center font-display font-medium text-sm">
          {nama?.charAt(0)?.toUpperCase() ?? "?"}
        </div>
      </div>
    </header>
  );
}
