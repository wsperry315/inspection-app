import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ClipboardCheck, Home, Clock, CheckCircle2 } from "lucide-react";

export default async function LandlordDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: properties }, { data: inspections }] = await Promise.all([
    supabase.from("properties").select("id").eq("landlord_id", user!.id),
    supabase
      .from("inspections")
      .select("id, status, type, tenant_name, submitted_at, property:properties(name, address)")
      .eq("landlord_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const pending = inspections?.filter((i) => i.status === "pending").length ?? 0;
  const inProgress = inspections?.filter((i) => i.status === "in_progress").length ?? 0;
  const completed = inspections?.filter((i) => i.status === "completed").length ?? 0;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
      <p className="text-gray-500 mb-8">Overview of your properties and inspections</p>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Properties", value: properties?.length ?? 0, icon: Home, color: "blue" },
          { label: "Pending", value: pending, icon: Clock, color: "yellow" },
          { label: "In Progress", value: inProgress, icon: ClipboardCheck, color: "orange" },
          { label: "Completed", value: completed, icon: CheckCircle2, color: "green" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${color}-100`}>
              <Icon className={`w-5 h-5 text-${color}-600`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-sm text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Recent Inspections</h2>
          <Link href="/landlord/properties" className="text-sm text-primary-600 hover:underline">
            View all
          </Link>
        </div>

        {!inspections?.length ? (
          <div className="text-center py-12 text-gray-500">
            <ClipboardCheck className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No inspections yet</p>
            <p className="text-sm mt-1">
              <Link href="/landlord/properties" className="text-primary-600 hover:underline">
                Add a property
              </Link>{" "}
              to get started
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 text-gray-500 font-medium">Property</th>
                <th className="text-left py-2 text-gray-500 font-medium">Tenant</th>
                <th className="text-left py-2 text-gray-500 font-medium">Type</th>
                <th className="text-left py-2 text-gray-500 font-medium">Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {inspections.map((insp) => (
                <tr key={insp.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 font-medium">
                    {(insp.property as unknown as { name: string } | null)?.name ?? "—"}
                  </td>
                  <td className="py-3 text-gray-600">{insp.tenant_name ?? "—"}</td>
                  <td className="py-3 capitalize text-gray-600">
                    {insp.type.replace("_", " ")}
                  </td>
                  <td className="py-3">
                    <StatusBadge status={insp.status} />
                  </td>
                  <td className="py-3 text-right">
                    <Link
                      href={`/landlord/inspections/${insp.id}`}
                      className="text-primary-600 hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    in_progress: "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700",
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${styles[status] ?? "bg-gray-100 text-gray-600"}`}>
      {status.replace("_", " ")}
    </span>
  );
}
