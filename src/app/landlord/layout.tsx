import Link from "next/link";
import { ClipboardCheck, Home, LayoutDashboard, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function LandlordLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  // Allow access if profile doesn't exist yet (first login) or role is landlord
  if (profile && profile.role !== "landlord") redirect("/login");

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <Link href="/landlord/dashboard" className="flex items-center gap-2 font-bold text-lg text-primary-700">
            <ClipboardCheck className="w-5 h-5" />
            MoveCheck
          </Link>
          <p className="text-xs text-gray-500 mt-1">{profile?.full_name || user.email}</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <NavLink href="/landlord/dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavLink href="/landlord/properties" icon={Home} label="Properties" />
        </nav>

        <div className="p-4 border-t border-gray-200">
          <form action="/api/auth/signout" method="post">
            <button type="submit" className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 w-full">
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}

function NavLink({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
    >
      <Icon className="w-4 h-4" />
      {label}
    </Link>
  );
}
