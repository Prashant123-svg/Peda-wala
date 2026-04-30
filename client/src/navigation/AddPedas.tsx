import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/AddPedas.css";
import { API_BASE_URL } from "../utils/apiConfig";
import { FALLBACK_IMAGE_URL, resolveImageUrl } from "../utils/imageUrl";

interface PedaFormData {
  name: string;
  category: string;
  description: string;
  price: number;
  image: string;
  availability: boolean;
}

interface CategoryFile {
  name: string;
  label: string;
}

const AddPedas = () => {
  const navigate = useNavigate();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<PedaFormData>({
    name: "",
    category: "classic_pedas",
    description: "",
    price: 0,
    image: "",
    availability: true,
  });

  // Category mapping
  const categories: CategoryFile[] = [
    { name: "classic_pedas", label: "Classic Pedas" },
    { name: "nutty_and_dry_fruit_pedas", label: "Nutty & Dry Fruit Pedas" },
    { name: "modern_fusion_pedas", label: "Modern Fusion Pedas" },
    { name: "seasonal_and_festival_special_pedas", label: "Seasonal Pedas" },
    { name: "health-conscious_pedas", label: "Healthy Pedas" },
    { name: "fruit-based_pedas", label: "Fruit Pedas" },
    { name: "exotic_and_gourmet_pedas", label: "Exotic Pedas" },
  ];

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        const profileRes = await axios.get(`${API_BASE_URL}/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (profileRes.data.role !== "admin") {
          navigate("/profile");
          return;
        }

        setAdminUser(profileRes.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching admin data:", err);
        navigate("/login");
      }
    };

    fetchAdminData();
  }, [navigate]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      
      // Validate form data
      if (!formData.name || !formData.description || formData.price <= 0) {
        setError("Please fill in all required fields with valid data");
        setSubmitting(false);
        return;
      }

      const response = await axios.post(
        `${API_BASE_URL}/categories/add-peda`,
        {
          ...formData,
          category: categories.find((c) => c.name === formData.category)?.label || formData.category,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSuccess(`✅ ${formData.name} added successfully to ${formData.category}!`);
      
      // Reset form
      setTimeout(() => {
        setFormData({
          name: "",
          category: "classic_pedas",
          description: "",
          price: 0,
          image: "",
          availability: true,
        });
        setSuccess(null);
      }, 3000);
    } catch (err: any) {
      console.error("Error adding peda:", err);
      setError(err.response?.data?.error || "Failed to add peda. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin text-4xl">⏳</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">➕ Add New Peda</h1>
            <p className="text-gray-600 mt-1">Add a new peda product to your catalog</p>
          </div>
          <button 
            className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded transition-colors"
            onClick={() => navigate("/admin-dashboard")}
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="m-4 p-4 bg-red-100 border border-red-400 text-red-800 rounded flex justify-between items-start" role="alert">
          <span>{error}</span>
          <button 
            type="button" 
            className="text-red-600 hover:text-red-800 text-2xl w-8 h-8 flex items-center justify-center rounded hover:bg-red-200 transition-colors"
            onClick={() => setError(null)}
          >✕</button>
        </div>
      )}

      {success && (
        <div className="m-4 p-4 bg-green-100 border border-green-400 text-green-800 rounded flex justify-between items-start" role="alert">
          <span>{success}</span>
          <button 
            type="button" 
            className="text-green-600 hover:text-green-800 text-2xl w-8 h-8 flex items-center justify-center rounded hover:bg-green-200 transition-colors"
            onClick={() => setSuccess(null)}
          >✕</button>
        </div>
      )}

      {/* Main Form Container */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            <div>
              <label htmlFor="name" className="block font-semibold text-gray-700 mb-2">Peda Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Kesar Peda, Malai Peda"
                required
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label htmlFor="category" className="block font-semibold text-gray-700 mb-2">Category *</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-600"
              >
                {categories.map((cat) => (
                  <option key={cat.name} value={cat.name}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-6">
              <label htmlFor="price" className="block font-bold text-gray-700 mb-2">Price (₹) *</label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price || ""}
                onChange={handleInputChange}
                placeholder="e.g., 250"
                min="0"
                step="10"
                required
                className="w-full bg-gray-900 border border-gray-700 text-white rounded px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="availability" className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  id="availability"
                  name="availability"
                  checked={formData.availability}
                  onChange={handleInputChange}
                  className="w-5 h-5"
                />
                <span className="font-semibold text-gray-700">Available for Purchase</span>
              </label>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div>
              <label htmlFor="description" className="block font-semibold text-gray-700 mb-2">Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe the peda, its ingredients, taste, etc."
                rows={6}
                required
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-600"
              ></textarea>
            </div>

            <div>
              <label htmlFor="image" className="block font-semibold text-gray-700 mb-2">Image URL</label>
              <input
                type="text"
                id="image"
                name="image"
                value={formData.image}
                onChange={handleInputChange}
                placeholder="e.g., /images/classic_pedas/kesar_peda.jpeg"
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-600"
              />
              {formData.image && (
                <div className="mt-3 rounded overflow-hidden border border-gray-200">
                  <img 
                    src={resolveImageUrl(formData.image, FALLBACK_IMAGE_URL)} 
                    alt="Preview" 
                    className="w-full h-40 object-cover"
                    onError={() => {}}
                  />
                </div>
              )}
            </div>
          </div>
        </form>

        {/* Form Actions */}
        <div className="flex gap-4 justify-center mt-8">
          <button
            type="submit"
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded transition-colors disabled:opacity-50"
            disabled={submitting}
            onClick={handleSubmit}
          >
            {submitting ? "Adding..." : "➕ Add Peda"}
          </button>
          <button
            type="reset"
            className="px-8 py-3 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded transition-colors"
            onClick={() => {
              setFormData({
                name: "",
                category: "classic_pedas",
                description: "",
                price: 0,
                image: "",
                availability: true,
              });
              setError(null);
              setSuccess(null);
            }}
          >
            Clear Form
          </button>
        </div>
      </div>

      {/* Info Card */}
      <div className="info-card">
        <h3>📋 Category Information</h3>
        <ul>
          {categories.map((cat) => (
            <li key={cat.name}>
              <strong>{cat.label}:</strong> {getCategoryDescription(cat.name)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

function getCategoryDescription(categoryName: string): string {
  const descriptions: Record<string, string> = {
    classic_pedas: "Traditional milk-based pedas with authentic flavors",
    nutty_and_dry_fruit_pedas: "Pedas with nuts like almonds, cashews, and dry fruits",
    modern_fusion_pedas: "Contemporary pedas with innovative flavors",
    seasonal_and_festival_special_pedas: "Limited edition pedas for special occasions",
    "health-conscious_pedas": "Low-sugar or organic pedas for health-conscious customers",
    "fruit-based_pedas": "Pedas made with fresh or dried fruits",
    exotic_and_gourmet_pedas: "Premium pedas with exotic ingredients",
  };
  return descriptions[categoryName] || "Peda category";
}

export default AddPedas;
