import Link from "next/link";
import { ClipboardCheck, Home, FileText, Shield } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white">
      <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-xl text-primary-700">
          <ClipboardCheck className="w-6 h-6" />
          MoveCheck
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="btn-secondary">Log in</Link>
          <Link href="/signup" className="btn-primary">Get started</Link>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
          Move-in & move-out<br />
          <span className="text-primary-600">inspections made easy</span>
        </h1>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          Landlords send a link. Tenants walk through each room, rate conditions, snap photos, and sign.
          Get a professional PDF report instantly.
        </p>
        <Link href="/signup" className="btn-primary text-base px-6 py-3">
          Start for free
        </Link>

        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          {[
            {
              icon: Home,
              title: "Room-by-room walkthrough",
              body: "Structured checklist covering every room and item. Condition ratings from Excellent to Poor.",
            },
            {
              icon: FileText,
              title: "Photo evidence per item",
              body: "Attach multiple photos to any item during the walkthrough. All stored securely in the cloud.",
            },
            {
              icon: Shield,
              title: "Signed PDF report",
              body: "Tenants sign digitally at the end. Download a timestamped PDF with all findings and photos.",
            },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="card">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-primary-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
              <p className="text-gray-600 text-sm">{body}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
