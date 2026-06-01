"use client";
import { useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { InspectionRoom, Condition } from "@/types";
import { ChevronLeft, ChevronRight, Camera, CheckCircle2, ClipboardCheck } from "lucide-react";
import SignatureCanvas from "react-signature-canvas";
import { useDropzone } from "react-dropzone";

type Photo = { id: string; storage_path: string; caption: string | null };
type RoomItem = {
  id: string;
  room_id: string;
  name: string;
  condition: Condition | null;
  notes: string | null;
  sort_order: number;
  photos: Photo[];
};
type Room = InspectionRoom & { items: RoomItem[] };

interface Props {
  inspection: {
    id: string;
    type: string;
    status: string;
    tenant_name: string | null;
    property?: { name: string; address: string; city: string; state: string } | null;
  };
  initialRooms: Room[];
}

const CONDITIONS: { value: Condition; label: string; color: string }[] = [
  { value: "excellent", label: "Excellent", color: "bg-green-100 text-green-700 border-green-300" },
  { value: "good", label: "Good", color: "bg-emerald-100 text-emerald-700 border-emerald-300" },
  { value: "fair", label: "Fair", color: "bg-yellow-100 text-yellow-700 border-yellow-300" },
  { value: "poor", label: "Poor", color: "bg-red-100 text-red-700 border-red-300" },
  { value: "na", label: "N/A", color: "bg-gray-100 text-gray-500 border-gray-300" },
];

export function TenantInspectionFlow({ inspection, initialRooms }: Props) {
  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [step, setStep] = useState<"intro" | "rooms" | "sign" | "done">(
    inspection.status === "completed" ? "done" : "intro"
  );
  const [roomIdx, setRoomIdx] = useState(0);
  const [tenantName, setTenantName] = useState(inspection.tenant_name ?? "");
  const [saving, setSaving] = useState(false);
  const [uploadingItem, setUploadingItem] = useState<string | null>(null);
  const sigRef = useRef<SignatureCanvas>(null);
  const supabase = createClient();

  const property = inspection.property;

  function patchRoom(roomId: string, itemId: string, patch: Partial<RoomItem>): Room[] {
    return rooms.map((r): Room => {
      if (r.id !== roomId) return r;
      return {
        ...r,
        items: r.items.map((i): RoomItem => (i.id === itemId ? { ...i, ...patch, photos: i.photos ?? [] } : { ...i, photos: i.photos ?? [] })),
      };
    });
  }

  async function updateItem(roomId: string, itemId: string, patch: Partial<InspectionItem>) {
    setRooms(patchRoom(roomId, itemId, patch));
    await supabase.from("inspection_items").update(patch).eq("id", itemId);
    if (inspection.status === "pending") {
      await supabase.from("inspections").update({ status: "in_progress" }).eq("id", inspection.id);
    }
  }

  async function uploadPhoto(itemId: string, file: File) {
    setUploadingItem(itemId);
    const path = `${inspection.id}/${itemId}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("inspection-photos").upload(path, file);
    if (!error) {
      const { data } = await supabase
        .from("inspection_photos")
        .insert({ item_id: itemId, storage_path: path })
        .select()
        .single();
      if (data) {
        const photo = data as Photo;
        setRooms((prev) =>
          prev.map((r): Room => ({
            ...r,
            items: r.items.map((i): RoomItem =>
              i.id === itemId ? { ...i, photos: [...i.photos, photo] } : i
            ),
          }))
        );
      }
    }
    setUploadingItem(null);
  }

  async function removePhoto(itemId: string, photoId: string, path: string) {
    await supabase.storage.from("inspection-photos").remove([path]);
    await supabase.from("inspection_photos").delete().eq("id", photoId);
    setRooms((prev) =>
      prev.map((r): Room => ({
        ...r,
        items: r.items.map((i): RoomItem =>
          i.id === itemId ? { ...i, photos: i.photos.filter((p) => p.id !== photoId) } : i
        ),
      }))
    );
  }

  async function submit() {
    setSaving(true);
    const signatureDataUrl = sigRef.current?.toDataURL();
    await supabase.from("inspections").update({
      status: "completed",
      signature_data_url: signatureDataUrl,
      tenant_name: tenantName,
      submitted_at: new Date().toISOString(),
    }).eq("id", inspection.id);
    setStep("done");
    setSaving(false);
  }

  if (step === "done") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Inspection submitted!</h1>
          <p className="text-gray-600">
            Thank you {tenantName}. Your inspection has been recorded and the landlord has been notified.
          </p>
        </div>
      </div>
    );
  }

  if (step === "intro") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <ClipboardCheck className="w-6 h-6 text-primary-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              {inspection.type === "move_in" ? "Move-in" : "Move-out"} Inspection
            </h1>
            {property && (
              <p className="text-gray-500 mt-1">{property.name} — {property.address}, {property.city}</p>
            )}
          </div>
          <div className="card">
            <p className="text-sm text-gray-600 mb-4">
              You&apos;ll walk through <strong>{rooms.length} rooms</strong> and rate the condition of each item.
              You can add photos and notes to any item, then sign at the end.
            </p>
            <div>
              <label className="label">Your full name</label>
              <input
                className="input"
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                placeholder="Enter your full name"
              />
            </div>
            <button
              onClick={() => setStep("rooms")}
              disabled={!tenantName.trim()}
              className="btn-primary w-full mt-4"
            >
              Start inspection
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "sign") {
    return (
      <div className="min-h-screen bg-gray-50">
        <InspectionHeader inspection={inspection} property={property} />
        <div className="max-w-2xl mx-auto px-4 py-8">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Sign the inspection</h2>
          <p className="text-gray-500 text-sm mb-6">
            By signing below, you confirm this inspection accurately reflects the property&apos;s condition.
          </p>
          <div className="card mb-4">
            <label className="label">Tenant name</label>
            <input className="input" value={tenantName} onChange={(e) => setTenantName(e.target.value)} />
          </div>
          <div className="card">
            <p className="text-sm font-medium text-gray-700 mb-2">Signature</p>
            <div className="border-2 border-dashed border-gray-300 rounded-lg bg-white">
              <SignatureCanvas
                ref={sigRef}
                canvasProps={{ className: "w-full", height: 180 }}
                backgroundColor="white"
              />
            </div>
            <button onClick={() => sigRef.current?.clear()} className="text-xs text-gray-500 hover:text-gray-700 mt-2">
              Clear
            </button>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={() => setStep("rooms")} className="btn-secondary flex-1">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button onClick={submit} disabled={saving} className="btn-primary flex-1">
              {saving ? "Submitting…" : "Submit inspection"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const room = rooms[roomIdx];
  const isLast = roomIdx === rooms.length - 1;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <InspectionHeader inspection={inspection} property={property} />
      <div className="h-1 bg-gray-200">
        <div
          className="h-1 bg-primary-600 transition-all"
          style={{ width: `${((roomIdx + 1) / rooms.length) * 100}%` }}
        />
      </div>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xl font-bold text-gray-900">{room.name}</h2>
          <span className="text-sm text-gray-500">Room {roomIdx + 1} of {rooms.length}</span>
        </div>
        <p className="text-sm text-gray-500 mb-6">Rate each item and add photos if needed</p>
        <div className="space-y-4">
          {room.items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              uploading={uploadingItem === item.id}
              onConditionChange={(c) => updateItem(room.id, item.id, { condition: c })}
              onNotesChange={(n) => updateItem(room.id, item.id, { notes: n })}
              onPhotoAdd={(file) => uploadPhoto(item.id, file)}
              onPhotoRemove={(photoId, path) => removePhoto(item.id, photoId, path)}
            />
          ))}
        </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="max-w-2xl mx-auto flex gap-3">
          <button
            onClick={() => setRoomIdx((i) => Math.max(0, i - 1))}
            disabled={roomIdx === 0}
            className="btn-secondary flex-1"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
          {isLast ? (
            <button onClick={() => setStep("sign")} className="btn-primary flex-1">
              Review & sign <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={() => setRoomIdx((i) => i + 1)} className="btn-primary flex-1">
              Next room <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function InspectionHeader({ inspection, property }: { inspection: Props["inspection"]; property: Props["inspection"]["property"] }) {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="max-w-2xl mx-auto flex items-center gap-3">
        <ClipboardCheck className="w-5 h-5 text-primary-600" />
        <div>
          <p className="font-medium text-sm text-gray-900 capitalize">
            {inspection.type.replace("_", " ")} Inspection
          </p>
          {property && <p className="text-xs text-gray-500">{property.name}</p>}
        </div>
      </div>
    </header>
  );
}

function ItemCard({
  item,
  uploading,
  onConditionChange,
  onNotesChange,
  onPhotoAdd,
  onPhotoRemove,
}: {
  item: RoomItem;
  uploading: boolean;
  onConditionChange: (c: Condition) => void;
  onNotesChange: (n: string) => void;
  onPhotoAdd: (f: File) => void;
  onPhotoRemove: (photoId: string, path: string) => void;
}) {
  const [showNotes, setShowNotes] = useState(!!item.notes);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  const onDrop = useCallback(
    (files: File[]) => { if (files[0]) onPhotoAdd(files[0]); },
    [onPhotoAdd]
  );
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxFiles: 1,
  });

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-800">{item.name}</h3>
        <button onClick={() => setShowNotes((v) => !v)} className="text-xs text-gray-400 hover:text-gray-600">
          {showNotes ? "Hide notes" : "+ Notes"}
        </button>
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        {CONDITIONS.map((c) => (
          <button
            key={c.value}
            onClick={() => onConditionChange(c.value)}
            className={`px-3 py-1 rounded-lg border text-xs font-medium transition-all ${
              item.condition === c.value
                ? c.color + " ring-2 ring-offset-1 ring-current"
                : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>
      {showNotes && (
        <textarea
          className="input text-sm resize-none mb-3"
          rows={2}
          placeholder="Add notes…"
          defaultValue={item.notes ?? ""}
          onBlur={(e) => onNotesChange(e.target.value)}
        />
      )}
      {item.photos.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-3">
          {item.photos.map((p) => (
            <div key={p.id} className="relative group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${supabaseUrl}/storage/v1/object/public/inspection-photos/${p.storage_path}`}
                alt=""
                className="w-20 h-20 object-cover rounded-lg border border-gray-200"
              />
              <button
                onClick={() => onPhotoRemove(p.id, p.storage_path)}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs hidden group-hover:flex items-center justify-center"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-colors text-xs ${
          isDragActive ? "border-primary-400 bg-primary-50" : "border-gray-200 hover:border-gray-300"
        }`}
      >
        <input {...getInputProps()} />
        <Camera className="w-4 h-4 mx-auto mb-1 text-gray-400" />
        {uploading ? <p className="text-gray-500">Uploading…</p> : <p className="text-gray-400">Tap to add photo</p>}
      </div>
    </div>
  );
}
