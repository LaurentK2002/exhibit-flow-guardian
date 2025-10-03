import { useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { SystemSettings } from "@/components/SystemSettings";
import { UserProfile } from "@/components/UserProfile";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Settings() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'administrator';

  useEffect(() => {
    document.title = "Settings";
    const meta = document.querySelector('meta[name="description"]');
    const prev = meta?.getAttribute('content');
    if (meta) meta.setAttribute('content', 'Manage your profile and system settings.');
    const link = document.createElement('link');
    link.rel = 'canonical';
    link.href = window.location.href;
    document.head.appendChild(link);
    return () => { if (meta && prev) meta.setAttribute('content', prev); document.head.removeChild(link); };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <Navigation />
      <main className="container mx-auto px-4 md:px-6 py-8 max-w-7xl">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>
        <Tabs defaultValue="profile" className="w-full">
          <TabsList>
            <TabsTrigger value="profile">My Profile</TabsTrigger>
            {isAdmin && <TabsTrigger value="system">System Settings</TabsTrigger>}
          </TabsList>
          <TabsContent value="profile" className="mt-6">
            <UserProfile />
          </TabsContent>
          {isAdmin && (
            <TabsContent value="system" className="mt-6">
              <SystemSettings />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
}
