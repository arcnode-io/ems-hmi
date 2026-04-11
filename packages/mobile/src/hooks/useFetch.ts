import { useEffect, useState } from "react";
import { z } from "zod";

interface UseFetchResult<T> {
  data?: T;
  loading: boolean;
  error?: string;
}

/**
 * Generic fetch hook with Zod validation.
 * @param url URL to fetch from
 * @param schema Zod schema to validate response against
 * @returns Object containing parsed data, loading state, and error state
 * @example const { data, loading, error } = useFetch('/api/users', UserSchema);
 */
export function useFetch<T>(
  url: string,
  schema: z.ZodSchema<T>,
): UseFetchResult<T> {
  const [data, setData] = useState<T>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(undefined);

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const rawData = (await response.json()) as unknown;
        const parsedData = schema.parse(rawData);

        setData(parsedData);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error occurred";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchData().catch((err: unknown) => {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      setLoading(false);
    });
  }, [url, schema]);

  return { data, loading, error };
}
