export const runtime = "edge";

import { campaignData } from "../../../data/campaignData";
import CampaignPage from "../../../components/campaign/CampaignPage";

export async function generateMetadata({ params }) {
  // For Phase 2: replace with await getCampaign(params.slug)
  return {
    title: campaignData.meta.title,
    description: campaignData.meta.description,
  };
}

export default function CampaignPageRoute({ params }) {
  // For Phase 2: replace with: const data = await getCampaign(params.slug)
  const data = campaignData;
  return <CampaignPage data={data} />;
}
