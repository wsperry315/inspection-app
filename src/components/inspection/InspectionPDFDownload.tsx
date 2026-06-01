"use client";
import { useState } from "react";
import { Download } from "lucide-react";

interface Props {
  inspection: {
    id: string;
    type: string;
    tenant_name: string | null;
    tenant_email: string | null;
    submitted_at: string | null;
    signature_data_url: string | null;
    notes: string | null;
  };
  rooms: {
    id: string;
    name: string;
    items: {
      id: string;
      name: string;
      condition: string | null;
      notes: string | null;
      photos: { id: string; storage_path: string; caption: string | null }[];
    }[];
  }[];
  property: { name: string; address: string; city: string; state: string; zip: string } | null;
}

export function InspectionPDFDownload({ inspection, rooms, property }: Props) {
  const [generating, setGenerating] = useState(false);

  async function handleDownload() {
    setGenerating(true);
    const { generateInspectionPDF } = await import("./generatePDF");
    await generateInspectionPDF({ inspection, rooms, property });
    setGenerating(false);
  }

  return (
    <button onClick={handleDownload} disabled={generating} className="btn-secondary text-sm">
      <Download className="w-4 h-4" />
      {generating ? "Generating PDF…" : "Download PDF"}
    </button>
  );
}
