export const runtime = "edge";

import { notFound } from "next/navigation";
import CampaignPage from "../../../components/campaign/CampaignPage";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  try {
    const res = await fetch(`${apiUrl}/api/campaigns/${slug}`, {
      cache: "no-store",
    });
    if (res.ok) {
      const json = await res.json();
      const meta = json.meta || {};
      return {
        title: meta.title || "Cremson Publications",
        description: meta.description || "",
        openGraph: {
          title: meta.title || "Cremson Publications",
          description: meta.description || "",
          images: meta.ogImage ? [{ url: meta.ogImage }] : [],
        },
      };
    }
  } catch {
    // fall through to static fallback
  }

  const { campaignData } = await import("../../../data/campaignData");
  if (campaignData.meta?.slug === slug) {
    const meta = campaignData.meta;
    return {
      title: meta.title || "Cremson Publications",
      description: meta.description || "",
      openGraph: {
        title: meta.title || "Cremson Publications",
        description: meta.description || "",
        images: meta.ogImage ? [{ url: meta.ogImage }] : [],
      },
    };
  }

  return { title: "Cremson Publications" };
}

export default async function CampaignPageRoute({ params }) {
  const { slug } = await params;

  // Try to load from the API first; fall back to static data if not found
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const res = await fetch(`${apiUrl}/api/campaigns/${slug}`, {
      cache: "no-store",
    });

    if (res.ok) {
      const json = await res.json();
      // The API returns { id, slug, title, is_active, data, ... }
      // CampaignPage expects the nested data object directly
      const campaignData = json.data || json;
      return <CampaignPage data={campaignData} />;
    }
  } catch {
    // Network error — fall through to static fallback
  }

  // Static fallback: import the hardcoded campaign data file and match by slug
  const { campaignData } = await import("../../../data/campaignData");
  if (campaignData.meta?.slug === slug) {
    return <CampaignPage data={campaignData} />;
  }

  notFound();
}
