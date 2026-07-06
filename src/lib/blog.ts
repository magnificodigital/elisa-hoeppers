import { supabase } from "./supabase";
import { mediaUrl } from "./storage";

export type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image: string | null;
  body_md: string | null;
  author_name: string | null;
  published_at: string | null;
  is_published: boolean;
  tags: string[] | null;
  created_at: string;
};

function withPostMedia(post: Post): Post {
  return { ...post, cover_image: mediaUrl(post.cover_image) };
}

export async function listPublishedPosts(): Promise<Post[]> {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("is_published", true)
    .order("published_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as Post[]).map(withPostMedia);
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  if (error) throw error;
  return data ? withPostMedia(data as Post) : null;
}

export async function listAllPostsForAdmin(): Promise<Post[]> {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as Post[]).map(withPostMedia);
}

export async function getPostForAdmin(id: string): Promise<Post | null> {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? withPostMedia(data as Post) : null;
}

export type PostUpdate = Partial<Omit<Post, "id" | "created_at">>;
export type PostInsert = Omit<Post, "id" | "created_at">;

export async function createPost(input: PostInsert): Promise<Post> {
  const { data, error } = await supabase.from("posts").insert(input).select().single();
  if (error) throw error;
  return data as Post;
}

export async function updatePost(id: string, patch: PostUpdate): Promise<void> {
  const { error } = await supabase.from("posts").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deletePost(id: string): Promise<void> {
  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) throw error;
}

export type RenderBlock =
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "paragraph"; text: string };

export function parseMarkdownBlocks(md: string): RenderBlock[] {
  if (!md) return [];
  return md
    .split(/\n\s*\n/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk): RenderBlock => {
      if (chunk.startsWith("## ")) return { type: "h2", text: chunk.slice(3).trim() };
      if (chunk.startsWith("### ")) return { type: "h3", text: chunk.slice(4).trim() };
      return { type: "paragraph", text: chunk };
    });
}
