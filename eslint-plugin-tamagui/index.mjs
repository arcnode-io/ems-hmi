/**
 * Custom ESLint plugin for Tamagui best practices.
 * Enforces fontWeight on styled Text components for cross-platform font rendering.
 */

const requireFontWeightRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Require fontWeight on styled Text components",
      category: "Best Practices",
    },
    messages: {
      missingFontWeight:
        "styled(Text, ...) must include fontWeight for cross-platform font rendering. Add fontWeight: '400', '500', or '700'.",
    },
    schema: [],
  },
  create(context) {
    return {
      CallExpression(node) {
        // Check if this is a styled() call
        if (node.callee.name !== "styled") {
          return;
        }

        // Check if first argument is Text
        const firstArg = node.arguments[0];
        if (!firstArg || firstArg.type !== "Identifier" || firstArg.name !== "Text") {
          return;
        }

        // Check if second argument exists and is an object
        const secondArg = node.arguments[1];
        if (!secondArg || secondArg.type !== "ObjectExpression") {
          context.report({
            node,
            messageId: "missingFontWeight",
          });
          return;
        }

        // Check if fontWeight property exists
        const hasFontWeight = secondArg.properties.some(
          (prop) =>
            prop.type === "Property" &&
            prop.key.type === "Identifier" &&
            prop.key.name === "fontWeight"
        );

        if (!hasFontWeight) {
          context.report({
            node: secondArg,
            messageId: "missingFontWeight",
          });
        }
      },
    };
  },
};

export default {
  rules: {
    "require-font-weight": requireFontWeightRule,
  },
};
