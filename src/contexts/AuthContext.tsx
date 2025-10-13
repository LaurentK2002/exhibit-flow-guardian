import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    console.log('AuthContext: Starting initialization');
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('AuthContext: Auth state change:', event, !!session);
        if (!isMounted) return;
        
        // Only update session and user synchronously
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer profile fetching to avoid blocking auth state changes
        if (session?.user) {
          console.log('AuthContext: User found, fetching profile');
          setTimeout(() => {
            if (!isMounted) return;
            
            const fetchProfile = async () => {
              try {
                const profilePromise = supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', session.user.id)
                  .maybeSingle();
                
                const timeoutPromise = new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
                );
                
                const { data: profileData, error } = await Promise.race([
                  profilePromise,
                  timeoutPromise
                ]) as any;
                
                console.log('AuthContext: Profile fetch result:', { profileData, error });
                
                if (isMounted) {
                  if (error) {
                    console.error('Profile fetch error:', error);
                    setProfile(null);
                  } else {
                    setProfile(profileData);
                  }
                  setLoading(false);
                }
              } catch (error) {
                console.error('Error fetching profile:', error);
                if (isMounted) {
                  setProfile(null);
                  setLoading(false);
                }
              }
            };
            
            fetchProfile();
          }, 0);
        } else {
          console.log('AuthContext: No user, setting loading to false');
          if (isMounted) {
            setProfile(null);
            setLoading(false);
          }
        }
      }
    );

    // THEN check for existing session
    const initializeAuth = async () => {
      console.log('AuthContext: Checking existing session');
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('AuthContext: Session check result:', { hasSession: !!session, error });
        
        if (error) {
          console.error('Session error:', error);
          if (isMounted) {
            setSession(null);
            setUser(null);
            setProfile(null);
            setLoading(false);
          }
          return;
        }

        // If there's no session, we're done loading
        if (!session) {
          console.log('AuthContext: No session found, setting loading to false');
          if (isMounted) {
            setSession(null);
            setUser(null);
            setProfile(null);
            setLoading(false);
          }
          return;
        }

        // If there is a session, the onAuthStateChange will handle it
        console.log('AuthContext: Session found, letting onAuthStateChange handle it');
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (isMounted) {
          setSession(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    profile,
    loading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
