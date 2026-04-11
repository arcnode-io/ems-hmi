import { Component } from "react";
import type { ReactNode, ErrorInfo } from "react";
import { View, Text } from "react-native";
import { styles } from "./ErrorBoundary.styles";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

/**
 * Error boundary component that catches JavaScript errors in the component tree.
 * @param props Component props
 * @param props.children Child components to wrap with error boundary
 * @returns React element that shows error UI when errors occur
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  /**
   * Creates an ErrorBoundary instance.
   * @param props - Component props
   */
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  /**
   * Catches errors and updates state to show error UI.
   * @param error - The error that was thrown
   * @returns Updated state with error information
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  /**
   * Logs error information when an error is caught.
   * @param error - The error that was thrown
   * @param errorInfo - Additional error information from React
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  /**
   * Renders the component with error UI if an error occurred.
   * @returns React node - either error UI or children
   */
  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            An unexpected error occurred. Please refresh the page to try again.
          </Text>
          <View style={styles.details}>
            {this.state.error?.message !== undefined && (
              <View>
                <Text style={styles.summary}>Error details</Text>
                <Text style={styles.pre}>{this.state.error.message}</Text>
              </View>
            )}
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}
