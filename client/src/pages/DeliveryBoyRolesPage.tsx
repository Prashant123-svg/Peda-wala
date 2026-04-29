import React, { useState } from "react";
import { ChevronDown, ChevronUp, Truck, MapPin, Clock, DollarSign, FileText, AlertCircle, CheckCircle } from "lucide-react";

interface RoleFeature {
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface WorkflowStep {
  step: number;
  title: string;
  description: string;
  action: string;
}

interface DeliveryBoyRole {
  roleId: string;
  roleName: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  features: RoleFeature[];
  workflow: WorkflowStep[];
  benefits: string[];
  color: string;
}

const DeliveryBoyRolesPage: React.FC = () => {
  const [expandedRole, setExpandedRole] = useState<string | null>("standard_delivery_boy");
  const [activeTab, setActiveTab] = useState<"overview" | "workflow" | "requirements">("overview");

  const deliveryBoyRoles: DeliveryBoyRole[] = [
    {
      roleId: "standard_delivery_boy",
      roleName: "🚗 Standard Delivery Boy",
      description: "Entry-level delivery personnel responsible for delivering orders to customers",
      requirements: [
        "Valid ID (Aadhaar/PAN)",
        "Mobile phone with internet",
        "Reliable transport (bike/auto)",
        "Complete profile setup",
        "Document verification"
      ],
      responsibilities: [
        "Pick up orders from warehouse",
        "Update order status (Out for Delivery, Delivered, Failed)",
        "Deliver orders to customers",
        "Add delivery notes and feedback",
        "Maintain delivery history"
      ],
      features: [
        {
          title: "View Assigned Orders",
          description: "See all orders assigned to you with customer details",
          icon: <FileText className="w-6 h-6" />
        },
        {
          title: "Update Delivery Status",
          description: "Mark orders as Out for Delivery, Delivered, or Failed",
          icon: <Clock className="w-6 h-6" />
        },
        {
          title: "Track Earnings",
          description: "View commission per delivery and total earnings",
          icon: <DollarSign className="w-6 h-6" />
        },
        {
          title: "Add Delivery Notes",
          description: "Include optional notes for each delivery (issues, feedback)",
          icon: <FileText className="w-6 h-6" />
        }
      ],
      workflow: [
        {
          step: 1,
          title: "Order Assignment",
          description: "Receive order assignment with customer details",
          action: "Dashboard shows assigned order"
        },
        {
          step: 2,
          title: "Pickup",
          description: "Click 'Out for Delivery' when picking up from warehouse",
          action: "Status changes to 'Out for Delivery'"
        },
        {
          step: 3,
          title: "Delivery",
          description: "Deliver order to customer address",
          action: "Customer receives package"
        },
        {
          step: 4,
          title: "Mark Complete",
          description: "Click 'Delivered' and add optional notes",
          action: "Status changes to 'Delivered' + Commission earned"
        }
      ],
      benefits: [
        "Earn ₹50-100 commission per successful delivery",
        "Performance-based bonus system",
        "Real-time order tracking",
        "Flexible working hours",
        "Mobile-friendly app"
      ],
      color: "#FF9800"
    },
    {
      roleId: "premium_delivery_boy",
      roleName: "⭐ Premium Delivery Boy",
      description: "Experienced delivery personnel with advanced tracking and fleet management capabilities",
      requirements: [
        "Min 3 months as Standard Delivery Boy",
        "80%+ delivery success rate",
        "Excellent customer ratings",
        "Own vehicle preferred",
        "GPS-enabled smartphone"
      ],
      responsibilities: [
        "Handle high-priority orders",
        "Manage team of junior delivery boys",
        "Provide delivery route optimization",
        "Customer issue resolution",
        "Maintain vehicle condition"
      ],
      features: [
        {
          title: "Advanced Tracking",
          description: "Real-time GPS location tracking for deliveries",
          icon: <MapPin className="w-6 h-6" />
        },
        {
          title: "Team Management",
          description: "Supervise and assign orders to junior delivery staff",
          icon: <Truck className="w-6 h-6" />
        },
        {
          title: "Route Optimization",
          description: "Get AI-optimized delivery routes to save time",
          icon: <MapPin className="w-6 h-6" />
        },
        {
          title: "Performance Analytics",
          description: "Detailed dashboard with delivery metrics and ratings",
          icon: <FileText className="w-6 h-6" />
        }
      ],
      workflow: [
        {
          step: 1,
          title: "Batch Assignment",
          description: "Receive multiple orders optimized in delivery route",
          action: "View batch on map"
        },
        {
          step: 2,
          title: "Route Planning",
          description: "System suggests optimal route order",
          action: "Follow GPS navigation"
        },
        {
          step: 3,
          title: "Sequential Delivery",
          description: "Deliver each order in optimized sequence",
          action: "Mark each as delivered"
        },
        {
          step: 4,
          title: "Performance Reward",
          description: "Earn bonus for completing batch quickly",
          action: "Bonus automatically credited"
        }
      ],
      benefits: [
        "₹150-250 commission per delivery",
        "Team leadership bonus",
        "Faster payments (daily settlement)",
        "Exclusive route assignments",
        "Priority support"
      ],
      color: "#FFD700"
    },
    {
      roleId: "zone_manager",
      roleName: "🎯 Zone Manager (DeliveryBoy Leading)",
      description: "Experienced delivery personnel responsible for managing a geographic zone",
      requirements: [
        "1+ year delivery experience",
        "Minimum 90% success rate",
        "Outstanding customer feedback",
        "Leadership skills",
        "Local area knowledge"
      ],
      responsibilities: [
        "Oversee 5-10 delivery boys in zone",
        "Quality assurance of deliveries",
        "Customer complaint resolution",
        "Team performance monitoring",
        "Generate zone reports"
      ],
      features: [
        {
          title: "Zone Dashboard",
          description: "Monitor all deliveries in your assigned zone",
          icon: <Truck className="w-6 h-6" />
        },
        {
          title: "Team Monitoring",
          description: "Real-time tracking of all delivery boy locations",
          icon: <MapPin className="w-6 h-6" />
        },
        {
          title: "Issue Management",
          description: "Handle customer complaints and delivery issues",
          icon: <AlertCircle className="w-6 h-6" />
        },
        {
          title: "Performance Reports",
          description: "Generate and analyze zone delivery metrics",
          icon: <FileText className="w-6 h-6" />
        }
      ],
      workflow: [
        {
          step: 1,
          title: "Orders Allocation",
          description: "Receive zone orders to allocate among delivery boys",
          action: "View all pending orders for zone"
        },
        {
          step: 2,
          title: "Team Assignment",
          description: "Assign orders to appropriate delivery boys based on location",
          action: "Orders distributed to team"
        },
        {
          step: 3,
          title: "Progress Monitoring",
          description: "Track delivery progress in real-time",
          action: "Live dashboard updates"
        },
        {
          step: 4,
          title: "Performance Analysis",
          description: "Generate performance reports and metrics",
          action: "Monthly review completed"
        }
      ],
      benefits: [
        "₹200-400 base salary + commissions",
        "Team management stipend",
        "Zone performance bonus",
        "Direct communication with SubAdmin",
        "Training budget allocation"
      ],
      color: "#4CAF50"
    },
    {
      roleId: "logistics_coordinator",
      roleName: "📊 Logistics Coordinator",
      description: "Semi-management role coordinating between SubAdmin and delivery team",
      requirements: [
        "1+ year as Zone Manager or equivalent",
        "Management certification preferred",
        "Strong communication skills",
        "Basic accounting knowledge",
        "Problem-solving expertise"
      ],
      responsibilities: [
        "Coordinate 20-50 delivery boys across multiple zones",
        "Manage delivery schedules and route planning",
        "Handle order reconciliation",
        "Escalate critical issues to SubAdmin",
        "Generate logistics reports"
      ],
      features: [
        {
          title: "Multi-Zone Oversight",
          description: "Manage multiple zones from centralized dashboard",
          icon: <Truck className="w-6 h-6" />
        },
        {
          title: "Schedule Management",
          description: "Plan delivery schedules and team shifts",
          icon: <Clock className="w-6 h-6" />
        },
        {
          title: "Order Reconciliation",
          description: "Ensure all orders are accounted for and delivered",
          icon: <CheckCircle className="w-6 h-6" />
        },
        {
          title: "Advanced Analytics",
          description: "Generate detailed logistics performance metrics",
          icon: <FileText className="w-6 h-6" />
        }
      ],
      workflow: [
        {
          step: 1,
          title: "Daily Planning",
          description: "Plan delivery schedule for all zones",
          action: "Schedule created and published"
        },
        {
          step: 2,
          title: "Team Coordination",
          description: "Coordinate with zone managers for implementation",
          action: "Teams briefed and ready"
        },
        {
          step: 3,
          title: "Live Monitoring",
          description: "Monitor all deliveries in real-time",
          action: "Dashboard shows live status"
        },
        {
          step: 4,
          title: "Daily Report",
          description: "Generate end-of-day logistics report",
          action: "Report submitted to SubAdmin"
        }
      ],
      benefits: [
        "₹400-800 monthly salary + performance bonus",
        "Health insurance coverage",
        "Paid leaves (12 days/year)",
        "Annual salary review + increments",
        "Career path to SubAdmin"
      ],
      color: "#2196F3"
    }
  ];

  const toggleRoleExpand = (roleId: string) => {
    setExpandedRole(expandedRole === roleId ? null : roleId);
  };

  return (
    <div className="delivery-boy-roles-container">
      {/* Header Section */}
      <div className="roles-header">
        <div className="header-content">
          <h1>🚚 Delivery Boy Role Hierarchy</h1>
          <p>Complete guide to all delivery boy positions and career progression</p>
        </div>
        <div className="header-stats">
          <div className="stat-box">
            <Truck className="w-8 h-8" />
            <div>
              <h3>4 Roles</h3>
              <p>Career Options</p>
            </div>
          </div>
          <div className="stat-box">
            <DollarSign className="w-8 h-8" />
            <div>
              <h3>₹50-800</h3>
              <p>Per Delivery/Month</p>
            </div>
          </div>
        </div>
      </div>

      {/* Roles List */}
      <div className="roles-list">
        {deliveryBoyRoles.map((role) => (
          <div
            key={role.roleId}
            className={`role-card ${expandedRole === role.roleId ? "expanded" : ""}`}
            style={{ borderLeftColor: role.color }}
          >
            {/* Role Header - Always Visible */}
            <div
              className="role-header-clickable"
              onClick={() => toggleRoleExpand(role.roleId)}
            >
              <div className="role-title-section">
                <h2 style={{ color: role.color }}>{role.roleName}</h2>
                <p className="role-summary">{role.description}</p>
              </div>
              <div className="expand-icon">
                {expandedRole === role.roleId ? (
                  <ChevronUp className="w-6 h-6" />
                ) : (
                  <ChevronDown className="w-6 h-6" />
                )}
              </div>
            </div>

            {/* Role Details - Expandable */}
            {expandedRole === role.roleId && (
              <div className="role-details">
                {/* Tab Navigation */}
                <div className="tab-navigation">
                  <button
                    className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
                    onClick={() => setActiveTab("overview")}
                  >
                    Overview
                  </button>
                  <button
                    className={`tab-btn ${activeTab === "workflow" ? "active" : ""}`}
                    onClick={() => setActiveTab("workflow")}
                  >
                    Workflow
                  </button>
                  <button
                    className={`tab-btn ${activeTab === "requirements" ? "active" : ""}`}
                    onClick={() => setActiveTab("requirements")}
                  >
                    Requirements
                  </button>
                </div>

                {/* Tab Content */}
                <div className="tab-content">
                  {/* Overview Tab */}
                  {activeTab === "overview" && (
                    <>
                      {/* Features Grid */}
                      <div className="section">
                        <h3>✨ Key Features</h3>
                        <div className="features-grid">
                          {role.features.map((feature, idx) => (
                            <div key={idx} className="feature-card">
                              <div className="feature-icon" style={{ color: role.color }}>
                                {feature.icon}
                              </div>
                              <h4>{feature.title}</h4>
                              <p>{feature.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Responsibilities */}
                      <div className="section">
                        <h3>📋 Main Responsibilities</h3>
                        <ul className="responsibility-list">
                          {role.responsibilities.map((resp, idx) => (
                            <li key={idx}>
                              <CheckCircle className="w-5 h-5" />
                              <span>{resp}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Benefits */}
                      <div className="section">
                        <h3>🎁 Benefits</h3>
                        <div className="benefits-list">
                          {role.benefits.map((benefit, idx) => (
                            <div key={idx} className="benefit-item">
                              <span className="benefit-icon">✓</span>
                              <span>{benefit}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Workflow Tab */}
                  {activeTab === "workflow" && (
                    <div className="section">
                      <h3>🔄 Daily Workflow</h3>
                      <div className="workflow-timeline">
                        {role.workflow.map((step, idx) => (
                          <div key={idx} className="workflow-step">
                            <div className="step-number" style={{ backgroundColor: role.color }}>
                              {step.step}
                            </div>
                            <div className="step-content">
                              <h4>{step.title}</h4>
                              <p className="step-desc">{step.description}</p>
                              <p className="step-action">📌 {step.action}</p>
                            </div>
                            {idx < role.workflow.length - 1 && <div className="step-connector" />}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Requirements Tab */}
                  {activeTab === "requirements" && (
                    <div className="section">
                      <h3>📋 Requirements to Apply</h3>
                      <div className="requirements-list">
                        {role.requirements.map((req, idx) => (
                          <div key={idx} className="requirement-item">
                            <div className="requirement-checkbox">✓</div>
                            <span>{req}</span>
                          </div>
                        ))}
                      </div>
                      <div className="apply-section">
                        <button
                          className="apply-btn"
                          style={{ backgroundColor: role.color }}
                        >
                          Apply for {role.roleName.split(" ").slice(1).join(" ")}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Career Progression */}
      <div className="career-progression-section">
        <h2>📈 Career Progression Path</h2>
        <div className="progression-chart">
          <div className="progression-box tier-1">
            <span className="role-badge">Standard Delivery Boy</span>
            <p>Entry Level</p>
          </div>
          <div className="arrow">→</div>
          <div className="progression-box tier-2">
            <span className="role-badge">Premium/Zone Manager</span>
            <p>3+ months / Experience</p>
          </div>
          <div className="arrow">→</div>
          <div className="progression-box tier-3">
            <span className="role-badge">Logistics Coordinator</span>
            <p>1+ year Leadership</p>
          </div>
          <div className="arrow">→</div>
          <div className="progression-box tier-4">
            <span className="role-badge">SubAdmin (Territory Manager)</span>
            <p>Promotion by Superior</p>
          </div>
        </div>
      </div>

      {/* FAQs */}
      <div className="faqs-section">
        <h2>❓ Frequently Asked Questions</h2>
        <div className="faq-items">
          <div className="faq-item">
            <h4>How do I get started as a Delivery Boy?</h4>
            <p>
              Complete your profile, upload required documents (ID, License), and submit a request. 
              Admin will verify and approve your application within 24-48 hours.
            </p>
          </div>
          <div className="faq-item">
            <h4>What's the payment structure?</h4>
            <p>
              Standard: ₹50-100/delivery | Premium: ₹150-250/delivery | 
              Coordinator: ₹400-800/month + bonus
            </p>
          </div>
          <div className="faq-item">
            <h4>Can I switch roles?</h4>
            <p>
              Yes! You can request a promotion once you meet the requirements for the next tier. 
              This requires manager approval and meeting performance benchmarks.
            </p>
          </div>
          <div className="faq-item">
            <h4>What happens if a delivery fails?</h4>
            <p>
              Mark it as "Failed Delivery" with notes. No commission is earned, but you can retry 
              or the order may reassign to another delivery boy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryBoyRolesPage;
