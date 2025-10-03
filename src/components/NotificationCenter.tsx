import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, BellRing, Check, X, AlertTriangle, Info, CheckCircle, Clock } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

export const NotificationCenter = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // Set up real-time listeners for notifications
      setupRealtimeListeners();
      loadInitialNotifications();
    }
  }, [user]);

  const setupRealtimeListeners = () => {
    // Listen for new case activities
    const activityChannel = supabase
      .channel('activity-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'case_activities'
        },
        (payload) => {
          addNotification({
            id: `activity-${payload.new.id}`,
            title: 'New Activity',
            message: `${payload.new.description}`,
            type: 'info',
            timestamp: new Date(),
            read: false
          });
        }
      )
      .subscribe();

    // Listen for exhibit status changes
    const exhibitChannel = supabase
      .channel('exhibit-notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'exhibits'
        },
        (payload) => {
          if (payload.old.status !== payload.new.status) {
            addNotification({
              id: `exhibit-${payload.new.id}`,
              title: 'Exhibit Status Updated',
              message: `Exhibit ${payload.new.exhibit_number} status changed to ${payload.new.status}`,
              type: payload.new.status === 'analysis_complete' ? 'success' : 'info',
              timestamp: new Date(),
              read: false
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(activityChannel);
      supabase.removeChannel(exhibitChannel);
    };
  };

  const loadInitialNotifications = () => {
    // Add some sample notifications based on recent data
    const sampleNotifications: Notification[] = [
      {
        id: '1',
        title: 'Case Assignment',
        message: 'You have been assigned to case CYB-2024-001',
        type: 'info',
        timestamp: new Date(Date.now() - 5 * 60000),
        read: false
      },
      {
        id: '2',
        title: 'Analysis Complete',
        message: 'Forensic analysis completed for exhibit EXH-2024-003',
        type: 'success',
        timestamp: new Date(Date.now() - 15 * 60000),
        read: false
      },
      {
        id: '3',
        title: 'Critical Case Alert',
        message: 'High priority case requires immediate attention',
        type: 'warning',
        timestamp: new Date(Date.now() - 30 * 60000),
        read: true
      }
    ];
    
    setNotifications(sampleNotifications);
    setUnreadCount(sampleNotifications.filter(n => !n.read).length);
  };

  const addNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev].slice(0, 50)); // Keep only last 50
    setUnreadCount(prev => prev + 1);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const removeNotification = (id: string) => {
    const notification = notifications.find(n => n.id === id);
    if (notification && !notification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          {unreadCount > 0 ? (
            <BellRing className="h-5 w-5" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center min-w-[1.25rem]"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="dark w-80 p-0 border border-border/30 shadow-lg" align="end">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Notifications</CardTitle>
              <div className="flex gap-1">
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                    <Check className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <ScrollArea className="h-80">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No notifications</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 border-b last:border-0 hover:bg-muted/50 transition-colors ${
                        !notification.read ? 'bg-blue-50/50 border-l-2 border-l-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <p className="text-sm font-medium text-foreground truncate">
                              {notification.title}
                            </p>
                            <div className="flex items-center gap-1 ml-2">
                              {!notification.read && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => markAsRead(notification.id)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                              )}
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => removeNotification(notification.id)}
                                className="h-6 w-6 p-0"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-muted-foreground">
                              {formatTimeAgo(notification.timestamp)}
                            </span>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
};