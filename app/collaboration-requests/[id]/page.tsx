import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "../../../lib/server";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function CollaborationRequestPage({
  params,
}: PageProps) {
  const { id } = await params;

  const supabase = await createClient();

  // ---------------------------------------------------------
  // LOAD REQUEST
  // ---------------------------------------------------------

  const { data: request, error } = await supabase
    .from("collaboration_requests")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !request) {
    notFound();
  }

  // ---------------------------------------------------------
  // LOAD INFLUENCER
  // ---------------------------------------------------------

  const { data: influencer } = await supabase
    .from("influencers")
    .select("id, username, name")
    .eq("id", request.influencer_id)
    .single();

  // ---------------------------------------------------------
  // UPDATE STATUS
  // ---------------------------------------------------------

  async function updateStatus(formData: FormData) {
    "use server";

    const newStatus = String(
      formData.get("status") ?? ""
    );

    const allowedStatuses = [
      "new",
      "reviewing",
      "accepted",
      "rejected",
      "completed",
    ];

    if (!allowedStatuses.includes(newStatus)) {
      return;
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from("collaboration_requests")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error(
        "Status update failed:",
        error
      );

      return;
    }

    redirect(`/collaboration-requests/${id}`);
  }

  // ---------------------------------------------------------
  // STATUS STYLING
  // ---------------------------------------------------------

  const statusStyles: Record<string, string> = {
    new: "bg-pink-100 text-pink-600",
    reviewing: "bg-yellow-100 text-yellow-700",
    accepted: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-600",
    completed: "bg-blue-100 text-blue-700",
  };

  const currentStatusStyle =
    statusStyles[request.status] ??
    "bg-gray-100 text-gray-600";

  return (
    <main className="min-h-screen bg-[#f4f5f7] px-6 py-8 sm:px-10">

      <div className="mx-auto max-w-5xl">

        {/* =====================================================
            TOP BAR
        ====================================================== */}

        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <Link
            href="/"
            className="text-sm font-semibold text-gray-500 transition hover:text-gray-900"
          >
            ← Back to Dashboard
          </Link>

          <span
            className={`w-fit rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide ${currentStatusStyle}`}
          >
            {request.status}
          </span>

        </div>


        {/* =====================================================
            HEADER
        ====================================================== */}

        <section className="rounded-3xl bg-white p-7 shadow-sm sm:p-10">

          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-pink-500">
            Collaboration Request
          </p>

          <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

            <div>

              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
                {request.company_name}
              </h1>

              <p className="mt-2 text-lg text-gray-500">
                {request.contact_person}
              </p>

            </div>

            {influencer && (
              <div className="rounded-2xl bg-gray-50 px-5 py-4">

                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Influencer
                </p>

                <p className="mt-1 font-bold text-gray-900">
                  {influencer.name}
                </p>

                <p className="text-sm text-gray-500">
                  @{influencer.username}
                </p>

              </div>
            )}

          </div>

        </section>


        {/* =====================================================
            CONTACT INFORMATION
        ====================================================== */}

        <section className="mt-6 rounded-3xl bg-white p-7 shadow-sm sm:p-10">

          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-pink-500">
            01 — Contact
          </p>

          <h2 className="mt-3 text-2xl font-bold text-gray-900">
            Company Contact
          </h2>

          <div className="mt-7 grid gap-5 sm:grid-cols-2">

            <div className="rounded-2xl bg-gray-50 p-5">

              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Contact Person
              </p>

              <p className="mt-2 font-semibold text-gray-900">
                {request.contact_person}
              </p>

            </div>


            <div className="rounded-2xl bg-gray-50 p-5">

              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Email
              </p>

              <a
                href={`mailto:${request.email}`}
                className="mt-2 block break-all font-semibold text-gray-900 hover:text-pink-500"
              >
                {request.email}
              </a>

            </div>


            <div className="rounded-2xl bg-gray-50 p-5">

              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Phone
              </p>

              {request.phone ? (
                <a
                  href={`tel:${request.phone}`}
                  className="mt-2 block font-semibold text-gray-900 hover:text-pink-500"
                >
                  {request.phone}
                </a>
              ) : (
                <p className="mt-2 text-gray-400">
                  Not provided
                </p>
              )}

            </div>

          </div>

        </section>


        {/* =====================================================
            CAMPAIGN INFORMATION
        ====================================================== */}

        <section className="mt-6 rounded-3xl bg-white p-7 shadow-sm sm:p-10">

          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-pink-500">
            02 — Campaign
          </p>

          <h2 className="mt-3 text-2xl font-bold text-gray-900">
            Campaign Information
          </h2>

          <div className="mt-7 grid gap-5 sm:grid-cols-2">

            <div className="rounded-2xl bg-gray-50 p-5">

              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Campaign / Project
              </p>

              <p className="mt-2 font-semibold text-gray-900">
                {request.campaign_title ||
                  "Not specified"}
              </p>

            </div>


            <div className="rounded-2xl bg-gray-50 p-5">

              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Collaboration Type
              </p>

              <p className="mt-2 font-semibold text-gray-900">
                {request.collaboration_type ||
                  "Not specified"}
              </p>

            </div>


            <div className="rounded-2xl bg-gray-50 p-5">

              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Budget
              </p>

              <p className="mt-2 font-semibold text-gray-900">
                {request.budget ||
                  "Not specified"}
              </p>

            </div>


            <div className="rounded-2xl bg-gray-50 p-5">

              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Preferred Date
              </p>

              <p className="mt-2 font-semibold text-gray-900">
                {request.preferred_date
                  ? new Date(
                      `${request.preferred_date}T00:00:00`
                    ).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "Not specified"}
              </p>

            </div>

          </div>

        </section>


        {/* =====================================================
            CAMPAIGN DETAILS
        ====================================================== */}

        <section className="mt-6 rounded-3xl bg-white p-7 shadow-sm sm:p-10">

          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-pink-500">
            03 — Proposal
          </p>

          <h2 className="mt-3 text-2xl font-bold text-gray-900">
            Campaign Details
          </h2>

          <div className="mt-7 rounded-2xl bg-gray-50 p-6">

            <p className="whitespace-pre-wrap text-base leading-8 text-gray-700">
              {request.campaign_details}
            </p>

          </div>

        </section>


        {/* =====================================================
            REQUEST TIMELINE
        ====================================================== */}

        <section className="mt-6 rounded-3xl bg-white p-7 shadow-sm sm:p-10">

          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-pink-500">
            04 — Request
          </p>

          <h2 className="mt-3 text-2xl font-bold text-gray-900">
            Request Information
          </h2>

          <div className="mt-7 grid gap-5 sm:grid-cols-2">

            <div className="rounded-2xl bg-gray-50 p-5">

              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Received
              </p>

              <p className="mt-2 font-semibold text-gray-900">
                {new Date(
                  request.created_at
                ).toLocaleString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>

            </div>


            <div className="rounded-2xl bg-gray-50 p-5">

              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Last Updated
              </p>

              <p className="mt-2 font-semibold text-gray-900">
                {new Date(
                  request.updated_at
                ).toLocaleString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>

            </div>

          </div>

        </section>


        {/* =====================================================
            STATUS MANAGEMENT
        ====================================================== */}

        <section className="mt-6 rounded-3xl bg-gray-900 p-7 text-white shadow-sm sm:p-10">

          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-pink-400">
            05 — Manage
          </p>

          <h2 className="mt-3 text-2xl font-bold">
            Update Request Status
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">
            Update the request as you review and process
            the collaboration.
          </p>


          <form
            action={updateStatus}
            className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-end"
          >

            <div className="flex-1">

              <label
                htmlFor="status"
                className="mb-2 block text-sm font-semibold text-white/80"
              >
                Status
              </label>

              <select
                id="status"
                name="status"
                defaultValue={request.status}
                className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20"
              >

                <option
                  value="new"
                  className="text-black"
                >
                  New
                </option>

                <option
                  value="reviewing"
                  className="text-black"
                >
                  Reviewing
                </option>

                <option
                  value="accepted"
                  className="text-black"
                >
                  Accepted
                </option>

                <option
                  value="rejected"
                  className="text-black"
                >
                  Rejected
                </option>

                <option
                  value="completed"
                  className="text-black"
                >
                  Completed
                </option>

              </select>

            </div>


            <button
              type="submit"
              className="rounded-xl bg-white px-7 py-3 font-bold text-gray-900 transition hover:bg-pink-100"
            >
              Update Status
            </button>

          </form>

        </section>


        {/* =====================================================
            FOOTER
        ====================================================== */}

        <div className="py-10 text-center">

          <Link
            href="/"
            className="text-sm font-semibold text-gray-500 transition hover:text-gray-900"
          >
            ← Return to Admin Dashboard
          </Link>

        </div>

      </div>

    </main>
  );
}