import { redirect } from "next/navigation";
import { createClient } from "../lib/server";

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Not logged in → Login
  if (!user) {
    redirect("/login");
  }

  // Get the user's role
  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  // Admin → Admin Dashboard
  if (roleData?.role === "admin") {
    redirect("/admin");
  }

  // Creator → Creator Dashboard
  if (roleData?.role === "creator") {
    redirect("/creator");
  }

  // Logged in but no valid role
  await supabase.auth.signOut();

  redirect("/login");
}