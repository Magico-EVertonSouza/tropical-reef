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
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "./firebase";
import type { Coral, CoralCategory, CoralStatus, CoralFormData } from "@/types/coral";

const CORALS_COLLECTION = "corals";

export async function getCorals(filters?: {
  category?: CoralCategory;
  status?: CoralStatus;
}): Promise<Coral[]> {
  console.log("[Firestore] getCorals, filtros:", filters ?? "nenhum");

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

  // Sort client-side — no composite index required
  corals.sort((a, b) => {
    const aTime = (a.createdAt as Date | null)?.getTime() ?? 0;
    const bTime = (b.createdAt as Date | null)?.getTime() ?? 0;
    return bTime - aTime;
  });

  console.log(`[Firestore] getCorals → ${corals.length} corais`);
  return corals;
}

export async function uploadCoralImage(file: File, coralId: string): Promise<string> {
  const ext = file.name.split(".").pop();
  const storageRef = ref(storage, `corals/${coralId}.${ext}`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

export async function deleteCoralImage(imageUrl: string): Promise<void> {
  try {
    const storageRef = ref(storage, imageUrl);
    await deleteObject(storageRef);
  } catch {
    // ignore if no image
  }
}

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
    imageUrl: "",
    createdAt: serverTimestamp(),
  });

  if (data.imageFile) {
    const imageUrl = await uploadCoralImage(data.imageFile, docRef.id);
    await updateDoc(docRef, { imageUrl });
  }

  return docRef.id;
}

export async function updateCoral(id: string, data: Partial<CoralFormData>): Promise<void> {
  const docRef = doc(db, CORALS_COLLECTION, id);
  const updateData: Record<string, unknown> = {
    name: data.name,
    price: data.price,
    category: data.category,
    description: data.description,
    size: data.size,
    status: data.status,
  };

  if (data.imageFile) {
    const imageUrl = await uploadCoralImage(data.imageFile, id);
    updateData.imageUrl = imageUrl;
  }

  await updateDoc(docRef, updateData);
}

export async function deleteCoral(id: string, imageUrl?: string): Promise<void> {
  if (imageUrl) {
    await deleteCoralImage(imageUrl);
  }
  await deleteDoc(doc(db, CORALS_COLLECTION, id));
}

/**
 * Batch-insert corals. Used by seed.ts and the Admin "Seed Demo" button.
 */
export async function batchInsertCorals(
  corals: Array<Record<string, unknown>>
): Promise<void> {
  const batch = writeBatch(db);
  for (const coral of corals) {
    const newDoc = doc(collection(db, CORALS_COLLECTION));
    batch.set(newDoc, { ...coral, createdAt: serverTimestamp() });
  }
  await batch.commit();
}
