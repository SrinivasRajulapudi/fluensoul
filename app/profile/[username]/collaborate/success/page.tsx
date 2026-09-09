import { notFound } from "next/navigation";
import { createClient } from "../../../../../lib/server";

type PageProps = {
  params: Promise<{ username: string }>;
};

export default async function CollaborationSuccessPage({
  params,
}: PageProps) {
  const { username } = await params;

  const supabase = await createClient();

  const { data: influencer, error } = await supabase
    .from("influencers")
    .select("username, name, is_active")
    .eq("username", username)
    .eq("is_active", true)
    .single();

  if (error || !influencer) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#f5f3ef] text-[#111318]">
      <header className="border-b border-black/10 bg-[#f5f3ef]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 sm:px-10">
          <a
            href={`/profile/${influencer.username}`}
            className="text-sm font-bold uppercase tracking-[0.25em] text-black"
          >
            FluenSoul
          </a>

          <a
            href={`/profile/${influencer.username}`}
            className="text-sm font-semibold text-black/60 transition hover:text-black"
          >
            ← Back to Profile
          </a>
        </div>
      </header>

      <section className="px-6 py-16 sm:px-10 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.4em] text-pink-500">
              Let&apos;s Work Together
            </p>

            <h1 className="mt-5 text-5xl font-semibold tracking-[-0.04em] sm:text-7xl">
              Collaborate with {influencer.name}.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-black/55 sm:text-xl">
              Tell us about your campaign, brand or creative project. Your
              collaboration request has been sent to the team managing{" "}
              {influencer.name}&apos;s profile.
            </p>
          </div>

          <div className="mt-12 rounded-[2rem] border border-green-200 bg-green-50 p-8 sm:p-10">
            <div className="flex items-start gap-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-600 text-xl font-bold text-white">
                ✓
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-green-600">
                  Request Received
                </p>

                <h2 className="mt-3 text-2xl font-semibold text-green-950">
                  Thank you. Your collaboration request has been received.
                </h2>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-green-900/70">
                  The team managing {influencer.name}&apos;s profile will
                  review your proposal and get back to you if there is a fit.
                </p>

                <a
                  href={`/profile/${influencer.username}`}
                  className="mt-6 inline-flex rounded-full bg-black px-6 py-3 text-sm font-bold text-white transition hover:bg-pink-500"
                >
                  Back to Profile →
                </a>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-xs uppercase tracking-[0.25em] text-black/30">
              Collaboration request • {influencer.name}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
