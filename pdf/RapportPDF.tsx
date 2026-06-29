import React from "react";
import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";

const BRAND = "#0891B2";

const s = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: "Helvetica", color: "#1a1a1a" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 18, borderBottom: `2 solid ${BRAND}`, paddingBottom: 10 },
  brand: { fontSize: 18, fontFamily: "Helvetica-Bold", color: BRAND },
  small: { fontSize: 8, color: "#555" },
  title: { fontSize: 14, fontFamily: "Helvetica-Bold", marginTop: 8, marginBottom: 6 },
  ref: { fontSize: 9, color: "#666" },
  block: { marginBottom: 12 },
  label: { fontFamily: "Helvetica-Bold", color: BRAND, marginBottom: 3, fontSize: 10 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  photo: { width: 150, height: 110, objectFit: "cover", marginRight: 8, marginBottom: 8, borderRadius: 3 },
  table: { marginTop: 6 },
  tr: { flexDirection: "row", borderBottom: "1 solid #eee", paddingVertical: 4 },
  thLib: { flex: 3, fontFamily: "Helvetica-Bold", fontSize: 9 },
  thNum: { flex: 1, textAlign: "right", fontFamily: "Helvetica-Bold", fontSize: 9 },
  tdLib: { flex: 3 },
  tdNum: { flex: 1, textAlign: "right" },
  totalRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 8 },
  totalTtc: { fontFamily: "Helvetica-Bold", fontSize: 12, color: BRAND },
  footer: { position: "absolute", bottom: 24, left: 36, right: 36, fontSize: 7, color: "#888", textAlign: "center", borderTop: "1 solid #eee", paddingTop: 6 },
});

export type RapportData = {
  societe: { raisonSociale: string; adresse: string; codePostal: string; ville: string; tel: string; email: string; siret: string };
  reference: string;
  date: string;
  client: string;
  adresse: string;
  ville: string;
  codePostal: string;
  typeService: string;
  notes?: string | null;
  photosAvant: string[];
  photosApres: string[];
  travaux: { libelle: string; quantite: number; prixUnitaire: number; total: number }[];
  ttc: number;
};

const fmt = (n: number) => n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

export function RapportPDF({ d }: { d: RapportData }) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View>
            <Text style={s.brand}>{d.societe.raisonSociale}</Text>
            <Text style={s.small}>{d.societe.adresse}, {d.societe.codePostal} {d.societe.ville}</Text>
            <Text style={s.small}>Tél : {d.societe.tel} — {d.societe.email}</Text>
            <Text style={s.small}>SIRET : {d.societe.siret}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={s.title}>Rapport d'intervention</Text>
            <Text style={s.ref}>Réf. {d.reference}</Text>
            <Text style={s.ref}>{d.date}</Text>
          </View>
        </View>

        <View style={s.block}>
          <Text style={s.label}>Client</Text>
          <Text>{d.client}</Text>
          <Text>{d.adresse}, {d.codePostal} {d.ville}</Text>
        </View>

        <View style={s.block}>
          <Text style={s.label}>Prestation réalisée</Text>
          <Text>{d.typeService}</Text>
          {d.notes ? <Text style={{ marginTop: 4, color: "#444" }}>{d.notes}</Text> : null}
        </View>

        {d.travaux.length > 0 && (
          <View style={s.block}>
            <Text style={s.label}>Travaux supplémentaires</Text>
            <View style={s.table}>
              <View style={s.tr}>
                <Text style={s.thLib}>Désignation</Text>
                <Text style={s.thNum}>Qté</Text>
                <Text style={s.thNum}>PU</Text>
                <Text style={s.thNum}>Total</Text>
              </View>
              {d.travaux.map((t, i) => (
                <View style={s.tr} key={i}>
                  <Text style={s.tdLib}>{t.libelle}</Text>
                  <Text style={s.tdNum}>{t.quantite}</Text>
                  <Text style={s.tdNum}>{fmt(t.prixUnitaire)}</Text>
                  <Text style={s.tdNum}>{fmt(t.total)}</Text>
                </View>
              ))}
            </View>
            <View style={s.totalRow}>
              <Text style={s.totalTtc}>Total TTC : {fmt(d.ttc)}</Text>
            </View>
          </View>
        )}

        <View style={s.block}>
          <Text style={s.label}>Photos avant</Text>
          <View style={s.row}>
            {d.photosAvant.map((url, i) => <Image key={i} src={url} style={s.photo} />)}
          </View>
        </View>

        <View style={s.block}>
          <Text style={s.label}>Photos après</Text>
          <View style={s.row}>
            {d.photosApres.map((url, i) => <Image key={i} src={url} style={s.photo} />)}
          </View>
        </View>

        <Text style={s.footer}>
          {d.societe.raisonSociale} — {d.societe.adresse}, {d.societe.codePostal} {d.societe.ville} — SIRET {d.societe.siret}
        </Text>
      </Page>
    </Document>
  );
}
