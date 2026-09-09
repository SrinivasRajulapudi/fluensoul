"use client";

import Link from "next/link";
import SocialPlatformIcon from "../../../components/SocialPlatformIcon";
import FluenSoulLogo from "../../../components/FluenSoulLogo";

type SocialLink = {
  id: string;
  platform: string;
  url: string;
  display_order: number;
  is_active: boolean;
  platform_name: string | null;
  logo_url: string | null;
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

type Influencer = {
  id: string;
  username: string;
  name: string;
  tagline: string | null;
  bio: string | null;
  hero_image_url: string | null;
  followers: string | number | null;
  total_likes: string | number | null;
  collaboration_count: string | number | null;
  plan: string;
  template: string;

  accent_color: string | null;
  background_color: string | null;
  text_color: string | null;
};

type Props = {
  influencer: Influencer;
  links: SocialLink[];
  portfolio: PortfolioItem[];
  collaborateUrl: string;
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

function formatWorkDate(date: string | null) {
  if (!date) return null;

  try {
    return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
      month: "short",
      year: "numeric",
    });
  } catch {
    return null;
  }
}

function ArrowUpRight() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M7 17 17 7" />
      <path d="M8 7h9v9" />
    </svg>
  );
}

export default function PremiumPublicProfile({
  influencer,
  links,
  portfolio,
  collaborateUrl,
}: Props) {
  /*
   * =========================================================
   * PREMIUM APPEARANCE
   * =========================================================
   *
   * These values come from the creator's Premium
   * Appearance settings in Supabase.
   *
   * Fallback values keep the Premium profile working
   * for older Premium creators who don't have custom
   * colors saved yet.
   */

  const accentColor =
    influencer.accent_color || "#ef476f";

  const backgroundColor =
    influencer.background_color || "#faf9f7";

  const textColor =
    influencer.text_color || "#111216";

  return (
    <main
      className="min-h-screen overflow-x-hidden"
      style={{
        backgroundColor,
        color: textColor,
      }}
    >
      {/* =========================================================
          TOP NAVIGATION
      ========================================================== */}

      <nav className="absolute left-0 right-0 top-0 z-50">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-5 py-6 sm:px-8 lg:px-12">
          <Link
            href="#top"
            aria-label="FluenSoul"
            className="flex w-fit items-center"
          >
            <FluenSoulLogo
              width={150}
              className="max-w-[150px] sm:max-w-[170px]"
            />
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <a
              href="#about"
              className="text-xs font-medium opacity-45 transition hover:opacity-100"
            >
              About
            </a>

            <a
              href="#social"
              className="text-xs font-medium opacity-45 transition hover:opacity-100"
            >
              Social
            </a>

            <a
              href="#work"
              className="text-xs font-medium opacity-45 transition hover:opacity-100"
            >
              Work
            </a>

            <a
              href="#contact"
              className="text-xs font-medium opacity-45 transition hover:opacity-100"
            >
              Contact
            </a>
          </div>

          <Link
            href={collaborateUrl}
            className="rounded-full px-5 py-2.5 text-xs font-bold text-white transition duration-300 hover:-translate-y-0.5"
            style={{
              backgroundColor: textColor,
            }}
          >
            Work With Me
          </Link>
        </div>
      </nav>

      {/* =========================================================
          HERO
      ========================================================== */}

      <section
        id="top"
        className="relative min-h-[100svh] overflow-hidden"
        style={{
          backgroundColor,
        }}
      >
        {/* Main accent shape */}
        <div
          className="absolute right-[-18%] top-[15%] h-[58vh] w-[82vw] rounded-[45%] sm:right-[-12%] sm:h-[68vh] sm:w-[70vw] lg:right-[-8%] lg:top-[13%] lg:h-[72vh] lg:w-[62vw]"
          style={{
            backgroundColor: accentColor,
          }}
        />

        {/* Secondary accent glow */}
        <div
          className="absolute bottom-[6%] left-[-18%] h-40 w-40 rounded-full opacity-10 blur-2xl sm:h-64 sm:w-64"
          style={{
            backgroundColor: accentColor,
          }}
        />

        {/* Creator image */}
        {influencer.hero_image_url ? (
          <img
            src={influencer.hero_image_url}
            alt={influencer.name}
            className="absolute inset-0 z-10 h-full w-full object-cover object-center"
          />
        ) : (
          <div
            className="absolute inset-0 z-10"
            style={{
              background: `linear-gradient(135deg, ${backgroundColor} 0%, ${accentColor} 100%)`,
            }}
          />
        )}

        {/* Soft fade at bottom */}
        <div
          className="absolute bottom-0 left-0 right-0 z-20 h-32"
          style={{
            background: `linear-gradient(to top, ${backgroundColor}, transparent)`,
          }}
        />

        {/* Hero content */}
        <div className="relative z-30 mx-auto flex min-h-[100svh] max-w-[1500px] items-end px-5 pb-12 sm:px-8 sm:pb-16 lg:px-12 lg:pb-20">
          <div className="relative w-full">
            <div className="max-w-[850px]">
              <p
                className="mb-5 text-[9px] font-black uppercase tracking-[0.45em] sm:text-[10px]"
                style={{
                  color: accentColor,
                }}
              >
                Premium Creator
              </p>

              <h1
                className="max-w-[850px] text-[4.4rem] font-black leading-[0.78] tracking-[-0.075em] sm:text-[7rem] md:text-[8.5rem] lg:text-[10rem] xl:text-[11rem]"
                style={{
                  color: textColor,
                }}
              >
                {influencer.name}
              </h1>

              {influencer.tagline && (
                <p className="mt-7 max-w-xl text-base font-medium leading-7 opacity-55 sm:text-xl sm:leading-8">
                  {influencer.tagline}
                </p>
              )}
            </div>

            <div className="mt-8 flex flex-wrap gap-3 sm:mt-10">
              <Link
                href={collaborateUrl}
                className="inline-flex items-center gap-3 rounded-full px-7 py-4 text-xs font-bold text-white transition duration-300 hover:-translate-y-1"
                style={{
                  backgroundColor: textColor,
                }}
              >
                Start a Collaboration
                <ArrowUpRight />
              </Link>

              <a
                href="#about"
                className="inline-flex items-center gap-3 rounded-full border bg-white/70 px-7 py-4 text-xs font-bold backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:bg-white"
                style={{
                  borderColor: `${textColor}26`,
                }}
              >
                Explore Profile
                <span>↓</span>
              </a>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 right-6 hidden items-center gap-4 lg:right-12 lg:flex">
          <span className="text-[9px] font-bold uppercase tracking-[0.35em] opacity-30">
            Scroll to explore
          </span>

          <span
            className="h-px w-14 opacity-20"
            style={{
              backgroundColor: textColor,
            }}
          />
        </div>
      </section>

      {/* =========================================================
          CREATOR INTRO + STATS
      ========================================================== */}

      <section
        className="px-5 py-20 sm:px-8 sm:py-28 lg:px-12 lg:py-32"
        style={{
          backgroundColor,
        }}
      >
        <div className="mx-auto max-w-[1500px]">
          <div className="grid gap-14 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <p
                className="text-[9px] font-black uppercase tracking-[0.4em] sm:text-[10px]"
                style={{
                  color: accentColor,
                }}
              >
                Creator
              </p>

              <h2 className="mt-6 max-w-4xl text-4xl font-semibold leading-[0.95] tracking-[-0.055em]">
                Creating stories,
                <br />
                building influence.
              </h2>

              <p className="mt-7 max-w-2xl text-base leading-8 opacity-50 sm:text-lg">
                {influencer.bio ||
                  `${influencer.name} is a creator building meaningful content, collaborations and connections with their audience.`}
              </p>
            </div>

            <div
              className="grid grid-cols-3 border-y"
              style={{
                borderColor: `${textColor}1A`,
              }}
            >
              <div className="px-3 py-6 text-center sm:px-5">
                <p className="text-2xl font-bold tracking-tight sm:text-4xl">
                  {influencer.followers || "—"}
                </p>

                <p className="mt-2 text-[8px] font-black uppercase tracking-[0.25em] opacity-35 sm:text-[9px]">
                  Followers
                </p>
              </div>

              <div
                className="border-l px-3 py-6 text-center sm:px-5"
                style={{
                  borderColor: `${textColor}1A`,
                }}
              >
                <p className="text-2xl font-bold tracking-tight sm:text-4xl">
                  {influencer.total_likes || "—"}
                </p>

                <p className="mt-2 text-[8px] font-black uppercase tracking-[0.25em] opacity-35 sm:text-[9px]">
                  Likes
                </p>
              </div>

              <div
                className="border-l px-3 py-6 text-center sm:px-5"
                style={{
                  borderColor: `${textColor}1A`,
                }}
              >
                <p className="text-2xl font-bold tracking-tight sm:text-4xl">
                  {influencer.collaboration_count || "—"}
                </p>

                <p className="mt-2 text-[8px] font-black uppercase tracking-[0.25em] opacity-35 sm:text-[9px]">
                  Collabs
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          ABOUT
      ========================================================== */}

      <section
        id="about"
        className="border-t px-5 py-20 sm:px-8 sm:py-28 lg:px-12 lg:py-36"
        style={{
          backgroundColor,
          borderColor: `${textColor}1A`,
        }}
      >
        <div className="mx-auto max-w-[1500px]">
          <div className="grid gap-10 lg:grid-cols-[0.4fr_1.6fr] lg:gap-20">
            <div>
              <p
                className="text-[9px] font-black uppercase tracking-[0.4em] sm:text-[10px]"
                style={{
                  color: accentColor,
                }}
              >
                About Me
              </p>
            </div>

            <div>
              {influencer.bio ? (
                <p className="whitespace-pre-line text-2xl font-medium leading-[1.35] tracking-[-0.025em] opacity-75 sm:text-3xl lg:text-[3.2rem] lg:leading-[1.3]">
                  {influencer.bio}
                </p>
              ) : (
                <p className="text-2xl opacity-35">
                  More about {influencer.name} coming soon.
                </p>
              )}

              <div
                className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t pt-5"
                style={{
                  borderColor: `${textColor}1A`,
                }}
              >
                <p className="text-xs font-medium opacity-35">
                  @{influencer.username}
                </p>

                <Link
                  href={collaborateUrl}
                  className="inline-flex items-center gap-2 text-xs font-bold transition hover:opacity-60"
                >
                  Work with {influencer.name}
                  <ArrowUpRight />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          SOCIAL
      ========================================================== */}

      <section
        id="social"
        className="border-t px-5 py-20 sm:px-8 sm:py-28 lg:px-12 lg:py-32"
        style={{
          backgroundColor,
          borderColor: `${textColor}1A`,
        }}
      >
        <div className="mx-auto max-w-[1500px]">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div>
              <p
                className="text-[9px] font-black uppercase tracking-[0.4em] sm:text-[10px]"
                style={{
                  color: accentColor,
                }}
              >
                Connect
              </p>

              <h2 className="mt-5 text-5xl font-semibold leading-[0.9] tracking-[-0.06em] sm:text-7xl">
                Follow the
                <br />
                journey.
              </h2>
            </div>

            <p className="max-w-md text-sm leading-7 opacity-45 sm:text-base">
              Discover {influencer.name}&apos;s latest content,
              collaborations and stories.
            </p>
          </div>

          {links.length > 0 ? (
            <div className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {links.map((link) => {
                const platform = link.platform.toLowerCase();

                const label =
                  platformLabel[platform] || link.platform;

                const displayName =
                  platform === "other"
                    ? link.platform_name || "Social Profile"
                    : label;

                return (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between border-t py-6 transition hover:px-3"
                    style={{
                      borderColor: `${textColor}1A`,
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <span
                        className="flex h-11 w-11 items-center justify-center rounded-full text-white"
                        style={{
                          backgroundColor: accentColor,
                        }}
                      >
                        {link.logo_url ? (
                          <img
                            src={link.logo_url}
                            alt={displayName}
                            className="h-7 w-7 rounded-lg object-contain"
                          />
                        ) : (
                          <SocialPlatformIcon
                            platform={platform}
                            className="h-6 w-6"
                          />
                        )}
                      </span>

                      <div>
                        <p className="text-sm font-bold">
                          {displayName}
                        </p>

                        <p className="mt-1 text-[10px] opacity-35">
                          Visit profile
                        </p>
                      </div>
                    </div>

                    <span className="transition group-hover:translate-x-1">
                      <ArrowUpRight />
                    </span>
                  </a>
                );
              })}
            </div>
          ) : (
            <div
              className="mt-14 border-t py-7"
              style={{
                borderColor: `${textColor}1A`,
              }}
            >
              <p className="text-sm font-semibold opacity-40">
                Social profiles coming soon.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* =========================================================
          SELECTED WORK
      ========================================================== */}

      <section
        id="work"
        className="border-t px-5 py-20 sm:px-8 sm:py-28 lg:px-12 lg:py-36"
        style={{
          backgroundColor,
          borderColor: `${textColor}1A`,
        }}
      >
        <div className="mx-auto max-w-[1500px]">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div>
              <p
                className="text-[9px] font-black uppercase tracking-[0.4em] sm:text-[10px]"
                style={{
                  color: accentColor,
                }}
              >
                Selected Work
              </p>

              <h2 className="mt-5 text-5xl font-semibold leading-[0.9] tracking-[-0.06em] sm:text-7xl">
                Things I&apos;ve
                <br />
                created.
              </h2>
            </div>

            <p className="max-w-md text-sm leading-7 opacity-45 sm:text-base">
              Campaigns, collaborations and standout content
              created with brands and audiences.
            </p>
          </div>

          {portfolio.length > 0 ? (
            <div className="mt-14 columns-1 gap-6 md:columns-2">
              {portfolio.map((item) => {
                const workDate = formatWorkDate(item.work_date);

                return (
                  <article
                    key={item.id}
                    className="group mb-8 break-inside-avoid"
                  >
                    <div
                      className="relative overflow-hidden rounded-[1.75rem]"
                      style={{
                        backgroundColor: `${accentColor}18`,
                      }}
                    >
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="block h-auto w-full object-contain transition duration-700 group-hover:scale-[1.02]"
                        />
                      ) : (
                        <div
                          className="aspect-[4/3] w-full"
                          style={{
                            backgroundColor: accentColor,
                            opacity: 0.15,
                          }}
                        />
                      )}

                      {item.is_featured && (
                        <div className="absolute left-5 top-5">
                          <span
                            className="rounded-full px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.2em] text-white shadow-sm backdrop-blur-sm"
                            style={{
                              backgroundColor: accentColor,
                            }}
                          >
                            Featured
                          </span>
                        </div>
                      )}

                      {item.content_url && (
                        <a
                          href={item.content_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute bottom-5 right-5 flex h-11 w-11 items-center justify-center rounded-full bg-white text-black opacity-0 shadow-lg transition duration-300 group-hover:opacity-100"
                          aria-label={`View ${item.title}`}
                        >
                          <ArrowUpRight />
                        </a>
                      )}
                    </div>

                    <div
                      className="border-b py-5"
                      style={{
                        borderColor: `${textColor}1A`,
                      }}
                    >
                      <div className="flex items-start justify-between gap-5">
                        <div className="min-w-0">
                          {item.brand_name && (
                            <p
                              className="text-[8px] font-black uppercase tracking-[0.25em]"
                              style={{
                                color: accentColor,
                              }}
                            >
                              {item.brand_name}
                            </p>
                          )}

                          <h3 className="mt-2 text-xl font-bold tracking-tight sm:text-2xl">
                            {item.title}
                          </h3>

                          {item.description && (
                            <p className="mt-2 max-w-xl text-xs leading-6 opacity-45 sm:text-sm">
                              {item.description}
                            </p>
                          )}
                        </div>

                        {workDate && (
                          <p className="shrink-0 pt-1 text-[10px] font-medium opacity-30">
                            {workDate}
                          </p>
                        )}
                      </div>

                      {item.content_url && (
                        <a
                          href={item.content_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-4 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] transition hover:opacity-50"
                        >
                          View Content
                          <ArrowUpRight />
                        </a>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div
              className="mt-14 border-t py-8"
              style={{
                borderColor: `${textColor}1A`,
              }}
            >
              <p className="text-lg font-semibold opacity-40">
                Featured work is coming soon.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* =========================================================
          COLLABORATION
      ========================================================== */}

      <section
        id="contact"
        className="relative overflow-hidden border-t px-5 py-28 sm:px-8 sm:py-36 lg:px-12 lg:py-44"
        style={{
          backgroundColor,
          borderColor: `${textColor}1A`,
        }}
      >
        <div
          className="absolute right-[-20%] top-1/2 h-[28rem] w-[28rem] -translate-y-1/2 rounded-full opacity-20 blur-3xl"
          style={{
            backgroundColor: accentColor,
          }}
        />

        <div className="relative mx-auto max-w-[1100px] text-center">
          <p
            className="text-[9px] font-black uppercase tracking-[0.4em] sm:text-[10px]"
            style={{
              color: accentColor,
            }}
          >
            Let&apos;s Work Together
          </p>

          <h2 className="mt-7 text-6xl font-black leading-[0.82] tracking-[-0.075em] sm:text-8xl lg:text-[9rem]">
            Have an idea?
          </h2>

          <p className="mx-auto mt-8 max-w-xl text-base leading-7 opacity-45 sm:text-lg">
            Have a campaign, product launch or creative project in
            mind? Let&apos;s create something meaningful together.
          </p>

          <Link
            href={collaborateUrl}
            className="mt-10 inline-flex items-center gap-3 rounded-full px-8 py-4 text-xs font-bold text-white transition duration-300 hover:-translate-y-1"
            style={{
              backgroundColor: textColor,
            }}
          >
            Start a Collaboration
            <ArrowUpRight />
          </Link>
        </div>
      </section>

      {/* =========================================================
          FOOTER
      ========================================================== */}

      <footer
        className="border-t px-5 py-8 sm:px-8 lg:px-12"
        style={{
          backgroundColor,
          borderColor: `${textColor}1A`,
        }}
      >
        <div className="mx-auto flex max-w-[1500px] flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em]">
              {influencer.name}
            </p>

            <p className="mt-1 text-[10px] opacity-30">
              @{influencer.username}
            </p>
          </div>

          <div className="flex items-center gap-5">
            <Link
              href={collaborateUrl}
              className="inline-flex items-center gap-2 text-xs font-bold transition hover:opacity-60"
            >
              Let&apos;s collaborate
              <ArrowUpRight />
            </Link>

            <span className="text-[10px] opacity-25">
              Powered by FluenSoul
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}