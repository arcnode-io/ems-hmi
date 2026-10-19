/**
 * The real backend the e2e runs against — the same images product deploys,
 * wired by compose service name on one docker network: postgres, the File-RBAC
 * broker (ems-hivemq), device-api booted from a commissioned DTM,
 * der-control-api (event history), and this repo's HMI image (nginx + the
 * `deployed` build) with a site overlay mounted. No gateway:
 * gatewayStub.ts plays its MQTT side. No analyst: it needs LLM credentials,
 * so tests stub it at the network (fixtures/test.ts).
 */

import { join } from "path";
import { GenericContainer, Network, PullPolicy, Wait, type StartedNetwork, type StartedTestContainer } from "testcontainers";

const FIXTURES = import.meta.dirname;
const WEB_ROOT = join(FIXTURES, "..", "..");

/** HMI host port — playwright.config's baseURL. */
export const HMI_PORT = 4173;

/** Test-only credentials (match hivemq-credentials.xml). */
export const OPERATOR = { username: "operator", password: "e2e-operator-login" } as const;
export const GATEWAY = { username: "arcnode_gateway", password: "gateway-test-pw" } as const;

const JWT_SECRET = "e2e-jwt-secret-at-least-32-bytes-long";

/** A product image at :latest — always re-pulled, or a stale local copy gets tested. */
function productImage(name: string): GenericContainer {
  return new GenericContainer(`public.ecr.aws/y1d2j6a8/${name}:latest`).withPullPolicy(PullPolicy.alwaysPull());
}

const DEVICE_API_ENV = {
  ENV: "beta",
  BOOT_DTM_PATH: "/app/dtm.json",
  DOCUMENT_URL: "postgresql://postgres:e2e@postgres:5432/postgres",
  AUTH_JWT_SECRET: JWT_SECRET,
  AUTH_OPERATOR_PW: OPERATOR.password,
  AUTH_VIEWER_PW: "e2e-viewer-login",
  MQTT_OPERATOR_PASSWORD: "operator-test-pw",
  MQTT_VIEWER_PASSWORD: "viewer-test-pw",
  MQTT_DEVICE_API_PASSWORD: "device-api-test-pw",
} as const;

const DER_CONTROL_API_ENV = {
  ENV: "beta",
  POSTGRES_PASSWORD: "e2e",
  AUTH_JWT_SECRET: JWT_SECRET,
  MQTT_DER_CONTROL_API_PASSWORD: "der-control-api-test-pw",
  DER_CONTROL_LFDI_ALLOWLIST: "",
} as const;

export interface Stack {
  /** mqtt://localhost:<mapped 1883> — for the gateway stub. */
  brokerUrl: string;
  stop(): Promise<void>;
}

/**
 * Start the stack. Expects `VITE_ENV=deployed npm run build` to have filled dist/.
 * @param dtmPath commissioned DTM device-api boots from
 */
export async function startStack(dtmPath: string): Promise<Stack> {
  const network: StartedNetwork = await new Network().start();
  const started: StartedTestContainer[] = [];
  const run = async (container: GenericContainer): Promise<StartedTestContainer> => {
    const started_ = await container.withNetwork(network).start();
    started.push(started_);
    return started_;
  };

  await run(
    new GenericContainer("postgres:15")
      .withNetworkAliases("postgres")
      .withEnvironment({ POSTGRES_PASSWORD: "e2e" })
      .withWaitStrategy(Wait.forLogMessage(/database system is ready to accept connections/, 2)),
  );
  const broker = await run(
    productImage("ems-hivemq")
      .withNetworkAliases("hivemq")
      .withExposedPorts(1883)
      .withCopyFilesToContainer([
        {
          source: join(FIXTURES, "hivemq-credentials.xml"),
          target: "/opt/hivemq/extensions/hivemq-file-rbac-extension/conf/credentials.xml",
        },
      ])
      .withWaitStrategy(Wait.forLogMessage(/Started HiveMQ in/)),
  );
  await run(
    productImage("ems-device-api")
      .withNetworkAliases("device-api")
      .withEnvironment(DEVICE_API_ENV)
      .withCopyFilesToContainer([{ source: dtmPath, target: "/app/dtm.json" }])
      .withWaitStrategy(Wait.forLogMessage(/Nest application successfully started/)),
  );
  await run(
    productImage("ems-der-control-api")
      .withNetworkAliases("der-control-api")
      .withEnvironment(DER_CONTROL_API_ENV)
      .withWaitStrategy(Wait.forLogMessage(/Started \w+ in/)),
  );
  const hmiImage = await GenericContainer.fromDockerfile(WEB_ROOT).build("ems-hmi-e2e", { deleteOnExit: false });
  await run(
    hmiImage
      .withExposedPorts({ container: 80, host: HMI_PORT })
      .withCopyFilesToContainer([
        { source: join(FIXTURES, "cfg.customer.yml"), target: "/opt/arcnode/hmi-cfg.customer.yml" },
      ])
      .withWaitStrategy(Wait.forHttp("/", 80)),
  );

  return {
    brokerUrl: `mqtt://${broker.getHost()}:${broker.getMappedPort(1883)}`,
    stop: async (): Promise<void> => {
      for (const container of started.reverse()) await container.stop();
      await network.stop();
    },
  };
}
