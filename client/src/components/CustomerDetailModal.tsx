import React from "react";

interface CustomerData {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  role: string;
  createdAt: string;
}

interface OrderData {
  _id: string;
  totalPrice: number;
  status: string;
  createdAt: string;
}

interface CustomerDetailModalProps {
  isOpen: boolean;
  customer: CustomerData | null;
  orders: OrderData[];
  onClose: () => void;
  onDeleteUser: (userId: string) => void;
  deleteLoading: string | null;
}

const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  isOpen,
  customer,
  orders,
  onClose,
  onDeleteUser,
  deleteLoading,
}) => {
  if (!isOpen || !customer) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h3 className="text-2xl font-bold text-gray-800">
            👤 Customer Details
          </h3>
          <button className="text-gray-400 hover:text-gray-600 text-2xl w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 transition-colors" onClick={onClose} title="Close modal">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Customer Info */}
          <div className="space-y-4 mb-6">
            <div className="flex justify-between border-b border-gray-100 pb-3">
              <label className="font-semibold text-gray-600">Name</label>
              <span className="text-gray-800">{customer.name}</span>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-3">
              <label className="font-semibold text-gray-600">Email</label>
              <span className="text-gray-800">{customer.email}</span>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-3">
              <label className="font-semibold text-gray-600">Phone</label>
              <span className="text-gray-800">{customer.phone || "N/A"}</span>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-3">
              <label className="font-semibold text-gray-600">Address</label>
              <span className="text-gray-800">{customer.address || "N/A"}</span>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-3">
              <label className="font-semibold text-gray-600">Role</label>
              <span className={`inline-block px-3 py-1 rounded-full text-white font-semibold ${
                customer.role === "admin" ? "bg-red-600" : "bg-blue-600"
              }`}>
                {customer.role === "admin" ? "👑 Admin" : "👤 User"}
              </span>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-3">
              <label className="font-semibold text-gray-600">Joined</label>
              <span className="text-gray-800">
                {new Date(customer.createdAt).toLocaleDateString("en-IN", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>

          {/* Orders Section */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h5 className="mb-3 font-bold text-gray-800">
              🛍️ Orders ({orders.length})
            </h5>
            {orders.length > 0 ? (
              <div className="space-y-3">
                {orders.map((order) => (
                  <div key={order._id} className="border border-gray-200 rounded p-3 bg-gray-50">
                    <div className="font-semibold text-gray-700 mb-2">
                      Order ID: {order._id.slice(0, 12)}...
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-700">Amount: ₹{order.totalPrice}</span>
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                          order.status === "Delivered"
                            ? "bg-green-100 text-green-800"
                            : order.status === "Pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : order.status === "Cancelled"
                            ? "bg-red-100 text-red-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      <span>
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
                ℹ️ No orders found
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={() => onDeleteUser(customer._id)}
            disabled={deleteLoading === customer._id}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded transition-colors"
          >
            {deleteLoading === customer._id ? (
              <>
                <span
                  className="inline-block animate-spin mr-2"
                  role="status"
                  aria-hidden="true"
                >
                  ⟳
                </span>
                Deleting...
              </>
            ) : (
              <>
                🗑️ Delete User & Orders
              </>
            )}
          </button>
          <button onClick={onClose} className="px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white font-semibold rounded transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetailModal;
