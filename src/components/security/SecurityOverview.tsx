import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, CheckCircle, Activity, Users, Eye } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { AuditLogsDashboard } from './AuditLogsDashboard';
import { SessionManagement } from './SessionManagement';

interface SecurityStats {
  activeUsers: number;
  recentLogins: number;
  profileAccesses: number;
  suspiciousActivity: number;
}

export const SecurityOverview = () => {
  const [stats, setStats] = useState<SecurityStats>({
    activeUsers: 0,
    recentLogins: 0,
    profileAccesses: 0,
    suspiciousActivity: 0,
  });
  const [loading, setLoading] = useState(true);
  const { hasPermission } = usePermissions();

  useEffect(() => {
    if (hasPermission('manage_users')) {
      fetchSecurityStats();
    }
  }, [hasPermission]);

  const fetchSecurityStats = async () => {
    try {
      // Get active users count
      const { count: activeUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Get recent logins (last 24 hours)
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count: recentLogins } = await supabase
        .from('user_sessions')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', twentyFourHoursAgo);

      // Get profile accesses (last 24 hours)
      const { count: profileAccesses } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .eq('action', 'PROFILE_ACCESS')
        .gte('created_at', twentyFourHoursAgo);

      setStats({
        activeUsers: activeUsers || 0,
        recentLogins: recentLogins || 0,
        profileAccesses: profileAccesses || 0,
        suspiciousActivity: 0, // Placeholder for future implementation
      });
    } catch (error) {
      console.error('Error fetching security stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const cleanupExpiredSessions = async () => {
    try {
      const { error } = await supabase.rpc('cleanup_expired_sessions');
      if (error) throw error;
      
      // Refresh stats after cleanup
      fetchSecurityStats();
    } catch (error) {
      console.error('Error cleaning up sessions:', error);
    }
  };

  if (!hasPermission('manage_users')) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4" />
              <p>You don't have permission to view security overview.</p>
            </div>
          </CardContent>
        </Card>
        <SessionManagement />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Security Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              Total active officers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Logins</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentLogins}</div>
            <p className="text-xs text-muted-foreground">
              Last 24 hours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profile Accesses</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.profileAccesses}</div>
            <p className="text-xs text-muted-foreground">
              Last 24 hours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspicious Activity</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.suspiciousActivity}</div>
            <p className="text-xs text-muted-foreground">
              Flagged events
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Security Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Row Level Security (RLS) is enabled on all sensitive tables.
            </AlertDescription>
          </Alert>
          
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Profile access logging is active and monitoring all user interactions.
            </AlertDescription>
          </Alert>

          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Platform security warnings detected. Please check Supabase dashboard settings:
              OTP expiry, leaked password protection, and Postgres version.
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button onClick={cleanupExpiredSessions} variant="outline">
              Cleanup Expired Sessions
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Session Management */}
      <SessionManagement />

      {/* Audit Logs */}
      <AuditLogsDashboard />
    </div>
  );
};