"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Upload, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface ParsedProperty {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  valid: boolean;
  reason?: string;
}

function parseAppFolioCSV(text: string): ParsedProperty[] {
  const lines = text.split("\n").slice(1); // skip header
  const results: ParsedProperty[] = [];

  for (const line of lines) {
    if (!line.trim()) continue;

    // Extract first quoted field (the Property column)
    const match = line.match(/^"([^"]+)"/);
    if (!match) continue;

    const raw = match[1].trim();

    // Skip totals row and blank/non-address entries
    if (raw.toLowerCase().startsWith("total")) continue;
    if (!raw.match(/\d/)) continue; // must have a number (street number)

    // Try to parse: "Address City, ST ZIP"
    // AppFolio format examples:
    // "1005 Trinity Oaks Rd. Weatherford, TX 76087"
    // "1301 Throckmorton, unit 2805 Fort Worth, TX 76102"
    // "1412 Virginia Place - 1412 Virginia Place Fort Worth, TX 76107"

    // Remove duplicate address pattern (e.g. "X - X City")
    let cleaned = raw.replace(/^(.+?)\s*-\s*\1\s*/i, "").trim();
    // Also handle "Name - Address City" pattern
    if (cleaned.includes(" - ")) {
      const parts = cleaned.split(" - ");
      cleaned = parts[parts.length - 1].trim();
    }

    // Match: everything before last City, ST ZIP
    const addrMatch = cleaned.match(/^(.+?),?\s+([A-Za-z\s]+),\s*(TX|OK|AR|NM|LA|CO)\s+(\d{5})$/i);
    if (!addrMatch) {
      results.push({ name: raw, address: raw, city: "", state: "TX", zip: "", valid: false, reason: "Could not parse address" });
      continue;
    }

    const streetAddress = addrMatch[1].trim();
    const city = addrMatch[2].trim();
    const state = addrMatch[3].toUpperCase();
    const zip = addrMatch[4];

    results.push({
      name: raw,
      address: streetAddress,
      city,
      state,
      zip,
      valid: true,
    });
  }

  return results;
}

export default function ImportPropertiesPage() {
  const router = useRouter();
  const [parsed, setParsed] = useState<ParsedProperty[] | null>(null);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(false);
  const [importCount, setImportCount] = useState(0);
  const supabase = createClient();

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const results = parseAppFolioCSV(text);
      setParsed(results);
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    if (!parsed) return;
    setImporting(true);

    const { data: { user } } = await supabase.auth.getUser();
    const valid = parsed.filter((p) => p.valid);
    let count = 0;

    for (const p of valid) {
      const { error } = await supabase.from("properties").insert({
        landlord_id: user!.id,
        name: p.name,
        address: p.address,
        city: p.city,
        state: p.state,
        zip: p.zip,
      });
      if (!error) count++;
    }

    setImportCount(count);
    setDone(true);
    setImporting(false);
  }

  const validCount = parsed?.filter((p) => p.valid).length ?? 0;
  const invalidCount = parsed?.filter((p) => !p.valid).length ?? 0;

  if (done) {
    return (
      <div className="p-8 max-w-xl">
        <div className="card text-center py-12">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Import complete!</h2>
          <p className="text-gray-600 mb-6">{importCount} properties imported successfully.</p>
          <Link href="/landlord/properties" className="btn-primary">
            View my properties
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl">
      <Link href="/landlord/properties" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to properties
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">Import from AppFolio</h1>
      <p className="text-gray-500 mb-8">Upload your AppFolio property directory CSV to import all properties at once.</p>

      {!parsed ? (
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">How to export from AppFolio:</h2>
          <ol className="text-sm text-gray-600 space-y-2 mb-6 list-decimal list-inside">
            <li>In AppFolio, go to <strong>Reports</strong></li>
            <li>Search for <strong>"Property Directory"</strong></li>
            <li>Run the report and click <strong>Export to CSV</strong></li>
            <li>Upload that CSV file below</li>
          </ol>

          <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-10 cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors">
            <Upload className="w-8 h-8 text-gray-400 mb-3" />
            <p className="font-medium text-gray-700">Click to upload CSV file</p>
            <p className="text-sm text-gray-400 mt-1">AppFolio Property Directory export</p>
            <input type="file" accept=".csv" onChange={handleFile} className="hidden" />
          </label>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="card bg-green-50 border-green-200">
              <p className="text-3xl font-bold text-green-700">{validCount}</p>
              <p className="text-sm text-green-600">Properties ready to import</p>
            </div>
            <div className="card bg-yellow-50 border-yellow-200">
              <p className="text-3xl font-bold text-yellow-700">{invalidCount}</p>
              <p className="text-sm text-yellow-600">Could not be parsed (will skip)</p>
            </div>
          </div>

          <div className="card max-h-96 overflow-y-auto">
            <h3 className="font-semibold text-gray-900 mb-3">Preview</h3>
            <div className="space-y-2">
              {parsed.map((p, i) => (
                <div key={i} className={`flex items-start gap-3 p-2 rounded-lg text-sm ${p.valid ? "bg-green-50" : "bg-yellow-50"}`}>
                  {p.valid ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
                  )}
                  <div>
                    <p className="font-medium text-gray-800">{p.address}{p.city ? `, ${p.city}` : ""}{p.state ? `, ${p.state}` : ""} {p.zip}</p>
                    {!p.valid && <p className="text-xs text-yellow-600">{p.reason}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setParsed(null)} className="btn-secondary flex-1">
              Choose different file
            </button>
            <button
              onClick={handleImport}
              disabled={importing || validCount === 0}
              className="btn-primary flex-1"
            >
              {importing ? "Importing…" : `Import ${validCount} properties`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
