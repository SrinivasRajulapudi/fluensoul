import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "../../../lib/server";

type PageProps = {
  params: Promise<{ username: string }>;
};

type SocialLink = {
  id: string;
  platform: string;
  url: string;
  display_order: number;
  is_active: boolean;
};

type PortfolioItem = {
  id: string;
  title: string;
  brand_name: string | null;
  description: string | null;
  image_url: string | null;
  content_url: string | null;
  work_date: string | null;
  display_order: number;
  is_featured: boolean;
  is_active: boolean;
};

const platformLabel: Record<string, string> = {
  instagram: "Instagram",
  youtube: "YouTube",
  facebook: "Facebook",
  threads: "Threads",
  twitter: "X / Twitter",
  x: "X",
  linkedin: "LinkedIn",
  other: "Social Profile",
};

const platformInitial: Record<string, string> = {
  instagram: "IG",
  youtube: "YT",
  facebook: "FB",
  threads: "TH",
  twitter: "X",
  x: "X",
  linkedin: "IN",
  other: "↗",
};

export default async function PublicProfile({
  params,
}: PageProps) {
  const { username } = await params;

  const supabase = await createClient();

  // =========================================================
  // LOAD INFLUENCER
  // =========================================================

  const {
    data: influencer,
    error: influencerError,
  } = await supabase
    .from("influencers")
    .select("*")
    .eq("username", username)
    .eq("is_active", true)
    .single();

  if (influencerError || !influencer) {
    notFound();
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
      "id, platform, url, display_order, is_active"
    )
    .eq("influencer_id", influencer.id)
    .eq("is_active", true)
    .order("display_order", {
      ascending: true,
    });

  const links: SocialLink[] = socialLinks ?? [];

  // =========================================================
  // LOAD FEATURED PORTFOLIO
  // =========================================================

  const {
    data: portfolioData,
    error: portfolioError,
  } = await supabase
    .from("influencer_portfolio")
    .select(
      "id, title, brand_name, description, image_url, content_url, work_date, display_order, is_featured, is_active"
    )
    .eq("influencer_id", influencer.id)
    .eq("is_active", true)
    .eq("is_featured", true)
    .order("display_order", {
      ascending: true,
    })
    .order("created_at", {
      ascending: false,
    });

  const portfolio: PortfolioItem[] =
    portfolioData ?? [];

  // =========================================================
  // COLLABORATION URL
  // =========================================================

  const collaborateUrl =
    `/profile/${encodeURIComponent(
      influencer.username
    )}/collaborate`;

  // =========================================================
  // FORMAT DATE
  // =========================================================

  function formatWorkDate(
    date: string | null
  ) {
    if (!date) {
      return null;
    }

    try {
      return new Date(
        `${date}T00:00:00`
      ).toLocaleDateString("en-IN", {
        month: "short",
        year: "numeric",
      });
    } catch {
      return null;
    }
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f4f1eb] text-[#111318]">

      {/* =====================================================
          NAVIGATION
      ====================================================== */}

      <nav className="absolute left-0 right-0 top-0 z-40">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-6 sm:px-10 lg:px-14">

          <Link
            href="#top"
            className="text-sm font-bold uppercase tracking-[0.32em] text-white"
          >
            Influencer
          </Link>

          <div className="hidden items-center gap-9 md:flex">

            <a
              href="#about"
              className="text-sm font-medium text-white/80 transition hover:text-white"
            >
              About
            </a>

            <a
              href="#social"
              className="text-sm font-medium text-white/80 transition hover:text-white"
            >
              Social
            </a>

            <a
              href="#work"
              className="text-sm font-medium text-white/80 transition hover:text-white"
            >
              Work
            </a>

            <a
              href="#collaborate"
              className="text-sm font-medium text-white/80 transition hover:text-white"
            >
              Collaborate
            </a>

          </div>

          <Link
            href={collaborateUrl}
            className="rounded-full border border-white/40 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white hover:text-black"
          >
            Let's Work
          </Link>

        </div>
      </nav>


      {/* =====================================================
          HERO
      ====================================================== */}

      <section
        id="top"
        className="relative min-h-[88vh] overflow-hidden bg-black sm:min-h-[92vh]"
      >

        {influencer.hero_image_url ? (
          <img
            src={influencer.hero_image_url}
            alt={influencer.name}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#22252a] via-[#111318] to-black" />
        )}

        <div className="absolute inset-0 bg-black/25" />

        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/25 to-transparent" />

        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-black/20" />


        <div className="relative z-10 mx-auto flex min-h-[88vh] max-w-[1440px] items-end px-6 pb-14 sm:min-h-[92vh] sm:px-10 sm:pb-20 lg:px-14">

          <div className="max-w-6xl">

            <div className="mb-6 flex items-center gap-3">

              <span className="h-px w-8 bg-pink-400" />

              <p className="text-[11px] font-bold uppercase tracking-[0.42em] text-pink-300 sm:text-xs">
                Creator · Influencer · Storyteller
              </p>

            </div>


            <h1 className="max-w-6xl text-[4.5rem] font-semibold leading-[0.82] tracking-[-0.065em] text-white sm:text-[7rem] md:text-[8.5rem] lg:text-[10rem]">
              {influencer.name}
            </h1>


            {influencer.tagline && (
              <p className="mt-8 max-w-2xl text-lg leading-8 text-white/80 sm:text-2xl sm:leading-9">
                {influencer.tagline}
              </p>
            )}


            <div className="mt-9 flex flex-wrap gap-3">

              <Link
                href={collaborateUrl}
                className="rounded-full bg-white px-7 py-4 text-sm font-bold text-black transition duration-300 hover:-translate-y-1 hover:bg-pink-100"
              >
                Let's Collaborate
              </Link>

              <a
                href="#about"
                className="rounded-full border border-white/40 bg-white/5 px-7 py-4 text-sm font-semibold text-white backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:bg-white/15"
              >
                Explore Profile
              </a>

            </div>

          </div>

        </div>


        <div className="absolute bottom-7 right-6 z-10 hidden items-center gap-4 sm:flex lg:right-14">

          <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-white/50">
            Scroll
          </span>

          <span className="h-px w-14 bg-white/30" />

        </div>

      </section>


      {/* =====================================================
          STATS
      ====================================================== */}

      <section className="relative bg-[#111318] text-white">

        <div className="mx-auto grid max-w-[1440px] grid-cols-3">

          <div className="border-r border-white/10 px-4 py-9 text-center sm:py-14">

            <p className="text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
              {influencer.followers || "—"}
            </p>

            <p className="mt-2 text-[9px] font-bold uppercase tracking-[0.3em] text-white/40 sm:text-xs">
              Followers
            </p>

          </div>


          <div className="border-r border-white/10 px-4 py-9 text-center sm:py-14">

            <p className="text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
              {influencer.total_likes || "—"}
            </p>

            <p className="mt-2 text-[9px] font-bold uppercase tracking-[0.3em] text-white/40 sm:text-xs">
              Total Likes
            </p>

          </div>


          <div className="px-4 py-9 text-center sm:py-14">

            <p className="text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
              {influencer.collaboration_count || "—"}
            </p>

            <p className="mt-2 text-[9px] font-bold uppercase tracking-[0.3em] text-white/40 sm:text-xs">
              Collaborations
            </p>

          </div>

        </div>

      </section>


      {/* =====================================================
          ABOUT
      ====================================================== */}

      <section
        id="about"
        className="px-6 py-24 sm:px-10 sm:py-32 lg:px-14 lg:py-40"
      >

        <div className="mx-auto max-w-[1440px]">

          <div className="grid gap-14 lg:grid-cols-[0.65fr_1.35fr] lg:gap-28">

            <div>

              <p className="text-[11px] font-bold uppercase tracking-[0.38em] text-pink-500">
                01 — About
              </p>

              <h2 className="mt-6 text-5xl font-semibold leading-[0.95] tracking-[-0.05em] sm:text-7xl">
                The person
                <br />
                behind
                <br />
                the profile.
              </h2>

            </div>


            <div className="flex items-end">

              <div className="max-w-4xl">

                {influencer.bio ? (
                  <p className="whitespace-pre-line text-xl leading-9 text-black/65 sm:text-2xl sm:leading-10 lg:text-[2rem] lg:leading-[1.55]">
                    {influencer.bio}
                  </p>
                ) : (
                  <p className="text-xl leading-9 text-black/45 sm:text-2xl">
                    More about {influencer.name} coming soon.
                  </p>
                )}


                <div className="mt-12 h-px w-full bg-black/10" />


                <div className="mt-6 flex flex-wrap items-center justify-between gap-4">

                  <p className="text-sm font-medium text-black/40">
                    @{influencer.username}
                  </p>

                  <Link
                    href={collaborateUrl}
                    className="text-sm font-bold underline decoration-pink-400 decoration-2 underline-offset-4 transition hover:text-pink-500"
                  >
                    Work with {influencer.name} →
                  </Link>

                </div>

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          SOCIAL
      ====================================================== */}

      <section
        id="social"
        className="border-y border-black/10 bg-[#e9e5de] px-6 py-24 sm:px-10 sm:py-32 lg:px-14"
      >

        <div className="mx-auto max-w-[1440px]">

          <div className="grid gap-14 lg:grid-cols-[0.65fr_1.35fr] lg:gap-28">

            <div>

              <p className="text-[11px] font-bold uppercase tracking-[0.38em] text-pink-500">
                02 — Connect
              </p>

              <h2 className="mt-6 text-5xl font-semibold leading-[0.95] tracking-[-0.05em] sm:text-7xl">
                Follow the
                <br />
                journey.
              </h2>

              <p className="mt-7 max-w-sm text-base leading-7 text-black/50">
                Follow {influencer.name}'s latest content, collaborations and everyday stories.
              </p>

            </div>


            <div>

              {socialLinksError ? (

                <div className="rounded-3xl border border-red-200 bg-red-50 p-8">

                  <p className="font-semibold text-red-700">
                    Unable to load social links.
                  </p>

                  <p className="mt-2 text-sm text-red-600">
                    Please try refreshing the page.
                  </p>

                </div>

              ) : links.length > 0 ? (

                <div className="grid gap-3 sm:grid-cols-2">

                  {links.map((link) => {

                    const platform =
                      link.platform.toLowerCase();

                    const label =
                      platformLabel[platform] ||
                      link.platform;

                    const initial =
                      platformInitial[platform] ||
                      link.platform
                        .slice(0, 2)
                        .toUpperCase();

                    return (
                      <a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group rounded-3xl border border-black/10 bg-[#f4f1eb] p-6 transition duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-xl"
                      >

                        <div className="flex items-start justify-between">

                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#111318] text-xs font-bold text-white">
                            {initial}
                          </div>

                          <span className="text-lg text-black/30 transition group-hover:translate-x-1 group-hover:text-black">
                            ↗
                          </span>

                        </div>


                        <div className="mt-10">

                          <p className="text-xl font-semibold">
                            {label}
                          </p>

                          <p className="mt-2 text-sm text-black/40">
                            View profile
                          </p>

                        </div>

                      </a>
                    );
                  })}

                </div>

              ) : (

                <div className="rounded-3xl border border-black/10 bg-[#f4f1eb] p-10">

                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#111318] text-sm font-bold text-white">
                    +
                  </div>

                  <p className="mt-7 text-xl font-semibold">
                    Social profiles coming soon.
                  </p>

                  <p className="mt-2 max-w-md text-sm leading-6 text-black/45">
                    Follow this creator's journey once their social profiles are connected.
                  </p>

                </div>

              )}

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          FEATURED WORK
      ====================================================== */}

      <section
        id="work"
        className="bg-[#111318] px-6 py-24 text-white sm:px-10 sm:py-32 lg:px-14"
      >

        <div className="mx-auto max-w-[1440px]">

          {/* Heading */}

          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">

            <div>

              <p className="text-[11px] font-bold uppercase tracking-[0.38em] text-pink-400">
                03 — Selected Work
              </p>

              <h2 className="mt-6 text-5xl font-semibold tracking-[-0.05em] sm:text-7xl">
                Featured
                <br />
                Work.
              </h2>

            </div>


            <p className="max-w-md text-base leading-7 text-white/45">
              A curated collection of content, campaigns and brand collaborations.
            </p>

          </div>


          {/* Portfolio error */}

          {portfolioError ? (

            <div className="mt-16 rounded-[2rem] border border-red-400/20 bg-red-500/10 p-8">

              <p className="font-semibold text-red-300">
                Unable to load featured work.
              </p>

              <p className="mt-2 text-sm text-red-300/70">
                Please try refreshing the page.
              </p>

            </div>

          ) : portfolio.length > 0 ? (

            <div className="mt-16 grid gap-5 md:grid-cols-2">

              {portfolio.map((item) => {

                const workDate =
                  formatWorkDate(
                    item.work_date
                  );

                return (
                  <article
                    key={item.id}
                    className="group relative aspect-[4/3] overflow-hidden rounded-[2rem] border border-white/10 bg-[#1b1d21]"
                  >

                    {/* Image */}

                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-[#292b30] to-[#111318]" />
                    )}


                    {/* Image overlay */}

                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent" />


                    {/* Featured badge */}

                    <div className="absolute left-6 top-6">

                      <span className="rounded-full bg-pink-500 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white">
                        Featured
                      </span>

                    </div>


                    {/* Content */}

                    <div className="absolute bottom-0 left-0 right-0 p-7 sm:p-8">

                      <div className="flex items-end justify-between gap-5">

                        <div className="min-w-0">

                          {item.brand_name && (
                            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-pink-300">
                              {item.brand_name}
                            </p>
                          )}

                          <h3 className="mt-2 text-2xl font-semibold leading-tight text-white sm:text-3xl">
                            {item.title}
                          </h3>

                        </div>


                        {workDate && (
                          <p className="shrink-0 text-xs font-medium text-white/50">
                            {workDate}
                          </p>
                        )}

                      </div>


                      {item.description && (
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">
                          {item.description}
                        </p>
                      )}


                      {item.content_url && (
                        <a
                          href={item.content_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-5 inline-flex rounded-full border border-white/25 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white hover:text-black"
                        >
                          View Content ↗
                        </a>
                      )}

                    </div>

                  </article>
                );
              })}

            </div>

          ) : (

            /* Empty state */

            <div className="mt-16 rounded-[2rem] border border-white/10 bg-white/[0.03] p-10 sm:p-14">

              <div className="max-w-xl">

                <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-pink-400">
                  Portfolio
                </p>

                <h3 className="mt-4 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
                  Featured work is coming soon.
                </h3>

                <p className="mt-4 text-base leading-7 text-white/45">
                  Campaigns, collaborations and standout content will appear here.
                </p>

              </div>

            </div>

          )}


          {/* Portfolio CTA */}

          {portfolio.length > 0 && (
            <div className="mt-5 rounded-[2rem] border border-white/10 bg-white/[0.03] p-7 sm:p-9">

              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">

                <div>

                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/35">
                    Interested in working together?
                  </p>

                  <p className="mt-2 text-lg font-medium text-white/70">
                    Start a conversation with {influencer.name}.
                  </p>

                </div>

                <Link
                  href={collaborateUrl}
                  className="w-fit rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white hover:text-black"
                >
                  Start a project →
                </Link>

              </div>

            </div>
          )}

        </div>

      </section>


      {/* =====================================================
          COLLABORATION CTA
      ====================================================== */}

      <section
        id="collaborate"
        className="relative overflow-hidden bg-[#f4f1eb] px-6 py-28 sm:px-10 sm:py-40 lg:px-14"
      >

        <div className="absolute -right-40 -top-40 h-[30rem] w-[30rem] rounded-full bg-pink-200/40 blur-3xl" />

        <div className="absolute -bottom-48 -left-40 h-[28rem] w-[28rem] rounded-full bg-pink-100/30 blur-3xl" />


        <div className="relative mx-auto max-w-5xl text-center">

          <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-pink-500">
            04 — Work Together
          </p>


          <h2 className="mt-7 text-6xl font-semibold leading-[0.9] tracking-[-0.06em] sm:text-8xl">
            Have an
            <br />
            idea?
          </h2>


          <p className="mx-auto mt-8 max-w-2xl text-lg leading-8 text-black/55 sm:text-xl">
            Looking to collaborate with {influencer.name} on a campaign, product launch or creative project?
          </p>


          <div className="mt-11">

            <Link
              href={collaborateUrl}
              className="inline-flex rounded-full bg-[#111318] px-9 py-4 text-sm font-bold text-white transition duration-300 hover:-translate-y-1 hover:bg-pink-500"
            >
              Start a Collaboration
            </Link>

          </div>


          <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.25em] text-black/30">
            Brands · Campaigns · Creative Projects
          </p>

        </div>

      </section>


      {/* =====================================================
          FOOTER
      ====================================================== */}

      <footer className="bg-[#090a0c] px-6 py-10 text-white sm:px-10 lg:px-14">

        <div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-8 sm:flex-row sm:items-end">

          <div>

            <p className="text-sm font-bold uppercase tracking-[0.3em]">
              {influencer.name}
            </p>

            <p className="mt-2 text-xs text-white/35">
              @{influencer.username}
            </p>

          </div>


          <div className="flex flex-col gap-3 sm:items-end">

            <Link
              href={collaborateUrl}
              className="text-sm font-semibold text-white/70 transition hover:text-white"
            >
              Let's collaborate →
            </Link>

            <p className="text-xs text-white/25">
              © {new Date().getFullYear()} All rights reserved.
            </p>

          </div>

        </div>

      </footer>

    </main>
  );
}