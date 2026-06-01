import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const { inspectionId } = await req.json();
  const supabase = await createClient();

  // Get inspection + property details
  const { data: insp, error } = await supabase
    .from("inspections")
    .select("*, property:properties(name, address, city, state)")
    .eq("id", inspectionId)
    .single();

  if (error || !insp) {
    return NextResponse.json({ error: "Inspection not found" }, { status: 404 });
  }

  const property = insp.property as { name: string; address: string; city: string; state: string } | null;
  const inspectionUrl = `${process.env.NEXT_PUBLIC_APP_URL}/tenant/inspect/${inspectionId}`;
  const type = insp.type === "move_in" ? "Move-In" : "Move-Out";

  // Send email via Supabase Edge Function / SMTP
  // We use the Resend-compatible fetch approach
  const emailBody = {
    to: insp.tenant_email,
    subject: `Your ${type} Inspection is Ready — ${property?.name ?? ""}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #0284c7; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">MoveCheck</h1>
          <p style="color: #bae6fd; margin: 4px 0 0;">Property Inspection</p>
        </div>

        <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
          <p style="font-size: 16px; color: #1e293b;">Hi ${insp.tenant_name || "there"},</p>

          <p style="color: #475569;">Your <strong>${type} Inspection</strong> for the following property is ready to complete:</p>

          <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold; color: #1e293b;">${property?.name ?? ""}</p>
            <p style="margin: 4px 0 0; color: #64748b;">${property?.address ?? ""}, ${property?.city ?? ""}, ${property?.state ?? ""}</p>
          </div>

          <p style="color: #475569;">Please walk through the property, rate each room and item, add photos where needed, and sign at the end.</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${inspectionUrl}"
               style="background: #0284c7; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">
              Start Inspection
            </a>
          </div>

          <p style="color: #94a3b8; font-size: 13px;">Or copy this link: <a href="${inspectionUrl}" style="color: #0284c7;">${inspectionUrl}</a></p>

          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />

          <p style="color: #94a3b8; font-size: 12px; margin: 0;">
            This email was sent by WS Perry Co via MoveCheck.
            Keep this email so you can return to your inspection at any time.
          </p>
        </div>
      </div>
    `,
  };

  // Use Resend for reliable email delivery
  const resendKey = process.env.RESEND_API_KEY;

  if (resendKey) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM ?? "MoveCheck <inspections@wsperryco.com>",
        to: emailBody.to,
        subject: emailBody.subject,
        html: emailBody.html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: 500 });
    }
  }

  // Mark inspection as email sent
  await supabase
    .from("inspections")
    .update({ status: "pending" })
    .eq("id", inspectionId);

  return NextResponse.json({ success: true, url: inspectionUrl });
}
