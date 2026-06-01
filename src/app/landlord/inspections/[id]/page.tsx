import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock, ClipboardCheck } from "lucide-react";
import Link from "next/link";
import { InspectionPDFDownload } from "@/components/inspection/InspectionPDFDownload";
import { CopyLinkButton } from "./CopyLinkButton";

export default async function InspectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: insp } = await supabase
    .from("inspections")
    .select("*, property:properties(*)")
    .eq("id", id)
    .single();

  if (!insp) notFound();

  const { data: rooms } = await supabase
    .from("inspection_rooms")
    .select("*, items:inspection_items(*, photos:inspection_photos(*))")
    .eq("inspection_id", id)
    .order("sort_order");

  const property = insp.property as { name: string; address: string; city: string; state: string; zip: string } | null;

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/landlord/properties" className="hover:text-gray-900">Properties</Link>
        <span>/</span>
        <span>Inspection</span>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 capitalize">
            {insp.type.replace("_", " ")} Inspection
          </h1>
          <p className="text-gray-500">{property?.name} — {property?.address}, {property?.city}</p>
        </div>
        <StatusBadge status={insp.status} />
      </div>

      <div className="card mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Tenant</p>
            <p className="font-medium">{insp.tenant_name || "—"}</p>
          </div>
          <div>
            <p className="text-gray-500">Email</p>
            <p className="font-medium">{insp.tenant_email || "—"}</p>
          </div>
          <div>
            <p className="text-gray-500">Created</p>
            <p className="font-medium">{new Date(insp.created_at).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-gray-500">Submitted</p>
            <p className="font-medium">{insp.submitted_at ? new Date(insp.submitted_at).toLocaleDateString() : "—"}</p>
          </div>
        </div>
      </div>

      {insp.status === "pending" && (
        <div className="card mb-6 bg-yellow-50 border-yellow-200">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-yellow-800">Awaiting tenant</p>
              <p className="text-sm text-yellow-700 mt-1 mb-2">Share this link with the tenant:</p>
              <div className="flex items-center gap-2">
                <code className="bg-yellow-100 border border-yellow-200 px-2 py-1 rounded text-xs flex-1 break-all">
                  https://inspection-app-bay.vercel.app/tenant/inspect/{insp.id}
                </code>
                <CopyLinkButton inspectionId={insp.id} />
              </div>
            </div>
          </div>
        </div>
      )}

      {insp.status === "completed" && (
        <div className="card mb-6 bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <p className="font-medium text-green-800">Inspection completed and signed</p>
            </div>
            <InspectionPDFDownload inspection={insp} rooms={rooms ?? []} property={property} />
          </div>
        </div>
      )}

      {insp.signature_data_url && (
        <div className="card mb-6">
          <h3 className="font-medium text-gray-900 mb-3">Tenant Signature</h3>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={insp.signature_data_url} alt="Signature" className="border border-gray-200 rounded-lg max-w-xs" />
        </div>
      )}

      <div className="space-y-6">
        {rooms?.map((room) => (
          <div key={room.id} className="card">
            <h3 className="font-semibold text-gray-900 mb-4">{room.name}</h3>
            <div className="space-y-3">
              {room.items?.map((item: {
                id: string;
                name: string;
                condition: string | null;
                notes: string | null;
                photos?: { id: string; storage_path: string; caption: string | null }[];
              }) => (
                <div key={item.id} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-800">{item.name}</span>
                    {item.condition && <ConditionBadge condition={item.condition} />}
                  </div>
                  {item.notes && <p className="text-xs text-gray-500 mt-1">{item.notes}</p>}
                  {item.photos && item.photos.length > 0 && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {item.photos.map((photo: { id: string; storage_path: string; caption: string | null }) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={photo.id}
                          src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/inspection-photos/${photo.storage_path}`}
                          alt={photo.caption ?? ""}
                          className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {(!rooms || rooms.length === 0) && (
        <div className="card text-center py-12 text-gray-400">
          <ClipboardCheck className="w-10 h-10 mx-auto mb-3" />
          <p>No rooms recorded yet</p>
        </div>
      )}
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
    <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${styles[status] ?? "bg-gray-100 text-gray-600"}`}>
      {status.replace("_", " ")}
    </span>
  );
}

function ConditionBadge({ condition }: { condition: string }) {
  const styles: Record<string, string> = {
    excellent: "bg-green-100 text-green-700",
    good: "bg-emerald-100 text-emerald-700",
    fair: "bg-yellow-100 text-yellow-700",
    poor: "bg-red-100 text-red-700",
    na: "bg-gray-100 text-gray-500",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${styles[condition] ?? "bg-gray-100 text-gray-500"}`}>
      {condition === "na" ? "N/A" : condition}
    </span>
  );
}
