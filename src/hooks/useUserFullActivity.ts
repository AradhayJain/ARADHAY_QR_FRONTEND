import { useState, useEffect } from "react";
import API from "@/api/api";

export interface FullActivityDay {
  date: string;
  totalDuration: number;
  scanCount: number;
  isFlagged: boolean;
  checkInTime?: string;
  checkOutTime?: string;
}

export interface UseUserFullActivityResult {
  data: FullActivityDay[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Fetches complete user activity data (for ContributionCalendar) 
 * Uses admin endpoint for 90-day history with full details
 */
export function useUserFullActivity(userId: string): UseUserFullActivityResult {
  const [data, setData] = useState<FullActivityDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);
    
    // Fetch full activity data matching ContributionCalendar format (proven endpoint)
    API.get(`/api/user/calendar/${userId}?days=90`)
      .then(res => {
        setData(res.data.calendar || []);
      })
      .catch(err => {
        setError(err.response?.data?.message || "Failed to load full activity");
      })
      .finally(() => setIsLoading(false));
  }, [userId]);

  return { data, isLoading, error };
}

