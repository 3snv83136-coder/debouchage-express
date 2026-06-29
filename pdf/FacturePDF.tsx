import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const BRAND = "#0891B2";
const fmt = (n: number) => n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

const s = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#1a1a1a" },
  top: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  brand: { fontSize: 18, fontFamily: "Helvetica-Bold", color: BRAND },
  small: { fontSize: 8, color: "#555", marginTop: 1 },
  factBox: { alignItems: "flex-end" },
  factTitle: { fontSize: 16, fontFamily: "Helvetica-Bold" },
  meta: { fontSize: 9, color: "#666", marginTop: 2 },
  clientBox: { marginBottom: 20, padding: 10, backgroundColor: "#ECFEFF", borderRadius: 4 },
  label: { fontFamily: "Helvetica-Bold", color: BRAND, fontSize: 9, marginBottom: 3 },
  table: { marginTop: 4, borderTop: `1 solid ${BRAND}` },
  trHead: { flexDirection: "row", backgroundColor: BRAND, paddingVertical: 5, paddingHorizontal: 4 },
  th: { color: "#fff", fontFamily: "Helvetica-Bold", fontSize: 9 },
  tr: { flexDirection: "row", borderBottom: "1 solid #eee", paddingVertical: 5, paddingHorizontal: 4 },
  cLib: { flex: 4 },
  cNum: { flex: 1, textAlign: "right" },
  totals: { marginTop: 12, alignSelf: "flex-end", width: 200 },
  totLine: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  totTtc: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, marginTop: 4, borderTop: `2 solid ${BRAND}` },
  totTtcTxt: { fontFamily: "Helvetica-Bold", fontSize: 12, color: BRAND },
  pay: { marginTop: 24, fontSize: 8, color: "#444" },
  footer: { position: "absolute", bottom: 24, left: 40, right: 40, fontSize: 7, color: "#888", textAlign: "center", borderTop: "1 solid #eee", paddingTop: 6 },
});

export type FactureData = {
  societe: { raisonSociale: string; adresse: string; codePostal: string; ville: string; tel: string; email: string; siret: string; tva: string; iban: string; tauxTva: number };
  numero: string;
  date: string;
  client: string;
  clientAdresse: string;
  clientVille: string;
  clientCp: string;
  lignes: { libelle: string; quantite: number; prixUnitaire: number; total: number }[];
  ht: number;
  tva: number;
  ttc: number;
};

export function FacturePDF({ d }: { d: FactureData }) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.top}>
          <View>
            <Text style={s.brand}>{d.societe.raisonSociale}</Text>
            <Text style={s.small}>{d.societe.adresse}</Text>
            <Text style={s.small}>{d.societe.codePostal} {d.societe.ville}</Text>
            <Text style={s.small}>Tél : {d.societe.tel}</Text>
            <Text style={s.small}>{d.societe.email}</Text>
            <Text style={s.small}>SIRET : {d.societe.siret}</Text>
            <Text style={s.small}>TVA : {d.societe.tva}</Text>
          </View>
          <View style={s.factBox}>
            <Text style={s.factTitle}>FACTURE</Text>
            <Text style={s.meta}>N° {d.numero}</Text>
            <Text style={s.meta}>Date : {d.date}</Text>
          </View>
        </View>

        <View style={s.clientBox}>
          <Text style={s.label}>Facturé à</Text>
          <Text>{d.client}</Text>
          <Text>{d.clientAdresse}</Text>
          <Text>{d.clientCp} {d.clientVille}</Text>
        </View>

        <View style={s.table}>
          <View style={s.trHead}>
            <Text style={[s.th, s.cLib]}>Désignation</Text>
            <Text style={[s.th, s.cNum]}>Qté</Text>
            <Text style={[s.th, s.cNum]}>PU HT</Text>
            <Text style={[s.th, s.cNum]}>Total HT</Text>
          </View>
          {d.lignes.map((l, i) => (
            <View style={s.tr} key={i}>
              <Text style={s.cLib}>{l.libelle}</Text>
              <Text style={s.cNum}>{l.quantite}</Text>
              <Text style={s.cNum}>{fmt(l.prixUnitaire)}</Text>
              <Text style={s.cNum}>{fmt(l.total)}</Text>
            </View>
          ))}
        </View>

        <View style={s.totals}>
          <View style={s.totLine}><Text>Total HT</Text><Text>{fmt(d.ht)}</Text></View>
          <View style={s.totLine}><Text>TVA ({d.societe.tauxTva} %)</Text><Text>{fmt(d.tva)}</Text></View>
          <View style={s.totTtc}><Text style={s.totTtcTxt}>Total TTC</Text><Text style={s.totTtcTxt}>{fmt(d.ttc)}</Text></View>
        </View>

        <Text style={s.pay}>
          Règlement à réception. Coordonnées bancaires : IBAN {d.societe.iban}.{"\n"}
          En cas de retard de paiement, pénalités au taux légal en vigueur + indemnité forfaitaire de 40 € (art. L441-10 du Code de commerce).
        </Text>

        <Text style={s.footer}>
          {d.societe.raisonSociale} — {d.societe.adresse}, {d.societe.codePostal} {d.societe.ville} — SIRET {d.societe.siret} — TVA {d.societe.tva}
        </Text>
      </Page>
    </Document>
  );
}
