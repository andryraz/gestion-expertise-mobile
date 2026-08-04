import { router } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  AuthFooter,
  FormField,
  LogoMark,
  PrimaryButton,
} from "@/components/auth";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { MaxContentWidth, Spacing } from "@/constants/theme";
import { useAuth } from "@/context/auth-context";
import { ApiError } from "@/services/api-client";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await login(email, password);
      router.replace("/(tabs)/dashboard" as any);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Impossible de se connecter",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = email.trim().length > 0 && password.trim().length > 0;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.headerSection}>
              <LogoMark />
              <View style={styles.headingGroup}>
                <ThemedText type="subtitle" style={{ textAlign: "center" }}>
                  Connexion
                </ThemedText>
                <ThemedText themeColor="textSecondary">
                  Accès réservé aux experts agréés
                </ThemedText>
              </View>
            </View>

            {/* Form */}
            <ThemedView type="backgroundElement" style={styles.formCard}>
              <FormField
                label="Adresse e-mail"
                icon="envelope.fill"
                placeholder="expert@cabinet.mg"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <FormField
                label="Mot de passe"
                icon="lock.fill"
                secureToggle
                placeholder="Votre mot de passe"
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
                rightElement={
                  <Pressable hitSlop={8}>
                    {/* <ThemedText type="link" themeColor="textSecondary">
                      Mot de passe oublié ?
                    </ThemedText> */}
                  </Pressable>
                }
              />
              <PrimaryButton
                label="Se connecter"
                loadingLabel="Connexion..."
                onPress={handleLogin}
                disabled={!isFormValid}
                loading={isLoading}
                icon="arrow.right"
              />
            </ThemedView>

            <View style={styles.footer}>
              <ThemedText themeColor="textSecondary">
                Pas encore de compte ?
              </ThemedText>
              <Pressable
                onPress={() => router.push("/register" as any)}
                hitSlop={8}
                style={({ pressed }) => pressed && styles.pressed}
              >
                <ThemedText type="linkPrimary" style={styles.registerLink}>
                  S'inscrire
                </ThemedText>
              </Pressable>
            </View>

            <AuthFooter
              line1="Expertise Mobile · v1.0.0"
              line2="Bâtiment & Travaux Publics"
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.six,
    justifyContent: "center",
    alignSelf: "center",
    width: "100%",
    maxWidth: MaxContentWidth,
  },
  headerSection: {
    gap: Spacing.four,
    marginBottom: Spacing.five,
  },
  headingGroup: {
    gap: Spacing.one,
    alignItems: "center",
  },
  formCard: {
    borderRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.one,
    marginTop: Spacing.five,
  },
  registerLink: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
  },
  pressed: {
    opacity: 0.7,
  },
});
