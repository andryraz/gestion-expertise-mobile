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
  CheckboxRow,
  FormField,
  LogoMark,
  PrimaryButton,
} from "@/components/auth";
import { ScreenFade } from "@/components/screen-fade";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/context/auth-context";
import { useTheme } from "@/hooks/use-theme";
import { ApiError } from "@/services/api-client";

export default function RegisterScreen() {
  const theme = useTheme();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await register(name, email, password, phone);
      router.replace("/(tabs)/dashboard" as any);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Impossible de créer le compte",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const passwordsMatch =
    password === confirmPassword || confirmPassword.length === 0;

  const isFormValid =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    phone.trim().length > 0 &&
    password.trim().length > 0 &&
    confirmPassword.trim().length > 0 &&
    password === confirmPassword &&
    acceptedTerms;

  const getPasswordValidationColor = () => {
    if (confirmPassword.length === 0) return undefined;
    return passwordsMatch ? theme.success : theme.danger;
  };

  return (
    <ThemedView className="flex-1">
      <SafeAreaView className="flex-1">
        <ScreenFade>
          <KeyboardAvoidingView
            className="flex-1"
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <ScrollView
              contentContainerClassName="grow justify-center self-center w-full max-w-content px-four pb-six"
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View className="mb-four gap-three">
                <LogoMark compact />
                <View className="items-center gap-one">
                  <ThemedText type="subtitle" themeColor="accent">
                    Inscription
                  </ThemedText>
                  <ThemedText
                    themeColor="textSecondary"
                    className="text-center"
                  >
                    Créez votre compte pour accéder au portail technique
                  </ThemedText>
                </View>
              </View>

              <ThemedView
                type="backgroundElement"
                className="gap-three rounded-four p-four"
              >
                <FormField
                  label="Nom complet"
                  icon="person.fill"
                  placeholder="Jean Dupont"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  autoCorrect={false}
                />

                <FormField
                  label="Adresse e-mail"
                  icon="envelope.fill"
                  placeholder="j.dupont@gmail.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <FormField
                  label="Numéro de téléphone"
                  icon="phone.fill"
                  placeholder="+261 34 00 000 00"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />

                <FormField
                  label="Mot de passe"
                  icon="lock.fill"
                  secureToggle
                  placeholder="Minimum 8 caractères"
                  value={password}
                  onChangeText={setPassword}
                  autoCapitalize="none"
                />

                <FormField
                  label="Confirmer le mot de passe"
                  icon={
                    passwordsMatch && confirmPassword.length > 0
                      ? "checkmark.circle.fill"
                      : "lock.fill"
                  }
                  iconColor={getPasswordValidationColor()}
                  borderColor={getPasswordValidationColor()}
                  secureToggle
                  placeholder="Répétez le mot de passe"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  autoCapitalize="none"
                  helperText={
                    !passwordsMatch && confirmPassword.length > 0
                      ? "Les mots de passe ne correspondent pas"
                      : undefined
                  }
                  helperColor={theme.danger}
                />

                <CheckboxRow
                  checked={acceptedTerms}
                  onToggle={() => setAcceptedTerms(!acceptedTerms)}
                >
                  En continuant, vous acceptez nos Conditions d'utilisation et
                  notre Politique de confidentialité.
                </CheckboxRow>

                <PrimaryButton
                  label="Créer mon compte"
                  loadingLabel="Inscription..."
                  onPress={handleRegister}
                  disabled={!isFormValid}
                  loading={isLoading}
                />
              </ThemedView>

              <View className="mt-five flex-row items-center justify-center gap-one">
                <ThemedText themeColor="textSecondary">
                  Déjà un compte ?
                </ThemedText>
                <Pressable
                  onPress={() => router.back()}
                  hitSlop={8}
                  style={({ pressed }) =>
                    pressed ? { opacity: 0.7 } : undefined
                  }
                >
                  <ThemedText
                    type="linkPrimary"
                    className="text-base leading-6 font-semibold"
                  >
                    Se connecter
                  </ThemedText>
                </Pressable>
              </View>

              <AuthFooter
                line1="Expertise Mobile · v1.0.0"
                line2="Bâtiment & Travaux Publics"
              />
            </ScrollView>
          </KeyboardAvoidingView>
        </ScreenFade>
      </SafeAreaView>
    </ThemedView>
  );
}
