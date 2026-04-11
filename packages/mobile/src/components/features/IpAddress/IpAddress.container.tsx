import type { ReactElement } from "react";
import { z } from "zod";
import { Address4 } from "ip-address";
import { useFetch } from "../../../hooks/useFetch";
import { IpAddress } from "./IpAddress";

const HttpBinResponse = z.object({
  origin: z.string().transform((val) => new Address4(val).address),
});

/**
 * Container component that fetches IP address from httpbin.org/get and passes it to IpAddress component.
 * @returns React element with IP address data from httpbin.org
 */
export function IpAddressContainer(): ReactElement {
  const { data, loading, error } = useFetch(
    "https://httpbin.org/get",
    HttpBinResponse,
  );

  return <IpAddress ip={data?.origin} loading={loading} error={error} />;
}
