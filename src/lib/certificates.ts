import { supabase } from "./supabase";

export type Certificate = {
  id: string;
  code: string;
  course_id: string;
  user_id: string;
  student_name: string;
  course_title: string;
  instructor_name: string;
  issued_at: string;
};

export async function issueCertificate(courseId: string): Promise<Certificate | null> {
  const { data, error } = await supabase.rpc("issue_certificate", { p_course_id: courseId });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  return {
    id: row.certificate_id,
    code: row.code,
    course_id: courseId,
    user_id: "",
    student_name: row.student_name,
    course_title: row.course_title,
    instructor_name: "Elisa Hoeppers",
    issued_at: row.issued_at,
  };
}

export async function getCertificateByCode(code: string): Promise<Certificate | null> {
  const { data, error } = await supabase
    .from("certificates")
    .select("*")
    .eq("code", code)
    .maybeSingle();
  if (error) throw error;
  return data as Certificate | null;
}

export async function listMyCertificates(): Promise<Certificate[]> {
  const { data: sessionData } = await supabase.auth.getSession();
  const sessionUser = sessionData?.session?.user;
  if (!sessionUser) return [];
  const { data, error } = await supabase
    .from("certificates")
    .select("*")
    .eq("user_id", sessionUser.id)
    .order("issued_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Certificate[];
}

export async function getMyCertificateForCourse(courseId: string): Promise<Certificate | null> {
  const { data: sessionData } = await supabase.auth.getSession();
  const sessionUser = sessionData?.session?.user;
  if (!sessionUser) return null;
  const { data, error } = await supabase
    .from("certificates")
    .select("*")
    .eq("user_id", sessionUser.id)
    .eq("course_id", courseId)
    .maybeSingle();
  if (error) throw error;
  return data as Certificate | null;
}
