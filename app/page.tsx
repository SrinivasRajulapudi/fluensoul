import Link from "next/link";
import { createClient } from "../lib/server";
import FluenSoulLogo from "./components/FluenSoulLogo";

type Influencer = {
  id: string;
  username: string;
  name: string;
  tagline: string | null;
  hero_image_url: string | null;
  followers: string | null;
  is_active: boolean;
};

async function getFeaturedCreators() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("influencers")
    .select(
      `
        id,
        username,
        name,
        tagline,
        hero_image_url,
        followers,
        is_active
      `
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(8);

  if (error) {
    console.error("Influencers loading failed:", error);
    return [];
  }

  return (data ?? []) as Influencer[];
}

function formatFollowers(value: string | null) {
  if (!value) return "";
  return value;
}

export default async function Home() {
  const creators = await getFeaturedCreators();

  return (
    <main className="min-h-screen bg-[#faf9f6] text-[#171717]">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <header className="sticky top-0 z-50 border-b border-black/5 bg-[#faf9f6]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">

          {/* LOGO */}

          <Link href="/" className="shrink-0">
            <FluenSoulLogo
              width={190}
              className="max-w-[190px]"
            />
          </Link>


          {/* DESKTOP NAVIGATION */}

          <nav className="hidden items-center gap-7 text-sm text-black/70 lg:flex">

            <a
              href="#how-it-works"
              className="transition hover:text-black"
            >
              How It Works
            </a>

            <a
              href="#creators"
              className="transition hover:text-black"
            >
              Our Family
            </a>

            <a
              href="#testimonials"
              className="transition hover:text-black"
            >
              Testimonials
            </a>

            {/* FOR BRANDS */}

            <Link
              href="/for-brands"
              className="transition hover:text-black"
            >
              For Brands
            </Link>

            {/* FOR INFLUENCERS */}

            <Link
              href="/for-influencers"
              className="transition hover:text-black"
            >
              For Influencers
            </Link>

          </nav>


          {/* LOGIN */}

          <Link
            href="/login"
            className="rounded-full bg-[#171717] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-black"
          >
            Login
          </Link>

        </div>
      </header>


      {/* =====================================================
          HERO
      ====================================================== */}

      <section className="relative overflow-hidden border-b border-black/5">

        {/* Decorative background */}

        <div className="pointer-events-none absolute inset-0 overflow-hidden">

          <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[#eadfd2]/70 blur-3xl" />

          <div className="absolute -left-32 bottom-0 h-80 w-80 rounded-full bg-[#eee8df]/80 blur-3xl" />

          <div className="absolute right-[8%] top-[16%] hidden font-serif text-[100px] italic leading-none text-black/[0.035] lg:block">
            Connect
          </div>

          <div className="absolute bottom-[12%] right-[12%] hidden text-[10px] font-semibold uppercase tracking-[0.45em] text-black/20 lg:block">
            CREATE · CONNECT · GROW
          </div>

        </div>


        <div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 sm:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16 lg:py-28">

          {/* HERO CONTENT */}

          <div>

            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-black/45">
              Influencer Collaborations · Made Simple
            </p>


            <h1 className="mt-6 max-w-4xl font-serif text-5xl leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl">
              Connecting Brands
              <br />
              with the Right
              <br />
              <span className="italic">
                Creators.
              </span>
            </h1>


            <p className="mt-7 max-w-xl text-base leading-7 text-black/60 sm:text-lg">
              FluenSoul helps brands discover suitable influencers for
              campaigns while giving creators a place to connect with
              meaningful opportunities.
            </p>


            {/* HERO BUTTONS */}

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">

              <Link
                href="/for-brands"
                className="group inline-flex items-center justify-center rounded-2xl bg-[#171717] px-7 py-4 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-black"
              >
                For Brands

                <span className="ml-3 transition-transform group-hover:translate-x-1">
                  →
                </span>
              </Link>


              <Link
                href="/for-influencers"
                className="group inline-flex items-center justify-center rounded-2xl border border-black/15 bg-white/60 px-7 py-4 text-sm font-semibold text-black transition hover:-translate-y-0.5 hover:bg-white"
              >
                For Influencers

                <span className="ml-3 transition-transform group-hover:translate-x-1">
                  →
                </span>
              </Link>

            </div>


            {/* SMALL HERO MESSAGE */}

            <div className="mt-12 flex flex-wrap gap-x-8 gap-y-4 text-xs font-medium uppercase tracking-[0.18em] text-black/45">

              <span>Discover</span>

              <span>Connect</span>

              <span>Collaborate</span>

              <span>Grow</span>

            </div>

          </div>


          {/* =================================================
              ORIGINAL FLUENSOUL HERO VISUAL
              NO HUMAN IMAGE
          ================================================== */}

          <div className="relative min-h-[320px] lg:min-h-[420px]">

            <div className="absolute inset-0 rounded-[2.5rem] border border-black/10 bg-white/60 shadow-[0_30px_80px_rgba(0,0,0,0.08)] backdrop-blur-sm" />


            <div className="absolute inset-5 overflow-hidden rounded-[2rem] bg-[#171717]">

              {/* Abstract circles */}

              <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full border-[60px] border-[#d8c5b1]/30" />

              <div className="absolute -bottom-24 -left-20 h-80 w-80 rounded-full border-[45px] border-[#eee4d8]/10" />


              <div className="absolute left-8 top-8 h-px w-32 bg-white/20" />

              <div className="absolute right-8 top-8 h-20 w-px bg-white/20" />


              <div className="relative flex h-full flex-col justify-between p-8 sm:p-10">

                <div>

                  <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-white/45">
                    FluenSoul
                  </p>


                  <div className="mt-10 font-serif text-5xl leading-[0.95] text-white sm:text-6xl">

                    Ideas.

                    <br />

                    People.

                    <br />

                    <span className="italic text-[#d8c5b1]">
                      Impact.
                    </span>

                  </div>

                </div>


                <div className="flex items-end justify-between">

                  <div>

                    <p className="text-xs uppercase tracking-[0.25em] text-white/40">
                      Good Brands
                    </p>

                    <p className="mt-2 text-sm text-white/75">
                      Great Creator Stories
                    </p>

                  </div>


                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/15 text-xs uppercase tracking-[0.15em] text-white/65">
                    FS
                  </div>

                </div>

              </div>

            </div>


            {/* FLOATING CARD */}

            <div className="absolute -bottom-4 -left-3 rounded-2xl border border-black/10 bg-white px-5 py-4 shadow-xl sm:left-0">

              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/40">
                Our Approach
              </p>

              <p className="mt-2 font-serif text-lg">
                Right creator.
                <br />
                Right campaign.
              </p>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          VALUE STRIP
      ====================================================== */}

      <section className="border-b border-black/5 bg-white">

        <div className="mx-auto grid max-w-7xl gap-px bg-black/5 px-5 sm:grid-cols-3 sm:px-8">

          {/* FOR BRANDS */}

          <div className="bg-white px-5 py-8 sm:px-8">

            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-black/35">
              For Brands
            </p>

            <h3 className="mt-3 font-serif text-2xl">
              Find suitable creators
            </h3>

            <p className="mt-2 text-sm leading-6 text-black/55">
              Tell us about your campaign and we’ll search our creator
              network for suitable influencers.
            </p>

          </div>


          {/* FOR CREATORS */}

          <div className="bg-white px-5 py-8 sm:px-8">

            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-black/35">
              For Creators
            </p>

            <h3 className="mt-3 font-serif text-2xl">
              Join our network
            </h3>

            <p className="mt-2 text-sm leading-6 text-black/55">
              Share your profile and work with FluenSoul to become part
              of our creator network.
            </p>

          </div>


          {/* OUR ROLE */}

          <div className="bg-white px-5 py-8 sm:px-8">

            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-black/35">
              Our Role
            </p>

            <h3 className="mt-3 font-serif text-2xl">
              Make the connection
            </h3>

            <p className="mt-2 text-sm leading-6 text-black/55">
              We bring brands and suitable creators together for
              collaboration opportunities.
            </p>

          </div>

        </div>

      </section>


      {/* =====================================================
          HOW FLUENSOUL WORKS
      ====================================================== */}

      <section
        id="how-it-works"
        className="border-b border-black/5 bg-[#faf9f6] px-5 py-20 sm:px-8 sm:py-28"
      >

        <div className="mx-auto max-w-7xl">

          <div className="max-w-2xl">

            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-black/40">
              The Process
            </p>

            <h2 className="mt-4 font-serif text-4xl tracking-tight sm:text-5xl">
              How FluenSoul Works
            </h2>

            <p className="mt-4 text-black/55">
              A simple process. Real conversations. Meaningful
              collaborations.
            </p>

          </div>


          <div className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-black/10 bg-black/10 md:grid-cols-4">

            {/* STEP 1 */}

            <div className="bg-white p-7 sm:p-8">

              <span className="font-serif text-4xl text-black/15">
                01
              </span>

              <h3 className="mt-8 text-lg font-semibold">
                Submit
              </h3>

              <p className="mt-3 text-sm leading-6 text-black/55">
                Brands share their campaign requirements. Creators
                submit their details to join our network.
              </p>

            </div>


            {/* STEP 2 */}

            <div className="bg-white p-7 sm:p-8">

              <span className="font-serif text-4xl text-black/15">
                02
              </span>

              <h3 className="mt-8 text-lg font-semibold">
                Find Suitable Influencers
              </h3>

              <p className="mt-3 text-sm leading-6 text-black/55">
                We search our creator network to find influencers
                suitable for the campaign.
              </p>

            </div>


            {/* STEP 3 */}

            <div className="bg-white p-7 sm:p-8">

              <span className="font-serif text-4xl text-black/15">
                03
              </span>

              <h3 className="mt-8 text-lg font-semibold">
                Connect
              </h3>

              <p className="mt-3 text-sm leading-6 text-black/55">
                We connect brands with suitable creators and
                facilitate the collaboration.
              </p>

            </div>


            {/* STEP 4 */}

            <div className="bg-white p-7 sm:p-8">

              <span className="font-serif text-4xl text-black/15">
                04
              </span>

              <h3 className="mt-8 text-lg font-semibold">
                Grow
              </h3>

              <p className="mt-3 text-sm leading-6 text-black/55">
                Successful collaborations create value and
                opportunities for everyone.
              </p>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          OUR FAMILY
      ====================================================== */}

      <section
        id="creators"
        className="border-b border-black/5 bg-white px-5 py-16 sm:px-8 sm:py-28"
      >

        <div className="mx-auto max-w-7xl">

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

            <div>

              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-black/40">
                Creator Network
              </p>

              <h2 className="mt-3 font-serif text-4xl tracking-tight sm:mt-4 sm:text-5xl">
                Our Family
              </h2>

            </div>


            <p className="max-w-md text-sm leading-6 text-black/50 sm:text-right">
              Meet some of the creators who are part of the FluenSoul
              family.
            </p>

          </div>


          {creators.length > 0 ? (

            <div
              className="
                mt-8
                grid
                grid-cols-2
                gap-3
                sm:mt-12
                sm:grid-cols-2
                sm:gap-5
                lg:grid-cols-3
              "
            >

              {creators.map((creator) => (

                /*
                 * DISPLAY ONLY
                 * Family cards are intentionally NOT clickable.
                 */

                <div
                  key={creator.id}
                  className="
                    overflow-hidden
                    rounded-2xl
                    border
                    border-black/10
                    bg-[#faf9f6]
                    sm:rounded-3xl
                  "
                >

                  {/* PROFILE IMAGE */}

                  <div
                    className="
                      aspect-square
                      overflow-hidden
                      bg-[#e9e4dd]
                      sm:aspect-[4/3]
                    "
                  >

                    {creator.hero_image_url ? (

                      <img
                        src={creator.hero_image_url}
                        alt={creator.name}
                        className="
                          h-full
                          w-full
                          object-cover
                          transition-transform
                          duration-500
                          sm:hover:scale-105
                        "
                      />

                    ) : (

                      <div className="flex h-full items-center justify-center">

                        <span className="font-serif text-4xl text-black/15">
                          {creator.name?.charAt(0) ?? "F"}
                        </span>

                      </div>

                    )}

                  </div>


                  {/* PROFILE INFORMATION */}

                  <div className="p-3 sm:p-5">

                    <h3
                      className="
                        truncate
                        text-sm
                        font-semibold
                        sm:text-lg
                      "
                    >
                      {creator.name}
                    </h3>


                    {/* TAGLINE — HIDDEN ON MOBILE */}

                    <p
                      className="
                        mt-1
                        hidden
                        truncate
                        text-sm
                        text-black/50
                        sm:block
                      "
                    >
                      {creator.tagline || "FluenSoul Creator"}
                    </p>


                    {/* FOLLOWERS */}

                    {creator.followers && (

                      <p
                        className="
                          mt-1.5
                          text-[10px]
                          font-semibold
                          uppercase
                          tracking-[0.12em]
                          text-black/40
                          sm:mt-5
                          sm:text-xs
                          sm:tracking-[0.15em]
                        "
                      >
                        {formatFollowers(creator.followers)} Followers
                      </p>

                    )}

                  </div>

                </div>

              ))}

            </div>

          ) : (

            <div className="mt-10 rounded-3xl border border-dashed border-black/15 bg-[#faf9f6] px-6 py-16 text-center">

              <p className="font-serif text-2xl">
                Creator profiles coming soon.
              </p>

              <p className="mt-3 text-sm text-black/50">
                FluenSoul creators will appear here as the family grows.
              </p>

            </div>

          )}

        </div>

      </section>


      {/* =====================================================
          TESTIMONIALS
      ====================================================== */}

      <section
        id="testimonials"
        className="border-b border-black/5 bg-[#f1ebe3] px-5 py-20 sm:px-8 sm:py-28"
      >

        <div className="mx-auto max-w-7xl">

          <div className="text-center">

            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-black/40">
              Community
            </p>

            <h2 className="mt-4 font-serif text-4xl tracking-tight sm:text-5xl">
              What People Say
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-black/55">
              As our network grows, this space will showcase feedback
              from brands and creators who work with FluenSoul.
            </p>

          </div>


          <div className="mt-12 grid gap-5 md:grid-cols-3">

            {/* TESTIMONIAL 1 */}

            <div className="rounded-3xl border border-black/10 bg-white/70 p-7">

              <div className="font-serif text-5xl leading-none text-black/15">
                “
              </div>

              <p className="mt-5 text-sm leading-7 text-black/65">
                Your experience with FluenSoul could be featured here.
              </p>

              <div className="mt-7 border-t border-black/10 pt-5">

                <p className="text-sm font-semibold">
                  Brand Partner
                </p>

                <p className="mt-1 text-xs text-black/40">
                  FluenSoul Community
                </p>

              </div>

            </div>


            {/* TESTIMONIAL 2 */}

            <div className="rounded-3xl border border-black/10 bg-white/70 p-7">

              <div className="font-serif text-5xl leading-none text-black/15">
                “
              </div>

              <p className="mt-5 text-sm leading-7 text-black/65">
                Creator stories and collaboration experiences will
                appear here.
              </p>

              <div className="mt-7 border-t border-black/10 pt-5">

                <p className="text-sm font-semibold">
                  Creator Partner
                </p>

                <p className="mt-1 text-xs text-black/40">
                  FluenSoul Community
                </p>

              </div>

            </div>


            {/* TESTIMONIAL 3 */}

            <div className="rounded-3xl border border-black/10 bg-white/70 p-7">

              <div className="font-serif text-5xl leading-none text-black/15">
                “
              </div>

              <p className="mt-5 text-sm leading-7 text-black/65">
                Real feedback from our growing network will be
                showcased here.
              </p>

              <div className="mt-7 border-t border-black/10 pt-5">

                <p className="text-sm font-semibold">
                  FluenSoul Partner
                </p>

                <p className="mt-1 text-xs text-black/40">
                  FluenSoul Community
                </p>

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          BRAND + INFLUENCER CTA
      ====================================================== */}

      <section className="grid md:grid-cols-2">

        {/* FOR BRANDS */}

        <div
          id="for-brands"
          className="scroll-mt-24 bg-[#dfc9b8] px-7 py-16 sm:px-12 sm:py-24"
        >

          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/45">
            For Brands
          </p>


          <h2 className="mt-5 max-w-lg font-serif text-4xl leading-tight sm:text-5xl">
            Looking for creators for your next campaign?
          </h2>


          <p className="mt-5 max-w-lg text-sm leading-6 text-black/60">
            Tell us about your brand and campaign. We’ll search our
            creator network and help connect you with suitable
            influencers.
          </p>


          <Link
            href="/for-brands"
            className="mt-8 inline-flex rounded-2xl bg-[#171717] px-7 py-4 text-sm font-semibold text-white transition hover:bg-black"
          >
            Submit Brand Requirement →
          </Link>

        </div>


        {/* FOR INFLUENCERS */}

        <div
          id="for-influencers"
          className="scroll-mt-24 bg-[#171717] px-7 py-16 text-white sm:px-12 sm:py-24"
        >

          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">
            For Influencers
          </p>


          <h2 className="mt-5 max-w-lg font-serif text-4xl leading-tight sm:text-5xl">
            Are you a creator looking for opportunities?
          </h2>


          <p className="mt-5 max-w-lg text-sm leading-6 text-white/55">
            Join the FluenSoul creator network and let us know about
            your content, audience and work.
          </p>


          <Link
            href="/for-influencers"
            className="mt-8 inline-flex rounded-2xl bg-white px-7 py-4 text-sm font-semibold text-black transition hover:bg-white/90"
          >
            Join FluenSoul →
          </Link>

        </div>

      </section>


      {/* =====================================================
          FOOTER
      ====================================================== */}

      <footer className="bg-[#faf9f6] px-5 py-12 sm:px-8">

        <div className="mx-auto flex max-w-7xl flex-col gap-8 md:flex-row md:items-end md:justify-between">

          {/* FOOTER LOGO */}

          <div>

            <Link
              href="/"
              className="inline-block"
            >

              <FluenSoulLogo
                width={190}
                className="max-w-[190px]"
              />

            </Link>


            <p className="mt-5 max-w-sm text-sm leading-6 text-black/45">
              Connecting brands with creators and creating meaningful
              collaboration opportunities.
            </p>

          </div>


          {/* FOOTER LINKS */}

          <div className="flex flex-wrap gap-x-7 gap-y-3 text-sm text-black/55">

            <Link
              href="/"
              className="hover:text-black"
            >
              Home
            </Link>


            <a
              href="#how-it-works"
              className="hover:text-black"
            >
              How It Works
            </a>


            <a
              href="#creators"
              className="hover:text-black"
            >
              Our Family
            </a>


            <Link
              href="/for-brands"
              className="hover:text-black"
            >
              For Brands
            </Link>


            <Link
              href="/for-influencers"
              className="hover:text-black"
            >
              For Influencers
            </Link>


            <Link
              href="/login"
              className="font-semibold text-black"
            >
              Login
            </Link>

          </div>

        </div>


        {/* COPYRIGHT */}

        <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-3 border-t border-black/10 pt-6 text-xs text-black/35 sm:flex-row sm:items-center sm:justify-between">

          <p>
            © {new Date().getFullYear()} FluenSoul. All rights reserved.
          </p>

          <p>
            CREATE · CONNECT · GROW
          </p>

        </div>

      </footer>

    </main>
  );
}