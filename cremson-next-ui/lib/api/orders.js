import api from "./axios";

export async function getMyOrders(email) {
  const { data } = await api.get(`/api/orders/?email=${encodeURIComponent(email)}`);
  return (data.results || []).map(mapOrder);
}

function mapOrder(row) {
  const userInfo   = tryParse(row.user_info)   || {};
  const items      = tryParse(row.items)        || [];
  const summary    = tryParse(row.order_summary)|| {};
  const payment    = tryParse(row.payment)      || {};
  const address    = userInfo.address           || {};
  const delivery   = tryParse(row.delivery)     || {};

  const shippingAddress = [
    address.street,
    address.apartment,
    address.city,
    address.state && address.pincode ? `${address.state} - ${address.pincode}` : address.state || address.pincode,
  ].filter(Boolean).join(", ");

  const statusMap = {
    confirmed: "Order Placed",
    shipped:   "Shipped",
    delivered: "Delivered",
  };
  const status = statusMap[(row.order_status || "").toLowerCase()] || row.order_status || "Order Placed";

  const awb = delivery.awb || "";
  const trackingUrl = awb
    ? `https://cremsonpublications.shipway.com/tracking/forward/${awb}/`
    : (delivery.tracking_url || "");

  return {
    id:               row.order_id,
    date:             row.order_date ? new Date(row.order_date).toLocaleDateString("en-US") : "",
    rawDate:          row.order_date || "",
    status,
    total:            summary.grandTotal || 0,
    itemsCount:       items.reduce((s, i) => s + (i.quantity || 1), 0),
    expectedDelivery: "TBD",
    payment_id:       payment.transactionId || null,
    awb,
    trackingUrl,
    items:            items.map((i) => ({
      title:    i.name,
      quantity: i.quantity,
      price:    i.currentPrice,
      image:    i.image,
    })),
    shippingAddress,
  };
}

function tryParse(str) {
  try { return JSON.parse(str); } catch { return null; }
}
