import { ReactNode } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Shield, AlertTriangle } from 'lucide-react';

interface ChiefOfCyberGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  showWarning?: boolean;
}

/**
 * Permission guard component that only renders children if user has Chief of Cyber role
 * Use this to protect sensitive operations and UI elements
 */
export const ChiefOfCyberGuard = ({ 
  children, 
  fallback,
  showWarning = false 
}: ChiefOfCyberGuardProps) => {
  const { role, loading } = usePermissions();

  if (loading) {
    return null;
  }

  const isChiefOfCyber = role === 'chief_of_cyber';
  const isAdmin = role === 'admin' || role === 'administrator';

  // Allow both Chief of Cyber and Admins
  if (isChiefOfCyber || isAdmin) {
    return <>{children}</>;
  }

  if (showWarning) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Access Restricted</AlertTitle>
        <AlertDescription>
          This operation requires Chief of Cyber clearance level.
        </AlertDescription>
      </Alert>
    );
  }

  return fallback ? <>{fallback}</> : null;
};

interface SensitiveActionProps {
  children: ReactNode;
  action: string;
}

/**
 * Wrapper for sensitive actions that logs access attempts
 * Use this for critical operations like approvals, deletions, etc.
 */
export const SensitiveAction = ({ children, action }: SensitiveActionProps) => {
  const { role } = usePermissions();

  const isAuthorized = role === 'chief_of_cyber' || 
                       role === 'admin' || 
                       role === 'administrator';

  if (!isAuthorized) {
    return (
      <div className="relative group cursor-not-allowed opacity-50">
        {children}
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Shield className="h-4 w-4" />
            <span>Chief of Cyber Only</span>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
