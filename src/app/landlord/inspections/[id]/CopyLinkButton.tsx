"use client";
import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function CopyLinkButton({ inspectionId }: { inspectionId: string }) {
  const [copied, setCopied] = useState(false);
  const url = `https://inspection-app-bay.vercel.app/tenant/inspect/${inspectionId}`;

  function copy() {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={copy}
      className="flex items-center gap-1 bg-yellow-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-yellow-700 transition-colors whitespace-nowrap"
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copied!" : "Copy link"}
    </button>
  );
}
