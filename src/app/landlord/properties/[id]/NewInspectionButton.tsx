"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Plus } from "lucide-react";
import { buildTARRooms } from "@/types";

export function NewInspectionButton({ propertyId }: { propertyId: string }) {
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ tenant_name: "", tenant_email: "", type: "move_in" });
  const [saving, setSaving] = useState(false);
  const [link, setLink] = useState("");
  const router = useRouter();
  const supabase = createClient();

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();

    const { data: insp } = await supabase
      .from("inspections")
      .insert({
        property_id: propertyId,
        landlord_id: user!.id,
        tenant_name: form.tenant_name,
        tenant_email: form.tenant_email,
        type: form.type,
        status: "pending",
      })
      .select()
      .single();

    if (insp) {
      const { data: prop } = await supabase
        .from("properties")
        .select("bedrooms, bathrooms")
        .eq("id", propertyId)
        .single();

      const rooms = buildTARRooms(prop?.bedrooms ?? 3, prop?.bathrooms ?? 2);
      for (let ri = 0; ri < rooms.length; ri++) {
        const room = rooms[ri];
        const { data: roomRow } = await supabase
          .from("inspection_rooms")
          .insert({ inspection_id: insp.id, name: room.name, sort_order: ri })
          .select()
          .single();
        if (roomRow) {
          await supabase.from("inspection_items").insert(
            room.items.map((item, ii) => ({ room_id: roomRow.id, name: item, sort_order: ii }))
          );
        }
      }
      const inspUrl = `${window.location.origin}/tenant/inspect/${insp.id}`;
      setLink(inspUrl);

      // Auto-send email to tenant
      await fetch("/api/send-inspection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inspectionId: insp.id }),
      });

      router.refresh();
    }
    setSaving(false);
  }

  if (!show) {
    return (
      <button onClick={() => setShow(true)} className="btn-primary">
        <Plus className="w-4 h-4" /> New inspection
      </button>
    );
  }

  if (link) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
          <h2 className="font-semibold text-gray-900 mb-2">Inspection created! 🎉</h2>
          <p className="text-sm text-green-600 mb-3">✅ Email sent to {form.tenant_email}</p>
          <p className="text-sm text-gray-600 mb-3">You can also share this link directly:</p>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 font-mono text-xs break-all select-all mb-3">
            {link}
          </div>
          <button onClick={() => navigator.clipboard.writeText(link)} className="btn-secondary w-full mb-2">
            Copy link
          </button>
          <button onClick={() => { setShow(false); setLink(""); }} className="btn-primary w-full">
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">New Inspection</h2>
          <button onClick={() => setShow(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="label">Type</label>
            <div className="grid grid-cols-2 gap-2">
              {(["move_in", "move_out"] as const).map((t) => (
                <button key={t} type="button"
                  onClick={() => setForm((f) => ({ ...f, type: t }))}
                  className={`py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                    form.type === t ? "border-primary-600 bg-primary-50 text-primary-700" : "border-gray-300 text-gray-600 hover:bg-gray-50"
                  }`}>
                  {t === "move_in" ? "Move-in" : "Move-out"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Tenant name</label>
            <input className="input" value={form.tenant_name} onChange={(e) => setForm((f) => ({ ...f, tenant_name: e.target.value }))} required />
          </div>
          <div>
            <label className="label">Tenant email</label>
            <input type="email" className="input" value={form.tenant_email} onChange={(e) => setForm((f) => ({ ...f, tenant_email: e.target.value }))} required />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShow(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={saving}>
              {saving ? "Creating…" : "Create & get link"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
