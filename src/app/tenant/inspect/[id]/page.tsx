import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { TenantInspectionFlow } from "@/components/inspection/TenantInspectionFlow";

export default async function TenantInspectPage({ params }: { params: Promise<{ id: string }> }) {
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

  return (
    <TenantInspectionFlow
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      inspection={insp as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      initialRooms={(rooms ?? []) as any}
    />
  );
}
