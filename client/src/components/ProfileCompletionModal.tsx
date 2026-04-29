import React, { useState, useEffect } from "react";
import axios from "axios";

interface ProfileCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: "deliveryBoy" | "subAdmin";
  onComplete: () => void;
}

interface CompletionData {
  isComplete: boolean;
  missingFields: string[];
  completionPercentage: number;
  requirements: string[];
  currentData: any;
}

interface RequirementData {
  requiredFields: string[];
  description: string;
}

const ProfileCompletionModal: React.FC<ProfileCompletionModalProps> = ({
  isOpen,
  onClose,
  role,
  onComplete
}) => {
  const [completionData, setCompletionData] = useState<CompletionData | null>(null);
  const [requirements, setRequirements] = useState<RequirementData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"info" | "documents">("info");

  // Form data state
  const [formData, setFormData] = useState<any>({});
  const [uploadedDocs, setUploadedDocs] = useState<any>({});
  const [uploadProgress, setUploadProgress] = useState<any>({});

  useEffect(() => {
    if (isOpen) {
      fetchCompletionStatus();
      fetchRequirements();
    }
  }, [isOpen, role]);

  const fetchCompletionStatus = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:3001/api/profile/check-completion/${role}`
      );
      setCompletionData(response.data);
    } catch (error) {
      console.error("Error fetching completion status:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequirements = async () => {
    try {
      const response = await axios.get(
        `http://localhost:3001/api/profile/requirements/${role}`
      );
      setRequirements(response.data);
    } catch (error) {
      console.error("Error fetching requirements:", error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      await axios.post(`http://localhost:3001/api/profile/save-profile/${role}`, formData);
      fetchCompletionStatus();
      alert("Profile data saved successfully!");
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save profile data");
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentUpload = async (docType: string, file: File) => {
    try {
      setUploadProgress(prev => ({
        ...prev,
        [docType]: 0
      }));

      const formDataUpload = new FormData();
      formDataUpload.append("document", file);

      const response = await axios.post(
        `http://localhost:3001/api/profile/upload-document/${role}/${docType}`,
        formDataUpload,
        {
          headers: {
            "Content-Type": "multipart/form-data"
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(prev => ({
              ...prev,
              [docType]: percentCompleted
            }));
          }
        }
      );

      setUploadedDocs(prev => ({
        ...prev,
        [docType]: response.data.documentUrl
      }));

      setUploadProgress(prev => ({
        ...prev,
        [docType]: 100
      }));

      setTimeout(() => {
        setUploadProgress(prev => {
          const updated = { ...prev };
          delete updated[docType];
          return updated;
        });
      }, 2000);

      fetchCompletionStatus();
    } catch (error) {
      console.error("Error uploading document:", error);
      alert("Failed to upload document");
    }
  };

  const handleCompleteProfile = async () => {
    try {
      if (!completionData?.isComplete) {
        alert("Please complete all required fields first");
        return;
      }

      setLoading(true);
      await axios.post(`http://localhost:3001/api/profile/complete-profile/${role}`, {});
      alert("Profile completed successfully!");
      onComplete();
      onClose();
    } catch (error) {
      console.error("Error completing profile:", error);
      alert("Failed to complete profile");
    } finally {
      setLoading(false);
    }
  };

  const getFieldLabel = (field: string): string => {
    const labels: { [key: string]: string } = {
      name: "Full Name",
      email: "Email Address",
      phone: "Phone Number",
      aadhaarNumber: "Aadhaar Number",
      licenseNumber: "License Number",
      vehicleType: "Vehicle Type",
      departmentId: "Department ID",
      departmentName: "Department Name",
      aadhaarDoc: "Aadhaar Document",
      licenseDoc: "License Document",
      vehicleDoc: "Vehicle Document",
      idProof: "ID Proof",
      highschoolMarksheet: "High School Marksheet",
      intermediateMarksheet: "Intermediate Marksheet",
      degreeCertificate: "Degree Certificate"
    };
    return labels[field] || field;
  };

  const getDocumentTypes = (): string[] => {
    if (role === "deliveryBoy") {
      return ["aadhaarDoc", "licenseDoc"];
    } else {
      return ["idProof"];
    }
  };

  const getFormFields = (): string[] => {
    if (role === "deliveryBoy") {
      return ["aadhaarNumber", "licenseNumber", "vehicleType"];
    } else {
      return ["departmentId", "departmentName"];
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 top-0 left-0 w-full h-full bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-2xl mx-4 relative max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center pb-4 border-b border-gray-200 mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Complete Your {role === "deliveryBoy" ? "Delivery Boy" : "Sub-Admin"} Profile</h2>
          <button className="text-gray-400 hover:text-gray-600 text-2xl rounded-full hover:bg-gray-100 p-1 w-10 h-10 flex items-center justify-center transition-colors" onClick={onClose}>
            ✕
          </button>
        </div>

        {loading && completionData === null ? (
          <div className="flex items-center justify-center py-12"><span className="text-gray-500 text-lg">Loading...</span></div>
        ) : (
          <>
            {/* Progress Bar */}
            {completionData && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-semibold text-gray-700">Profile Completion</span>
                  <span className="text-lg font-bold text-green-600">{completionData.completionPercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-green-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${completionData.completionPercentage}%` }}
                  />
                </div>
                {completionData.missingFields.length > 0 && (
                  <div className="mt-3 p-3 bg-yellow-100 border border-yellow-400 rounded">
                    <p className="font-semibold text-yellow-900 text-sm mb-2">Missing Fields:</p>
                    <ul className="list-disc list-inside text-yellow-800 text-sm">
                      {completionData.missingFields.map((field, idx) => (
                        <li key={idx}>{getFieldLabel(field)}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200 mb-4">
              <button
                className={`px-4 py-3 font-semibold border-b-2 transition-all ${activeTab === "info" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-600 hover:text-gray-800"}`}
                onClick={() => setActiveTab("info")}
              >
                📋 Profile Information
              </button>
              <button
                className={`px-4 py-3 font-semibold border-b-2 transition-all ${activeTab === "documents" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-600 hover:text-gray-800"}`}
                onClick={() => setActiveTab("documents")}
              >
                📄 Documents
              </button>
            </div>

            {/* Tab Content */}
            <div>
              {/* Information Tab */}
              {activeTab === "info" && (
                <div>
                  <div className="space-y-4">
                    <div>
                      <label className="block font-semibold text-gray-700 mb-2">Full Name</label>
                      <input
                        type="text"
                        placeholder="Your full name"
                        value={formData.name || ""}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        disabled
                        className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100 text-gray-700"
                      />
                      <small className="text-gray-500">Synced from your account</small>
                    </div>

                    <div>
                      <label className="block font-semibold text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        placeholder="Your email"
                        value={formData.email || ""}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        disabled
                        className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100 text-gray-700"
                      />
                      <small className="text-gray-500">Synced from your account</small>
                    </div>

                    <div>
                      <label className="block font-semibold text-gray-700 mb-2">Phone Number</label>
                      <input
                        type="tel"
                        placeholder="Your phone number"
                        value={formData.phone || ""}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        disabled
                        className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100 text-gray-700"
                      />
                      <small className="text-gray-500">Synced from your account</small>
                    </div>

                  {role === "deliveryBoy" ? (
                    <>
                      <div>
                        <label className="block font-semibold text-gray-700 mb-2">Aadhaar Number *</label>
                        <input
                          type="text"
                          placeholder="Enter your 12-digit Aadhaar number"
                          maxLength={12}
                          value={formData.aadhaarNumber || ""}
                          onChange={(e) =>
                            handleInputChange("aadhaarNumber", e.target.value)
                          }
                          className="w-full border border-gray-300 rounded px-3 py-2"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-gray-700 mb-2">License Number *</label>
                        <input
                          type="text"
                          placeholder="Enter your license number"
                          value={formData.licenseNumber || ""}
                          onChange={(e) =>
                            handleInputChange("licenseNumber", e.target.value)
                          }
                          className="w-full border border-gray-300 rounded px-3 py-2"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-gray-700 mb-2">Vehicle Type *</label>
                        <select
                          value={formData.vehicleType || ""}
                          onChange={(e) =>
                            handleInputChange("vehicleType", e.target.value)
                          }
                          className="w-full border border-gray-300 rounded px-3 py-2"
                        >
                          <option value="">Select vehicle type</option>
                          <option value="bicycle">Bicycle</option>
                          <option value="motorcycle">Motorcycle</option>
                          <option value="scooter">Scooter</option>
                          <option value="car">Car</option>
                          <option value="van">Van</option>
                        </select>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block font-semibold text-gray-700 mb-2">Department ID *</label>
                        <input
                          type="text"
                          placeholder="Enter your department ID"
                          value={formData.departmentId || ""}
                          onChange={(e) =>
                            handleInputChange("departmentId", e.target.value)
                          }
                          className="w-full border border-gray-300 rounded px-3 py-2"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-gray-700 mb-2">Department Name *</label>
                        <input
                          type="text"
                          placeholder="Enter your department name"
                          value={formData.departmentName || ""}
                          onChange={(e) =>
                            handleInputChange("departmentName", e.target.value)
                          }
                          className="w-full border border-gray-300 rounded px-3 py-2"
                    </>
                  )}

                  <button
                    className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded transition-colors disabled:opacity-50 mt-4"
                    onClick={handleSaveProfile}
                    disabled={loading}
                  >
                    💾 Save Profile Information
                  </button>
                </div>
              )}

              {/* Documents Tab */}
              {activeTab === "documents" && (
                <div className="space-y-4">
                  {role === "deliveryBoy" ? (
                    <>
                      <DocumentUploadField
                        label="Aadhaar Document"
                        docType="aadhaar"
                        onUpload={(file) => handleDocumentUpload("aadhaar", file)}
                        progress={uploadProgress.aadhaar}
                        isUploaded={!!uploadedDocs.aadhaarDoc}
                      />
                      <DocumentUploadField
                        label="License Document"
                        docType="license"
                        onUpload={(file) => handleDocumentUpload("license", file)}
                        progress={uploadProgress.license}
                        isUploaded={!!uploadedDocs.licenseDoc}
                      />
                    </>
                  ) : (
                    <>
                      <DocumentUploadField
                        label="ID Proof Document"
                        docType="idProof"
                        onUpload={(file) => handleDocumentUpload("idProof", file)}
                        progress={uploadProgress.idProof}
                        isUploaded={!!uploadedDocs.idProof}
                      />
                      <DocumentUploadField
                        label="High School Marksheet"
                        docType="highschoolMarksheet"
                        onUpload={(file) => handleDocumentUpload("highschoolMarksheet", file)}
                        progress={uploadProgress.highschoolMarksheet}
                        isUploaded={!!uploadedDocs.highschoolMarksheet}
                      />
                      <DocumentUploadField
                        label="Intermediate Marksheet"
                        docType="intermediateMarksheet"
                        onUpload={(file) => handleDocumentUpload("intermediateMarksheet", file)}
                        progress={uploadProgress.intermediateMarksheet}
                        isUploaded={!!uploadedDocs.intermediateMarksheet}
                      />
                      <DocumentUploadField
                        label="Degree Certificate"
                        docType="degreeCertificate"
                        onUpload={(file) => handleDocumentUpload("degreeCertificate", file)}
                        progress={uploadProgress.degreeCertificate}
                        isUploaded={!!uploadedDocs.degreeCertificate}
                      />
                    </>
                  )}

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                    <h4 className="font-semibold text-blue-900 mb-2">📋 Document Requirements</h4>
                    <ul className="list-disc list-inside space-y-1 text-blue-800 text-sm">
                      <li>File formats: PDF, JPEG, PNG</li>
                      <li>Maximum file size: 5MB</li>
                      <li>Documents should be clear and legible</li>
                      <li>All required documents must be uploaded</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 mt-6">
              <button className="px-6 py-2 border border-gray-300 text-gray-700 font-semibold rounded hover:bg-gray-50 transition-colors" onClick={onClose}>
                Cancel
              </button>
              <button
                className={`px-6 py-2 font-semibold rounded text-white transition-colors ${completionData?.isComplete ? "bg-green-600 hover:bg-green-700" : "bg-gray-400 cursor-not-allowed opacity-50"}`}
                onClick={handleCompleteProfile}
                disabled={!completionData?.isComplete || loading}
              >
                {loading ? "Processing..." : "✓ Complete Profile"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Document Upload Field Component
interface DocumentUploadFieldProps {
  label: string;
  docType: string;
  onUpload: (file: File) => void;
  progress?: number;
  isUploaded: boolean;
}

const DocumentUploadField: React.FC<DocumentUploadFieldProps> = ({
  label,
  docType,
  onUpload,
  progress,
  isUploaded
}) => {
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block font-semibold text-gray-700">
        {label}
        {isUploaded && <span className="ml-2 inline-block px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full font-semibold">✓ Uploaded</span>}
      </label>

      <div className="flex gap-2">
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileSelect}
          id={`file-${docType}`}
          className="hidden"
          disabled={isUploaded}
        />
        <label htmlFor={`file-${docType}`} className="flex-1 px-4 py-3 bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold rounded cursor-pointer text-center transition-colors disabled:opacity-50">
          📎 Choose File
        </label>
      </div>

      {progress !== undefined && progress > 0 && progress < 100 && (
        <div className="space-y-2">
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <span className="text-sm text-gray-600">{progress}%</span>
        </div>
      )}

      {progress === 100 && (
        <div className="p-3 bg-green-100 text-green-800 rounded text-sm font-semibold">✓ Document uploaded successfully</div>
      )}
    </div>
  );
};

export default ProfileCompletionModal;
