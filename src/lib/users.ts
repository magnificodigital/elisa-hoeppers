import { supabase } from "./supabase";

export type UserRow = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: "student" | "instructor" | "admin";
  created_at: string;
  last_sign_in_at: string | null;
  confirmed: boolean;
};

async function call(action: string, payload?: unknown): Promise<any> {
  const { data, error } = await supabase.functions.invoke("admin-users", {
    body: { action, payload },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function listUsers(): Promise<UserRow[]> {
  const data = await call("list");
  return (data?.users ?? []) as UserRow[];
}

export async function updateUserRole(userId: string, role: UserRow["role"]): Promise<void> {
  await call("update_role", { user_id: userId, role });
}

export async function inviteUser(
  email: string,
  full_name: string,
  role: UserRow["role"],
): Promise<string> {
  const data = await call("invite", { email, full_name, role });
  return data?.user_id ?? "";
}

export async function createUser(
  email: string,
  password: string,
  full_name: string,
  role: UserRow["role"],
): Promise<string> {
  const data = await call("create", { email, password, full_name, role });
  return data?.user_id ?? "";
}

export async function deleteUser(userId: string): Promise<void> {
  await call("delete", { user_id: userId });
}

export async function sendPasswordResetForUser(email: string): Promise<void> {
  await call("send_password_reset", { email });
}

export async function setUserPassword(userId: string, password: string): Promise<void> {
  await call("set_password", { user_id: userId, password });
}
