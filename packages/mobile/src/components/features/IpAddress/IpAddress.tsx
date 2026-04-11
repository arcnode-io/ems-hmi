import type { ReactElement } from "react";
import { OctetContainer, OctetWrapper } from "./IpAddress.styles";
import { Card } from "../../ui/Card.styles";
import { ThemedText } from "../../ui/ThemedText";

interface IpAddressProps {
  ip?: string;
  loading?: boolean;
  error?: string;
}

/**
 * Displays an IP address broken down into individual octets.
 * @param props Component props
 * @param props.ip The IP address string to display
 * @param props.loading Whether the IP is being fetched
 * @param props.error Error message if fetch failed
 * @returns React element showing IP octets or loading/error state
 */
export function IpAddress({
  ip,
  loading,
  error,
}: IpAddressProps): ReactElement {
  const labelProps = {
    marginBottom: "$sm",
    fontSize: 16,
    color: "$color",
    fontWeight: "500",
  } as const;

  const octetProps = {
    padding: "$xs",
    backgroundColor: "$primary",
    color: "$background",
    borderWidth: 1,
    borderColor: "$borderColor",
    minWidth: 32,
    textAlign: "center",
    fontWeight: "700",
  } as const;

  const dotProps = {
    color: "$color",
    marginLeft: "$xs",
    fontWeight: "400",
  } as const;

  if (loading === true) {
    return (
      <Card>
        <ThemedText {...labelProps}>Your IP Address:</ThemedText>
        <OctetContainer>
          <ThemedText {...octetProps}>...</ThemedText>
        </OctetContainer>
      </Card>
    );
  }

  if (error !== undefined) {
    return (
      <Card>
        <ThemedText {...labelProps}>Your IP Address:</ThemedText>
        <OctetContainer>
          <ThemedText {...octetProps}>Error: {error}</ThemedText>
        </OctetContainer>
      </Card>
    );
  }

  if (ip === undefined) {
    return (
      <Card>
        <ThemedText {...labelProps}>Your IP Address:</ThemedText>
        <OctetContainer>
          <ThemedText {...octetProps}>Unknown</ThemedText>
        </OctetContainer>
      </Card>
    );
  }

  const octets = ip.split(".");

  return (
    <Card>
      <ThemedText {...labelProps}>Your IP Address:</ThemedText>
      <OctetContainer>
        {octets.map((octet, index) => (
          <OctetWrapper key={`octet-${index}`}>
            <ThemedText {...octetProps}>{octet}</ThemedText>
            {index !== octets.length - 1 && (
              <ThemedText {...dotProps}>.</ThemedText>
            )}
          </OctetWrapper>
        ))}
      </OctetContainer>
    </Card>
  );
}
