import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import { batchInsertCorals } from "./firestore";
import type { CoralCategory, CoralStatus } from "@/types/coral";

interface SeedCoral {
  code: string;
  name: string;
  price: number;
  category: CoralCategory;
  description: string;
  size: string;
  status: CoralStatus;
  stock: number;
  imageUrl: string;
}

export const SEED_CORALS: SeedCoral[] = [
  {
    code: "TR-001",
    name: "Zoanthus Rainbow",
    price: 65,
    category: "Zoanthus",
    description: "Zoanthus de cores vibrantes com tons de verde neon, laranja e roxo.",
    size: "3-4 pólipos",
    status: "available",
    stock: 3,
    imageUrl: "https://images.unsplash.com/photo-1582967788606-a171c1080cb0?w=600&q=80",
  },
  {
    code: "TR-002",
    name: "Acropora Azul",
    price: 120,
    category: "Acropora",
    description: "Acropora de crescimento ramificado com coloração azul intensa.",
    size: "6cm",
    status: "available",
    stock: 2,
    imageUrl: "https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=600&q=80",
  },
  {
    code: "TR-003",
    name: "Torch Coral Gold",
    price: 85,
    category: "LPS",
    description: "LPS de tentáculos longos e dourados com ponta branca.",
    size: "2 cabeças",
    status: "available",
    stock: 1,
    imageUrl: "https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=600&q=80",
  },
  {
    code: "TR-004",
    name: "Montipora Laranja",
    price: 55,
    category: "SPS",
    description: "SPS encrostante com coloração laranja vibrante. Crescimento rápido.",
    size: "4cm fragmento",
    status: "available",
    stock: 5,
    imageUrl: "https://images.unsplash.com/photo-1504198266287-1659872e6590?w=600&q=80",
  },
  {
    code: "TR-005",
    name: "Ricordea Florida",
    price: 40,
    category: "Softcoral",
    description: "Cogumelo com tons de verde, azul e roxo. Fácil de manter.",
    size: "3cm",
    status: "available",
    stock: 4,
    imageUrl: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600&q=80",
  },
  {
    code: "TR-006",
    name: "Hammer Coral Purple",
    price: 95,
    category: "LPS",
    description: "LPS com tentáculos em formato de martelo roxo e verde.",
    size: "3 cabeças",
    status: "reserved",
    stock: 1,
    imageUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&q=80",
  },
  {
    code: "TR-007",
    name: "Stylophora Rosa",
    price: 70,
    category: "SPS",
    description: "SPS ramificado de coloração rosa brilhante.",
    size: "5cm",
    status: "available",
    stock: 2,
    imageUrl: "https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=600&q=80",
  },
  {
    code: "TR-008",
    name: "Zoanthus People Eater",
    price: 150,
    category: "Zoanthus",
    description: "Raro e muito valorizado. Coloração roxa intensa com centro vermelho.",
    size: "5-6 pólipos",
    status: "available",
    stock: 1,
    imageUrl: "https://images.unsplash.com/photo-1566228015668-4c45dbc4e2f5?w=600&q=80",
  },
  {
    code: "TR-009",
    name: "Duncan Coral",
    price: 60,
    category: "LPS",
    description: "Coral colonial com tentáculos longos e verdes.",
    size: "4 cabeças",
    status: "available",
    stock: 3,
    imageUrl: "https://images.unsplash.com/photo-1498612753354-772a30629934?w=600&q=80",
  },
  {
    code: "TR-010",
    name: "Sarcophyton Leather",
    price: 45,
    category: "Softcoral",
    description: "Coral de couro clássico, muito resistente e fácil de manter.",
    size: "7cm",
    status: "sold",
    stock: 0,
    imageUrl: "https://images.unsplash.com/photo-1532274402911-5a369e4c4bb5?w=600&q=80",
  },
];

export async function seedCoralsIfEmpty(): Promise<{ seeded: boolean; count: number }> {
  console.log("[Seed] Verificando coleção...");

  const snapshot = await getDocs(collection(db, "corals"));
  const existingCodes = new Set(
    snapshot.docs.map((d) => d.data().code as string).filter(Boolean)
  );
  const toInsert = SEED_CORALS.filter((c) => !existingCodes.has(c.code));

  if (toInsert.length === 0) {
    console.log(`[Seed] ✅ ${snapshot.size} corais já existem.`);
    return { seeded: false, count: snapshot.size };
  }

  console.log(`[Seed] Inserindo ${toInsert.length} corais via batch...`);
  await batchInsertCorals(toInsert as unknown as Array<Record<string, unknown>>);

  const total = snapshot.size + toInsert.length;
  console.log(`[Seed] ✅ Seed completo — ${total} corais.`);
  return { seeded: true, count: total };
}
