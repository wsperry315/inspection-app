import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  pdf,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", fontSize: 10, color: "#1a1a1a" },
  header: { marginBottom: 24 },
  title: { fontSize: 20, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  subtitle: { fontSize: 11, color: "#555" },
  meta: { flexDirection: "row", gap: 24, marginTop: 12, flexWrap: "wrap" },
  metaItem: { flexDirection: "column" },
  metaLabel: { fontSize: 8, color: "#888", textTransform: "uppercase", letterSpacing: 0.5 },
  metaValue: { fontSize: 10, fontFamily: "Helvetica-Bold", marginTop: 2 },
  divider: { borderBottom: "1px solid #e5e7eb", marginVertical: 16 },
  roomSection: { marginBottom: 20 },
  roomTitle: { fontSize: 13, fontFamily: "Helvetica-Bold", marginBottom: 10, color: "#1e40af" },
  itemRow: { flexDirection: "row", marginBottom: 8, borderBottom: "1px solid #f3f4f6", paddingBottom: 8 },
  itemName: { flex: 1, fontSize: 10 },
  itemCondition: { fontSize: 9, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8 },
  itemNotes: { fontSize: 9, color: "#555", marginTop: 3, marginLeft: 8, flex: 1 },
  photos: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4, marginLeft: 8 },
  photo: { width: 80, height: 80, objectFit: "cover", borderRadius: 4 },
  signatureSection: { marginTop: 24 },
  signatureLabel: { fontSize: 9, color: "#888", marginBottom: 4 },
  signatureImage: { width: 200, height: 60, objectFit: "contain", borderBottom: "1px solid #000" },
  signerName: { fontSize: 10, marginTop: 4 },
  footer: { position: "absolute", bottom: 20, left: 40, right: 40, fontSize: 8, color: "#aaa", flexDirection: "row", justifyContent: "space-between" },
});

const CONDITION_COLORS: Record<string, { bg: string; text: string }> = {
  excellent: { bg: "#dcfce7", text: "#166534" },
  good: { bg: "#d1fae5", text: "#065f46" },
  fair: { bg: "#fef9c3", text: "#854d0e" },
  poor: { bg: "#fee2e2", text: "#991b1b" },
  na: { bg: "#f3f4f6", text: "#6b7280" },
};

interface PDFProps {
  inspection: {
    type: string;
    tenant_name: string | null;
    tenant_email: string | null;
    submitted_at: string | null;
    signature_data_url: string | null;
    notes: string | null;
  };
  rooms: {
    name: string;
    items: {
      name: string;
      condition: string | null;
      notes: string | null;
      photos: { storage_path: string; caption: string | null }[];
    }[];
  }[];
  property: { name: string; address: string; city: string; state: string; zip: string } | null;
}

function InspectionPDFDoc({ inspection, rooms, property }: PDFProps) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {inspection.type === "move_in" ? "Move-in" : "Move-out"} Inspection Report
          </Text>
          {property && (
            <Text style={styles.subtitle}>
              {property.name} — {property.address}, {property.city}, {property.state} {property.zip}
            </Text>
          )}
          <View style={styles.meta}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Tenant</Text>
              <Text style={styles.metaValue}>{inspection.tenant_name || "—"}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Email</Text>
              <Text style={styles.metaValue}>{inspection.tenant_email || "—"}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Date</Text>
              <Text style={styles.metaValue}>
                {inspection.submitted_at
                  ? new Date(inspection.submitted_at).toLocaleDateString()
                  : new Date().toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {rooms.map((room) => (
          <View key={room.name} style={styles.roomSection} wrap={false}>
            <Text style={styles.roomTitle}>{room.name}</Text>
            {room.items.map((item) => {
              const cond = item.condition ?? "na";
              const condColor = CONDITION_COLORS[cond] ?? CONDITION_COLORS.na;
              return (
                <View key={item.name}>
                  <View style={styles.itemRow}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <View style={{ backgroundColor: condColor.bg, ...styles.itemCondition }}>
                      <Text style={{ color: condColor.text }}>
                        {cond === "na" ? "N/A" : cond.charAt(0).toUpperCase() + cond.slice(1)}
                      </Text>
                    </View>
                  </View>
                  {item.notes && (
                    <Text style={styles.itemNotes}>Note: {item.notes}</Text>
                  )}
                  {item.photos && item.photos.length > 0 && (
                    <View style={styles.photos}>
                      {item.photos.map((p, i) => (
                        <Image
                          key={i}
                          src={`${supabaseUrl}/storage/v1/object/public/inspection-photos/${p.storage_path}`}
                          style={styles.photo}
                        />
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        ))}

        {inspection.notes && (
          <View style={{ marginTop: 16 }}>
            <Text style={{ fontFamily: "Helvetica-Bold", marginBottom: 4 }}>Additional Notes</Text>
            <Text style={{ color: "#555" }}>{inspection.notes}</Text>
          </View>
        )}

        <View style={styles.signatureSection}>
          <View style={styles.divider} />
          <Text style={styles.signatureLabel}>Tenant Signature</Text>
          {inspection.signature_data_url && (
            <Image src={inspection.signature_data_url} style={styles.signatureImage} />
          )}
          <Text style={styles.signerName}>{inspection.tenant_name}</Text>
        </View>

        <View style={styles.footer} fixed>
          <Text>MoveCheck Inspection Report</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

export async function generateInspectionPDF(props: PDFProps) {
  const blob = await pdf(<InspectionPDFDoc {...props} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `inspection-${props.inspection.type}-${new Date().toISOString().slice(0, 10)}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
