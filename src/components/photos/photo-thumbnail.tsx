import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { ActivityIndicator, Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";
import { Photo } from "@/types/photo";
import { getPhotoUri, isPendingPhoto } from "@/utils/photo-source";

type PhotoThumbnailProps = {
  photo: Photo;
  size?: number;
  onPress?: (photo: Photo) => void;
};

export function PhotoThumbnail({
  photo,
  size = 96,
  onPress,
}: PhotoThumbnailProps) {
  const theme = useTheme();
  const pending = isPendingPhoto(photo);

  return (
    <Pressable
      onPress={() => onPress?.(photo)}
      disabled={!onPress}
      style={{ width: size, height: size }}
      className="rounded-two overflow-hidden bg-background-element dark:bg-background-element-dark active:opacity-80"
    >
      <Image
        source={{ uri: getPhotoUri(photo) }}
        style={{ width: "100%", height: "100%" }}
        contentFit="cover"
        transition={150}
        recyclingKey={photo.id}
      />
      {pending && (
        <View className="absolute inset-0 items-center justify-center bg-black/40">
          <ActivityIndicator color={theme.background} size="small" />
        </View>
      )}
    </Pressable>
  );
}

type PhotoGridProps = {
  photos: Photo[];
  size?: number;
  emptyLabel?: string;
  emptyIcon?: keyof typeof Ionicons.glyphMap;
  onPhotoPress?: (photo: Photo) => void;
  renderOverlay?: (photo: Photo) => React.ReactNode;
};

export function PhotoGrid({
  photos,
  size = 96,
  emptyLabel,
  emptyIcon = "images-outline",
  onPhotoPress,
  renderOverlay,
}: PhotoGridProps) {
  const theme = useTheme();

  if (photos.length === 0) {
    if (!emptyLabel) return null;
    return (
      <View className="items-center py-three">
        <Ionicons name={emptyIcon} color={theme.textSecondary} size={24} />
        <ThemedText type="small" themeColor="textSecondary" className="mt-one">
          {emptyLabel}
        </ThemedText>
      </View>
    );
  }

  return (
    <View className="flex-row flex-wrap gap-two">
      {photos.map((photo) => (
        <View key={photo.id}>
          <PhotoThumbnail photo={photo} size={size} onPress={onPhotoPress} />
          {renderOverlay?.(photo)}
        </View>
      ))}
    </View>
  );
}
