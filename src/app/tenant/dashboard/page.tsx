import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ClipboardCheck } from "lucide-react";

export default async function TenantDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: inspections } = await supabase
    .from("inspections")
    .select("*, property:properties(name, address)")
    .eq("tenant_email", user.email)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-2 font-bold text-xl text-primary-700 mb-8">
          <ClipboardCheck className="w-6 h-6" />
          MoveCheck
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Your Inspections</h1>
        <p className="text-gray-500 mb-6">Inspections assigned to {user.email}</p>

        {!inspections?.length ? (
          <div className="card text-center py-12">
            <ClipboardCheck className="w-10 h-10 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No inspections assigned yet</p>
            <p className="text-sm text-gray-400 mt-1">Your landlord will share a link when it&apos;s time for an inspection</p>
          </div>
        ) : (
          <div className="space-y-4">
            {inspections.map((insp) => {
              const property = insp.property as { name: string; address: string } | null;
              return (
                <div key={insp.id} className="card flex items-center justify-between">
                  <div>
                    <p className="font-medium capitalize">{insp.type.replace("_", " ")} — {property?.name}</p>
                    <p className="text-sm text-gray-500">{property?.address}</p>
                    <span className={`inline-flex mt-1 px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                      insp.status === "completed" ? "bg-green-100 text-green-700" :
                      insp.status === "in_progress" ? "bg-blue-100 text-blue-700" :
                      "bg-yellow-100 text-yellow-700"
                    }`}>{insp.status.replace("_", " ")}</span>
                  </div>
                  <Link
                    href={`/tenant/inspect/${insp.id}`}
                    className="btn-primary text-sm"
                  >
                    {insp.status === "completed" ? "View" : "Start"}
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
