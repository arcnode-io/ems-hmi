/**
 * ConfirmationModal — two-step command confirmation. Required before any
 * hardware command dispatches (constitution Rule 3.1). Draggable by its
 * header on desktop so the operator can peek at the target behind it.
 *
 * The only SIM affordance here is the SIMULATED band (amendment locked
 * 2026-05-16) — the Send button never changes color or label in sim mode.
 *
 * See handoff/02-components/ConfirmationModal.md.
 */

import React, { useEffect, useRef } from "react";
import { Modal, View, Text, Animated, PanResponder } from "react-native";
import { useTheme } from "../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../theme/tokens";
import { SPACE, RADIUS } from "../../../theme/tokens/primitives";
import { useBreakpoint } from "../../../hooks/useBreakpoint";
import type { ConfirmationModalProps } from "./ConfirmationModal.types";
import { SimBand, TargetRow, ModalButton } from "./ConfirmationModal.parts";

const CARD_WIDTH = 360;

export function ConfirmationModal({
  visible,
  commandSummary,
  targetDevices,
  simMode = false,
  onConfirm,
  onCancel,
}: ConfirmationModalProps): React.ReactElement {
  const t = useTheme();
  const draggable = useBreakpoint().layout === "desktop";
  const pan = useRef(new Animated.ValueXY()).current;

  // Reset the drag offset each time the modal opens.
  useEffect(() => {
    if (visible) {
      pan.setValue({ x: 0, y: 0 });
      pan.setOffset({ x: 0, y: 0 });
    }
  }, [visible, pan]);

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: () => pan.extractOffset(),
    }),
  ).current;

  const dragHandlers = draggable ? responder.panHandlers : {};

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.55)",
          alignItems: "center",
          justifyContent: "center",
          padding: SPACE[4],
        }}
      >
        <Animated.View
          accessibilityViewIsModal
          dataSet={{ comp: "ConfirmationModal" }}
          style={{
            width: CARD_WIDTH,
            maxWidth: "100%",
            backgroundColor: t.surface,
            borderWidth: 1,
            borderColor: t.border,
            borderRadius: RADIUS[3],
            overflow: "hidden",
            transform: pan.getTranslateTransform(),
          }}
        >
          {simMode ? <SimBand /> : null}

          {/* Header — drag handle on desktop */}
          <View
            {...dragHandlers}
            style={{
              paddingVertical: SPACE[3],
              paddingHorizontal: SPACE[3],
              borderBottomWidth: 1,
              borderBottomColor: t.borderSoft,
            }}
          >
            <Text
              style={[
                resolveTypeStyle(t, "caption"),
                {
                  fontSize: 10,
                  letterSpacing: 0.2,
                  color: t.textSoft,
                  textTransform: "uppercase",
                },
              ]}
            >
              Confirm command
            </Text>
            <Text
              style={[
                resolveTypeStyle(t, "cardHeading"),
                {
                  color: t.text,
                  fontSize: 15,
                  fontWeight: "700",
                  marginTop: 2,
                },
              ]}
            >
              {commandSummary}
            </Text>
          </View>

          {/* Target panel */}
          <View style={{ padding: SPACE[3], gap: SPACE[2] }}>
            {targetDevices.map((d) => (
              <TargetRow key={d.id} target={d} />
            ))}
          </View>

          {/* Footer */}
          <View
            style={{
              flexDirection: "row",
              gap: SPACE[2],
              padding: SPACE[3],
              borderTopWidth: 1,
              borderTopColor: t.borderSoft,
            }}
          >
            <ModalButton
              label="Cancel"
              variant="ghost"
              action="cancel"
              onPress={onCancel}
            />
            <ModalButton
              label="Send"
              variant="accent"
              action="confirm"
              onPress={onConfirm}
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
