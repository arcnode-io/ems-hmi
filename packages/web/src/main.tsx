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

/**
 * Fail closed, visibly: a deployed image with no (or an incomplete)
 * /cfg.customer.yml must not render anyone's site. Plain DOM — nothing the
 * failure could have broken (theme, providers) is needed to say so.
 * @param err why config resolution failed
 */
function showConfigError(err: unknown): void {
  const root = document.getElementById("root")!;
  root.style.cssText =
    "font: 15px/1.5 system-ui, sans-serif; padding: 48px; max-width: 640px;";
  const title = document.createElement("h1");
  title.textContent = "HMI configuration error";
  title.style.cssText = "font-size: 20px; margin: 0 0 12px;";
  const detail = document.createElement("p");
  detail.textContent = err instanceof Error ? err.message : String(err);
  const hint = document.createElement("p");
  hint.textContent =
    "The deployment must mount its site config at /opt/arcnode/hmi-cfg.customer.yml.";
  hint.style.color = "#666";
  root.replaceChildren(title, detail, hint);
  throw err; // still surface it in the console / error tracking
}

bootstrap().catch(showConfigError);
