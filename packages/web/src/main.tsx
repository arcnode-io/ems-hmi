import { createRoot } from "react-dom/client";
import "./index.css";
import "./theme/fonts.css";
import { AppRoot } from "@ems-hmi/shared/AppRoot";
import { ErrorBoundary } from "./components/features";
import { loadConfig } from "./config";

const cfg = loadConfig();
console.info(`Running with config: ${JSON.stringify(cfg)}`);

createRoot(document.getElementById("root")!).render(
  <AppRoot cfg={cfg} errorBoundary={ErrorBoundary} />,
);
