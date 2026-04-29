/**
 * Frontend Permission Hook
 * Use this hook in React components to check permissions and roles
 * 
 * Location: client/src/hooks/usePermission.ts
 */

import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

interface PermissionHookReturn {
  hasRole: (role: string | string[]) => boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  userRole: string | null;
  userPermissions: string[];
}

/**
 * Hook to check user permissions and roles
 * 
 * Usage:
 * const { hasRole, hasPermission } = usePermission();
 * 
 * if (hasRole("admin")) { ... }
 * if (hasPermission("manage_subadmins")) { ... }
 */
export const usePermission = (): PermissionHookReturn => {
  const { user } = useContext(AuthContext) || {};

  // Permission mapping for each role
  const rolePermissions: Record<string, string[]> = {
    admin: [
      "manage_admins",
      "manage_subadmins",
      "manage_deliveryboys",
      "manage_api",
      "manage_settings",
      "manage_users",
      "view_all_orders",
      "view_reports",
      "block_users",
      "view_products",
      "add_to_cart",
      "place_order",
      "view_own_orders"
    ],
    subAdmin: [
      "view_orders",
      "update_orders",
      "assign_deliveryboys",
      "view_queries",
      "view_basic_reports",
      "view_assigned_orders",
      "update_delivery_status",
      "view_products",
      "add_to_cart",
      "place_order",
      "view_own_orders"
    ],
    deliveryBoy: [
      "view_assigned_orders",
      "update_delivery_status",
      "view_products",
      "add_to_cart",
      "place_order",
      "view_own_orders"
    ],
    user: [
      "view_products",
      "add_to_cart",
      "place_order",
      "view_own_orders"
    ]
  };

  const userRole = user?.role || null;
  const userPermissions = userRole ? rolePermissions[userRole] || [] : [];

  // Check if user has specific role
  const hasRole = (roles: string | string[]): boolean => {
    if (!userRole) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(userRole);
  };

  // Check if user has specific permission
  const hasPermission = (permission: string): boolean => {
    return userPermissions.includes(permission);
  };

  // Check if user has ANY of the permissions (OR logic)
  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some((perm) => userPermissions.includes(perm));
  };

  // Check if user has ALL permissions (AND logic)
  const hasAllPermissions = (permissions: string[]): boolean => {
    return permissions.every((perm) => userPermissions.includes(perm));
  };

  return {
    hasRole,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    userRole,
    userPermissions
  };
};

/**
 * Permission Gate Component - Use to conditionally render UI
 * 
 * Usage:
 * <PermissionGate requiredRoles={["admin"]}>
 *   <AdminPanel />
 * </PermissionGate>
 * 
 * or
 * 
 * <PermissionGate requiredPermissions={["manage_subadmins"]}>
 *   <SubAdminManager />
 * </PermissionGate>
 */

import React, { ReactNode } from "react";

interface PermissionGateProps {
  children: ReactNode;
  requiredRoles?: string | string[];
  requiredPermissions?: string | string[];
  fallback?: ReactNode;
  requireAll?: boolean; // If true, requires ALL permissions (AND); if false, requires ANY (OR)
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  requiredRoles,
  requiredPermissions,
  fallback = null,
  requireAll = false
}) => {
  const { hasRole, hasPermission, hasAnyPermission, hasAllPermissions } = usePermission();

  let allowed = true;

  // Check role requirements
  if (requiredRoles) {
    const rolesArray = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    allowed = allowed && hasRole(rolesArray);
  }

  // Check permission requirements
  if (requiredPermissions) {
    const permsArray = Array.isArray(requiredPermissions) 
      ? requiredPermissions 
      : [requiredPermissions];
    
    if (requireAll) {
      allowed = allowed && hasAllPermissions(permsArray);
    } else {
      allowed = allowed && hasAnyPermission(permsArray);
    }
  }

  return allowed ? <>{children}</> : <>{fallback}</>;
};

/**
 * Access Denied Component
 * 
 * Usage:
 * <PermissionGate requiredRoles={["admin"]} fallback={<AccessDenied />}>
 *   <AdminPanel />
 * </PermissionGate>
 */
export const AccessDenied: React.FC = () => (
  <div style={{
    padding: "2rem",
    textAlign: "center",
    backgroundColor: "#f8d7da",
    color: "#721c24",
    borderRadius: "0.3rem",
    border: "1px solid #f5c6cb"
  }}>
    <h2>🔒 Access Denied</h2>
    <p>You don't have permission to access this section.</p>
  </div>
);

export default usePermission;
