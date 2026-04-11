import { createRoot } from "react-dom/client";
import "./index.css";
import "./theme/fonts.css";
import App from "./App.tsx";
import { ErrorBoundary } from "./components/features";
import { TamaguiThemeProvider } from "./theme/TamaguiThemeProvider";
import { loadConfig } from "./config";

// Silence harmless React Native Web warnings (these don't affect functionality)
const SUPPRESSED_WARNINGS = [
  // RN touch props don't exist in DOM
  "onStartShouldSetResponder",
  "onResponderTerminationRequest",
  "onResponderGrant",
  "onResponderMove",
  "onResponderRelease",
  "onResponderTerminate",
  "onPressOut",
  "onPressIn",
  // Deprecated APIs used internally by RN libraries
  "props.pointerEvents is deprecated",
  "TouchableMixin is deprecated",
];
const isSuppressedWarning = (args: unknown[]): boolean => {
  const str = args.map((arg) => String(arg)).join(" ");
  return SUPPRESSED_WARNINGS.some((warning) => str.includes(warning));
};
const originalError = console.error;
const originalWarn = console.warn;
console.error = (...args: unknown[]): void => {
  if (isSuppressedWarning(args)) return;
  originalError.apply(console, args);
};
console.warn = (...args: unknown[]): void => {
  if (isSuppressedWarning(args)) return;
  originalWarn.apply(console, args);
};

const cfg = loadConfig();
console.info(`Running with config: ${JSON.stringify(cfg)}`);

// Reason: React.StrictMode removed — its double-mount cycle triggers a setTimeout
// in React Navigation v6's useNavigationBuilder cleanup that resets navigation state
// to undefined, breaking URL-based deep linking on web.
createRoot(document.getElementById("root")!).render(
  <TamaguiThemeProvider>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </TamaguiThemeProvider>,
);
