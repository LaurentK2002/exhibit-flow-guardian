import { ReactNode } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { SensitiveOperation, roleHasPermission } from '@/lib/permissions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface ProtectedActionProps {
  children: ReactNode;
  requiredOperation: SensitiveOperation;
  fallback?: ReactNode;
  showAccessDenied?: boolean;
}

/**
 * Component that protects sensitive operations based on user role
 * Only renders children if user has the required permission
 */
export const ProtectedAction = ({ 
  children, 
  requiredOperation, 
  fallback = null,
  showAccessDenied = false 
}: ProtectedActionProps) => {
  const { role } = usePermissions();
  
  const hasPermission = roleHasPermission(role, requiredOperation);
  
  if (!hasPermission) {
    if (showAccessDenied) {
      return (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You do not have permission to perform this operation. This action requires special privileges.
          </AlertDescription>
        </Alert>
      );
    }
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
};
