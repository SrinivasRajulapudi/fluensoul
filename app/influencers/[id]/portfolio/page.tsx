import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "../../../../lib/server";
import PortfolioImageUpload from "../../../components/PortfolioImageUpload";
import EditPortfolioItem from "../../../components/EditPortfolioItem";
type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    saved?: string;
    error?: string;
  }>;
};

export default async function PortfolioPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const { saved, error: queryError } =
    await searchParams;

  const supabase = await createClient();

  // =========================================================
  // AUTHENTICATION
  // =========================================================

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // =========================================================
  // LOAD INFLUENCER
  // =========================================================

  const {
    data: influencer,
    error: influencerError,
  } = await supabase
    .from("influencers")
    .select("id, name, username")
    .eq("id", id)
    .single();

  if (influencerError || !influencer) {
    return (
      <main className="min-h-screen bg-gray-100 p-8">
        <div className="mx-auto max-w-3xl rounded-3xl bg-white p-10 shadow-sm">
          <h1 className="text-3xl font-bold text-gray-900">
            Influencer not found
          </h1>

          <p className="mt-3 text-gray-500">
            We couldn't find this influencer.
          </p>

          <Link
            href="/"
            className="mt-6 inline-block rounded-xl bg-gray-900 px-5 py-3 font-semibold text-white"
          >
            Back to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  const influencerId = influencer.id;
  const influencerUsername = influencer.username;

  // =========================================================
  // LOAD PORTFOLIO
  // =========================================================

  const {
    data: portfolio,
    error: portfolioError,
  } = await supabase
    .from("influencer_portfolio")
    .select("*")
    .eq("influencer_id", id)
    .order("display_order", {
      ascending: true,
    })
    .order("created_at", {
      ascending: false,
    });

  // =========================================================
  // ADD PORTFOLIO ITEM
  // =========================================================

  async function addPortfolioItem(
    formData: FormData
  ) {
    "use server";

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

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

    if (!title) {
      redirect(
        `/influencers/${id}/portfolio?error=required`
      );
    }

    // ---------------------------------------------------------
    // VALIDATE CONTENT URL
    // ---------------------------------------------------------

    if (contentUrl) {
      try {
        const parsedUrl =
          new URL(contentUrl);

        if (
          parsedUrl.protocol !== "http:" &&
          parsedUrl.protocol !== "https:"
        ) {
          redirect(
            `/influencers/${id}/portfolio?error=url`
          );
        }
      } catch {
        redirect(
          `/influencers/${id}/portfolio?error=url`
        );
      }
    }

    // ---------------------------------------------------------
    // FIND NEXT DISPLAY ORDER
    // ---------------------------------------------------------

    const {
      data: lastItem,
    } = await supabase
      .from("influencer_portfolio")
      .select("display_order")
      .eq("influencer_id", id)
      .order("display_order", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    const nextOrder =
      lastItem
        ? Number(lastItem.display_order) + 1
        : 1;

    // ---------------------------------------------------------
    // INSERT
    // ---------------------------------------------------------

    const { error } = await supabase
      .from("influencer_portfolio")
      .insert({
        influencer_id: id,
        title,
        brand_name:
          brandName || null,
        description:
          description || null,
        image_url:
          imageUrl || null,
        content_url:
          contentUrl || null,
        work_date:
          workDate || null,
        display_order: nextOrder,
        is_featured: isFeatured,
        is_active: isActive,
      });

    if (error) {
      console.error(
        "Portfolio creation failed:",
        error
      );

      redirect(
        `/influencers/${id}/portfolio?error=create`
      );
    }

    revalidatePath(
      `/influencers/${id}/portfolio`
    );

    revalidatePath(
      `/profile/${influencerUsername}`
    );

    redirect(
      `/influencers/${id}/portfolio?saved=created`
    );
  }
  // =========================================================
  // UPDATE PORTFOLIO ITEM
  // =========================================================

  async function updatePortfolioItem(
    formData: FormData
  ) {
    "use server";

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
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
      redirect(
        `/influencers/${id}/portfolio?error=required`
      );
    }

    // ---------------------------------------------------------
    // VALIDATE CONTENT URL
    // ---------------------------------------------------------

    if (contentUrl) {
      try {
        const parsedUrl =
          new URL(contentUrl);

        if (
          parsedUrl.protocol !== "http:" &&
          parsedUrl.protocol !== "https:"
        ) {
          redirect(
            `/influencers/${id}/portfolio?error=url`
          );
        }
      } catch {
        redirect(
          `/influencers/${id}/portfolio?error=url`
        );
      }
    }

    // ---------------------------------------------------------
    // UPDATE
    // ---------------------------------------------------------

    const { error } = await supabase
      .from("influencer_portfolio")
      .update({
        title,
        brand_name:
          brandName || null,
        description:
          description || null,
        image_url:
          imageUrl || null,
        content_url:
          contentUrl || null,
        work_date:
          workDate || null,
        is_featured: isFeatured,
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", portfolioId)
      .eq("influencer_id", id);

    if (error) {
      console.error(
        "Portfolio update failed:",
        error
      );

      redirect(
        `/influencers/${id}/portfolio?error=update`
      );
    }

    revalidatePath(
      `/influencers/${id}/portfolio`
    );

    revalidatePath(
      `/profile/${influencerUsername}`
    );

    redirect(
      `/influencers/${id}/portfolio?saved=updated`
    );
  }
  // =========================================================
  // DELETE PORTFOLIO ITEM
  // =========================================================

  async function deletePortfolioItem(
    formData: FormData
  ) {
    "use server";

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const portfolioId = String(
      formData.get("portfolio_id") ?? ""
    ).trim();

    if (!portfolioId) {
      redirect(
        `/influencers/${id}/portfolio?error=delete`
      );
    }

    const { error } = await supabase
      .from("influencer_portfolio")
      .delete()
      .eq("id", portfolioId)
      .eq("influencer_id", id);

    if (error) {
      console.error(
        "Portfolio deletion failed:",
        error
      );

      redirect(
        `/influencers/${id}/portfolio?error=delete`
      );
    }

    revalidatePath(
      `/influencers/${id}/portfolio`
    );

    revalidatePath(
      `/profile/${influencerUsername}`
    );

    redirect(
      `/influencers/${id}/portfolio?saved=deleted`
    );
  }

  // =========================================================
  // ERROR MESSAGE
  // =========================================================

  function getErrorMessage() {
    if (queryError === "required") {
      return "A work title is required.";
    }

    if (queryError === "url") {
      return "Please enter a valid content URL beginning with http:// or https://.";
    }

    if (queryError === "create") {
      return "The portfolio item could not be created.";
    }

    if (queryError === "delete") {
      return "The portfolio item could not be deleted.";
    }
    if (queryError === "update") {
      return "The portfolio item could not be updated.";
    }
    return null;
  }

  const errorMessage =
    getErrorMessage();

  return (
    <main className="min-h-screen bg-[#f4f5f7] px-5 py-8 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-6xl">

        {/* =====================================================
            HEADER
        ====================================================== */}

        <header className="mb-8">

          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">

            <div>

              <p className="text-xs font-bold uppercase tracking-[0.3em] text-pink-500">
                Influencer Platform
              </p>

              <h1 className="mt-3 text-4xl font-bold tracking-tight text-gray-900">
                Featured Work
              </h1>

              <p className="mt-2 text-gray-500">
                Manage portfolio work for{" "}
                <span className="font-semibold text-gray-700">
                  {influencer.name}
                </span>
                .
              </p>

            </div>


            <div className="flex flex-wrap gap-3">

              <Link
                href={`/influencers/${id}`}
                className="rounded-xl border border-gray-200 bg-white px-5 py-3 font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
              >
                ← Manage Profile
              </Link>

              <Link
                href={`/profile/${influencerUsername}`}
                target="_blank"
                className="rounded-xl bg-gray-900 px-5 py-3 font-semibold text-white transition hover:bg-gray-700"
              >
                View Public Profile ↗
              </Link>

            </div>

          </div>

        </header>


        {/* =====================================================
            SUCCESS
        ====================================================== */}

        {saved && (
          <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-5">

            <p className="font-semibold text-green-700">
              {saved === "created"
                ? "Portfolio item added successfully."
                : "Portfolio item deleted successfully."}
            </p>

          </div>
        )}


        {/* =====================================================
            ERROR
        ====================================================== */}

        {errorMessage && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5">

            <p className="font-semibold text-red-700">
              {errorMessage}
            </p>

          </div>
        )}


        {/* =====================================================
            ADD WORK
        ====================================================== */}

        <section className="rounded-3xl bg-white p-7 shadow-sm sm:p-9">

          <div className="border-b border-gray-100 pb-7">

            <p className="text-xs font-bold uppercase tracking-[0.3em] text-pink-500">
              Add New
            </p>

            <h2 className="mt-2 text-2xl font-bold text-gray-900">
              Add Featured Work
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Add a campaign, brand collaboration or standout piece of content.
            </p>

          </div>


          <form
            action={addPortfolioItem}
            className="mt-8"
          >

            <div className="grid gap-6 sm:grid-cols-2">

              {/* =================================================
                  TITLE
              ================================================== */}

              <div className="sm:col-span-2">

                <label
                  htmlFor="title"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Work Title *
                </label>

                <input
                  id="title"
                  name="title"
                  type="text"
                  required
                  placeholder="Summer Campaign 2026"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                />

              </div>


              {/* =================================================
                  BRAND
              ================================================== */}

              <div>

                <label
                  htmlFor="brand_name"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Brand Name
                </label>

                <input
                  id="brand_name"
                  name="brand_name"
                  type="text"
                  placeholder="Brand / Company"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                />

              </div>


              {/* =================================================
                  DATE
              ================================================== */}

              <div>

                <label
                  htmlFor="work_date"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Work Date
                </label>

                <input
                  id="work_date"
                  name="work_date"
                  type="date"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                />

              </div>


              {/* =================================================
                  DESCRIPTION
              ================================================== */}

              <div className="sm:col-span-2">

                <label
                  htmlFor="description"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Description
                </label>

                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  placeholder="Briefly describe the campaign or work..."
                  className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                />

              </div>


              {/* =================================================
                  IMAGE UPLOAD
              ================================================== */}

              <div className="sm:col-span-2">

                <div className="mb-4">

                  <label className="block text-sm font-semibold text-gray-700">
                    Work Image
                  </label>

                  <p className="mt-1 text-xs text-gray-400">
                    Upload a campaign, brand or content image.
                  </p>

                </div>

                <PortfolioImageUpload
                  influencerId={id}
                />

              </div>


              {/* =================================================
                  CONTENT URL
              ================================================== */}

              <div className="sm:col-span-2">

                <label
                  htmlFor="content_url"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Content / Campaign URL
                </label>

                <input
                  id="content_url"
                  name="content_url"
                  type="url"
                  placeholder="https://instagram.com/..."
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                />

                <p className="mt-2 text-xs text-gray-400">
                  Optional link to the original campaign or social post.
                </p>

              </div>

            </div>


            {/* =================================================
                OPTIONS
            ================================================== */}

            <div className="mt-7 grid gap-4 sm:grid-cols-2">

              <label className="flex cursor-pointer items-center gap-4 rounded-2xl bg-gray-50 p-5">

                <input
                  type="checkbox"
                  name="is_featured"
                  defaultChecked
                  className="h-5 w-5 rounded border-gray-300 text-pink-500 focus:ring-pink-400"
                />

                <div>

                  <p className="font-semibold text-gray-900">
                    Featured Work
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Highlight this item on the public profile.
                  </p>

                </div>

              </label>


              <label className="flex cursor-pointer items-center gap-4 rounded-2xl bg-gray-50 p-5">

                <input
                  type="checkbox"
                  name="is_active"
                  defaultChecked
                  className="h-5 w-5 rounded border-gray-300 text-green-500 focus:ring-green-400"
                />

                <div>

                  <p className="font-semibold text-gray-900">
                    Published
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Show this work publicly.
                  </p>

                </div>

              </label>

            </div>


            {/* =================================================
                SUBMIT
            ================================================== */}

            <div className="mt-7 flex justify-end border-t border-gray-100 pt-7">

              <button
                type="submit"
                className="rounded-xl bg-gray-900 px-7 py-3.5 font-semibold text-white transition hover:bg-gray-700"
              >
                Add Featured Work
              </button>

            </div>

          </form>

        </section>


        {/* =====================================================
            CURRENT WORK
        ====================================================== */}

        <section className="mt-10">

          <div className="mb-6 flex items-end justify-between">

            <div>

              <p className="text-xs font-bold uppercase tracking-[0.3em] text-pink-500">
                Portfolio
              </p>

              <h2 className="mt-2 text-2xl font-bold text-gray-900">
                Current Work
              </h2>

            </div>

            <p className="text-sm text-gray-500">
              {portfolio?.length ?? 0} item
              {(portfolio?.length ?? 0) === 1
                ? ""
                : "s"}
            </p>

          </div>


          {portfolioError ? (

            <div className="rounded-3xl border border-red-200 bg-red-50 p-7">

              <p className="font-semibold text-red-700">
                Unable to load portfolio.
              </p>

              <pre className="mt-4 overflow-auto rounded-xl bg-white p-4 text-xs text-red-600">
                {JSON.stringify(
                  portfolioError,
                  null,
                  2
                )}
              </pre>

            </div>

          ) : portfolio &&
            portfolio.length > 0 ? (

            <div className="grid gap-5 md:grid-cols-2">

              {portfolio.map((item) => (

                <article
                  key={item.id}
                  className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm"
                >

                  {/* Image */}

                  <div className="relative aspect-[16/10] bg-gray-100">

                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">

                        <div className="text-center">

                          <div className="text-4xl">
                            🖼️
                          </div>

                          <p className="mt-3 text-sm font-medium text-gray-400">
                            No image
                          </p>

                        </div>

                      </div>
                    )}


                    {item.is_featured && (
                      <span className="absolute left-4 top-4 rounded-full bg-pink-500 px-3 py-1.5 text-xs font-bold text-white">
                        Featured
                      </span>
                    )}


                    <span
                      className={`absolute right-4 top-4 rounded-full px-3 py-1.5 text-xs font-bold ${
                        item.is_active
                          ? "bg-green-500 text-white"
                          : "bg-black/60 text-white"
                      }`}
                    >
                      {item.is_active
                        ? "Published"
                        : "Hidden"}
                    </span>

                  </div>


                  {/* Content */}

                  <div className="p-6">

                    <div className="flex items-start justify-between gap-4">

                      <div>

                        <h3 className="text-xl font-bold text-gray-900">
                          {item.title}
                        </h3>

                        {item.brand_name && (
                          <p className="mt-1 text-sm font-medium text-pink-500">
                            {item.brand_name}
                          </p>
                        )}

                      </div>

                      {item.work_date && (
                        <p className="shrink-0 text-xs font-medium text-gray-400">
                          {new Date(
                            `${item.work_date}T00:00:00`
                          ).toLocaleDateString(
                            "en-IN",
                            {
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </p>
                      )}

                    </div>


                    {item.description && (
                      <p className="mt-4 line-clamp-3 text-sm leading-6 text-gray-500">
                        {item.description}
                      </p>
                    )}


                    <div className="mt-6 flex flex-wrap gap-3">

                      {item.content_url && (
                        <a
                          href={item.content_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-700"
                        >
                          View Content ↗
                        </a>
                      )}
<EditPortfolioItem
  item={item}
  action={updatePortfolioItem}
/>

                      <form
                        action={deletePortfolioItem}
                      >

                        <input
                          type="hidden"
                          name="portfolio_id"
                          value={item.id}
                        />

                        <button
                          type="submit"
                          className="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
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

            <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-12 text-center">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-2xl">
                ✦
              </div>

              <h3 className="mt-5 text-xl font-bold text-gray-900">
                No featured work yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
                Add campaigns, brand collaborations and standout content above.
              </p>

            </div>

          )}

        </section>


        {/* =====================================================
            FOOTER
        ====================================================== */}

        <footer className="py-12 text-center">

          <p className="text-xs uppercase tracking-[0.25em] text-gray-400">
            {influencer.name} · Portfolio Management
          </p>

        </footer>

      </div>
    </main>
  );
}