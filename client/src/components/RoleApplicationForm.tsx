import React, { useState, useEffect } from "react";
import axios from "axios";

interface RoleApplicationFormProps {
  selectedRole: string;
  userName: string;
  onSubmit: () => void;
  onCancel: () => void;
}

interface FormData {
  requestReason: string;
  experience: string;
  degreeType: string;
  documents: { [key: string]: File | null };
}

interface RequiredFields {
  requiredFields: string[];
  role: string;
  description: string;
}

const RoleApplicationForm: React.FC<RoleApplicationFormProps> = ({
  selectedRole,
  userName,
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState<FormData>({
    requestReason: "",
    experience: "",
    degreeType: "",
    documents: {},
  });

  const [requirements, setRequirements] = useState<RequiredFields | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

  const roleDescriptions: { [key: string]: string } = {
    deliveryBoy: "🚚 Delivery Boy - Deliver orders to customers",
    subAdmin: "👨‍💼 Sub-Admin - Manage orders and delivery boys",
  };

  const degreeTypes = [
    { value: "btech", label: "B.Tech (Bachelor of Technology)" },
    { value: "ba", label: "BA (Bachelor of Arts)" },
    { value: "bsc", label: "B.Sc (Bachelor of Science)" },
    { value: "bcom", label: "B.Com (Bachelor of Commerce)" },
    { value: "bca", label: "BCA (Bachelor of Computer Applications)" },
    { value: "mtech", label: "M.Tech (Master of Technology)" },
    { value: "ma", label: "MA (Master of Arts)" },
    { value: "msc", label: "M.Sc (Master of Science)" },
    { value: "mba", label: "MBA (Master of Business Administration)" },
    { value: "mca", label: "MCA (Master of Computer Applications)" },
    { value: "llb", label: "LLB (Bachelor of Laws)" },
    { value: "llm", label: "LLM (Master of Laws)" },
    { value: "md", label: "MD (Doctor of Medicine)" },
    { value: "btechMtech", label: "B.Tech + M.Tech" },
    { value: "other", label: "Other Degree" },
  ];

  useEffect(() => {
    fetchRoleRequirements();
  }, [selectedRole]);

  const fetchRoleRequirements = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:5000/api/profile/requirements/${selectedRole}`
      );
      setRequirements(response.data);
      console.log(`📋 Requirements for ${selectedRole}:`, response.data);
    } catch (err: any) {
      console.error("Error fetching role requirements:", err);
      setError("Failed to load role requirements");
    } finally {
      setLoading(false);
    }
  };

  // Extract document types from requiredFields
  const getRequiredDocuments = (): string[] => {
    if (!requirements) return [];
    return requirements.requiredFields.filter(field => 
      field.includes("Doc") || field.includes("Proof") || field === "licenseDoc" || field === "aadhaarDoc" || field === "idProof"
    );
  };

  const formatDocLabel = (docType: string): string => {
    const specialLabels: Record<string, string> = {
      aadhaarDoc: "Aadhaar Document",
      licenseDoc: "Driving License",
      idProof: "ID Proof",
    };

    if (specialLabels[docType]) {
      return specialLabels[docType];
    }

    return docType
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  const handleTextChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    docType: string
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        documents: {
          ...prev.documents,
          [docType]: file,
        },
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.requestReason.trim()) {
      setError("Please provide a reason for your request");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");

      // Step 1: Submit role request
      const requestPayload = {
        requestedRole: selectedRole,
        requestReason: formData.requestReason,
        experience: formData.experience,
      };

      const requestResponse = await axios.post(
        "http://localhost:5000/api/role/request",
        requestPayload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("✅ Role request created:", requestResponse.data);

      // Step 2: Upload documents
      if (Object.keys(formData.documents).length > 0) {
        for (const [docType, file] of Object.entries(formData.documents)) {
          if (file) {
            const documentFormData = new FormData();
            documentFormData.append("document", file);

            try {
              await axios.post(
                `http://localhost:5000/api/profile/upload-document/${selectedRole}/${docType}`,
                documentFormData,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data",
                  },
                  onUploadProgress: (progressEvent: any) => {
                    const progress = Math.round(
                      (progressEvent.loaded / progressEvent.total) * 100
                    );
                    setUploadProgress((prev) => ({
                      ...prev,
                      [docType]: progress,
                    }));
                  },
                }
              );

              console.log(`✅ Document ${docType} uploaded`);
            } catch (docErr: any) {
              console.error(`❌ Failed to upload ${docType}:`, docErr);
            }
          }
        }
      }

      // Success
      onSubmit();
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message ||
        "Failed to submit role request. Please try again.";
      setError(errorMsg);
      console.error("❌ Submit error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="role-application-form">
        <div className="form-loading">Loading requirements...</div>
      </div>
    );
  }

  return (
    <div className="role-application-form">
      <div className="form-container">
        {/* Form Header */}
        <div className={`form-header role-accent-${selectedRole}`}>
          <h2>
            Apply for{" "}
            <span className={`role-text-${selectedRole}`}>
              {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}
            </span>
          </h2>
          <p>{roleDescriptions[selectedRole] || "Role description"}</p>
          <button type="button" className="close-btn" onClick={onCancel}>
            ✕
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="application-form">
          {/* Personal Info Section */}
          <div className="form-section">
            <h3>📋 Your Information</h3>
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                value={userName}
                disabled
                className="disabled-input"
                title="Full name"
              />
            </div>

            <div className="form-group">
              <label>Why do you want this role? *</label>
              <textarea
                name="requestReason"
                value={formData.requestReason}
                onChange={handleTextChange}
                placeholder="Tell us why you want to apply for this role..."
                required
                rows={4}
              />
            </div>

            {selectedRole === "deliveryBoy" && (
              <div className="form-group">
                <label>Delivery Experience (years)</label>
                <input
                  type="number"
                  name="experience"
                  value={formData.experience}
                  onChange={handleTextChange}
                  placeholder="e.g., 2"
                  min="0"
                  step="0.5"
                />
              </div>
            )}
          </div>

          {/* Required Documents Section */}
          {requirements && getRequiredDocuments().length > 0 && (
            <div className="form-section">
              <h3>📄 Required Documents</h3>
              <p className="section-note">Upload the following documents to support your application</p>

              {getRequiredDocuments().map((docType) => (
                <div key={docType} className="document-upload">
                  <label>
                    {formatDocLabel(docType)}{" "}
                    <span className="required">*</span>
                  </label>
                  <div className="file-input-wrapper">
                    <input
                      type="file"
                      id={docType}
                      className="file-input-hidden"
                      onChange={(e) => handleFileChange(e, docType)}
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    />
                    <label htmlFor={docType} className="file-label">
                      Choose file
                    </label>
                    <span className="file-name-preview">
                      {formData.documents[docType]?.name || "No file chosen"}
                    </span>
                  </div>
                  <p className="file-note">
                    PDF, JPG, PNG, DOC max 5MB
                  </p>
                  {uploadProgress[docType] && uploadProgress[docType] < 100 && (
                    <div className="progress-row">
                      <progress className="upload-progress" value={uploadProgress[docType]} max={100} />
                      <span className="progress-text">{uploadProgress[docType]}%</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* SubAdmin Educational Documents */}
          {selectedRole === "subAdmin" && (
            <div className="form-section">
              <h3>🎓 Educational Qualifications</h3>
              <p className="section-note">Upload your educational qualifications to support your SubAdmin application</p>

              {/* High School Marksheet */}
              <div className="document-upload">
                <label>
                  High School Marksheet
                  <span className="required">*</span>
                </label>
                <div className="file-input-wrapper">
                  <input
                    type="file"
                    id="highSchoolMarksheet"
                    className="file-input-hidden"
                    onChange={(e) => handleFileChange(e, "highSchoolMarksheet")}
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                  <label htmlFor="highSchoolMarksheet" className="file-label">
                    Choose file
                  </label>
                  <span className="file-name-preview">
                    {formData.documents.highSchoolMarksheet?.name || "No file chosen"}
                  </span>
                </div>
                <p className="file-note">Your 10th or 12th standard marksheet (PDF, JPG, PNG max 5MB)</p>
                {uploadProgress.highSchoolMarksheet && uploadProgress.highSchoolMarksheet < 100 && (
                  <div className="progress-row">
                    <progress className="upload-progress" value={uploadProgress.highSchoolMarksheet} max={100} />
                    <span className="progress-text">{uploadProgress.highSchoolMarksheet}%</span>
                  </div>
                )}
              </div>

              {/* Intermediate Marksheet */}
              <div className="document-upload">
                <label>
                  Intermediate Marksheet
                  <span className="required">*</span>
                </label>
                <div className="file-input-wrapper">
                  <input
                    type="file"
                    id="intermediateMarksheet"
                    className="file-input-hidden"
                    onChange={(e) => handleFileChange(e, "intermediateMarksheet")}
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                  <label htmlFor="intermediateMarksheet" className="file-label">
                    Choose file
                  </label>
                  <span className="file-name-preview">
                    {formData.documents.intermediateMarksheet?.name || "No file chosen"}
                  </span>
                </div>
                <p className="file-note">Your intermediate (12th/+2) marksheet (PDF, JPG, PNG max 5MB)</p>
                {uploadProgress.intermediateMarksheet && uploadProgress.intermediateMarksheet < 100 && (
                  <div className="progress-row">
                    <progress className="upload-progress" value={uploadProgress.intermediateMarksheet} max={100} />
                    <span className="progress-text">{uploadProgress.intermediateMarksheet}%</span>
                  </div>
                )}
              </div>

              {/* Degree Type Selector */}
              <div className="form-group">
                <label>
                  Your Degree Type
                  <span className="required">*</span>
                </label>
                <select
                  name="degreeType"
                  value={formData.degreeType}
                  onChange={handleTextChange}
                  required
                  className="degree-select"
                  title="Degree type"
                >
                  <option value="">Select your degree type...</option>
                  {degreeTypes.map((degree) => (
                    <option key={degree.value} value={degree.value}>
                      {degree.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Degree Marksheet - Show only if degree type selected */}
              {formData.degreeType && (
                <div className="document-upload">
                  <label>
                    {formData.degreeType.toUpperCase()} Marksheet
                    <span className="required">*</span>
                  </label>
                  <div className="file-input-wrapper">
                    <input
                      type="file"
                      id={`${formData.degreeType}Marksheet`}
                      className="file-input-hidden"
                      onChange={(e) => handleFileChange(e, `${formData.degreeType}Marksheet`)}
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                    <label htmlFor={`${formData.degreeType}Marksheet`} className="file-label">
                      Choose file
                    </label>
                    <span className="file-name-preview">
                      {formData.documents[`${formData.degreeType}Marksheet`]?.name || "No file chosen"}
                    </span>
                  </div>
                  <p className="file-note">Your {formData.degreeType.toUpperCase()} degree marksheet or result card (PDF, JPG, PNG max 5MB)</p>
                  {uploadProgress[`${formData.degreeType}Marksheet`] && uploadProgress[`${formData.degreeType}Marksheet`] < 100 && (
                    <div className="progress-row">
                      <progress className="upload-progress" value={uploadProgress[`${formData.degreeType}Marksheet`]} max={100} />
                      <span className="progress-text">{uploadProgress[`${formData.degreeType}Marksheet`]}%</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={onCancel}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`submit-btn role-btn-${selectedRole}`}
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit Application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoleApplicationForm;
