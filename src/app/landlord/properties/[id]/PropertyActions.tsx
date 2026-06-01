"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Pencil, Trash2 } from "lucide-react";

interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  bedrooms: number;
  bathrooms: number;
}

export function PropertyActions({ property }: { property: Property }) {
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [form, setForm] = useState({
    name: property.name,
    address: property.address,
    city: property.city,
    state: property.state,
    zip: property.zip,
    bedrooms: String(property.bedrooms),
    bathrooms: String(property.bathrooms),
  });
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await supabase.from("properties").update({
      name: form.name,
      address: form.address,
      city: form.city,
      state: form.state,
      zip: form.zip,
      bedrooms: parseFloat(form.bedrooms),
      bathrooms: parseFloat(form.bathrooms),
    }).eq("id", property.id);
    setSaving(false);
    setShowEdit(false);
    router.refresh();
  }

  async function handleDelete() {
    await supabase.from("properties").delete().eq("id", property.id);
    router.push("/landlord/properties");
  }

  return (
    <>
      <button onClick={() => setShowEdit(true)} className="btn-secondary text-sm">
        <Pencil className="w-4 h-4" /> Edit
      </button>
      <button onClick={() => setShowDelete(true)} className="btn-danger text-sm">
        <Trash2 className="w-4 h-4" /> Delete
      </button>

      {/* Edit Modal */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Edit Property</h2>
              <button onClick={() => setShowEdit(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="label">Property name</label>
                <input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
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
                  <input className="input" value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))} required maxLength={2} />
                </div>
                <div>
                  <label className="label">ZIP</label>
                  <input className="input" value={form.zip} onChange={(e) => setForm((f) => ({ ...f, zip: e.target.value }))} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Bedrooms</label>
                  <input type="number" className="input" value={form.bedrooms} onChange={(e) => setForm((f) => ({ ...f, bedrooms: e.target.value }))} min="0" max="10" />
                </div>
                <div>
                  <label className="label">Bathrooms</label>
                  <input type="number" className="input" value={form.bathrooms} onChange={(e) => setForm((f) => ({ ...f, bathrooms: e.target.value }))} min="0" max="10" step="0.5" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowEdit(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1" disabled={saving}>
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-2">Delete property?</h2>
            <p className="text-sm text-gray-600 mb-6">
              This will permanently delete <strong>{property.name}</strong> and all its inspections. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDelete(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleDelete} className="btn-danger flex-1">Yes, delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
