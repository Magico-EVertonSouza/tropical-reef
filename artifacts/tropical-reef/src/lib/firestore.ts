import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  where,
  query,
  serverTimestamp,
  writeBatch,
  onSnapshot,
  type Unsubscribe,
} from "firebase/firestore";

import { db } from "./firebase";

import type {
  Coral,
  CoralCategory,
  CoralStatus,
  CoralFormData,
} from "@/types/coral";

const CORALS_COLLECTION = "corals";

const VALID_CATEGORIES: CoralCategory[] = [
  "Zoanthus", "SPS", "LPS", "Softcoral", "Acropora", "Other",
];
const VALID_STATUSES: CoralStatus[] = ["available", "reserved", "sold"];

/* =========================
   VALIDATION HELPERS
========================= */
function validateCoralData(data: Partial<CoralFormData>): void {
  if (data.name !== undefined && (typeof data.name !== "string" || data.name.trim().length < 2)) {
    throw new Error("Nome inválido (mínimo 2 caracteres).");
  }
  if (data.price !== undefined && (typeof data.price !== "number" || data.price <= 0)) {
    throw new Error("Preço deve ser maior que zero.");
  }
  if (data.stock !== undefined && (typeof data.stock !== "number" || data.stock < 0)) {
    throw new Error("Estoque não pode ser negativo.");
  }
  if (data.category !== undefined && !VALID_CATEGORIES.includes(data.category)) {
    throw new Error(`Categoria inválida: ${data.category}`);
  }
  if (data.status !== undefined && !VALID_STATUSES.includes(data.status)) {
    throw new Error(`Status inválido: ${data.status}`);
  }
}

/* Strips undefined and null keys so Firestore never receives undefined values */
function cleanObject(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null)
  );
}

function docToCoral(d: any): Coral {
  return {
    id: d.id,
    ...d.data(),
    stock: d.data().stock ?? 1,
    createdAt: d.data().createdAt?.toDate?.() ?? null,
  } as Coral;
}

/* =========================
   GET CORALS (one-time)
========================= */
export async function getCorals(filters?: {
  category?: CoralCategory;
  status?: CoralStatus;
}): Promise<Coral[]> {
  try {
    let snapshot;

    if (filters?.category) {
      const q = query(
        collection(db, CORALS_COLLECTION),
        where("category", "==", filters.category)
      );
      snapshot = await getDocs(q);
    } else {
      snapshot = await getDocs(collection(db, CORALS_COLLECTION));
    }

    const corals = snapshot.docs.map(docToCoral);
    corals.sort((a, b) => {
      const aTime = (a.createdAt as Date | null)?.getTime() ?? 0;
      const bTime = (b.createdAt as Date | null)?.getTime() ?? 0;
      return bTime - aTime;
    });

    return corals;
  } catch (err) {
    console.error("[Firestore] getCorals falhou:", err);
    throw new Error("Não foi possível carregar os corais.");
  }
}

/* =========================
   SUBSCRIBE CORALS (real-time)
========================= */
export function subscribeCorals(
  onUpdate: (corals: Coral[]) => void,
  onError?: (err: Error) => void,
  filters?: { category?: CoralCategory }
): Unsubscribe {
  const q = filters?.category
    ? query(
        collection(db, CORALS_COLLECTION),
        where("category", "==", filters.category)
      )
    : collection(db, CORALS_COLLECTION);

  return onSnapshot(
    q,
    (snapshot) => {
      const corals = snapshot.docs.map(docToCoral);
      corals.sort((a, b) => {
        const aTime = (a.createdAt as Date | null)?.getTime() ?? 0;
        const bTime = (b.createdAt as Date | null)?.getTime() ?? 0;
        return bTime - aTime;
      });
      onUpdate(corals);
    },
    (err) => {
      console.error("[Firestore] onSnapshot error:", err);
      onError?.(err instanceof Error ? err : new Error(err.message));
    }
  );
}

/* =========================
   CREATE CORAL
========================= */
export async function createCoral(data: CoralFormData): Promise<string> {
  validateCoralData(data);

  if (!data.imageUrl || typeof data.imageUrl !== "string" || !data.imageUrl.startsWith("http")) {
    throw new Error("URL de imagem inválida.");
  }

  try {
    const allCorals = await getDocs(collection(db, CORALS_COLLECTION));
    const code = `TR-${String(allCorals.size + 1).padStart(3, "0")}`;

    const payload = cleanObject({
      name: data.name.trim(),
      price: data.price,
      category: data.category,
      description: (data.description ?? "").trim(),
      size: (data.size ?? "").trim(),
      status: data.status,
      stock: data.stock ?? 1,
      code,
      imageUrl: data.imageUrl,
      createdAt: serverTimestamp(),
    });

    const docRef = await addDoc(collection(db, CORALS_COLLECTION), payload);
    console.log("[Firestore] Coral criado:", docRef.id);
    return docRef.id;
  } catch (err: any) {
    console.error("[Firestore] createCoral falhou:", err);
    if (err.code === "permission-denied") {
      throw new Error("Sem permissão. Verifique se você é administrador.");
    }
    throw err instanceof Error ? err : new Error("Erro ao criar coral.");
  }
}

/* =========================
   UPDATE CORAL
========================= */
export async function updateCoral(
  id: string,
  data: Partial<CoralFormData>
): Promise<void> {
  if (!id) throw new Error("ID do coral inválido.");
  validateCoralData(data);

  try {
    const raw: Record<string, unknown> = {};

    if (data.name !== undefined)        raw.name        = data.name.trim();
    if (data.price !== undefined)       raw.price       = data.price;
    if (data.category !== undefined)    raw.category    = data.category;
    if (data.description !== undefined) raw.description = data.description.trim();
    if (data.size !== undefined)        raw.size        = (data.size ?? "").trim();
    if (data.status !== undefined)      raw.status      = data.status;
    if (data.stock !== undefined)       raw.stock       = data.stock;
    if (data.imageUrl)                  raw.imageUrl    = data.imageUrl;

    const payload = cleanObject(raw);

    if (Object.keys(payload).length === 0) {
      throw new Error("Nenhum campo válido para atualizar.");
    }

    console.log("[Firestore] updateCoral — status:", data.status, "| stock:", data.stock);
    await updateDoc(doc(db, CORALS_COLLECTION, id), payload);
    console.log("[Firestore] updateCoral — sucesso");
  } catch (err: any) {
    console.error("[Firestore] updateCoral falhou:", err);
    if (err.code === "permission-denied") {
      throw new Error("Sem permissão. Verifique se você é administrador.");
    }
    throw err instanceof Error ? err : new Error("Erro ao atualizar coral.");
  }
}

/* =========================
   DELETE CORAL
========================= */
export async function deleteCoral(id: string): Promise<void> {
  if (!id) throw new Error("ID do coral inválido.");
  try {
    await deleteDoc(doc(db, CORALS_COLLECTION, id));
    console.log("[Firestore] Coral excluído:", id);
  } catch (err: any) {
    console.error("[Firestore] deleteCoral falhou:", err);
    if (err.code === "permission-denied") {
      throw new Error("Sem permissão. Verifique se você é administrador.");
    }
    throw new Error("Erro ao excluir coral.");
  }
}

/* =========================
   BATCH INSERT (SEED)
========================= */
export async function batchInsertCorals(
  corals: Array<Record<string, unknown>>
): Promise<void> {
  try {
    const batch = writeBatch(db);
    for (const coral of corals) {
      const newDoc = doc(collection(db, CORALS_COLLECTION));
      batch.set(newDoc, cleanObject({
        ...coral,
        stock: coral.stock ?? 1,
        createdAt: serverTimestamp(),
      }));
    }
    await batch.commit();
  } catch (err: any) {
    console.error("[Firestore] batchInsertCorals falhou:", err);
    if (err.code === "permission-denied") {
      throw new Error("Sem permissão para inserir corais. Verifique as regras do Firestore.");
    }
    throw new Error("Erro ao inserir corais em lote.");
  }
}
