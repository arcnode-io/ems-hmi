import { createRoot } from "react-dom/client";
import "./index.css";
import "./theme/fonts.css";
import { AppRoot } from "@ems-hmi/shared/AppRoot";
import { ErrorBoundary } from "./components/features";
import { loadConfig } from "./config";

/**
 * Async bootstrap: loadConfig() overlays the deployed /cfg.customer.yml at
 * runtime, so the deployed HMI learns its real siteId + same-origin URLs
 * before the first render.
 * @returns resolves once the app is mounted
 */
async function bootstrap(): Promise<void> {
  const cfg = await loadConfig();
  console.info(`Running with config: ${JSON.stringify(cfg)}`);
  createRoot(document.getElementById("root")!).render(
    <AppRoot cfg={cfg} errorBoundary={ErrorBoundary} />,
  );
}

void bootstrap();
