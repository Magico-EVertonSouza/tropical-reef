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
  console.log("[Firestore] getCorals:", filters ?? "sem filtro");

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

  console.log(`[Firestore] ${corals.length} corais carregados`);
  return corals;
}

/* =========================
   SUBSCRIBE CORALS (real-time)
========================= */
export function subscribeCorals(
  onUpdate: (corals: Coral[]) => void,
  onError?: (err: Error) => void,
  filters?: { category?: CoralCategory }
): Unsubscribe {
  let q;
  if (filters?.category) {
    q = query(
      collection(db, CORALS_COLLECTION),
      where("category", "==", filters.category)
    );
  } else {
    q = collection(db, CORALS_COLLECTION);
  }

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const corals = snapshot.docs.map(docToCoral);
      corals.sort((a, b) => {
        const aTime = (a.createdAt as Date | null)?.getTime() ?? 0;
        const bTime = (b.createdAt as Date | null)?.getTime() ?? 0;
        return bTime - aTime;
      });
      console.log(`[Firestore] onSnapshot: ${corals.length} corais`);
      onUpdate(corals);
    },
    (err) => {
      console.error("[Firestore] onSnapshot error:", err);
      onError?.(err);
    }
  );

  return unsubscribe;
}

/* =========================
   CREATE CORAL
========================= */
export async function createCoral(data: CoralFormData): Promise<string> {
  const allCorals = await getDocs(collection(db, CORALS_COLLECTION));
  const code = `TR-${String(allCorals.size + 1).padStart(3, "0")}`;

  console.log("[Firestore] createCoral — status:", data.status, "stock:", data.stock);

  const docRef = await addDoc(collection(db, CORALS_COLLECTION), {
    name: data.name,
    price: data.price,
    category: data.category,
    description: data.description,
    size: data.size,
    status: data.status,
    stock: data.stock ?? 1,
    code,
    imageUrl: data.imageUrl || "",
    createdAt: serverTimestamp(),
  });

  return docRef.id;
}

/* =========================
   UPDATE CORAL
========================= */
export async function updateCoral(
  id: string,
  data: Partial<CoralFormData>
): Promise<void> {
  const docRef = doc(db, CORALS_COLLECTION, id);

  const updateData: Record<string, unknown> = {
    name: data.name,
    price: data.price,
    category: data.category,
    description: data.description,
    size: data.size,
    status: data.status,
    stock: data.stock ?? 1,
  };

  if (data.imageUrl) {
    updateData.imageUrl = data.imageUrl;
  }

  console.log("[Firestore] updateCoral — id:", id, "status:", data.status, "stock:", data.stock);

  await updateDoc(docRef, updateData);

  console.log("[Firestore] updateCoral — sucesso");
}

/* =========================
   DELETE CORAL
========================= */
export async function deleteCoral(id: string): Promise<void> {
  await deleteDoc(doc(db, CORALS_COLLECTION, id));
}

/* =========================
   BATCH INSERT (SEED)
========================= */
export async function batchInsertCorals(
  corals: Array<Record<string, unknown>>
): Promise<void> {
  const batch = writeBatch(db);

  for (const coral of corals) {
    const newDoc = doc(collection(db, CORALS_COLLECTION));
    batch.set(newDoc, {
      ...coral,
      stock: coral.stock ?? 1,
      createdAt: serverTimestamp(),
    });
  }

  await batch.commit();
}
