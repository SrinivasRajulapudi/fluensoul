"use client";

import { useState } from "react";

type PortfolioItem = {
  id: string;
  title: string;
  brand_name: string | null;
  description: string | null;
  image_url: string | null;
  content_url: string | null;
  work_date: string | null;
  is_featured: boolean;
  is_active: boolean;
};

type Props = {
  item: PortfolioItem;
  action: (formData: FormData) => void;
};

export default function EditPortfolioItem({
  item,
  action,
}: Props) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
      >
        Edit
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-5 backdrop-blur-sm">

      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-7 shadow-2xl sm:p-9">

        <div className="flex items-start justify-between gap-5">

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-pink-500">
              Portfolio
            </p>

            <h2 className="mt-2 text-2xl font-bold text-gray-900">
              Edit Featured Work
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Update this campaign or collaboration.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-lg text-gray-500 transition hover:bg-gray-200 hover:text-gray-900"
          >
            ×
          </button>

        </div>

        <form
          action={action}
          className="mt-8 space-y-5"
        >

          <input
            type="hidden"
            name="portfolio_id"
            value={item.id}
          />

          {/* TITLE */}

          <div>

            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Work Title *
            </label>

            <input
              name="title"
              type="text"
              required
              defaultValue={item.title}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
            />

          </div>


          {/* BRAND */}

          <div>

            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Brand Name
            </label>

            <input
              name="brand_name"
              type="text"
              defaultValue={item.brand_name ?? ""}
              placeholder="Brand / Company"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
            />

          </div>


          {/* DESCRIPTION */}

          <div>

            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Description
            </label>

            <textarea
              name="description"
              rows={5}
              defaultValue={item.description ?? ""}
              placeholder="Describe the campaign or work..."
              className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
            />

          </div>


          {/* IMAGE URL */}

          <div>

            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Image URL
            </label>

            <input
              name="image_url"
              type="url"
              defaultValue={item.image_url ?? ""}
              placeholder="https://..."
              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
            />

            {item.image_url && (
              <div className="mt-3 overflow-hidden rounded-xl">
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="h-40 w-full object-cover"
                />
              </div>
            )}

          </div>


          {/* CONTENT URL */}

          <div>

            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Content / Campaign URL
            </label>

            <input
              name="content_url"
              type="url"
              defaultValue={item.content_url ?? ""}
              placeholder="https://instagram.com/..."
              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
            />

          </div>


          {/* DATE */}

          <div>

            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Work Date
            </label>

            <input
              name="work_date"
              type="date"
              defaultValue={item.work_date ?? ""}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
            />

          </div>


          {/* OPTIONS */}

          <div className="grid gap-4 sm:grid-cols-2">

            <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-gray-50 p-5">

              <input
                type="checkbox"
                name="is_featured"
                defaultChecked={item.is_featured}
                className="h-5 w-5 rounded border-gray-300 text-pink-500 focus:ring-pink-400"
              />

              <div>
                <p className="font-semibold text-gray-900">
                  Featured
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Show in Featured Work.
                </p>
              </div>

            </label>


            <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-gray-50 p-5">

              <input
                type="checkbox"
                name="is_active"
                defaultChecked={item.is_active}
                className="h-5 w-5 rounded border-gray-300 text-green-500 focus:ring-green-400"
              />

              <div>
                <p className="font-semibold text-gray-900">
                  Published
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Visible publicly.
                </p>
              </div>

            </label>

          </div>


          {/* ACTIONS */}

          <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:justify-end">

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-xl border border-gray-200 bg-white px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="rounded-xl bg-gray-900 px-6 py-3 font-semibold text-white transition hover:bg-gray-700"
            >
              Save Changes
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}