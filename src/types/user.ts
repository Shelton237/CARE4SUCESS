export type Role = "admin" | "teacher" | "parent" | "advisor" | "student" | "tutor";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string | null;
  phone?: string | null;
  location?: string | null;
  timezone?: string | null;
  language?: string | null;
  bio?: string | null;
  notifyEmail?: boolean;
  notifySms?: boolean;
  notifyWhatsapp?: boolean;
  parentId?: string | null;
  avatarUrl?: string | null;
  lastLoginAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  // Teacher specific
  bankName?: string | null;
  bankIban?: string | null;
  bankAccountHolder?: string | null;
  availability?: string[] | null;
}
