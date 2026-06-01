import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, ClipboardCheck, CheckCircle2, Clock, Home } from "lucide-react";
import { NewInspectionButton } from "./NewInspectionButton";
import { PropertyActions } from "./PropertyActions";

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: property } = await supabase
    .from("properties")
    .select("*")
    .eq("id", id)
    .single();

  if (!property) notFound();

  const { data: inspections } = await supabase
    .from("inspections")
    .select("*")
    .eq("property_id", id)
    .order("created_at", { ascending: false });

  return (
    <div className="p-8 max-w-4xl">
      <Link href="/landlord/properties" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to properties
      </Link>

      {/* Property header */}
      <div className="card mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <Home className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{property.name}</h1>
              <p className="text-gray-500">{property.address}, {property.city}, {property.state} {property.zip}</p>
              <div className="flex gap-4 mt-2 text-sm text-gray-600">
                {property.bedrooms > 0 && <span>🛏 {property.bedrooms} bed</span>}
                {property.bathrooms > 0 && <span>🚿 {property.bathrooms} bath</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <PropertyActions property={property} />
            <NewInspectionButton propertyId={property.id} />
          </div>
        </div>
      </div>

      {/* Inspections list */}
      <h2 className="font-semibold text-gray-900 mb-4">Inspections</h2>

      {!inspections?.length ? (
        <div className="card text-center py-12">
          <ClipboardCheck className="w-10 h-10 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No inspections yet</p>
          <p className="text-sm text-gray-400 mt-1">Click &quot;New inspection&quot; above to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {inspections.map((insp) => (
            <Link
              key={insp.id}
              href={`/landlord/inspections/${insp.id}`}
              className="card flex items-center justify-between hover:border-primary-200 hover:bg-primary-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  insp.status === "completed" ? "bg-green-100" :
                  insp.status === "in_progress" ? "bg-blue-100" : "bg-yellow-100"
                }`}>
                  {insp.status === "completed"
                    ? <CheckCircle2 className="w-5 h-5 text-green-600" />
                    : <Clock className="w-5 h-5 text-yellow-600" />}
                </div>
                <div>
                  <p className="font-medium text-gray-900 capitalize">
                    {insp.type.replace("_", " ")} Inspection
                  </p>
                  <p className="text-sm text-gray-500">
                    {insp.tenant_name || insp.tenant_email || "No tenant assigned"} •{" "}
                    {new Date(insp.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                  insp.status === "completed" ? "bg-green-100 text-green-700" :
                  insp.status === "in_progress" ? "bg-blue-100 text-blue-700" :
                  "bg-yellow-100 text-yellow-700"
                }`}>
                  {insp.status.replace("_", " ")}
                </span>
                {insp.status === "pending" && (
                  <button
                    onClick={(e) => { e.preventDefault(); navigator.clipboard.writeText(`${window.location.origin}/tenant/inspect/${insp.id}`); }}
                    className="text-xs text-primary-600 hover:underline flex items-center gap-1"
                  >
                    <Send className="w-3 h-3" /> Copy link
                  </button>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
