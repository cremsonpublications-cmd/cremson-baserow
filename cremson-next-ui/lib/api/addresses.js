import api from "./axios";

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

export async function getAddresses(token) {
  const { data } = await api.get("/api/addresses/", { headers: authHeaders(token) });
  return data;
}

export async function addAddress(token, address) {
  const { data } = await api.post("/api/addresses/", address, { headers: authHeaders(token) });
  return data;
}

export async function updateAddress(token, id, address) {
  const { data } = await api.put(`/api/addresses/${id}`, address, { headers: authHeaders(token) });
  return data;
}

export async function deleteAddress(token, id) {
  await api.delete(`/api/addresses/${id}`, { headers: authHeaders(token) });
}

export async function setDefaultAddress(token, id) {
  const { data } = await api.put(`/api/addresses/${id}/set-default`, {}, { headers: authHeaders(token) });
  return data;
}
