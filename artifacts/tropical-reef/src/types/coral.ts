export type CoralStatus = "available" | "reserved" | "sold";

export type CoralCategory =
  | "Zoanthus"
  | "SPS"
  | "LPS"
  | "Softcoral"
  | "Acropora"
  | "Other";

export interface Coral {
  id: string;
  name: string;
  price: number;
  category: CoralCategory;
  description: string;
  size: string;
  imageUrl: string;
  status: CoralStatus;
  code: string;
  createdAt: Date | null;
}

export interface CoralFormData {
  name: string;
  price: number;
  category: CoralCategory;
  description: string;
  size: string;
  status: CoralStatus;
  imageFile?: File | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "customer" | "admin";
  createdAt: Date | null;
}
