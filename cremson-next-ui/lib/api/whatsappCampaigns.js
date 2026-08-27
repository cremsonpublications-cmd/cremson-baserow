import api from "./axios";

export const getWhatsAppTemplates = async () => {
  const res = await api.get("/api/admin/whatsapp/templates");
  return res.data;
};

export const syncTemplatesFromMeta = async () => {
  const res = await api.post("/api/admin/whatsapp/templates/sync");
  return res.data;
};

export const createTemplate = async (payload) => {
  const res = await api.post("/api/admin/whatsapp/templates", payload);
  return res.data;
};

export const updateTemplate = async (name, payload) => {
  const res = await api.patch(`/api/admin/whatsapp/templates/${name}`, payload);
  return res.data;
};

export const deleteTemplate = async (name) => {
  const res = await api.delete(`/api/admin/whatsapp/templates/${name}`);
  return res.data;
};

export const previewAudience = async (audienceType, audienceFilter = "") => {
  const res = await api.get(`/api/admin/whatsapp/audiences?audience_type=${audienceType}&audience_filter=${encodeURIComponent(audienceFilter)}`);
  return res.data;
};

export const getCampaigns = async () => {
  const res = await api.get("/api/admin/whatsapp/campaigns");
  return res.data;
};

export const createCampaign = async (payload) => {
  const res = await api.post("/api/admin/whatsapp/campaigns", payload);
  return res.data;
};

export const getCampaignDetails = async (campaignId) => {
  const res = await api.get(`/api/admin/whatsapp/campaigns/${campaignId}`);
  return res.data;
};

export const getCampaignRecipients = async (campaignId, page = 1, size = 50, status = "") => {
  let url = `/api/admin/whatsapp/campaigns/${campaignId}/recipients?page=${page}&size=${size}`;
  if (status) {
    url += `&status=${status}`;
  }
  const res = await api.get(url);
  return res.data;
};

export const sendCampaignNow = async (campaignId) => {
  const res = await api.post(`/api/admin/whatsapp/campaigns/${campaignId}/send`);
  return res.data;
};

export const cancelCampaign = async (campaignId) => {
  const res = await api.post(`/api/admin/whatsapp/campaigns/${campaignId}/cancel`);
  return res.data;
};

export const deleteCampaign = async (campaignId) => {
  const res = await api.delete(`/api/admin/whatsapp/campaigns/${campaignId}`);
  return res.data;
};

export const retryFailedRecipients = async (campaignId) => {
  const res = await api.post(`/api/admin/whatsapp/campaigns/${campaignId}/retry-failed`);
  return res.data;
};
