import { Ionicons } from "@expo/vector-icons";
import { memo, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  TextInput,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";
import { findSelectionByMaterialOptionId } from "@/queries/technical-sheets";
import type {
  OuvrageCategory,
  TechnicalSelection,
} from "@/types/technical-sheet";

const INDENT_PER_DEPTH = 18;

type CategoryAccordionProps = {
  category: OuvrageCategory;
  depth: number;
  selections: TechnicalSelection[];
  isToggling: boolean;
  /** Libellé du champ note ("Observation" ou "Localisation"). */
  noteLabel: string;
  /** Placeholder du champ note, adapté à la fiche active. */
  notePlaceholder: string;
  onToggle: (materialOptionId: string, checked: boolean) => void;
  onSaveNote: (selectionId: string, note: string | null) => void;
};

/**
 * Catégorie du catalogue, dépliable/repliable, affichant récursivement
 * ses sous-catégories PUIS ses matériaux directs avec une case à cocher
 * (calqué sur ZoneNode pour l'arbre des zones).
 */
export const CategoryAccordion = memo(function CategoryAccordion({
  category,
  depth,
  selections,
  isToggling,
  noteLabel,
  notePlaceholder,
  onToggle,
  onSaveNote,
}: CategoryAccordionProps) {
  const theme = useTheme();
  const hasChildren = category.children.length > 0;
  const hasMaterials = category.materialOptions.length > 0;
  const [expanded, setExpanded] = useState(depth === 0);

  return (
    <View>
      <Pressable
        onPress={() => setExpanded((prev) => !prev)}
        className="flex-row items-center gap-one py-two pr-two"
        style={{ paddingLeft: depth * INDENT_PER_DEPTH }}
      >
        <View className="w-four items-center justify-center">
          <Ionicons
            name={expanded ? "chevron-down" : "chevron-forward"}
            color={theme.textSecondary}
            size={14}
          />
        </View>

        <ThemedText
          type="smallBold"
          numberOfLines={1}
          className="flex-1"
          themeColor={hasChildren || hasMaterials ? "text" : "textSecondary"}
        >
          {category.name}
        </ThemedText>
      </Pressable>

      {expanded && (
        <View>
          {category.children.map((child) => (
            <CategoryAccordion
              key={child.id}
              category={child}
              depth={depth + 1}
              selections={selections}
              isToggling={isToggling}
              noteLabel={noteLabel}
              notePlaceholder={notePlaceholder}
              onToggle={onToggle}
              onSaveNote={onSaveNote}
            />
          ))}

          {category.materialOptions.map((option) => {
            const selection = findSelectionByMaterialOptionId(
              selections,
              option.id,
            );
            return (
              <MaterialRow
                key={option.id}
                optionId={option.id}
                optionName={option.name}
                depth={depth + 1}
                selection={selection}
                isToggling={isToggling}
                noteLabel={noteLabel}
                notePlaceholder={notePlaceholder}
                onToggle={onToggle}
                onSaveNote={onSaveNote}
              />
            );
          })}
        </View>
      )}
    </View>
  );
});

type MaterialRowProps = {
  optionId: string;
  optionName: string;
  depth: number;
  selection?: TechnicalSelection;
  isToggling: boolean;
  noteLabel: string;
  notePlaceholder: string;
  onToggle: (materialOptionId: string, checked: boolean) => void;
  onSaveNote: (selectionId: string, note: string | null) => void;
};

/** Matériau direct d'une catégorie : case à cocher + note si cochée. */
const MaterialRow = memo(function MaterialRow({
  optionId,
  optionName,
  depth,
  selection,
  isToggling,
  noteLabel,
  notePlaceholder,
  onToggle,
  onSaveNote,
}: MaterialRowProps) {
  const theme = useTheme();
  const isChecked = !!selection;
  const [noteDraft, setNoteDraft] = useState(selection?.note ?? "");
  const lastSavedNote = useRef(selection?.note ?? "");

  // Resynchronisation après invalidation du cache (ex: toggle en cours),
  // sans écraser ce que l'utilisateur est en train de taper.
  useEffect(() => {
    if (!selection) {
      lastSavedNote.current = "";
      setNoteDraft("");
      return;
    }
    if (selection.note !== lastSavedNote.current) {
      lastSavedNote.current = selection.note ?? "";
      setNoteDraft(selection.note ?? "");
    }
  }, [selection]);

  const handleBlur = () => {
    if (!selection) return;
    const trimmed = noteDraft.trim();
    const saved = selection.note ?? "";
    if (trimmed === saved) return;
    lastSavedNote.current = trimmed || "";
    // Champ vidé → on efface la note côté backend (null).
    onSaveNote(selection.id, trimmed || null);
  };

  return (
    <View
      style={{ paddingLeft: depth * INDENT_PER_DEPTH }}
      className="pr-two"
    >
      <Pressable
        onPress={() => onToggle(optionId, isChecked)}
        disabled={isToggling}
        className="flex-row items-center gap-two py-two"
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isChecked }}
      >
        <View
          className={[
            "h-5 w-5 items-center justify-center rounded-[5px] border-[1.5px]",
            isChecked
              ? "border-accent bg-accent"
              : "border-border dark:border-border-dark bg-transparent",
          ].join(" ")}
        >
          {isChecked && (
            <Ionicons name="checkmark" color={theme.background} size={14} />
          )}
        </View>

        <ThemedText
          type="small"
          numberOfLines={2}
          themeColor={isChecked ? "text" : "textSecondary"}
          className="flex-1"
        >
          {optionName}
        </ThemedText>

        {isToggling && isChecked && (
          <ActivityIndicator size="small" color={theme.accent} />
        )}
      </Pressable>

      {isChecked && selection && (
        <View
          className="ml-six rounded-two border border-border bg-background-element px-two py-half dark:border-border-dark dark:bg-background-element-dark"
          style={{ marginLeft: depth * INDENT_PER_DEPTH + 28 }}
        >
          <ThemedText
            type="eyebrow"
            themeColor="accent"
            className="mt-half"
          >
            {noteLabel}
          </ThemedText>
          <TextInput
            className="min-h-[32px] text-sm leading-5 text-text dark:text-text-dark"
            placeholder={notePlaceholder}
            placeholderTextColor={theme.textSecondary}
            value={noteDraft}
            onChangeText={setNoteDraft}
            onBlur={handleBlur}
            onEndEditing={handleBlur}
            multiline
            maxLength={2000}
            returnKeyType="done"
            blurOnSubmit
          />
        </View>
      )}
    </View>
  );
});
