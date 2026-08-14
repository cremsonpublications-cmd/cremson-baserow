"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../../lib/api/axios";
import { adminUpdateShippingSetting } from "../../../lib/api/admin";
import {
  Settings,
  AlertTriangle,
  CheckCircle2,
  Save,
  RotateCcw,
} from "lucide-react";

export default function AdminSettings() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("global");

  // State for Global Delivery & Returns text
  const [deliveryInfo, setDeliveryInfo] = useState(
    "We aim to deliver your order safely and on time. All orders are usually delivered within 4–5 working days from the date of dispatch.\nDelivery timelines may vary slightly depending on your location, courier service availability, and order size.\n\nDelivery Charges:\nApplicable as per your delivery address and order value. The exact delivery charge (if any) will be displayed at checkout before you make the payment.\n\nOnce your order has been shipped, you will receive an email or WhatsApp notification with your tracking details so you can monitor your delivery status in real time."
  );

  const [returnsInfo, setReturnsInfo] = useState(
    "We take utmost care in packaging and dispatching your order. However, if you happen to receive a damaged, defective, or incorrect product, we will be happy to offer an exchange.\n\nPlease note the following terms:\n• Exchange is applicable only in cases where the product received is damaged, misprinted, or incorrect.\n• We do not offer returns or refunds for any other reasons (such as change of mind or wrong selection).\n• Customers must notify us within 14 days of delivery to be eligible for an exchange.\n• We do not arrange return pickups. You will need to ship the product back to our address (as provided in the exchange confirmation email).\n• Once we receive and verify the returned product, a replacement copy will be dispatched to you at no additional cost.\n• The exchanged product will be the same title and edition as originally ordered (unless otherwise agreed upon in writing).\n\n—\n\nHow to Raise an Exchange Request\n\nTo initiate an exchange or report a damaged/incorrect product:\n1. Email us at info@cremsonpublications.com within 14 days of receiving your order.\n2. Mention your Order ID, the issue faced, and attach clear photographs of the product and packaging.\n3. Our team will review your request and respond with the return shipping details and next steps."
  );

  // State for Shipping Config
  const [shippingEnabled, setShippingEnabled] = useState(true);
  const [shippingCharge, setShippingCharge] = useState("50");
  const [freeThreshold, setFreeThreshold] = useState("500");

  // State for Teacher Limit
  const [teacherLimit, setTeacherLimit] = useState("10");
  const [teacherLimitRowId, setTeacherLimitRowId] = useState(null);

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Fetch current shipping settings from API
  const { data: shippingData } = useQuery({
    queryKey: ["admin-shipping-settings"],
    queryFn: async () => {
      const { data } = await api.get("/api/shipping-settings/", { params: { size: 200 } });
      return data;
    },
  });

  const settingsList = shippingData?.results ?? shippingData?.items ?? [];
  const primarySetting = settingsList.find(s => s.Name !== "teacher_signup_limit") || settingsList[0];

  useEffect(() => {
    if (primarySetting) {
      if (primarySetting.shipping_charge != null) setShippingCharge(String(primarySetting.shipping_charge));
      if (primarySetting.free_delivery_threshold != null) setFreeThreshold(String(primarySetting.free_delivery_threshold));
      const activeState = primarySetting.shipping_enabled ?? primarySetting.Active ?? true;
      setShippingEnabled(activeState);
    }
    const limitSetting = settingsList.find(s => s.Name === "teacher_signup_limit");
    if (limitSetting) {
      setTeacherLimit(String(limitSetting.Notes || "10"));
      setTeacherLimitRowId(limitSetting.id);
    }
  }, [primarySetting, settingsList]);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      if (primarySetting?.id) {
        await adminUpdateShippingSetting(primarySetting.id, {
          Name: primarySetting.Name || "Standard Shipping",
          shipping_charge: parseFloat(shippingCharge) || 0,
          free_delivery_threshold: parseFloat(freeThreshold) || 0,
          shipping_enabled: shippingEnabled,
          Active: shippingEnabled,
          Notes: primarySetting.Notes || "Global default shipping rule",
        });
      }

      if (teacherLimitRowId) {
        await adminUpdateShippingSetting(teacherLimitRowId, {
          Name: "teacher_signup_limit",
          Notes: String(teacherLimit),
          Active: true
        });
      } else {
        await api.post("/api/shipping-settings/", {
          Name: "teacher_signup_limit",
          Notes: String(teacherLimit),
          Active: true
        });
      }

      queryClient.invalidateQueries({ queryKey: ["admin-shipping-settings"] });
      setSuccessMsg("Settings saved successfully!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setErrorMsg(err?.response?.data?.detail || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    if (primarySetting) {
      setShippingCharge(String(primarySetting.shipping_charge ?? 50));
      setFreeThreshold(String(primarySetting.free_delivery_threshold ?? 500));
      setShippingEnabled(primarySetting.shipping_enabled ?? primarySetting.Active ?? true);
    } else {
      setShippingCharge("50");
      setFreeThreshold("500");
      setShippingEnabled(true);
    }
    const limitSetting = settingsList.find(s => s.Name === "teacher_signup_limit");
    if (limitSetting) {
      setTeacherLimit(String(limitSetting.Notes || "10"));
    } else {
      setTeacherLimit("10");
    }
    setSuccessMsg("");
    setErrorMsg("");
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Sticky Header and Tabs */}
      <div className="sticky top-0 z-20 bg-gray-50 pt-4 pb-2 -mt-4 border-b border-gray-200 mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4 px-1">Settings</h2>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab("global")}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                  activeTab === "global"
                    ? "border-purple-500 text-purple-600 bg-purple-50"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                Global Settings
              </button>
              <button
                onClick={() => setActiveTab("account")}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                  activeTab === "account"
                    ? "border-purple-500 text-purple-600 bg-purple-50"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                Account Settings
              </button>
            </nav>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 min-h-screen p-6">
        <div className="max-w-4xl mx-auto">
          {activeTab === "global" ? (
            <>
              {/* Feedback messages */}
              {successMsg && (
                <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4 mb-6 flex items-center gap-2 text-sm font-medium">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  {successMsg}
                </div>
              )}
              {errorMsg && (
                <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6 text-sm font-medium">
                  {errorMsg}
                </div>
              )}

              {/* Main Form */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <form onSubmit={handleSave} className="space-y-6">
                  {/* Delivery text */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      <div className="flex items-center space-x-2">
                        <span>Global Delivery Information</span>
                        <CheckCircle2 className="w-4 h-4 text-green-600" aria-hidden="true" />
                      </div>
                    </label>
                    <textarea
                      placeholder="Enter default delivery information for all products..."
                      rows={8}
                      value={deliveryInfo}
                      onChange={(e) => setDeliveryInfo(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors resize-vertical text-sm text-gray-900"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      This information will appear in the delivery section of all product pages (unless overridden)
                    </p>
                  </div>

                  {/* Returns text */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      <div className="flex items-center space-x-2">
                        <span>Global Returns Information</span>
                        <CheckCircle2 className="w-4 h-4 text-green-600" aria-hidden="true" />
                      </div>
                    </label>
                    <textarea
                      placeholder="Enter default returns policy for all products..."
                      rows={8}
                      value={returnsInfo}
                      onChange={(e) => setReturnsInfo(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors resize-vertical text-sm text-gray-900"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      This information will appear in the returns section of all product pages (unless overridden)
                    </p>
                  </div>

                  {/* Shipping & Delivery Configuration */}
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Shipping &amp; Delivery Configuration</h3>

                    <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700">Enable Shipping Charges</h4>
                        <p className="text-sm text-gray-500">Toggle to enable/disable shipping charges sitewide</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={shippingEnabled}
                          onChange={(e) => setShippingEnabled(e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Standard Shipping Charge (₹)</label>
                        <input
                          type="number"
                          placeholder="Enter shipping charge"
                          min="0"
                          step="0.01"
                          value={shippingCharge}
                          onChange={(e) => setShippingCharge(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors text-sm text-gray-900"
                        />
                        <p className="text-xs text-gray-500 mt-1">Amount charged for standard delivery</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Free Delivery Threshold (₹)</label>
                        <input
                          type="number"
                          placeholder="Enter minimum order value"
                          min="0"
                          step="0.01"
                          value={freeThreshold}
                          onChange={(e) => setFreeThreshold(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors text-sm text-gray-900"
                        />
                        <p className="text-xs text-gray-500 mt-1">Orders above this amount get free delivery</p>
                      </div>
                    </div>

                    {/* Preview box */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <h4 className="text-sm font-medium text-blue-800 mb-2">Shipping Logic Preview</h4>
                      <div className="text-sm text-blue-700 space-y-1">
                        <p>
                          • Orders below ₹{freeThreshold || "500"}: <strong>₹{shippingCharge || "50"} shipping charge</strong>
                        </p>
                        <p>
                          • Orders ₹{freeThreshold || "500"} and above: <strong>FREE delivery</strong>
                        </p>
                      </div>
                    </div>

                    {/* Teacher Signup Settings */}
                    <div className="border-t border-gray-200 pt-6 mt-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Teacher Registration Settings</h3>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Teacher Signup Limit</label>
                        <input
                          type="number"
                          placeholder="Enter teacher signup limit"
                          min="0"
                          value={teacherLimit}
                          onChange={(e) => setTeacherLimit(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors text-sm text-gray-900 animate-none"
                        />
                        <p className="text-xs text-gray-500 mt-1.5">
                          Configure the maximum number of verified teacher accounts allowed. When this limit is met, further signups will be blocked and redirected to contact administration.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={handleReset}
                      className="px-6 py-3 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition-colors cursor-pointer text-sm"
                    >
                      Reset
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer disabled:opacity-50 text-sm"
                    >
                      <Save className="w-4 h-4" aria-hidden="true" />
                      <span>{saving ? "Saving..." : "Save Settings"}</span>
                    </button>
                  </div>
                </form>
              </div>
            </>
          ) : (
            /* Account Settings Tab */
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Account Settings</h2>
              <p className="text-sm text-gray-600 mb-6">Manage administrative credentials and preferences.</p>
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Admin Email</label>
                  <input
                    type="email"
                    disabled
                    value="admin@cremsonpublications.com"
                    className="w-full px-4 py-2.5 bg-gray-100 border border-gray-300 rounded-lg text-sm text-gray-700 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <input
                    type="text"
                    disabled
                    value="Super Administrator"
                    className="w-full px-4 py-2.5 bg-gray-100 border border-gray-300 rounded-lg text-sm text-gray-700 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
