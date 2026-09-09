import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  TextInput,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { DISORDER_CATEGORY_LABELS } from "@/constants/observation-labels";
import { useTheme } from "@/hooks/use-theme";
import {
  useCreateDisorderType,
  useDisorderTypes,
} from "@/queries/disorder-types";
import { ApiError } from "@/services/api-client";
import type { DisorderType, DisorderTypeCategory } from "@/types/disorder-type";
import { logger } from "@/utils/logger";

const SEARCH_DEBOUNCE_MS = 400;

const CATEGORY_OPTIONS = Object.keys(
  DISORDER_CATEGORY_LABELS,
) as DisorderTypeCategory[];

type DisorderTypeSelectProps = {
  value: DisorderType | null;
  onChange: (type: DisorderType) => void;
};

export function DisorderTypeSelect({
  value,
  onChange,
}: DisorderTypeSelectProps) {
  const theme = useTheme();

  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedSearch(searchText.trim()),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(timer);
  }, [searchText]);

  const {
    data: results = [],
    isLoading,
    error,
  } = useDisorderTypes(debouncedSearch || undefined);
  const createMutation = useCreateDisorderType();

  const trimmedSearch = debouncedSearch;
  const exactMatch = results.some(
    (type) => type.name.toLowerCase() === trimmedSearch.toLowerCase(),
  );
  const showCreateOption =
    trimmedSearch.length > 0 && !isLoading && !exactMatch;

  const handleCreate = async (category: DisorderTypeCategory) => {
    try {
      const created = await createMutation.mutateAsync({
        name: trimmedSearch,
        category,
      });
      logger.info("Observations", "Type de désordre créé", {
        id: created.id,
        name: created.name,
        category: created.category,
      });
      setCategoryModalVisible(false);
      onChange(created);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Impossible de créer le type";
      Alert.alert("Erreur", message);
      logger.error("Observations", "Échec création type de désordre", {
        name: trimmedSearch,
        message,
      });
    }
  };

  const selectedInView = value && results.some((type) => type.id === value.id);

  const renderItem = ({ item }: { item: DisorderType }) => {
    const isSelected = value?.id === item.id;
    return (
      <Pressable
        onPress={() => onChange(item)}
        className={[
          "flex-row items-center gap-two rounded-three border px-three py-two mb-two",
          isSelected
            ? "border-accent bg-background-selected dark:bg-background-selected-dark"
            : "border-border dark:border-border-dark bg-background-element dark:bg-background-element-dark",
        ].join(" ")}
      >
        <View className="flex-1 gap-half">
          <ThemedText type="smallBold" numberOfLines={1}>
            {item.name}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {DISORDER_CATEGORY_LABELS[item.category]}
          </ThemedText>
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" color={theme.accent} size={18} />
        )}
      </Pressable>
    );
  };

  return (
    <View>
      {value && !selectedInView && (
        <ThemedView
          type="backgroundElement"
          className="flex-row items-center gap-two rounded-three border border-accent px-three py-two mb-two"
        >
          <Ionicons name="checkmark-circle" color={theme.accent} size={16} />
          <View className="flex-1 gap-half">
            <ThemedText type="smallBold" numberOfLines={1}>
              {value.name}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {DISORDER_CATEGORY_LABELS[value.category]}
            </ThemedText>
          </View>
        </ThemedView>
      )}

      <TextInput
        value={searchText}
        onChangeText={setSearchText}
        placeholder="Rechercher un type de désordre..."
        placeholderTextColor={theme.textSecondary}
        className="rounded-three border border-border dark:border-border-dark bg-background-element dark:bg-background-element-dark text-text dark:text-text-dark px-three py-three text-base font-medium mb-two"
        autoCapitalize="none"
      />

      {isLoading && (
        <View className="py-three items-center">
          <ActivityIndicator color={theme.textSecondary} size="small" />
        </View>
      )}

      {error && !isLoading && (
        <ThemedText themeColor="danger" type="small" className="py-two">
          {error instanceof ApiError
            ? error.message
            : "Impossible de charger les types de désordres"}
        </ThemedText>
      )}

      {!isLoading && !error && (
        <FlatList
          data={results}
          keyExtractor={(type) => type.id}
          renderItem={renderItem}
          scrollEnabled={false}
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <ThemedText
              type="small"
              themeColor="textSecondary"
              className="py-one"
            >
              {trimmedSearch
                ? "Aucun type de désordre ne correspond à cette recherche"
                : "Aucun type de désordre disponible"}
            </ThemedText>
          }
          ListFooterComponent={
            showCreateOption ? (
              <Pressable
                onPress={() => setCategoryModalVisible(true)}
                className="flex-row items-center gap-two rounded-three border border-dashed border-accent px-three py-two active:opacity-80"
              >
                <Ionicons
                  name="add-circle-outline"
                  color={theme.accent}
                  size={18}
                />
                <View className="flex-1">
                  <ThemedText type="smallBold" themeColor="accent">
                    Créer « {trimmedSearch} »
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    Nouveau type de désordre
                  </ThemedText>
                </View>
              </Pressable>
            ) : null
          }
        />
      )}

      <Modal
        visible={categoryModalVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <Pressable
          className="flex-1 items-center justify-center bg-black/50 px-six"
          onPress={() => setCategoryModalVisible(false)}
        >
          <Pressable
            className="w-full rounded-three border border-border dark:border-border-dark bg-background dark:bg-background-dark px-three py-three"
            onPress={() => {}}
          >
            <ThemedText type="smallBold" className="text-lg mb-one">
              Catégorie du désordre
            </ThemedText>
            <ThemedText
              type="small"
              themeColor="textSecondary"
              className="mb-two"
            >
              Pour « {trimmedSearch} »
            </ThemedText>

            {CATEGORY_OPTIONS.map((category) => (
              <Pressable
                key={category}
                onPress={() => handleCreate(category)}
                disabled={createMutation.isPending}
                className="flex-row items-center gap-two rounded-two px-three py-two active:opacity-70 mb-one bg-background-element dark:bg-background-element-dark"
              >
                {createMutation.isPending ? (
                  <ActivityIndicator size="small" color={theme.accent} />
                ) : (
                  <Ionicons
                    name="folder-outline"
                    color={theme.textSecondary}
                    size={16}
                  />
                )}
                <ThemedText type="smallBold" className="flex-1">
                  {DISORDER_CATEGORY_LABELS[category]}
                </ThemedText>
                <Ionicons
                  name="chevron-forward"
                  color={theme.textSecondary}
                  size={14}
                />
              </Pressable>
            ))}

            <Pressable
              onPress={() => setCategoryModalVisible(false)}
              className="items-center py-two"
              disabled={createMutation.isPending}
            >
              <ThemedText type="smallBold" themeColor="textSecondary">
                Annuler
              </ThemedText>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
