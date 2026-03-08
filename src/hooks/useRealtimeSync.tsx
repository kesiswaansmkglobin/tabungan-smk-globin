import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

type TableName = "students" | "transactions" | "classes" | "profiles" | "school_data" | "wali_kelas" | "audit_logs";

/**
 * Hook to subscribe to realtime changes on a Supabase table
 * and automatically invalidate related React Query caches.
 */
export function useRealtimeSync(
  table: TableName,
  queryKeys: string[][],
  enabled: boolean = true
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    const channel = supabase
      .channel(`realtime-${table}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => {
          // Invalidate all related query keys
          queryKeys.forEach((key) => {
            queryClient.invalidateQueries({ queryKey: key });
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, enabled, queryClient]);
}

/**
 * Default stale/cache times for React Query
 */
export const QUERY_CONFIG = {
  // Data that rarely changes (school data, classes)
  static: {
    staleTime: 10 * 60 * 1000,   // 10 min
    gcTime: 30 * 60 * 1000,      // 30 min cache
  },
  // Data that changes moderately (students, profiles)
  moderate: {
    staleTime: 2 * 60 * 1000,    // 2 min
    gcTime: 10 * 60 * 1000,      // 10 min cache
  },
  // Data that changes frequently (transactions, audit logs)
  dynamic: {
    staleTime: 30 * 1000,        // 30 sec
    gcTime: 5 * 60 * 1000,       // 5 min cache
  },
} as const;
