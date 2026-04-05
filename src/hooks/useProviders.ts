import { useState, useEffect } from "react";
import { getProviders } from "../services/providerService";
import type { ServiceProvider } from "../types";

interface UseProvidersResult {
  providers: ServiceProvider[];
  loading: boolean;
  error: string | null;
}

export const useProviders = (categoryId?: string): UseProvidersResult => {
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProviders = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getProviders(categoryId);
        setProviders(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load providers");
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, [categoryId]);

  return { providers, loading, error };
};
