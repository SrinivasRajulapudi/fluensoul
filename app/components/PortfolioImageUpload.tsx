"use client";

import { useState } from "react";
import { createClient } from "../../lib/supabase";

type PortfolioImageUploadProps = {
  influencerId: string;
};

export default function PortfolioImageUpload({
  influencerId,
}: PortfolioImageUploadProps) {
  const supabase = createClient();

  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleUpload(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    setMessage("");

    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    // -------------------------------------------------------
    // VALIDATE FILE
    // -------------------------------------------------------

    if (!file.type.startsWith("image/")) {
      setMessage("Please select an image file.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage("Image must be smaller than 5MB.");
      event.target.value = "";
      return;
    }

    setUploading(true);

    try {
      // -----------------------------------------------------
      // CHECK LOGIN
      // -----------------------------------------------------

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setMessage(
          "You must be logged in to upload an image."
        );
        return;
      }

      // -----------------------------------------------------
      // FILE PATH
      // -----------------------------------------------------

      const extension =
        file.name.split(".").pop()?.toLowerCase() ||
        "jpg";

      const fileName =
        `${crypto.randomUUID()}.${extension}`;

      const filePath =
        `${influencerId}/portfolio/${fileName}`;

      // -----------------------------------------------------
      // UPLOAD
      // -----------------------------------------------------

      const { error: uploadError } =
        await supabase.storage
          .from("influencer-images")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type,
          });

      if (uploadError) {
        console.error(
          "Portfolio image upload failed:",
          uploadError
        );

        setMessage(
          uploadError.message ||
            "Image upload failed."
        );

        return;
      }

      // -----------------------------------------------------
      // PUBLIC URL
      // -----------------------------------------------------

      const {
        data: publicUrlData,
      } = supabase.storage
        .from("influencer-images")
        .getPublicUrl(filePath);

      const publicUrl =
        publicUrlData.publicUrl;

      setImageUrl(publicUrl);

      setMessage(
        "Image uploaded successfully."
      );

    } catch (error) {
      console.error(
        "Unexpected portfolio upload error:",
        error
      );

      setMessage(
        "Something went wrong while uploading the image."
      );
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  return (
    <div className="space-y-4">

      {/* =====================================================
          PREVIEW
      ====================================================== */}

      {imageUrl ? (
        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gray-100">

          <img
            src={imageUrl}
            alt="Portfolio preview"
            className="aspect-[16/10] w-full object-cover"
          />

          <button
            type="button"
            onClick={() => {
              setImageUrl("");
              setMessage("");
            }}
            className="absolute right-3 top-3 rounded-full bg-black/70 px-4 py-2 text-xs font-semibold text-white backdrop-blur transition hover:bg-black"
          >
            Remove
          </button>

        </div>
      ) : (
        <div className="flex aspect-[16/10] items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50">

          <div className="text-center">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-2xl shadow-sm">
              🖼️
            </div>

            <p className="mt-4 text-sm font-semibold text-gray-700">
              No image selected
            </p>

            <p className="mt-1 text-xs text-gray-400">
              Upload a campaign or collaboration image.
            </p>

          </div>

        </div>
      )}


      {/* =====================================================
          UPLOAD BUTTON
      ====================================================== */}

      <label
        className={`inline-flex items-center justify-center rounded-xl px-6 py-3 font-semibold text-white transition ${
          uploading
            ? "cursor-not-allowed bg-gray-400"
            : "cursor-pointer bg-gray-900 hover:bg-gray-700"
        }`}
      >
        {uploading
          ? "Uploading..."
          : imageUrl
          ? "Replace Image"
          : "Choose Image"}

        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          disabled={uploading}
          onChange={handleUpload}
          className="hidden"
        />
      </label>


      {/* =====================================================
          INFO
      ====================================================== */}

      <p className="text-xs text-gray-400">
        JPG, PNG, WEBP or GIF · Maximum 5MB
      </p>


      {/* =====================================================
          MESSAGE
      ====================================================== */}

      {message && (
        <div
          className={`rounded-xl px-4 py-3 text-sm font-medium ${
            message.includes("successfully")
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-600"
          }`}
        >
          {message}
        </div>
      )}


      {/* =====================================================
          HIDDEN FORM VALUE
      ====================================================== */}

      <input
        type="hidden"
        name="image_url"
        value={imageUrl}
        readOnly
      />

    </div>
  );
}