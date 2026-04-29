/**
 * Delivery Boy Dashboard Component
 * Location: client/src/components/DeliveryBoyDashboard.tsx
 * 
 * Allows Delivery Boy to:
 * 1. View orders assigned to them
 * 2. Update delivery status (Out for Delivery, Delivered, Failed)
 * 3. Track sync status with external API
 */

import React, { useState, useEffect } from "react";
import axios from "axios";

interface Assignment {
  _id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  totalAmount: number;
  currentStatus: string;
  specialInstructions?: string;
  assignedAt: string;
  deliveredAt?: string;
}

interface DeliveryDetails extends Assignment {
  statusHistory: Array<{
    status: string;
    timestamp: string;
    notes: string;
  }>;
  syncStatus: string;
  syncError: string;
  lastSyncedAt: string;
}

export function DeliveryBoyDashboard() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<DeliveryDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [notes, setNotes] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "assigned" | "out_for_delivery">("all");

  useEffect(() => {
    loadAssignments();
    // Refresh every 20 seconds
    const interval = setInterval(loadAssignments, 20000);
    return () => clearInterval(interval);
  }, [statusFilter]);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const token = localStorage.getItem("token");
      if (!token) {
        setErrorMessage("Please login to view deliveries");
        setLoading(false);
        return;
      }

      const statusParam = statusFilter === "all" ? "" : statusFilter;
      const url = "/api/delivery/my-orders" + (statusParam ? `?status=${statusParam}` : "");

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAssignments(response.data.assignments || []);
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || "Error loading assignments";
      setErrorMessage(errorMsg);
      console.error("Error loading:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadDetails = async (assignmentId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await axios.get(`/api/delivery/${assignmentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedAssignment(response.data.delivery);
      setNotes("");
      setErrorMessage("");
    } catch (error: any) {
      setErrorMessage("Error loading delivery details");
      console.error("Error:", error);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!selectedAssignment) return;

    try {
      setUpdating(true);
      setErrorMessage("");

      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await axios.put("/api/delivery/update-status", {
        assignmentId: selectedAssignment._id,
        status: newStatus,
        notes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccessMessage(
        `✅ Status updated to ${newStatus.replace(/_/g, " ").toUpperCase()}`
      );

      if (response.data.delivery.syncStatus === "synced") {
        setSuccessMessage(prev => prev + " • Synced to API ✅");
      } else if (response.data.delivery.syncStatus === "failed") {
        setSuccessMessage(prev => prev + " • Sync pending ⏳");
      }

      // Close panel and reload
      setTimeout(() => {
        setSelectedAssignment(null);
        loadAssignments();
        setSuccessMessage("");
      }, 2500);
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || "Error updating status";
      setErrorMessage(`❌ ${errorMsg}`);
      console.error("Error:", error);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      assigned: "#2196F3",
      out_for_delivery: "#FF9800",
      delivered: "#4CAF50",
      failed: "#F44336"
    };
    return colors[status] || "#999";
  };

  const getStatusText = (status: string) => {
    return status.replace(/_/g, " ").toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-lg text-gray-600">Loading your deliveries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">🚚 My Deliveries</h1>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded transition-colors disabled:opacity-50" onClick={loadAssignments} disabled={loading}>
          🔄 Refresh
        </button>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-800 rounded">{successMessage}</div>
      )}
      {errorMessage && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-800 rounded">{errorMessage}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Orders List */}
        <div className="lg:col-span-1 bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-3">📋 Assigned Orders</h2>

            <div className="flex flex-wrap gap-2">
              <button
                className={`px-3 py-2 rounded text-sm font-semibold transition-colors ${statusFilter === "all" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                onClick={() => setStatusFilter("all")}
              >
                All ({assignments.length})
              </button>
              <button
                className={`px-3 py-2 rounded text-sm font-semibold transition-colors ${statusFilter === "assigned" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                onClick={() => setStatusFilter("assigned")}
              >
                Assigned
              </button>
              <button
                className={`px-3 py-2 rounded text-sm font-semibold transition-colors ${statusFilter === "out_for_delivery" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                onClick={() => setStatusFilter("out_for_delivery")}
              >
                Out for Delivery
              </button>
            </div>
          </div>

          <div className="overflow-y-auto max-h-[600px]">
            {assignments.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-5xl mb-3">📭</div>
                <p className="text-gray-600">No orders assigned to you</p>
              </div>
            ) : (
              assignments.map((assignment) => (
                <div
                  key={assignment._id}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-blue-50 transition-colors ${
                    selectedAssignment?._id === assignment._id ? "bg-blue-100" : ""
                  }`}
                  onClick={() => handleLoadDetails(assignment._id)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold text-gray-800">{assignment.orderNumber}</span>
                    <span
                      className="px-2 py-1 text-white text-xs rounded-full font-semibold"
                      style={{ backgroundColor: getStatusColor(assignment.currentStatus) }}
                    >
                      {getStatusText(assignment.currentStatus)}
                    </span>
                  </div>

                  <div className="space-y-1 text-sm">
                    <div>
                      <span className="text-gray-600">👤 Customer:</span>
                      <span className="font-semibold text-gray-800 ml-2">{assignment.customerName}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">📱 Phone:</span>
                      <span className="font-semibold text-gray-800 ml-2">{assignment.customerPhone}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">💰 Amount:</span>
                      <span className="font-semibold text-gray-800 ml-2">₹{assignment.totalAmount}</span>
                    </div>
                  </div>

                  <div className="mt-2 p-2 bg-gray-100 text-gray-700 text-sm rounded">
                    📍 {assignment.customerAddress}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Delivery Details & Status Update */}
        {selectedAssignment ? (
          <div className="lg:col-span-2 bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">📦 Delivery Details</h2>
              <button
                className="text-gray-400 hover:text-gray-600 text-2xl rounded-full hover:bg-gray-100 p-1 w-10 h-10 flex items-center justify-center transition-colors"
                onClick={() => setSelectedAssignment(null)}
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[600px] overflow-y-auto">
              {/* Order Information */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-3">Order Information</h3>
                <div className="space-y-3">
                  <div className="flex">
                    <span className="w-40 text-gray-600 font-semibold">Order Number:</span>
                    <span className="text-gray-800">{selectedAssignment.orderNumber}</span>
                  </div>
                  <div className="flex">
                    <span className="w-40 text-gray-600 font-semibold">Customer Name:</span>
                    <span className="text-gray-800">{selectedAssignment.customerName}</span>
                  </div>
                  <div className="flex">
                    <span className="w-40 text-gray-600 font-semibold">Customer Phone:</span>
                    <span className="text-gray-800">
                      <a href={`tel:${selectedAssignment.customerPhone}`} className="text-blue-600 hover:underline">
                        {selectedAssignment.customerPhone}
                      </a>
                    </span>
                  </div>
                  <div className="flex">
                    <span className="w-40 text-gray-600 font-semibold">Delivery Address:</span>
                    <span className="text-gray-800">{selectedAssignment.customerAddress}</span>
                  </div>
                  <div className="flex">
                    <span className="w-40 text-gray-600 font-semibold">Amount:</span>
                    <span className="text-xl font-bold text-green-600">₹{selectedAssignment.totalAmount}</span>
                  </div>
                </div>
              </div>

              {/* Current Status */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-3">Current Status</h3>
                <div
                  className="p-4 text-white rounded-lg flex items-center gap-3"
                  style={{ backgroundColor: getStatusColor(selectedAssignment.currentStatus) }}
                >
                  <span className="text-2xl">
                    {selectedAssignment.currentStatus === "assigned" && "📋"}
                    {selectedAssignment.currentStatus === "out_for_delivery" && "🚗"}
                    {selectedAssignment.currentStatus === "delivered" && "✅"}
                    {selectedAssignment.currentStatus === "failed" && "❌"}
                  </span>
                  <span className="text-lg font-semibold">
                    {getStatusText(selectedAssignment.currentStatus)}
                  </span>
                </div>

                {selectedAssignment.currentStatus === "delivered" && (
                  <div className="mt-3 p-3 bg-green-100 text-green-800 rounded font-semibold">
                    ✅ Delivered at {new Date(selectedAssignment.deliveredAt!).toLocaleString()}
                  </div>
                )}
              </div>

              {/* Special Instructions */}
              {selectedAssignment.specialInstructions && (
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-3">📝 Special Instructions</h3>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded text-gray-700">
                    {selectedAssignment.specialInstructions}
                  </div>
                </div>
              )}

              {/* Status History */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-3">Status History</h3>
                <div className="space-y-3">
                  {selectedAssignment.statusHistory?.map((history, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded border border-gray-200">
                      <div className="font-bold text-gray-800">
                        {history.status.replace(/_/g, " ").toUpperCase()}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {new Date(history.timestamp).toLocaleString()}
                      </div>
                      {history.notes && <div className="text-sm text-gray-700 mt-2">{history.notes}</div>}
                    </div>
                  ))}
                </div>
              </div>

              {/* API Sync Status */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-3">🔄 API Sync Status</h3>
                <div
                  className={`p-3 rounded font-semibold ${
                    selectedAssignment.syncStatus === "synced" ? "bg-green-100 text-green-800" :
                    selectedAssignment.syncStatus === "pending" ? "bg-yellow-100 text-yellow-800" :
                    "bg-red-100 text-red-800"
                  }`}
                >
                  {selectedAssignment.syncStatus === "synced" && "✅ Synced with API"}
                  {selectedAssignment.syncStatus === "pending" && "⏳ Pending sync"}
                  {selectedAssignment.syncStatus === "failed" && "⚠️ Sync failed"}
                </div>
                {selectedAssignment.syncError && (
                  <div className="mt-3 p-3 bg-red-100 text-red-800 rounded">
                    Error: {selectedAssignment.syncError}
                  </div>
                )}
              </div>

              {/* Update Status Section - only for "assigned" and "out_for_delivery" */}
              {["assigned", "out_for_delivery"].includes(selectedAssignment.currentStatus) && (
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-3">Update Status</h3>

                  <div className="mb-4">
                    <label className="block font-semibold text-gray-700 mb-2">Notes (Optional)</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g., Customer not home, will retry later..."
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-600"
                      rows={3}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {selectedAssignment.currentStatus === "assigned" && (
                      <button
                        className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => handleStatusUpdate("out_for_delivery")}
                        disabled={updating}
                      >
                        {updating ? "Updating..." : "🚗 Out for Delivery"}
                      </button>
                    )}

                    <button
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => handleStatusUpdate("delivered")}
                      disabled={updating}
                    >
                      {updating ? "Updating..." : "✅ Mark as Delivered"}
                    </button>

                    <button
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => handleStatusUpdate("failed")}
                      disabled={updating}
                    >
                      {updating ? "Updating..." : "❌ Failed Delivery"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-8 flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="text-6xl mb-4">👈</div>
              <p className="text-lg text-gray-600">Select an order to view details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DeliveryBoyDashboard;
