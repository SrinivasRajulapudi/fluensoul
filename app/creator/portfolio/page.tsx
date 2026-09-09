import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "../../../lib/server";
import PortfolioImageUpload from "../../components/PortfolioImageUpload";
import EditPortfolioItem from "../../components/EditPortfolioItem";
import LogoutButton from "../../components/LogoutButton";
import FluenSoulLogo from "../../components/FluenSoulLogo";

type PageProps = {
  searchParams: Promise<{
    saved?: string;
    error?: string;
  }>;
};

async function getCreator() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: role } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!role || role.role !== "creator") {
    redirect("/");
  }

  const { data: influencer, error } = await supabase
    .from("influencers")
    .select("id, name, username, plan, template")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!influencer) {
    return {
      user,
      influencer: null,
      portfolio: [],
    };
  }

  const { data: portfolio, error: portfolioError } = await supabase
    .from("influencer_portfolio")
    .select("*")
    .eq("influencer_id", influencer.id)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (portfolioError) {
    throw new Error(portfolioError.message);
  }

  return {
    user,
    influencer,
    portfolio: portfolio ?? [],
  };
}

async function addPortfolioItem(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: role } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!role || role.role !== "creator") {
    redirect("/");
  }

  const { data: influencer } = await supabase
    .from("influencers")
    .select("id, username")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!influencer) {
    redirect("/creator/profile");
  }

  const title = String(formData.get("title") ?? "").trim();
  const brandName = String(formData.get("brand_name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const imageUrl = String(formData.get("image_url") ?? "").trim();
  const contentUrl = String(formData.get("content_url") ?? "").trim();
  const workDate = String(formData.get("work_date") ?? "").trim();

  const isFeatured = formData.get("is_featured") === "on";
  const isActive = formData.get("is_active") === "on";

  if (!title) {
    redirect("/creator/portfolio?error=required");
  }

  if (contentUrl) {
    try {
      const parsedUrl = new URL(contentUrl);

      if (
        parsedUrl.protocol !== "http:" &&
        parsedUrl.protocol !== "https:"
      ) {
        redirect("/creator/portfolio?error=url");
      }
    } catch {
      redirect("/creator/portfolio?error=url");
    }
  }

  const { data: lastItem } = await supabase
    .from("influencer_portfolio")
    .select("display_order")
    .eq("influencer_id", influencer.id)
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrder = lastItem
    ? Number(lastItem.display_order) + 1
    : 1;

  const { error } = await supabase
    .from("influencer_portfolio")
    .insert({
      influencer_id: influencer.id,
      title,
      brand_name: brandName || null,
      description: description || null,
      image_url: imageUrl || null,
      content_url: contentUrl || null,
      work_date: workDate || null,
      display_order: nextOrder,
      is_featured: isFeatured,
      is_active: isActive,
    });

  if (error) {
    console.error("Creator portfolio creation failed:", error);
    redirect("/creator/portfolio?error=create");
  }

  revalidatePath("/creator/portfolio");
  revalidatePath(`/profile/${influencer.username}`);

  redirect("/creator/portfolio?saved=created");
}

async function updatePortfolioItem(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: role } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!role || role.role !== "creator") {
    redirect("/");
  }

  const { data: influencer } = await supabase
    .from("influencers")
    .select("id, username")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!influencer) {
    redirect("/creator/profile");
  }

  const portfolioId = String(
    formData.get("portfolio_id") ?? ""
  ).trim();

  const title = String(
    formData.get("title") ?? ""
  ).trim();

  const brandName = String(
    formData.get("brand_name") ?? ""
  ).trim();

  const description = String(
    formData.get("description") ?? ""
  ).trim();

  const imageUrl = String(
    formData.get("image_url") ?? ""
  ).trim();

  const contentUrl = String(
    formData.get("content_url") ?? ""
  ).trim();

  const workDate = String(
    formData.get("work_date") ?? ""
  ).trim();

  const isFeatured =
    formData.get("is_featured") === "on";

  const isActive =
    formData.get("is_active") === "on";

  if (!portfolioId || !title) {
    redirect("/creator/portfolio?error=required");
  }

  if (contentUrl) {
    try {
      const parsedUrl = new URL(contentUrl);

      if (
        parsedUrl.protocol !== "http:" &&
        parsedUrl.protocol !== "https:"
      ) {
        redirect("/creator/portfolio?error=url");
      }
    } catch {
      redirect("/creator/portfolio?error=url");
    }
  }

  const { error } = await supabase
    .from("influencer_portfolio")
    .update({
      title,
      brand_name: brandName || null,
      description: description || null,
      image_url: imageUrl || null,
      content_url: contentUrl || null,
      work_date: workDate || null,
      is_featured: isFeatured,
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", portfolioId)
    .eq("influencer_id", influencer.id);

  if (error) {
    console.error("Creator portfolio update failed:", error);
    redirect("/creator/portfolio?error=update");
  }

  revalidatePath("/creator/portfolio");
  revalidatePath(`/profile/${influencer.username}`);

  redirect("/creator/portfolio?saved=updated");
}

async function deletePortfolioItem(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: role } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!role || role.role !== "creator") {
    redirect("/");
  }

  const { data: influencer } = await supabase
    .from("influencers")
    .select("id, username")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!influencer) {
    redirect("/creator/profile");
  }

  const portfolioId = String(
    formData.get("portfolio_id") ?? ""
  ).trim();

  if (!portfolioId) {
    redirect("/creator/portfolio?error=delete");
  }

  const { error } = await supabase
    .from("influencer_portfolio")
    .delete()
    .eq("id", portfolioId)
    .eq("influencer_id", influencer.id);

  if (error) {
    console.error("Creator portfolio deletion failed:", error);
    redirect("/creator/portfolio?error=delete");
  }

  revalidatePath("/creator/portfolio");
  revalidatePath(`/profile/${influencer.username}`);

  redirect("/creator/portfolio?saved=deleted");
}

function getErrorMessage(error?: string) {
  if (error === "required") {
    return "A work title is required.";
  }

  if (error === "url") {
    return "Please enter a valid content URL beginning with http:// or https://.";
  }

  if (error === "create") {
    return "The portfolio item could not be created.";
  }

  if (error === "update") {
    return "The portfolio item could not be updated.";
  }

  if (error === "delete") {
    return "The portfolio item could not be deleted.";
  }

  return null;
}

export default async function CreatorPortfolioPage({
  searchParams,
}: PageProps) {
  const { influencer, portfolio } = await getCreator();

  const {
    saved,
    error: queryError,
  } = await searchParams;

  if (!influencer) {
    return (
      <main className="min-h-screen bg-[#050505] px-6 py-16 text-white">
        <div className="mx-auto max-w-3xl">
          <div className="mb-7">
            <FluenSoulLogo
              width={220}
              className="max-w-[220px] brightness-0 invert"
            />
          </div>

          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/40">
            FluenSoul Creator Studio
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            Build your portfolio
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-6 text-white/50">
            Create your creator profile first. Your portfolio will then appear
            on your public FluenSoul profile.
          </p>

          <Link
            href="/creator/profile"
            className="mt-8 inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
          >
            Create My Profile →
          </Link>
        </div>
      </main>
    );
  }

  const errorMessage = getErrorMessage(queryError);

  return (
    <main className="min-h-screen bg-[#050505] px-5 py-8 text-white sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}
        <header className="mb-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">

            <div>
              <div className="mb-7">
                <FluenSoulLogo
                  width={220}
                  className="max-w-[220px] brightness-0 invert"
                />
              </div>

              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/40">
                FluenSoul Creator Studio
              </p>

              <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
                Portfolio
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50">
                Showcase your campaigns, collaborations and best work to brands
                and visitors.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/creator"
                className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium transition hover:bg-white/10"
              >
                ← Dashboard
              </Link>

              <Link
                href="/creator/profile"
                className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium transition hover:bg-white/10"
              >
                Profile
              </Link>

              <Link
                href={`/profile/${influencer.username}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
              >
                View Public Profile ↗
              </Link>
                  <LogoutButton />
            </div>

          </div>
        </header>

        {/* SUCCESS */}
        {saved && (
          <div className="mb-7 rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-4 text-sm text-white/70">
            ✓{" "}
            {saved === "created"
              ? "Portfolio item added successfully."
              : saved === "updated"
              ? "Portfolio item updated successfully."
              : "Portfolio item deleted successfully."}
          </div>
        )}

        {/* ERROR */}
        {errorMessage && (
          <div className="mb-7 rounded-2xl border border-red-400/20 bg-red-500/10 px-5 py-4 text-sm text-red-200">
            {errorMessage}
          </div>
        )}

        {/* ADD WORK */}
        <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 md:p-8">

          <div className="border-b border-white/10 pb-7">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/35">
              Add New
            </p>

            <h2 className="mt-2 text-2xl font-semibold">
              Add portfolio work
            </h2>

            <p className="mt-2 text-sm text-white/45">
              Add a campaign, brand collaboration or standout piece of content.
            </p>
          </div>

          <form
            action={addPortfolioItem}
            className="mt-8"
          >
            <div className="grid gap-6 md:grid-cols-2">

              {/* TITLE */}
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm text-white/70">
                  Work title *
                </label>

                <input
                  name="title"
                  type="text"
                  required
                  placeholder="Summer Campaign 2026"
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition placeholder:text-white/20 focus:border-white/30"
                />
              </div>

              {/* BRAND */}
              <div>
                <label className="mb-2 block text-sm text-white/70">
                  Brand name
                </label>

                <input
                  name="brand_name"
                  type="text"
                  placeholder="Brand / Company"
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition placeholder:text-white/20 focus:border-white/30"
                />
              </div>

              {/* DATE */}
              <div>
                <label className="mb-2 block text-sm text-white/70">
                  Work date
                </label>

                <input
                  name="work_date"
                  type="date"
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-white/30"
                />
              </div>

              {/* DESCRIPTION */}
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm text-white/70">
                  Description
                </label>

                <textarea
                  name="description"
                  rows={5}
                  placeholder="Briefly describe the campaign or work..."
                  className="w-full resize-none rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-white/20 focus:border-white/30"
                />
              </div>

              {/* IMAGE */}
              <div className="md:col-span-2">
                <div className="mb-4">
                  <label className="block text-sm text-white/70">
                    Work image
                  </label>

                  <p className="mt-1 text-xs text-white/30">
                    Upload an image for this portfolio item.
                  </p>
                </div>

                <PortfolioImageUpload
                  influencerId={influencer.id}
                />
              </div>

              {/* CONTENT URL */}
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm text-white/70">
                  Content / campaign URL
                </label>

                <input
                  name="content_url"
                  type="url"
                  placeholder="https://instagram.com/..."
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition placeholder:text-white/20 focus:border-white/30"
                />

                <p className="mt-2 text-xs text-white/30">
                  Optional link to the original campaign or social post.
                </p>
              </div>

            </div>

            {/* OPTIONS */}
            <div className="mt-7 grid gap-4 md:grid-cols-2">

              <label className="flex cursor-pointer items-center gap-4 rounded-2xl border border-white/10 bg-black/20 p-5">
                <input
                  type="checkbox"
                  name="is_featured"
                  defaultChecked
                  className="h-5 w-5"
                />

                <div>
                  <p className="font-medium">
                    Featured Work
                  </p>

                  <p className="mt-1 text-xs leading-5 text-white/35">
                    Highlight this item on your public profile.
                  </p>
                </div>
              </label>

              <label className="flex cursor-pointer items-center gap-4 rounded-2xl border border-white/10 bg-black/20 p-5">
                <input
                  type="checkbox"
                  name="is_active"
                  defaultChecked
                  className="h-5 w-5"
                />

                <div>
                  <p className="font-medium">
                    Published
                  </p>

                  <p className="mt-1 text-xs leading-5 text-white/35">
                    Show this work publicly.
                  </p>
                </div>
              </label>

            </div>

            <div className="mt-7 flex justify-end border-t border-white/10 pt-7">
              <button
                type="submit"
                className="rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-black transition hover:bg-white/90"
              >
                Add Portfolio Work
              </button>
            </div>
          </form>
        </section>

        {/* CURRENT WORK */}
        <section className="mt-12">

          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/35">
                Portfolio
              </p>

              <h2 className="mt-2 text-2xl font-semibold">
                Your Work
              </h2>
            </div>

            <p className="text-sm text-white/40">
              {portfolio.length}{" "}
              {portfolio.length === 1 ? "item" : "items"}
            </p>
          </div>

          {portfolio.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">

              {portfolio.map((item) => (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035]"
                >

                  {/* IMAGE */}
                  <div className="relative aspect-[16/10] bg-white/5">

                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-4xl text-white/20">
                        ✦
                      </div>
                    )}

                    {item.is_featured && (
                      <span className="absolute left-4 top-4 rounded-full bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-black">
                        Featured
                      </span>
                    )}

                    <span
                      className={`absolute right-4 top-4 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${
                        item.is_active
                          ? "bg-white text-black"
                          : "bg-black/70 text-white/60"
                      }`}
                    >
                      {item.is_active ? "Published" : "Hidden"}
                    </span>

                  </div>

                  {/* CONTENT */}
                  <div className="p-6">

                    <div className="flex items-start justify-between gap-4">

                      <div>
                        <h3 className="text-xl font-semibold">
                          {item.title}
                        </h3>

                        {item.brand_name && (
                          <p className="mt-1 text-sm text-white/45">
                            {item.brand_name}
                          </p>
                        )}
                      </div>

                      {item.work_date && (
                        <p className="shrink-0 text-xs text-white/30">
                          {new Date(
                            `${item.work_date}T00:00:00`
                          ).toLocaleDateString("en-IN", {
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      )}

                    </div>

                    {item.description && (
                      <p className="mt-4 line-clamp-3 text-sm leading-6 text-white/45">
                        {item.description}
                      </p>
                    )}

                    <div className="mt-6 flex flex-wrap gap-3">

                      {item.content_url && (
                        <a
                          href={item.content_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-full bg-white px-4 py-2.5 text-xs font-semibold text-black transition hover:bg-white/90"
                        >
                          View Content ↗
                        </a>
                      )}

                      <EditPortfolioItem
                        item={item}
                        action={updatePortfolioItem}
                      />

                      <form action={deletePortfolioItem}>
                        <input
                          type="hidden"
                          name="portfolio_id"
                          value={item.id}
                        />

                        <button
                          type="submit"
                          className="rounded-full border border-white/10 px-4 py-2.5 text-xs text-white/45 transition hover:bg-white/10 hover:text-white"
                        >
                          Delete
                        </button>
                      </form>

                    </div>
                  </div>

                </article>
              ))}

            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.025] p-14 text-center">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/5 text-2xl text-white/30">
                ✦
              </div>

              <h3 className="mt-5 text-xl font-semibold">
                Your portfolio is empty
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/40">
                Add your best campaigns, collaborations and content above.
              </p>

            </div>
          )}

        </section>

        <footer className="py-12 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-white/25">
            FluenSoul · Creator Portfolio
          </p>
        </footer>

      </div>
    </main>
  );
}