import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useRealtime = (
  table: string,
  onUpdate: () => void,
  filter?: { column: string; value: any }
) => {
  const callbackRef = useRef(onUpdate);
  
  useEffect(() => {
    callbackRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    const channelName = `${table}-${Math.random().toString(36).substring(7)}-changes`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
          ...(filter && { filter: `${filter.column}=eq.${filter.value}` })
        },
        () => {
          callbackRef.current();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, filter?.column, filter?.value]);
};