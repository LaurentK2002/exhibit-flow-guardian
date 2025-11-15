import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Circle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";

interface UserPresence {
  user_id: string;
  full_name: string;
  role: string;
  last_seen: string;
  status: 'online' | 'away' | 'offline';
}

export const UserPresence = () => {
  const [users, setUsers] = useState<UserPresence[]>([]);
  const { user, profile } = useAuth();
  const { role } = usePermissions();

  useEffect(() => {
    if (!user) return;

    // Set up presence tracking
    const channel = supabase.channel('user-presence');

    // Track current user presence
    const trackPresence = () => {
      channel.track({
        user_id: user.id,
        full_name: profile?.full_name || 'Unknown',
        role: role || 'user',
        last_seen: new Date().toISOString(),
        status: 'online'
      });
    };

    // Subscribe and track presence
    channel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState();
        const activeUsers: UserPresence[] = [];

        Object.keys(presenceState).forEach(key => {
          const presence = presenceState[key][0] as any;
          activeUsers.push({
            user_id: presence.user_id,
            full_name: presence.full_name,
            role: presence.role,
            last_seen: presence.last_seen,
            status: 'online'
          });
        });

        setUsers(activeUsers);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        console.log('User joined:', newPresences);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        console.log('User left:', leftPresences);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          trackPresence();
        }
      });

    // Update presence every 30 seconds
    const interval = setInterval(trackPresence, 30000);

    // Handle page visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        channel.track({
          user_id: user.id,
          full_name: profile?.full_name || 'Unknown',
          role: role || 'user',
          last_seen: new Date().toISOString(),
          status: 'away'
        });
      } else {
        trackPresence();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      supabase.removeChannel(channel);
    };
  }, [user, profile, role]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      default: return 'bg-gray-400';
    }
  };

  const getRoleIcon = (role: string) => {
    return role.charAt(0).toUpperCase();
  };

  const formatLastSeen = (lastSeen: string) => {
    const date = new Date(lastSeen);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    return `${Math.floor(diffInMinutes / 60)}h ago`;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center">
          <Users className="h-4 w-4 mr-2" />
          Active Team Members
          <Badge variant="secondary" className="ml-2">
            {users.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {users.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground text-sm">
              <Users className="h-6 w-6 mx-auto mb-2 opacity-50" />
              No active users
            </div>
          ) : (
            users.map((activeUser, index) => (
              <div key={`${activeUser.user_id}-${index}`} className="flex items-center space-x-3">
                <div className="relative">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {getRoleIcon(activeUser.role)}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background ${getStatusColor(activeUser.status)}`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {activeUser.full_name}
                  </p>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs capitalize">
                      {activeUser.role.replace('_', ' ')}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatLastSeen(activeUser.last_seen)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center">
                  <Circle className={`h-2 w-2 ${getStatusColor(activeUser.status)}`} />
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};