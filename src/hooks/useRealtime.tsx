import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useRealtime = (
  table: string,
  onUpdate: () => void,
  filter?: { column: string; value: any }
) => {
  useEffect(() => {
    if (!onUpdate) return;
    const channel = supabase
      .channel(`${table}-changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
          ...(filter && { filter: `${filter.column}=eq.${filter.value}` })
        },
        () => {
          onUpdate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, onUpdate, filter]);
};