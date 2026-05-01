import { useEffect, useState } from "react";
import { z } from "zod";

interface UseFetchResult<T> {
  data?: T;
  loading: boolean;
  error?: string;
}

/**
 * Mock fetch hook that returns hardcoded data for testing.
 * @param url URL to fetch from (ignored in mock)
 * @param schema Zod schema to validate response against
 * @returns Object containing mocked data, loading state, and error state
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
    const fetchData = (): void => {
      try {
        setLoading(true);
        setError(undefined);

        // Mock response based on URL
        const mockData = url.includes("httpbin.org/get")
          ? { origin: "6.6.6.6" }
          : {};

        const parsedData = schema.parse(mockData);
        setData(parsedData);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error occurred";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url, schema]);

  return { data, loading, error };
}
