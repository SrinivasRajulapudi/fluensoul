import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "../../../lib/server";
import SocialPlatformIcon from "../../components/SocialPlatformIcon";
import SocialLinkForm from "../../components/SocialLinkForm";
import LogoutButton from "../../components/LogoutButton";
import FluenSoulLogo from "../../components/FluenSoulLogo";

type SocialLink = {
  id: string;
  platform: string;
  url: string;
  display_order: number;
  is_active: boolean;
  platform_name: string | null;
  logo_url: string | null;
};

type CreatorData = {
  id: string;
  username: string;
  name: string;
  tagline: string | null;
  bio: string | null;
  hero_image_url: string | null;
  followers: string | null;
  total_likes: string | null;
  collaboration_count: string | null;
  contact_email: string | null;
  is_active: boolean;
  plan: string;
  template: string;
  accent_color: string;
  background_color: string;
  text_color: string;
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
    .select(
      `
        id,
        username,
        name,
        tagline,
        bio,
        hero_image_url,
        followers,
        total_likes,
        collaboration_count,
        contact_email,
        is_active,
        plan,
        template,
        accent_color,
        background_color,
        text_color
      `
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!influencer) {
    redirect("/creator");
  }

  const { data: socialLinks, error: socialError } = await supabase
    .from("influencer_social_links")
    .select("id, platform, platform_name, url, logo_url, display_order, is_active")
    .eq("influencer_id", influencer.id)
    .order("display_order", { ascending: true });

  if (socialError) {
    throw new Error(socialError.message);
  }

  return {
    user,
    influencer: influencer as CreatorData,
    socialLinks: socialLinks ?? [],
  };
}

/* =========================================================
   VALIDATE HEX COLOUR
========================================================= */

function isValidHexColor(value: string) {
  return /^#[0-9A-Fa-f]{6}$/.test(value);
}

/* =========================================================
   UPDATE PROFILE
========================================================= */

async function updateProfile(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const name = String(formData.get("name") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim();
  const tagline = String(formData.get("tagline") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const contactEmail = String(
    formData.get("contact_email") ?? ""
  ).trim();
  const heroImageUrl = String(
    formData.get("hero_image_url") ?? ""
  ).trim();

  const accentColor = String(
    formData.get("accent_color") ?? ""
  ).trim();

  const backgroundColor = String(
    formData.get("background_color") ?? ""
  ).trim();

  const textColor = String(
    formData.get("text_color") ?? ""
  ).trim();

  if (!name || !username) {
    throw new Error("Name and username are required.");
  }

  /*
   * Only accept proper 6-digit hexadecimal colours.
   * This prevents invalid values from being stored.
   */
  if (
    !isValidHexColor(accentColor) ||
    !isValidHexColor(backgroundColor) ||
    !isValidHexColor(textColor)
  ) {
    throw new Error("Please enter valid profile colours.");
  }

  /*
   * Make sure this creator is updating their own profile.
   */
  const { data: influencer, error: influencerError } =
    await supabase
      .from("influencers")
      .select("id, plan")
      .eq("user_id", user.id)
      .maybeSingle();

  if (influencerError) {
    throw new Error(influencerError.message);
  }

  if (!influencer) {
    redirect("/creator");
  }

  const updateData: Record<string, unknown> = {
    name,
    username,
    tagline: tagline || null,
    bio: bio || null,
    contact_email: contactEmail || null,
    hero_image_url: heroImageUrl || null,
    updated_at: new Date().toISOString(),
  };

  /*
   * Appearance settings are Premium functionality.
   *
   * Basic creators keep their existing/default colours.
   */
  if (influencer.plan === "premium") {
    updateData.accent_color = accentColor;
    updateData.background_color = backgroundColor;
    updateData.text_color = textColor;
  }

  const { error } = await supabase
    .from("influencers")
    .update(updateData)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/creator");
  revalidatePath("/creator/profile");
  revalidatePath(`/profile/${username}`);
}

/* =========================================================
   ADD SOCIAL LINK
========================================================= */

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
  ).trim().toLowerCase();

  const platformName = String(
    formData.get("platform_name") ?? ""
  ).trim();

  const url = String(
    formData.get("url") ?? ""
  ).trim();

  const logoFile = formData.get("logo");

  if (!platform || !url) {
    throw new Error("Platform and URL are required.");
  }

  try {
    const parsedUrl = new URL(url);

    if (
      parsedUrl.protocol !== "http:" &&
      parsedUrl.protocol !== "https:"
    ) {
      throw new Error("Invalid URL.");
    }
  } catch {
    throw new Error(
      "Please enter a valid URL beginning with http:// or https://."
    );
  }

  const isOther = platform === "other";

  if (isOther && !platformName) {
    throw new Error("Please enter the platform name for Other.");
  }

  if (isOther) {
    if (!(logoFile instanceof File) || logoFile.size === 0) {
      throw new Error("Please upload a logo for the custom platform.");
    }

    if (!logoFile.type.startsWith("image/")) {
      throw new Error("Platform logo must be an image file.");
    }

    if (logoFile.size > 2 * 1024 * 1024) {
      throw new Error("Platform logo must be 2 MB or smaller.");
    }
  }

  const { data: influencer, error: influencerError } =
    await supabase
      .from("influencers")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

  if (influencerError) {
    throw new Error(influencerError.message);
  }

  if (!influencer) {
    redirect("/creator");
  }

  const { data: existingLinks } = await supabase
    .from("influencer_social_links")
    .select("display_order")
    .eq("influencer_id", influencer.id)
    .order("display_order", { ascending: false })
    .limit(1);

  const nextOrder =
    existingLinks && existingLinks.length > 0
      ? Number(existingLinks[0].display_order) + 1
      : 1;

  let logoUrl: string | null = null;

  if (isOther && logoFile instanceof File) {
    const extension =
      logoFile.type.split("/")[1]?.replace("jpeg", "jpg") || "png";

    const filePath = `social-logos/${influencer.id}/${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("influencer-images")
      .upload(filePath, logoFile, {
        contentType: logoFile.type,
        cacheControl: "31536000",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(
        `Platform logo upload failed: ${uploadError.message}`
      );
    }

    const { data: publicUrlData } = supabase.storage
      .from("influencer-images")
      .getPublicUrl(filePath);

    logoUrl = publicUrlData.publicUrl;
  }

  const { error } = await supabase
    .from("influencer_social_links")
    .insert({
      influencer_id: influencer.id,
      platform,
      platform_name: isOther ? platformName : null,
      url,
      logo_url: logoUrl,
      display_order: nextOrder,
      is_active: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/creator/profile");
}

/* =========================================================
   DELETE SOCIAL LINK
========================================================= */

async function deleteSocialLink(formData: FormData) {
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
    throw new Error("Invalid social link.");
  }

  const { data: influencer } = await supabase
    .from("influencers")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!influencer) {
    redirect("/creator");
  }

  const { error } = await supabase
    .from("influencer_social_links")
    .delete()
    .eq("id", linkId)
    .eq("influencer_id", influencer.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/creator/profile");
}

/* =========================================================
   TOGGLE SOCIAL LINK
========================================================= */

async function toggleSocialLink(formData: FormData) {
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

  const isActive =
    String(formData.get("is_active") ?? "") === "true";

  if (!linkId) {
    throw new Error("Invalid social link.");
  }

  const { data: influencer } = await supabase
    .from("influencers")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!influencer) {
    redirect("/creator");
  }

  const { error } = await supabase
    .from("influencer_social_links")
    .update({
      is_active: !isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", linkId)
    .eq("influencer_id", influencer.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/creator/profile");
}

/* =========================================================
   PAGE
========================================================= */

export default async function CreatorProfilePage() {
  const { influencer, socialLinks } =
    await getCreator();

  const isPremium =
    influencer.plan === "premium";

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto max-w-7xl px-6 py-10">

        {/* =====================================================
            HEADER
        ====================================================== */}

        <div className="mb-10 flex flex-col gap-6 border-b border-white/10 pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <FluenSoulLogo width={210} className="mb-6 max-w-[210px] brightness-0 invert" />

            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.35em] text-white/40">
              FluenSoul Creator Studio
            </p>

            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
              Profile Management
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">
              Manage the information visitors see on your public
              FluenSoul profile.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href={`/profile/${influencer.username}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-fit items-center rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium transition hover:bg-white/10"
            >
              View Public Profile →
            </a>
            <LogoutButton />
          </div>
        </div>

        {/* =====================================================
            MAIN LAYOUT
        ====================================================== */}

        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">

          {/* ===================================================
              MAIN CONTENT
          ==================================================== */}

          <div className="space-y-8">

            {/* =================================================
                PROFILE INFORMATION
            ================================================== */}

            <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 md:p-8">

              <div className="mb-7">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/35">
                  Profile
                </p>

                <h2 className="mt-2 text-2xl font-semibold">
                  Personal information
                </h2>

                <p className="mt-2 text-sm text-white/45">
                  Keep your creator identity and public information
                  up to date.
                </p>
              </div>

              <form
                action={updateProfile}
                className="space-y-6"
              >

                <div className="grid gap-6 md:grid-cols-2">

                  {/* NAME */}

                  <div>
                    <label className="mb-2 block text-sm text-white/70">
                      Name
                    </label>

                    <input
                      name="name"
                      defaultValue={influencer.name}
                      required
                      className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-white/30"
                    />
                  </div>

                  {/* USERNAME */}

                  <div>
                    <label className="mb-2 block text-sm text-white/70">
                      Username
                    </label>

                    <div className="flex items-center rounded-2xl border border-white/10 bg-black/30">
                      <span className="pl-4 text-sm text-white/30">
                        /profile/
                      </span>

                      <input
                        name="username"
                        defaultValue={
                          influencer.username
                        }
                        required
                        className="min-w-0 flex-1 bg-transparent px-1 py-3 pr-4 text-sm text-white outline-none"
                      />
                    </div>
                  </div>

                </div>

                {/* TAGLINE */}

                <div>
                  <label className="mb-2 block text-sm text-white/70">
                    Tagline
                  </label>

                  <input
                    name="tagline"
                    defaultValue={
                      influencer.tagline ?? ""
                    }
                    placeholder="Your creator tagline"
                    className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-white/30"
                  />
                </div>

                {/* BIO */}

                <div>
                  <label className="mb-2 block text-sm text-white/70">
                    Bio
                  </label>

                  <textarea
                    name="bio"
                    defaultValue={
                      influencer.bio ?? ""
                    }
                    placeholder="Tell brands and visitors about yourself..."
                    rows={6}
                    className="w-full resize-none rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/20 focus:border-white/30"
                  />
                </div>

                {/* CONTACT EMAIL */}

                <div>
                  <label className="mb-2 block text-sm text-white/70">
                    Contact email
                  </label>

                  <input
                    name="contact_email"
                    type="email"
                    defaultValue={
                      influencer.contact_email ?? ""
                    }
                    placeholder="business@example.com"
                    className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-white/30"
                  />
                </div>

                {/* HERO IMAGE */}

                <div>
                  <label className="mb-2 block text-sm text-white/70">
                    Hero image URL
                  </label>

                  <input
                    name="hero_image_url"
                    defaultValue={
                      influencer.hero_image_url ?? ""
                    }
                    placeholder="https://..."
                    className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-white/30"
                  />

                  <p className="mt-2 text-xs text-white/30">
                    This image is used as the main visual on your
                    public profile.
                  </p>
                </div>

                {/* =================================================
                    PREMIUM APPEARANCE
                ================================================== */}

                <section className="border-t border-white/10 pt-8">

                  <div className="mb-6">
                    <div className="flex flex-wrap items-center gap-3">

                      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/35">
                        Premium
                      </p>

                      {isPremium ? (
                        <span className="rounded-full bg-pink-500/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-pink-300">
                          Premium Active
                        </span>
                      ) : (
                        <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white/35">
                          Premium Only
                        </span>
                      )}

                    </div>

                    <h2 className="mt-3 text-2xl font-semibold">
                      Appearance
                    </h2>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
                      Personalize the colours of your Premium
                      creator profile.
                    </p>
                  </div>

                  {isPremium ? (
                    <div className="space-y-6">

                      {/* COLOUR CONTROLS */}

                      <div className="grid gap-4 md:grid-cols-3">

                        {/* ACCENT */}

                        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">

                          <label
                            htmlFor="accent_color"
                            className="block text-sm font-semibold text-white/80"
                          >
                            Accent Color
                          </label>

                          <p className="mt-1 text-xs leading-5 text-white/35">
                            Main brand colour used throughout your
                            Premium profile.
                          </p>

                          <div className="mt-5 flex items-center gap-3">

                            <input
                              id="accent_color"
                              name="accent_color"
                              type="color"
                              defaultValue={
                                influencer.accent_color ||
                                "#EF476F"
                              }
                              className="h-12 w-16 cursor-pointer rounded-xl border border-white/10 bg-transparent p-1"
                            />

                            <input
                              type="text"
                              defaultValue={
                                influencer.accent_color ||
                                "#EF476F"
                              }
                              aria-label="Accent color hex value"
                              readOnly
                              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-xs uppercase text-white/70 outline-none"
                            />

                          </div>

                        </div>

                        {/* BACKGROUND */}

                        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">

                          <label
                            htmlFor="background_color"
                            className="block text-sm font-semibold text-white/80"
                          >
                            Background Color
                          </label>

                          <p className="mt-1 text-xs leading-5 text-white/35">
                            Main background colour of your Premium
                            profile.
                          </p>

                          <div className="mt-5 flex items-center gap-3">

                            <input
                              id="background_color"
                              name="background_color"
                              type="color"
                              defaultValue={
                                influencer.background_color ||
                                "#FAF9F7"
                              }
                              className="h-12 w-16 cursor-pointer rounded-xl border border-white/10 bg-transparent p-1"
                            />

                            <input
                              type="text"
                              defaultValue={
                                influencer.background_color ||
                                "#FAF9F7"
                              }
                              aria-label="Background color hex value"
                              readOnly
                              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-xs uppercase text-white/70 outline-none"
                            />

                          </div>

                        </div>

                        {/* TEXT */}

                        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">

                          <label
                            htmlFor="text_color"
                            className="block text-sm font-semibold text-white/80"
                          >
                            Text Color
                          </label>

                          <p className="mt-1 text-xs leading-5 text-white/35">
                            Main text colour used on your Premium
                            profile.
                          </p>

                          <div className="mt-5 flex items-center gap-3">

                            <input
                              id="text_color"
                              name="text_color"
                              type="color"
                              defaultValue={
                                influencer.text_color ||
                                "#111216"
                              }
                              className="h-12 w-16 cursor-pointer rounded-xl border border-white/10 bg-transparent p-1"
                            />

                            <input
                              type="text"
                              defaultValue={
                                influencer.text_color ||
                                "#111216"
                              }
                              aria-label="Text color hex value"
                              readOnly
                              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-xs uppercase text-white/70 outline-none"
                            />

                          </div>

                        </div>

                      </div>

                      {/* PREVIEW */}

                      <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/20">

                        <div className="border-b border-white/10 px-5 py-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/35">
                            Appearance Preview
                          </p>
                        </div>

                        <div className="p-5 sm:p-8">

                          <div
                            className="relative overflow-hidden rounded-3xl p-6 sm:p-8"
                            style={{
                              backgroundColor:
                                influencer.background_color ||
                                "#FAF9F7",
                              color:
                                influencer.text_color ||
                                "#111216",
                            }}
                          >

                            <div
                              className="absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-90"
                              style={{
                                backgroundColor:
                                  influencer.accent_color ||
                                  "#EF476F",
                              }}
                            />

                            <div className="relative z-10 max-w-xl">

                              <p
                                className="text-[9px] font-black uppercase tracking-[0.35em]"
                                style={{
                                  color:
                                    influencer.accent_color ||
                                    "#EF476F",
                                }}
                              >
                                Premium Creator
                              </p>

                              <h3 className="mt-4 text-4xl font-black tracking-[-0.06em] sm:text-5xl">
                                {influencer.name}
                              </h3>

                              <p className="mt-3 text-sm opacity-60">
                                {influencer.tagline ||
                                  "Your creator tagline"}
                              </p>

                              <div className="mt-6 flex flex-wrap gap-3">

                                <span
                                  className="rounded-full px-5 py-3 text-[10px] font-bold text-white"
                                  style={{
                                    backgroundColor:
                                      influencer.accent_color ||
                                      "#EF476F",
                                  }}
                                >
                                  Your Accent
                                </span>

                                <span
                                  className="rounded-full border px-5 py-3 text-[10px] font-bold"
                                  style={{
                                    borderColor:
                                      influencer.text_color ||
                                      "#111216",
                                  }}
                                >
                                  Premium Profile
                                </span>

                              </div>

                            </div>

                          </div>

                        </div>

                      </div>

                    </div>
                  ) : (
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-6">

                      <div className="flex items-start gap-4">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm">
                          ✦
                        </div>

                        <div>
                          <p className="font-semibold">
                            Premium Appearance
                          </p>

                          <p className="mt-2 text-sm leading-6 text-white/40">
                            Custom colours and advanced profile
                            presentation are available with the
                            Premium Plan.
                          </p>
                        </div>

                      </div>

                    </div>
                  )}

                </section>

                {/* SAVE */}

                <div className="flex justify-end border-t border-white/10 pt-6">

                  <button
                    type="submit"
                    className="rounded-full bg-white px-7 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
                  >
                    Save Profile
                  </button>

                </div>

              </form>
            </section>

            {/* =================================================
                SOCIAL LINKS
            ================================================== */}

            <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 md:p-8">

              <div className="mb-7">

                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/35">
                  Social presence
                </p>

                <h2 className="mt-2 text-2xl font-semibold">
                  Social links
                </h2>

                <p className="mt-2 text-sm text-white/45">
                  Add the platforms where brands and visitors can
                  find you.
                </p>

              </div>

              <div className="space-y-3">
                {socialLinks.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 px-5 py-8 text-center text-sm text-white/35">
                    No social links added yet.
                  </div>
                ) : (
                  socialLinks.map((link) => (
                    <div
                      key={link.id}
                      className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-black/20 p-4 md:flex-row md:items-center"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                        {link.logo_url ? (
                          <img
                            src={link.logo_url}
                            alt={link.platform_name || link.platform}
                            className="h-7 w-7 rounded-lg object-contain"
                          />
                        ) : (
                          <SocialPlatformIcon
                            platform={link.platform}
                            className="h-6 w-6 text-white"
                          />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3">
                          <span className="font-medium">
                            {link.platform === "other"
                              ? link.platform_name || "Other Platform"
                              : link.platform}
                          </span>

                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                              link.is_active
                                ? "bg-white/10 text-white/70"
                                : "bg-white/5 text-white/25"
                            }`}
                          >
                            {link.is_active ? "Active" : "Hidden"}
                          </span>
                        </div>

                        <p className="mt-1 truncate text-xs text-white/35">
                          {link.url}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <form action={toggleSocialLink}>
                          <input
                            type="hidden"
                            name="link_id"
                            value={link.id}
                          />
                          <input
                            type="hidden"
                            name="is_active"
                            value={String(link.is_active)}
                          />
                          <button
                            type="submit"
                            className="rounded-full border border-white/10 px-4 py-2 text-xs text-white/65 transition hover:bg-white/10"
                          >
                            {link.is_active ? "Hide" : "Show"}
                          </button>
                        </form>

                        <form action={deleteSocialLink}>
                          <input
                            type="hidden"
                            name="link_id"
                            value={link.id}
                          />
                          <button
                            type="submit"
                            className="rounded-full border border-white/10 px-4 py-2 text-xs text-white/45 transition hover:bg-white/10 hover:text-white"
                          >
                            Delete
                          </button>
                        </form>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* ADD SOCIAL */}

              <div className="mt-8 border-t border-white/10 pt-8">
                <h3 className="mb-2 text-sm font-semibold">
                  Add social platform
                </h3>
                <p className="mb-5 text-xs leading-5 text-white/35">
                  Choose a platform. If you select Other, upload its logo so it can be displayed professionally on your public profile.
                </p>

                <SocialLinkForm action={addSocialLink} />
              </div>
            </section>
          </div>

          {/* ===================================================
              RIGHT SIDEBAR
          ==================================================== */}

          <aside className="space-y-6">

            {/* PROFILE CARD */}

            <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035]">

              <div className="relative aspect-[4/3] bg-white/5">

                {influencer.hero_image_url ? (

                  <img
                    src={influencer.hero_image_url}
                    alt={influencer.name}
                    className="h-full w-full object-cover"
                  />

                ) : (

                  <div className="flex h-full items-center justify-center text-sm text-white/25">
                    No hero image
                  </div>

                )}

                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-5 pt-16">

                  <p className="text-xs uppercase tracking-[0.2em] text-white/50">
                    Public profile
                  </p>

                  <h2 className="mt-1 text-2xl font-semibold">
                    {influencer.name}
                  </h2>

                  <p className="mt-1 text-sm text-white/60">
                    @{influencer.username}
                  </p>

                </div>

              </div>

              <div className="grid grid-cols-3 divide-x divide-white/10 border-t border-white/10">

                <div className="p-4 text-center">
                  <p className="text-lg font-semibold">
                    {influencer.followers ?? "0"}
                  </p>

                  <p className="mt-1 text-[10px] uppercase tracking-wider text-white/30">
                    Followers
                  </p>
                </div>

                <div className="p-4 text-center">
                  <p className="text-lg font-semibold">
                    {influencer.total_likes ?? "0"}
                  </p>

                  <p className="mt-1 text-[10px] uppercase tracking-wider text-white/30">
                    Likes
                  </p>
                </div>

                <div className="p-4 text-center">
                  <p className="text-lg font-semibold">
                    {influencer.collaboration_count ?? "0"}
                  </p>

                  <p className="mt-1 text-[10px] uppercase tracking-wider text-white/30">
                    Collabs
                  </p>
                </div>

              </div>

            </section>

            {/* PLAN */}

            <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">

              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/35">
                Account
              </p>

              <h2 className="mt-2 text-xl font-semibold">
                Your plan
              </h2>

              <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-5">

                <div className="flex items-center justify-between">

                  <span className="text-sm text-white/50">
                    Current plan
                  </span>

                  <span
                    className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                      isPremium
                        ? "bg-pink-500 text-white"
                        : "bg-white text-black"
                    }`}
                  >
                    {influencer.plan}
                  </span>

                </div>

                <div className="mt-5">

                  <p className="text-sm font-medium">
                    {isPremium
                      ? "Premium creator"
                      : "Basic creator"}
                  </p>

                  <p className="mt-2 text-xs leading-5 text-white/35">
                    Your plan is managed by FluenSoul.
                  </p>

                </div>

              </div>

            </section>

            {/* APPEARANCE SUMMARY */}

            <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">

              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/35">
                Appearance
              </p>

              <h2 className="mt-2 text-xl font-semibold">
                Your profile style
              </h2>

              {isPremium ? (

                <div className="mt-5">

                  <div
                    className="h-24 rounded-2xl border border-white/10"
                    style={{
                      backgroundColor:
                        influencer.background_color,
                    }}
                  >
                    <div className="flex h-full items-center justify-center gap-3">

                      <span
                        className="h-8 w-8 rounded-full"
                        style={{
                          backgroundColor:
                            influencer.accent_color,
                        }}
                      />

                      <span
                        className="text-sm font-bold"
                        style={{
                          color:
                            influencer.text_color,
                        }}
                      >
                        Premium
                      </span>

                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">

                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-white/30">
                        Accent
                      </p>

                      <div className="mt-2 flex items-center gap-2">
                        <span
                          className="h-5 w-5 rounded-full border border-white/10"
                          style={{
                            backgroundColor:
                              influencer.accent_color,
                          }}
                        />

                        <span className="text-[10px] uppercase text-white/50">
                          {influencer.accent_color}
                        </span>
                      </div>
                    </div>

                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-white/30">
                        Background
                      </p>

                      <div className="mt-2 flex items-center gap-2">
                        <span
                          className="h-5 w-5 rounded-full border border-white/10"
                          style={{
                            backgroundColor:
                              influencer.background_color,
                          }}
                        />

                        <span className="text-[10px] uppercase text-white/50">
                          {influencer.background_color}
                        </span>
                      </div>
                    </div>

                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-white/30">
                        Text
                      </p>

                      <div className="mt-2 flex items-center gap-2">
                        <span
                          className="h-5 w-5 rounded-full border border-white/10"
                          style={{
                            backgroundColor:
                              influencer.text_color,
                          }}
                        />

                        <span className="text-[10px] uppercase text-white/50">
                          {influencer.text_color}
                        </span>
                      </div>
                    </div>

                  </div>

                </div>

              ) : (

                <p className="mt-4 text-sm leading-6 text-white/35">
                  Upgrade to Premium to personalize your public
                  profile colours.
                </p>

              )}

            </section>

          </aside>

        </div>

        {/* =====================================================
            FOOTER
        ====================================================== */}

        <div className="py-10 text-center">

          <a
            href="/creator"
            className="text-sm font-semibold text-white/30 transition hover:text-white"
          >
            ← Back to Creator Dashboard
          </a>

        </div>

      </div>
    
    </main>
  );
}