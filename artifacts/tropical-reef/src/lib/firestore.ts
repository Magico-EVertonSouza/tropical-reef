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
} from "firebase/firestore";

import { db } from "./firebase";

import type {
  Coral,
  CoralCategory,
  CoralStatus,
  CoralFormData,
} from "@/types/coral";

const CORALS_COLLECTION = "corals";

/* =========================
   GET CORALS
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

  const corals = snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    createdAt: d.data().createdAt?.toDate?.() ?? null,
  })) as Coral[];

  // ordenar no cliente
  corals.sort((a, b) => {
    const aTime = (a.createdAt as Date | null)?.getTime() ?? 0;
    const bTime = (b.createdAt as Date | null)?.getTime() ?? 0;
    return bTime - aTime;
  });

  console.log(`[Firestore] ${corals.length} corais carregados`);
  return corals;
}

/* =========================
   CREATE CORAL (🔥 FIX)
========================= */
export async function createCoral(data: CoralFormData): Promise<string> {
  const allCorals = await getDocs(collection(db, CORALS_COLLECTION));

  const code = `TR-${String(allCorals.size + 1).padStart(3, "0")}`;

  const docRef = await addDoc(collection(db, CORALS_COLLECTION), {
    name: data.name,
    price: data.price,
    category: data.category,
    description: data.description,
    size: data.size,
    status: data.status,
    code,
    imageUrl: data.imageUrl || "", // ✅ CLOUDINARY URL
    createdAt: serverTimestamp(),
  });

  return docRef.id;
}

/* =========================
   UPDATE CORAL (🔥 FIX)
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
  };

  // ✅ atualiza imagem se vier nova URL
  if (data.imageUrl) {
    updateData.imageUrl = data.imageUrl;
  }

  await updateDoc(docRef, updateData);
}

/* =========================
   DELETE CORAL
========================= */
export async function deleteCoral(
  id: string
): Promise<void> {
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
      createdAt: serverTimestamp(),
    });
  }

  await batch.commit();
}