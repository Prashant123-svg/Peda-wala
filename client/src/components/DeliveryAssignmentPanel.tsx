/**
 * SubAdmin Delivery Assignment Component
 * Location: client/src/components/DeliveryAssignmentPanel.tsx
 * 
 * Allows SubAdmin to:
 * 1. View orders from external API that need delivery assignment
 * 2. Select a delivery boy
 * 3. Assign the order to the delivery boy
 */

import React, { useState, useEffect } from "react";
import axios from "axios";

interface Order {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  totalAmount: number;
  orderDate: string;
  specialInstructions?: string;
}

interface DeliveryBoy {
  _id: string;
  name: string;
  phone: string;
  vehicleType: string;
  activeOrders: number;
}

export function DeliveryAssignmentPanel() {
  const token = localStorage.getItem("token");

  // Orders to assign
  const [ordersToAssign, setOrdersToAssign] = useState<Order[]>([]);

  // Available delivery boys
  const [deliveryBoys, setDeliveryBoys] = useState<DeliveryBoy[]>([]);

  // Selection state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedDeliveryBoy, setSelectedDeliveryBoy] = useState<DeliveryBoy | null>(null);
  const [specialInstructions, setSpecialInstructions] = useState("");

  // UI state
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Load data only once when component mounts
  useEffect(() => {
    loadData();
  }, []);

  // Refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => loadData(), 30000);
    return () => clearInterval(interval);
  }, [token]);

  const loadData = async () => {
    if (!token) {
      setErrorMessage("⚠️ Not authenticated. Please login.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");

      const headers = { Authorization: `Bearer ${token}` };

      // 1. Fetch unassigned orders ready for delivery
      const ordersRes = await axios.get(
        "http://localhost:5000/api/delivery/unassigned-orders",
        { headers }
      );
      // Map response to component format
      const ordersData = (ordersRes.data.orders || []).map((order: any) => ({
        orderId: order._id,
        orderNumber: order.orderNumber || `ORD-${order._id}`,
        customerName: order.userId?.name || "Unknown",
        customerPhone: order.userId?.phone || "N/A",
        customerAddress: order.userId?.address || "N/A",
        totalAmount: order.totalPrice || 0,
        orderDate: order.createdAt,
        specialInstructions: order.notes || ""
      }));
      setOrdersToAssign(ordersData);

      // 2. Fetch available delivery boys from ADMIN route
      const dbRes = await axios.get(
        "http://localhost:5000/api/admin/deliveryboys",
        { headers }
      );
      setDeliveryBoys(dbRes.data.deliveryboys || []);
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || "Error loading data";
      console.error("❌ Error loading:", error);
      setErrorMessage(`⚠️ ${errorMsg}`);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedOrder || !selectedDeliveryBoy) {
      setErrorMessage("Please select an order and a delivery boy");
      return;
    }

    try {
      setAssigning(true);
      setErrorMessage("");

      const response = await axios.put(
        `http://localhost:5000/api/delivery/order/${selectedOrder.orderId}/assign`,
        {
          deliveryBoyId: selectedDeliveryBoy._id
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setSuccessMessage(
        `✅ ${selectedOrder.orderNumber} assigned to ${selectedDeliveryBoy.name}`
      );

      // Reset
      setSelectedOrder(null);
      setSelectedDeliveryBoy(null);
      setSpecialInstructions("");

      // Reload data
      setTimeout(() => {
        loadData();
        setSuccessMessage("");
      }, 2000);
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || "Error assigning order";
      setErrorMessage(`❌ ${errorMsg}`);
      console.error("Error assigning:", error);
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return (
      <div className="delivery-panel loading-state">
        <div className="loader">Loading delivery data...</div>
      </div>
    );
  }

  return (
    <div className="delivery-assignment-container">
      <div className="header">
        <h1>🚚 Delivery Management</h1>
        <button className="refresh-btn" onClick={loadData} disabled={loading}>
          🔄 Refresh
        </button>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="message success-message">{successMessage}</div>
      )}
      {errorMessage && (
        <div className="message error-message">{errorMessage}</div>
      )}

      {/* ASSIGN ORDERS SECTION */}
        <div className="tab-content">
          <div className="assignment-grid">
            {/* Left: Unassigned Orders */}
            <div className="panel">
              <h2>📋 Orders Ready for Delivery</h2>
              <div className="items-list">
                {ordersToAssign.length === 0 ? (
                  <div className="empty-state">No orders to assign</div>
                ) : (
                  ordersToAssign.map((order) => (
                    <div
                      key={order.orderId}
                      className={`order-card ${
                        selectedOrder?.orderId === order.orderId ? "selected" : ""
                      }`}
                      onClick={() => setSelectedOrder(order)}
                    >
                      <div className="order-number">{order.orderNumber}</div>
                      <div className="customer-name">👤 {order.customerName}</div>
                      <div className="customer-phone">📱 {order.customerPhone}</div>
                      <div className="address">📍 {order.customerAddress}</div>
                      <div className="amount">💰 ₹{order.totalAmount}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Center: Assignment Details */}
            {selectedOrder && (
              <div className="panel assignment-details">
                <h2>✅ Order Details</h2>
                <div className="detail-item">
                  <strong>Order Number:</strong> {selectedOrder.orderNumber}
                </div>
                <div className="detail-item">
                  <strong>Customer:</strong> {selectedOrder.customerName}
                </div>
                <div className="detail-item">
                  <strong>Phone:</strong> {selectedOrder.customerPhone}
                </div>
                <div className="detail-item">
                  <strong>Address:</strong> {selectedOrder.customerAddress}
                </div>
                <div className="detail-item">
                  <strong>Amount:</strong> ₹{selectedOrder.totalAmount}
                </div>

                <div className="mb-6">
                  <label className="block font-bold text-gray-700 mb-2">Special Instructions (Optional)</label>
                  <textarea
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    placeholder="e.g., Call before delivery, leave at door..."
                    className="w-full bg-gray-900 border border-gray-700 text-white rounded px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {selectedDeliveryBoy && (
                  <div className="selected-db">
                    <h3>Selected Delivery Boy</h3>
                    <div className="db-info">
                      <div><strong>🏍️ {selectedDeliveryBoy.name}</strong></div>
                      <div>📱 {selectedDeliveryBoy.phone}</div>
                      <div>🚗 {selectedDeliveryBoy.vehicleType}</div>
                      <div>✅ {selectedDeliveryBoy.activeOrders} active orders</div>
                    </div>
                    <button
                      className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded transition-colors"
                      onClick={handleAssign}
                      disabled={assigning}
                    >
                      {assigning ? "⟳ Assigning..." : "✅ Assign Order"}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Right: Available Delivery Boys */}
            <div className="panel">
              <h2>🚗 Available Delivery Boys</h2>
              <div className="items-list">
                {deliveryBoys.length === 0 ? (
                  <div className="empty-state">No delivery boys available</div>
                ) : (
                  deliveryBoys.map((db) => (
                    <div
                      key={db._id}
                      className={`db-card ${
                        selectedDeliveryBoy?._id === db._id ? "selected" : ""
                      }`}
                      onClick={() => setSelectedDeliveryBoy(db)}
                    >
                      <div className="db-name">🏍️ {db.name}</div>
                      <div className="db-phone">📱 {db.phone}</div>
                      <div className="db-vehicle">🚗 {db.vehicleType}</div>
                      <div className="db-active">
                        ✅ {db.activeOrders} active deliveries
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
    </div>
  );
}

export default DeliveryAssignmentPanel;
