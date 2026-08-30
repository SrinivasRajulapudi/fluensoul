import Link from "next/link";
import { createClient } from "../../../lib/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import ImageUpload from "../../components/ImageUpload";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    saved?: string;
    error?: string;
  }>;
};

type SocialLink = {
  id: string;
  influencer_id: string;
  platform: string;
  url: string;
  display_order: number;
  is_active: boolean;
};

const PLATFORM_OPTIONS = [
  "instagram",
  "youtube",
  "facebook",
  "threads",
  "twitter",
  "linkedin",
  "other",
];

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram",
  youtube: "YouTube",
  facebook: "Facebook",
  threads: "Threads",
  twitter: "X / Twitter",
  linkedin: "LinkedIn",
  other: "Other",
};

export default async function ManageProfile({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const { saved, error: queryError } = await searchParams;

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
    .select("*")
    .eq("id", id)
    .single();

  if (influencerError || !influencer) {
    return (
      <main className="min-h-screen bg-[#f4f5f7] p-6 sm:p-8">
        <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-sm sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-pink-500">
            Influencer Platform
          </p>

          <h1 className="mt-3 text-3xl font-bold text-gray-900">
            Influencer not found
          </h1>

          <p className="mt-3 text-gray-600">
            We couldn't load this influencer profile.
          </p>

          <Link
            href="/"
            className="mt-6 inline-block rounded-xl bg-gray-900 px-5 py-3 font-semibold text-white transition hover:bg-gray-700"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  // =========================================================
  // LOAD SOCIAL LINKS
  // =========================================================

  const {
    data: socialLinks,
    error: socialLinksError,
  } = await supabase
    .from("influencer_social_links")
    .select(
      "id, influencer_id, platform, url, display_order, is_active"
    )
    .eq("influencer_id", id)
    .order("display_order", {
      ascending: true,
    });

  const links: SocialLink[] = socialLinks ?? [];

  // =========================================================
  // SAVE PROFILE
  // =========================================================

  async function saveProfile(formData: FormData) {
    "use server";

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const name = String(formData.get("name") ?? "").trim();
    const username = String(
      formData.get("username") ?? ""
    ).trim();

    const tagline = String(
      formData.get("tagline") ?? ""
    ).trim();

    const bio = String(formData.get("bio") ?? "").trim();

    const heroImageUrl = String(
      formData.get("hero_image_url") ?? ""
    ).trim();

    const followers = String(
      formData.get("followers") ?? ""
    ).trim();

    const totalLikes = String(
      formData.get("total_likes") ?? ""
    ).trim();

    const collaborationCount = String(
      formData.get("collaboration_count") ?? ""
    ).trim();

    const contactEmail = String(
      formData.get("contact_email") ?? ""
    ).trim();

    const isActive =
      formData.get("is_active") === "on";

    if (!name || !username) {
      redirect(
        `/influencers/${id}?error=required`
      );
    }

    const { error } = await supabase
      .from("influencers")
      .update({
        name,
        username,
        tagline: tagline || null,
        bio: bio || null,
        hero_image_url: heroImageUrl || null,
        followers: followers || null,
        total_likes: totalLikes || null,
        collaboration_count:
          collaborationCount || null,
        contact_email: contactEmail || null,
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error(
        "Profile update failed:",
        error
      );

      redirect(
        `/influencers/${id}?error=save`
      );
    }

    revalidatePath("/");
    revalidatePath(`/influencers/${id}`);
    revalidatePath(`/profile/${username}`);

    redirect(
      `/influencers/${id}?saved=profile`
    );
  }

  // =========================================================
  // ADD SOCIAL LINK
  // =========================================================

  async function addSocialLink(formData: FormData) {
    "use server";

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const platform = String(
      formData.get("platform") ?? ""
    )
      .trim()
      .toLowerCase();

    const url = String(
      formData.get("url") ?? ""
    ).trim();

    if (!platform || !url) {
      redirect(
        `/influencers/${id}?error=social_required`
      );
    }

    try {
      const parsedUrl = new URL(url);

      if (
        parsedUrl.protocol !== "http:" &&
        parsedUrl.protocol !== "https:"
      ) {
        redirect(
          `/influencers/${id}?error=social_url`
        );
      }
    } catch {
      redirect(
        `/influencers/${id}?error=social_url`
      );
    }

    const { data: existingLinks } =
      await supabase
        .from("influencer_social_links")
        .select("display_order")
        .eq("influencer_id", id)
        .order("display_order", {
          ascending: false,
        })
        .limit(1);

    const nextOrder =
      existingLinks &&
      existingLinks.length > 0
        ? Number(
            existingLinks[0].display_order
          ) + 1
        : 1;

    const { error } = await supabase
      .from("influencer_social_links")
      .insert({
        influencer_id: id,
        platform,
        url,
        display_order: nextOrder,
        is_active: true,
      });

    if (error) {
      console.error(
        "Social link insert failed:",
        error
      );

      redirect(
        `/influencers/${id}?error=social_add`
      );
    }

    revalidatePath(`/influencers/${id}`);
    revalidatePath(
      `/profile/${influencer.username}`
    );

    redirect(
      `/influencers/${id}?saved=social`
    );
  }

  // =========================================================
  // UPDATE SOCIAL LINK
  // =========================================================

  async function updateSocialLink(
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

    const linkId = String(
      formData.get("link_id") ?? ""
    ).trim();

    const platform = String(
      formData.get("platform") ?? ""
    )
      .trim()
      .toLowerCase();

    const url = String(
      formData.get("url") ?? ""
    ).trim();

    const isActive =
      formData.get("is_active") === "on";

    if (!linkId || !platform || !url) {
      redirect(
        `/influencers/${id}?error=social_required`
      );
    }

    try {
      const parsedUrl = new URL(url);

      if (
        parsedUrl.protocol !== "http:" &&
        parsedUrl.protocol !== "https:"
      ) {
        redirect(
          `/influencers/${id}?error=social_url`
        );
      }
    } catch {
      redirect(
        `/influencers/${id}?error=social_url`
      );
    }

    const { error } = await supabase
      .from("influencer_social_links")
      .update({
        platform,
        url,
        is_active: isActive,
      })
      .eq("id", linkId)
      .eq("influencer_id", id);

    if (error) {
      console.error(
        "Social link update failed:",
        error
      );

      redirect(
        `/influencers/${id}?error=social_update`
      );
    }

    revalidatePath(`/influencers/${id}`);
    revalidatePath(
      `/profile/${influencer.username}`
    );

    redirect(
      `/influencers/${id}?saved=social`
    );
  }

  // =========================================================
  // DELETE SOCIAL LINK
  // =========================================================

  async function deleteSocialLink(
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

    const linkId = String(
      formData.get("link_id") ?? ""
    ).trim();

    if (!linkId) {
      redirect(
        `/influencers/${id}?error=social_delete`
      );
    }

    const { error } = await supabase
      .from("influencer_social_links")
      .delete()
      .eq("id", linkId)
      .eq("influencer_id", id);

    if (error) {
      console.error(
        "Social link delete failed:",
        error
      );

      redirect(
        `/influencers/${id}?error=social_delete`
      );
    }

    revalidatePath(`/influencers/${id}`);
    revalidatePath(
      `/profile/${influencer.username}`
    );

    redirect(
      `/influencers/${id}?saved=social`
    );
  }

  // =========================================================
  // ERROR MESSAGE
  // =========================================================

  function getErrorMessage() {
    switch (queryError) {
      case "required":
        return "Name and username are required.";

      case "save":
        return "Profile could not be saved.";

      case "social_required":
        return "Platform and URL are required.";

      case "social_url":
        return "Please enter a valid URL beginning with https:// or http://.";

      case "social_add":
        return "Social link could not be added.";

      case "social_update":
        return "Social link could not be updated.";

      case "social_delete":
        return "Social link could not be deleted.";

      default:
        return null;
    }
  }

  const errorMessage = getErrorMessage();

  // =========================================================
  // PUBLIC PROFILE URL
  // =========================================================

  const publicProfileUrl =
    `/profile/${encodeURIComponent(
      influencer.username
    )}`;

  return (
    <main className="min-h-screen bg-[#f4f5f7] p-5 sm:p-8">
      <div className="mx-auto max-w-6xl">

        {/* ===================================================
            HEADER
        ==================================================== */}

        <header className="mb-8">

          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-pink-500">
                Influencer Platform
              </p>

              <h1 className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
                Manage Profile
              </h1>

              <p className="mt-3 text-gray-500">
                Manage {influencer.name}'s public profile,
                social links and profile media.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">

              <Link
                href="/"
                className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
              >
                ← Dashboard
              </Link>

              <Link
                href={publicProfileUrl}
                target="_blank"
                className="rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-700"
              >
                View Public Profile ↗
              </Link>

            </div>

          </div>


          {/* =================================================
              QUICK NAVIGATION
          ================================================== */}

          <div className="mt-6 flex flex-wrap gap-2">

            <a
              href="#profile"
              className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-600 transition hover:border-gray-300 hover:text-gray-900"
            >
              Profile
            </a>

            <a
              href="#social"
              className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-600 transition hover:border-gray-300 hover:text-gray-900"
            >
              Social Links
            </a>

            <a
              href="#media"
              className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-600 transition hover:border-gray-300 hover:text-gray-900"
            >
              Profile Media
            </a>

            <Link
              href={publicProfileUrl}
              target="_blank"
              className="rounded-full border border-pink-200 bg-pink-50 px-4 py-2 text-xs font-semibold text-pink-600 transition hover:bg-pink-100"
            >
              Live Profile ↗
            </Link>

          </div>

        </header>


        {/* ===================================================
            SUCCESS
        ==================================================== */}

        {saved && (
          <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-5">

            <p className="font-semibold text-green-700">
              {saved === "social"
                ? "Social links saved successfully."
                : "Profile saved successfully."}
            </p>

            <p className="mt-1 text-sm text-green-600">
              Your changes have been saved to Supabase.
            </p>

          </div>
        )}


        {/* ===================================================
            ERROR
        ==================================================== */}

        {errorMessage && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5">

            <p className="font-semibold text-red-700">
              {errorMessage}
            </p>

          </div>
        )}


        {/* ===================================================
            PROFILE FORM
        ==================================================== */}

        <form
          action={saveProfile}
          id="profile"
          className="rounded-3xl bg-white p-6 shadow-sm sm:p-8"
        >

          <div className="mb-8 border-b border-gray-100 pb-6">

            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-pink-500">
              Creator Profile
            </p>

            <h2 className="mt-2 text-3xl font-bold text-gray-900">
              Profile Information
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              These details appear on the public influencer profile.
            </p>

          </div>


          <div className="grid gap-6 sm:grid-cols-2">

            {/* NAME */}

            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Name
              </label>

              <input
                id="name"
                name="name"
                defaultValue={influencer.name ?? ""}
                required
                className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
              />
            </div>


            {/* USERNAME */}

            <div>
              <label
                htmlFor="username"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Username
              </label>

              <input
                id="username"
                name="username"
                defaultValue={
                  influencer.username ?? ""
                }
                required
                className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
              />

              <p className="mt-2 text-xs text-gray-400">
                Public URL: /profile/
                {influencer.username}
              </p>
            </div>


            {/* TAGLINE */}

            <div className="sm:col-span-2">

              <label
                htmlFor="tagline"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Tagline
              </label>

              <input
                id="tagline"
                name="tagline"
                defaultValue={
                  influencer.tagline ?? ""
                }
                placeholder="Lifestyle & Fashion Creator"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
              />

            </div>


            {/* BIO */}

            <div className="sm:col-span-2">

              <label
                htmlFor="bio"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Bio
              </label>

              <textarea
                id="bio"
                name="bio"
                defaultValue={influencer.bio ?? ""}
                rows={6}
                placeholder="Tell visitors about this creator..."
                className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
              />

            </div>


            {/* =================================================
                PROFILE MEDIA
            ================================================== */}

            <div
              id="media"
              className="scroll-mt-8 sm:col-span-2"
            >

              <div className="mb-5">

                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-pink-500">
                  Profile Media
                </p>

                <h3 className="mt-2 text-2xl font-bold text-gray-900">
                  Hero Image
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  This is the main image displayed on the public profile.
                </p>

              </div>


              <ImageUpload
                influencerId={id}
                currentImageUrl={
                  influencer.hero_image_url ?? null
                }
              />


              <input
                type="hidden"
                name="hero_image_url"
                value={
                  influencer.hero_image_url ?? ""
                }
                readOnly
              />

            </div>


            {/* FOLLOWERS */}

            <div>

              <label
                htmlFor="followers"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Followers
              </label>

              <input
                id="followers"
                name="followers"
                defaultValue={
                  influencer.followers ?? ""
                }
                placeholder="125K"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
              />

            </div>


            {/* LIKES */}

            <div>

              <label
                htmlFor="total_likes"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Total Likes
              </label>

              <input
                id="total_likes"
                name="total_likes"
                defaultValue={
                  influencer.total_likes ?? ""
                }
                placeholder="2.4M"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
              />

            </div>


            {/* COLLABORATIONS */}

            <div>

              <label
                htmlFor="collaboration_count"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Collaboration Count
              </label>

              <input
                id="collaboration_count"
                name="collaboration_count"
                defaultValue={
                  influencer.collaboration_count ?? ""
                }
                placeholder="25"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
              />

            </div>


            {/* EMAIL */}

            <div>

              <label
                htmlFor="contact_email"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Contact Email
              </label>

              <input
                id="contact_email"
                name="contact_email"
                type="email"
                defaultValue={
                  influencer.contact_email ?? ""
                }
                placeholder="creator@example.com"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
              />

            </div>

          </div>


          {/* =================================================
              PROFILE STATUS
          ================================================== */}

          <div className="mt-10 border-t border-gray-100 pt-8">

            <h3 className="text-2xl font-bold text-gray-900">
              Profile Status
            </h3>

            <div className="mt-5 flex flex-col gap-5 rounded-2xl bg-gray-50 p-6 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <p className="font-semibold text-gray-900">
                  Public profile visibility
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Turn this off to temporarily hide this influencer's public profile.
                </p>

              </div>


              <label className="relative inline-flex cursor-pointer items-center">

                <input
                  type="checkbox"
                  name="is_active"
                  defaultChecked={
                    influencer.is_active
                  }
                  className="peer sr-only"
                />

                <div className="h-7 w-12 rounded-full bg-gray-300 transition peer-checked:bg-green-500 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-100 after:absolute after:left-[4px] after:top-[4px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-5" />

              </label>

            </div>

          </div>


          {/* =================================================
              SAVE
          ================================================== */}

          <div className="mt-8 flex flex-col gap-4 border-t border-gray-100 pt-8 sm:flex-row sm:items-center sm:justify-between">

            <p className="text-sm text-gray-400">
              Changes are saved securely to Supabase.
            </p>

            <button
              type="submit"
              className="rounded-xl bg-gray-900 px-8 py-3 font-semibold text-white transition hover:bg-gray-700"
            >
              Save Changes
            </button>

          </div>

        </form>


        {/* ===================================================
            SOCIAL LINKS
        ==================================================== */}

        <section
          id="social"
          className="mt-8 scroll-mt-8 rounded-3xl bg-white p-6 shadow-sm sm:p-8"
        >

          <div className="mb-8 border-b border-gray-100 pb-6">

            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-pink-500">
              Social Media
            </p>

            <h2 className="mt-2 text-3xl font-bold text-gray-900">
              Social Links
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              These links are displayed on the public profile.
            </p>

          </div>


          {/* EXISTING LINKS */}

          {socialLinksError ? (

            <div className="rounded-2xl border border-red-200 bg-red-50 p-5">

              <p className="font-semibold text-red-700">
                Unable to load social links.
              </p>

              <p className="mt-1 text-sm text-red-600">
                Check the database permissions and try again.
              </p>

            </div>

          ) : links.length > 0 ? (

            <div className="space-y-5">

              {links.map((link) => (

                <div
                  key={link.id}
                  className="rounded-2xl border border-gray-200 bg-gray-50 p-5"
                >

                  <form action={updateSocialLink}>

                    <input
                      type="hidden"
                      name="link_id"
                      value={link.id}
                    />

                    <div className="grid gap-4 md:grid-cols-[190px_1fr]">

                      {/* PLATFORM */}

                      <div>

                        <label
                          htmlFor={`platform-${link.id}`}
                          className="mb-2 block text-sm font-semibold text-gray-700"
                        >
                          Platform
                        </label>

                        <select
                          id={`platform-${link.id}`}
                          name="platform"
                          defaultValue={
                            PLATFORM_OPTIONS.includes(
                              link.platform.toLowerCase()
                            )
                              ? link.platform.toLowerCase()
                              : "other"
                          }
                          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                        >
                          {PLATFORM_OPTIONS.map(
                            (platform) => (
                              <option
                                key={platform}
                                value={platform}
                              >
                                {PLATFORM_LABELS[
                                  platform
                                ] ?? platform}
                              </option>
                            )
                          )}
                        </select>

                      </div>


                      {/* URL */}

                      <div>

                        <label
                          htmlFor={`url-${link.id}`}
                          className="mb-2 block text-sm font-semibold text-gray-700"
                        >
                          Profile URL
                        </label>

                        <input
                          id={`url-${link.id}`}
                          name="url"
                          type="url"
                          defaultValue={link.url}
                          placeholder="https://..."
                          required
                          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                        />

                      </div>

                    </div>


                    <div className="mt-5 flex flex-col gap-4 border-t border-gray-200 pt-5 sm:flex-row sm:items-center sm:justify-between">

                      <label className="flex cursor-pointer items-center gap-3">

                        <input
                          type="checkbox"
                          name="is_active"
                          defaultChecked={
                            link.is_active
                          }
                          className="h-4 w-4 rounded border-gray-300 text-pink-500 focus:ring-pink-400"
                        />

                        <span className="text-sm font-medium text-gray-700">
                          Show publicly
                        </span>

                      </label>


                      <div className="flex gap-3">

                        <button
                          type="submit"
                          className="rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-700"
                        >
                          Save
                        </button>

                        <button
                          type="submit"
                          formAction={deleteSocialLink}
                          className="rounded-xl border border-red-200 bg-white px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                        >
                          Delete
                        </button>

                      </div>

                    </div>

                  </form>

                </div>

              ))}

            </div>

          ) : (

            <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">

              <p className="font-semibold text-gray-700">
                No social links yet.
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Add Instagram, YouTube, Facebook, Threads or another platform below.
              </p>

            </div>

          )}


          {/* ADD SOCIAL */}

          <div className="mt-8 border-t border-gray-100 pt-8">

            <h3 className="text-xl font-bold text-gray-900">
              Add Social Link
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Add another social profile to this creator.
            </p>


            <form
              action={addSocialLink}
              className="mt-5 rounded-2xl bg-gray-50 p-5"
            >

              <div className="grid gap-4 md:grid-cols-[190px_1fr_auto]">

                <div>

                  <label
                    htmlFor="new-platform"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Platform
                  </label>

                  <select
                    id="new-platform"
                    name="platform"
                    defaultValue="instagram"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                  >
                    {PLATFORM_OPTIONS.map(
                      (platform) => (
                        <option
                          key={platform}
                          value={platform}
                        >
                          {PLATFORM_LABELS[
                            platform
                          ] ?? platform}
                        </option>
                      )
                    )}
                  </select>

                </div>


                <div>

                  <label
                    htmlFor="new-url"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Profile URL
                  </label>

                  <input
                    id="new-url"
                    name="url"
                    type="url"
                    placeholder="https://www.instagram.com/username"
                    required
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                  />

                </div>


                <div className="flex items-end">

                  <button
                    type="submit"
                    className="w-full rounded-xl bg-pink-500 px-6 py-3 font-semibold text-white transition hover:bg-pink-600 md:w-auto"
                  >
                    + Add
                  </button>

                </div>

              </div>

            </form>

          </div>

        </section>


        {/* ===================================================
            BOTTOM ACTIONS
        ==================================================== */}

        <section className="mt-8 grid gap-5 sm:grid-cols-2">

          <Link
            href={publicProfileUrl}
            target="_blank"
            className="group rounded-3xl bg-gray-900 p-8 text-white transition hover:bg-gray-800"
          >

            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-pink-400">
              Public Profile
            </p>

            <h2 className="mt-3 text-2xl font-bold">
              View Live Profile ↗
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-300">
              Open the profile exactly as visitors and brands see it.
            </p>

            <div className="mt-7 text-sm font-semibold text-white/60 transition group-hover:text-white">
              /profile/{influencer.username}
            </div>

          </Link>


          <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">

            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-pink-500">
              Profile Status
            </p>

            <div className="mt-4 flex items-center gap-3">

              <span
                className={`h-3 w-3 rounded-full ${
                  influencer.is_active
                    ? "bg-green-500"
                    : "bg-gray-300"
                }`}
              />

              <p className="text-2xl font-bold text-gray-900">
                {influencer.is_active
                  ? "Public & Active"
                  : "Hidden"}
              </p>

            </div>

            <p className="mt-3 text-sm leading-6 text-gray-500">
              {influencer.is_active
                ? "This influencer can currently be viewed through the public profile."
                : "This influencer is currently hidden from the public profile."}
            </p>

          </div>

        </section>


        {/* ===================================================
            FOOTER
        ==================================================== */}

        <div className="py-10 text-center">

          <Link
            href="/"
            className="text-sm font-semibold text-gray-400 transition hover:text-gray-900"
          >
            ← Return to Admin Dashboard
          </Link>

        </div>

      </div>
    </main>
  );
}