/**
 * Mobile-only TypeScript augmentation. The shared package uses `dataSet`
 * on RN Views to tag DOM elements for web-side CSS hooks; native ignores
 * the prop at runtime but the RN types don't declare it. Add it here so
 * mobile typecheck doesn't complain about props that are no-ops on this
 * platform.
 */

import "react-native";

declare module "react-native" {
  interface ViewProps {
    dataSet?: Record<string, string | number | undefined>;
  }
  interface TextProps {
    dataSet?: Record<string, string | number | undefined>;
  }
  interface PressableProps {
    dataSet?: Record<string, string | number | undefined>;
  }
}
