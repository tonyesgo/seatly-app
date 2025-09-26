import { auth, db, storage } from "@/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export default function CheckFirebaseScreen() {
  const [status, setStatus] = useState("Iniciando...");
  const [firestoreDocs, setFirestoreDocs] = useState<number | null>(null);

  useEffect(() => {
    const runChecks = async () => {
      try {
        console.log("[CheckFirebase] auth:", auth.app?.name);

        // 🔹 Verificar Auth
        if (!auth) throw new Error("Auth no inicializado");
        setStatus("✅ Auth inicializado correctamente");

        // 🔹 Verificar Firestore
        const snap = await getDocs(collection(db, "reservations"));
        console.log("[CheckFirebase] reservas encontradas:", snap.size);
        setFirestoreDocs(snap.size);

        // 🔹 Verificar Storage
        if (!storage) throw new Error("Storage no inicializado");
        console.log("[CheckFirebase] Storage inicializado");

        setStatus("✅ Firebase funcionando en esta plataforma");
      } catch (err: any) {
        console.error("[CheckFirebase] Error:", err);
        setStatus("❌ Error: " + err.message);
      }
    };

    runChecks();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔍 Verificación de Firebase</Text>
      <Text style={styles.status}>{status}</Text>
      {firestoreDocs !== null && (
        <Text style={styles.status}>
          Documentos en "reservations": {firestoreDocs}
        </Text>
      )}
      {status === "Iniciando..." && <ActivityIndicator size="large" color="#007AFF" />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  status: { fontSize: 16, marginTop: 10, textAlign: "center" },
});
