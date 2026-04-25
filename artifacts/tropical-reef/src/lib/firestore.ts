import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "./firebase";
import type { Coral, CoralCategory, CoralStatus, CoralFormData } from "@/types/coral";

const CORALS_COLLECTION = "corals";

function generateCoralCode(index: number): string {
  return `TR-${String(index).padStart(3, "0")}`;
}

export async function getCorals(filters?: {
  category?: CoralCategory;
  status?: CoralStatus;
}): Promise<Coral[]> {
  let q = query(collection(db, CORALS_COLLECTION), orderBy("createdAt", "desc"));

  if (filters?.category) {
    q = query(
      collection(db, CORALS_COLLECTION),
      where("category", "==", filters.category),
      orderBy("createdAt", "desc")
    );
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() ?? null,
  })) as Coral[];
}

export async function getCoralById(id: string): Promise<Coral | null> {
  const docRef = doc(db, CORALS_COLLECTION, id);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return {
    id: snapshot.id,
    ...snapshot.data(),
    createdAt: snapshot.data().createdAt?.toDate() ?? null,
  } as Coral;
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
  }
}

export async function createCoral(data: CoralFormData): Promise<string> {
  const allCorals = await getDocs(collection(db, CORALS_COLLECTION));
  const code = generateCoralCode(allCorals.size + 1);

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
