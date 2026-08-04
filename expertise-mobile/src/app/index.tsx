import { router } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
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
    <ThemedView className="flex-1">
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerClassName="grow justify-center self-center w-full max-w-content px-four pb-six"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View className="mb-five gap-four">
              <LogoMark />
              <View className="items-center gap-one">
                <ThemedText type="subtitle" className="text-center">
                  Connexion
                </ThemedText>
                <ThemedText themeColor="textSecondary">
                  Accès réservé aux experts agréés
                </ThemedText>
              </View>
            </View>

            {/* Form */}
            <ThemedView type="backgroundElement" className="gap-three rounded-four p-four">
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

            <View className="mt-five flex-row items-center justify-center gap-one">
              <ThemedText themeColor="textSecondary">
                Pas encore de compte ?
              </ThemedText>
              <Pressable
                onPress={() => router.push("/register" as any)}
                hitSlop={8}
                style={({ pressed }) => (pressed ? { opacity: 0.7 } : undefined)}
              >
                <ThemedText type="linkPrimary" className="text-base leading-6 font-semibold">
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
