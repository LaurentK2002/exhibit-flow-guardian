// Permission definitions for role-based access control

export const SENSITIVE_OPERATIONS = {
  VIEW_AUDIT_LOGS: 'view_audit_logs',
  APPROVE_FINAL_REPORTS: 'approve_final_reports',
  MANAGE_ALL_USERS: 'manage_all_users',
  VIEW_SYSTEM_ANALYTICS: 'view_system_analytics',
  EXECUTE_STRATEGIC_DECISIONS: 'execute_strategic_decisions',
  MANAGE_DEPARTMENT_BUDGET: 'manage_department_budget',
  OVERRIDE_POLICIES: 'override_policies',
} as const;

export const ROLE_PERMISSIONS: Record<string, SensitiveOperation[]> = {
  chief_of_cyber: [
    SENSITIVE_OPERATIONS.VIEW_AUDIT_LOGS,
    SENSITIVE_OPERATIONS.APPROVE_FINAL_REPORTS,
    SENSITIVE_OPERATIONS.MANAGE_ALL_USERS,
    SENSITIVE_OPERATIONS.VIEW_SYSTEM_ANALYTICS,
    SENSITIVE_OPERATIONS.EXECUTE_STRATEGIC_DECISIONS,
    SENSITIVE_OPERATIONS.MANAGE_DEPARTMENT_BUDGET,
    SENSITIVE_OPERATIONS.OVERRIDE_POLICIES,
  ],
  admin: [
    SENSITIVE_OPERATIONS.VIEW_AUDIT_LOGS,
    SENSITIVE_OPERATIONS.MANAGE_ALL_USERS,
    SENSITIVE_OPERATIONS.VIEW_SYSTEM_ANALYTICS,
  ],
  administrator: [
    SENSITIVE_OPERATIONS.VIEW_AUDIT_LOGS,
    SENSITIVE_OPERATIONS.MANAGE_ALL_USERS,
    SENSITIVE_OPERATIONS.VIEW_SYSTEM_ANALYTICS,
  ],
  commanding_officer: [
    SENSITIVE_OPERATIONS.APPROVE_FINAL_REPORTS,
    SENSITIVE_OPERATIONS.VIEW_SYSTEM_ANALYTICS,
  ],
  officer_commanding_unit: [
    SENSITIVE_OPERATIONS.APPROVE_FINAL_REPORTS,
  ],
};

export type SensitiveOperation = typeof SENSITIVE_OPERATIONS[keyof typeof SENSITIVE_OPERATIONS];
export type UserRole = keyof typeof ROLE_PERMISSIONS;

/**
 * Check if a role has permission for a specific sensitive operation
 */
export const roleHasPermission = (role: string | null, operation: SensitiveOperation): boolean => {
  if (!role) return false;
  
  const permissions = ROLE_PERMISSIONS[role as UserRole];
  if (!permissions) return false;
  
  return permissions.includes(operation);
};

/**
 * Check if a role is Chief of Cyber (highest privilege)
 */
export const isChiefOfCyber = (role: string | null): boolean => {
  return role === 'chief_of_cyber';
};

/**
 * Check if a role has executive privileges (Chief of Cyber or Administrator)
 */
export const hasExecutivePrivileges = (role: string | null): boolean => {
  return role === 'chief_of_cyber' || role === 'admin' || role === 'administrator';
};

/**
 * Get all permissions for a given role
 */
export const getRolePermissions = (role: string | null): SensitiveOperation[] => {
  if (!role) return [];
  return ROLE_PERMISSIONS[role as UserRole] || [];
};
