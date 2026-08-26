import { Ionicons } from "@expo/vector-icons";
import { useRef } from "react";
import { ScrollView, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import {
  STATUS_INDEX,
  STATUS_LABELS,
  STATUS_TONE,
} from "@/constants/mission-labels";
import { useTheme } from "@/hooks/use-theme";
import type { MissionStatus } from "@/types/mission";

const TONE_TEXT = {
  muted: "textSecondary",
  accent: "textSecondary",
  success: "success",
  danger: "danger",
} as const;

type NodeKind = "main" | "branch-accept" | "branch-refuse";

type TimelineNode = {
  status: MissionStatus;
  kind: NodeKind;
  label: string;
};

const TIMELINE_NODES: TimelineNode[] = [
  { status: "BROUILLON", kind: "main", label: STATUS_LABELS.BROUILLON },
  {
    status: "PRISE_DE_CONTACT",
    kind: "main",
    label: STATUS_LABELS.PRISE_DE_CONTACT,
  },
  {
    status: "DEVIS_EN_PREPARATION",
    kind: "main",
    label: STATUS_LABELS.DEVIS_EN_PREPARATION,
  },
  { status: "DEVIS_ENVOYE", kind: "main", label: STATUS_LABELS.DEVIS_ENVOYE },
  { status: "ACCEPTEE", kind: "branch-accept", label: STATUS_LABELS.ACCEPTEE },
  { status: "REFUSEE", kind: "branch-refuse", label: STATUS_LABELS.REFUSEE },
  { status: "EN_COURS", kind: "main", label: STATUS_LABELS.EN_COURS },
  { status: "TERMINEE", kind: "main", label: STATUS_LABELS.TERMINEE },
  { status: "ENVOYEE", kind: "main", label: STATUS_LABELS.ENVOYEE },
];

function dotState(
  node: TimelineNode,
  current: MissionStatus,
  isArchived: boolean,
): "past" | "current" | "future" {
  if (isArchived) return "past";
  const ci = STATUS_INDEX[current];
  const ni = STATUS_INDEX[node.status];
  if (ni < ci) return "past";
  if (ni === ci) return "current";
  return "future";
}

function TimelineDot({
  node,
  current,
  isArchived,
}: {
  node: TimelineNode;
  current: MissionStatus;
  isArchived: boolean;
}) {
  const theme = useTheme();
  const state = dotState(node, current, isArchived);
  const tone = STATUS_TONE[node.status];

  const ringColor =
    state === "future"
      ? theme.border
      : state === "current"
        ? theme.accent
        : tone === "muted"
          ? theme.border
          : tone === "accent"
            ? theme.accent
            : tone === "success"
              ? theme.success
              : theme.danger;

  const fillColor =
    state === "future"
      ? theme.backgroundElement
      : state === "past" || state === "current"
        ? ringColor
        : theme.backgroundElement;

  const iconColor =
    state === "future"
      ? theme.border
      : state === "current" || state === "past"
        ? theme.background
        : theme.textSecondary;

  const iconName =
    state === "past"
      ? "checkmark"
      : node.status === "REFUSEE" && state !== "future"
        ? "close"
        : "ellipse";

  const labelColor =
    state === "future"
      ? "textSecondary"
      : state === "current"
        ? ("accent" as const)
        : (TONE_TEXT[tone] as any);

  return (
    <View className="items-center" style={{ width: 72 }}>
      <View
        className="h-[32px] w-[32px] items-center justify-center rounded-full border-2"
        style={{ borderColor: ringColor, backgroundColor: fillColor }}
      >
        {state === "past" || (state === "current" && iconName === "close") ? (
          <Ionicons name={iconName as any} color={iconColor} size={15} />
        ) : state === "current" ? (
          <View className="h-3 w-3 rounded-full bg-background" />
        ) : null}
      </View>
      <ThemedText
        type="small"
        themeColor={labelColor}
        className="mt-1 text-center"
        numberOfLines={2}
        style={{ fontSize: 11, lineHeight: 14 }}
      >
        {node.label}
      </ThemedText>
    </View>
  );
}

function Connector({
  fromNode,
  toNode,
  current,
  isArchived,
}: {
  fromNode: TimelineNode;
  toNode: TimelineNode;
  current: MissionStatus;
  isArchived: boolean;
}) {
  const theme = useTheme();
  const fromState = dotState(fromNode, current, isArchived);
  const isActive = fromState === "past" || fromState === "current";

  return (
    <View
      className="self-center"
      style={{
        width: 24,
        height: 2,
        backgroundColor: isActive ? theme.accent : theme.border,
        opacity: fromState === "future" ? 0.4 : 1,
      }}
    />
  );
}

type BranchState = "pending" | "accepted" | "refused";

function getBranchState(currentStatus: MissionStatus): BranchState {
  if (currentStatus === "REFUSEE") return "refused";
  if (currentStatus === "DEVIS_ENVOYE") return "pending";
  return "accepted";
}

type StatusTimelineProps = {
  currentStatus: MissionStatus;
  isArchived?: boolean;
};

export function StatusTimeline({
  currentStatus,
  isArchived = false,
}: StatusTimelineProps) {
  const theme = useTheme();
  const scrollRef = useRef<ScrollView>(null);

  const mainNodes = TIMELINE_NODES.filter((n) => n.kind === "main");
  const showBranch =
    STATUS_INDEX[currentStatus] >= STATUS_INDEX["DEVIS_ENVOYE"];
  const branchState = getBranchState(currentStatus);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="pt-one px-four"
    >
      <View style={{ alignItems: "center" }}>
        <View className="flex-row items-start">
          {mainNodes.map((node, i) => {
            const nextMain = mainNodes[i + 1];
            return (
              <View key={node.status} className="flex-row items-start">
                <TimelineDot
                  node={node}
                  current={currentStatus}
                  isArchived={isArchived}
                />
                {nextMain && (
                  <Connector
                    fromNode={node}
                    toNode={nextMain}
                    current={currentStatus}
                    isArchived={isArchived}
                  />
                )}
              </View>
            );
          })}
        </View>

        {showBranch && (
          <View
            className="flex-row items-center mt-one"
            style={{ marginLeft: 72 * 3 + 24 * 3 + 16 }}
          >
            <View className="items-center" style={{ width: 72 }}>
              <View
                className="h-[32px] w-[32px] items-center justify-center rounded-full border-2"
                style={{
                  borderColor:
                    branchState === "accepted" ? theme.success : theme.border,
                  backgroundColor:
                    branchState === "accepted"
                      ? theme.success
                      : theme.backgroundElement,
                }}
              >
                {branchState === "accepted" && (
                  <Ionicons
                    name="checkmark"
                    color={theme.background}
                    size={15}
                  />
                )}
              </View>
              <ThemedText
                type="small"
                themeColor={
                  branchState === "accepted" ? "success" : "textSecondary"
                }
                className="mt-1 text-center"
                style={{ fontSize: 11, lineHeight: 14, height: 28 }}
              >
                {STATUS_LABELS.ACCEPTEE}
              </ThemedText>
            </View>

            <View style={{ width: 14 }} />

            <View className="items-center" style={{ width: 72 }}>
              <View
                className="h-[32px] w-[32px] items-center justify-center rounded-full border-2"
                style={{
                  borderColor:
                    branchState === "refused" ? theme.danger : theme.border,
                  backgroundColor:
                    branchState === "refused"
                      ? theme.danger
                      : theme.backgroundElement,
                }}
              >
                {branchState === "refused" && (
                  <Ionicons name="close" color={theme.background} size={15} />
                )}
              </View>
              <ThemedText
                type="small"
                themeColor={
                  branchState === "refused" ? "danger" : "textSecondary"
                }
                className="mt-1 text-center"
                style={{ fontSize: 11, lineHeight: 14 }}
              >
                {STATUS_LABELS.REFUSEE}
              </ThemedText>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
