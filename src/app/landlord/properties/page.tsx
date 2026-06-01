"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Property, Inspection } from "@/types";
import { Plus, Home, ChevronRight, Trash2, Send, Upload } from "lucide-react";
import Link from "next/link";

type PropertyWithInspections = Property & { inspections: Inspection[] };

export default function PropertiesPage() {
  const [properties, setProperties] = useState<PropertyWithInspections[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showInspect, setShowInspect] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase
      .from("properties")
      .select("*, inspections(*)")
      .eq("landlord_id", user!.id)
      .order("created_at", { ascending: false });
    setProperties((data as PropertyWithInspections[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
          <p className="text-gray-500">Manage your rental units and send inspection links</p>
        </div>
        <div className="flex gap-2">
          <Link href="/landlord/properties/import" className="btn-secondary">
            <Upload className="w-4 h-4" /> Import CSV
          </Link>
          <button onClick={() => setShowAdd(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Add property
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : properties.length === 0 ? (
        <div className="card text-center py-16">
          <Home className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="font-medium text-gray-900">No properties yet</p>
          <p className="text-sm text-gray-500 mt-1">Add your first property to start sending inspections</p>
          <button onClick={() => setShowAdd(true)} className="btn-primary mt-4">
            <Plus className="w-4 h-4" /> Add property
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {properties.map((p) => (
            <div key={p.id} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{p.name}</h3>
                  <p className="text-sm text-gray-500">{p.address}, {p.city}, {p.state} {p.zip}</p>
                  <p className="text-xs text-gray-400 mt-1">{p.inspections?.length ?? 0} inspection(s)</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowInspect(p.id)}
                    className="btn-secondary text-xs"
                  >
                    <Send className="w-3 h-3" /> New inspection
                  </button>
                  <Link
                    href={`/landlord/properties/${p.id}`}
                    className="btn-secondary text-xs"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              {p.inspections?.length > 0 && (
                <div className="mt-4 border-t border-gray-100 pt-4 space-y-2">
                  {p.inspections.slice(0, 3).map((insp) => (
                    <div key={insp.id} className="flex items-center justify-between text-sm">
                      <span className="capitalize text-gray-600">{insp.type.replace("_", " ")} — {insp.tenant_name || insp.tenant_email}</span>
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                          insp.status === "completed" ? "bg-green-100 text-green-700" :
                          insp.status === "in_progress" ? "bg-blue-100 text-blue-700" :
                          "bg-yellow-100 text-yellow-700"
                        }`}>{insp.status.replace("_", " ")}</span>
                        <Link href={`/landlord/inspections/${insp.id}`} className="text-primary-600 hover:underline text-xs">
                          View
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showAdd && <AddPropertyModal onClose={() => setShowAdd(false)} onSaved={load} />}
      {showInspect && (
        <NewInspectionModal
          propertyId={showInspect}
          onClose={() => setShowInspect(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}

function AddPropertyModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ name: "", address: "", city: "", state: "", zip: "", bedrooms: "3", bathrooms: "2" });
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("properties").insert({ ...form, landlord_id: user!.id });
    onSaved();
    onClose();
  }

  return (
    <Modal title="Add Property" onClose={onClose}>
      <form onSubmit={save} className="space-y-4">
        <div>
          <label className="label">Property name / unit</label>
          <input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required placeholder="e.g. Unit 2B – Oak Ave" />
        </div>
        <div>
          <label className="label">Street address</label>
          <input className="input" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} required />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-1">
            <label className="label">City</label>
            <input className="input" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} required />
          </div>
          <div>
            <label className="label">State</label>
            <input className="input" value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))} required maxLength={2} placeholder="CA" />
          </div>
          <div>
            <label className="label">ZIP</label>
            <input className="input" value={form.zip} onChange={(e) => setForm((f) => ({ ...f, zip: e.target.value }))} required />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Bedrooms</label>
            <input type="number" className="input" value={form.bedrooms} onChange={(e) => setForm((f) => ({ ...f, bedrooms: e.target.value }))} min="0" max="10" required />
          </div>
          <div>
            <label className="label">Bathrooms</label>
            <input type="number" className="input" value={form.bathrooms} onChange={(e) => setForm((f) => ({ ...f, bathrooms: e.target.value }))} min="0" max="10" step="0.5" required />
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" className="btn-primary flex-1" disabled={saving}>
            {saving ? "Saving…" : "Add property"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function NewInspectionModal({ propertyId, onClose, onSaved }: { propertyId: string; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ tenant_name: "", tenant_email: "", type: "move_in" });
  const [saving, setSaving] = useState(false);
  const [link, setLink] = useState("");
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
      // Get property bed/bath counts to generate TAR-style rooms
      const { data: prop } = await supabase
        .from("properties")
        .select("bedrooms, bathrooms")
        .eq("id", propertyId)
        .single();
      const { buildTARRooms } = await import("@/types");
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
            room.items.map((item, ii) => ({
              room_id: roomRow.id,
              name: item,
              sort_order: ii,
            }))
          );
        }
      }
      setLink(`${window.location.origin}/tenant/inspect/${insp.id}`);
    }
    onSaved();
    setSaving(false);
  }

  if (link) {
    return (
      <Modal title="Inspection link created" onClose={onClose}>
        <p className="text-sm text-gray-600 mb-3">Share this link with the tenant:</p>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 font-mono text-xs break-all select-all">
          {link}
        </div>
        <button
          onClick={() => { navigator.clipboard.writeText(link); }}
          className="btn-secondary w-full mt-3"
        >
          Copy link
        </button>
        <button onClick={onClose} className="btn-primary w-full mt-2">Done</button>
      </Modal>
    );
  }

  return (
    <Modal title="New Inspection" onClose={onClose}>
      <form onSubmit={save} className="space-y-4">
        <div>
          <label className="label">Inspection type</label>
          <div className="grid grid-cols-2 gap-2">
            {(["move_in", "move_out"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setForm((f) => ({ ...f, type: t }))}
                className={`py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                  form.type === t
                    ? "border-primary-600 bg-primary-50 text-primary-700"
                    : "border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
              >
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
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" className="btn-primary flex-1" disabled={saving}>
            {saving ? "Creating…" : "Create & get link"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
}
