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
  CheckboxRow,
  FormField,
  LogoMark,
  PrimaryButton,
} from "@/components/auth";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { MaxContentWidth, Spacing } from "@/constants/theme";
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
              <LogoMark compact />
              <View style={styles.headingGroup}>
                <ThemedText type="subtitle">Inscription</ThemedText>
                <ThemedText
                  themeColor="textSecondary"
                  style={{ textAlign: "center" }}
                >
                  Créez votre compte pour accéder au portail technique
                </ThemedText>
              </View>
            </View>

            {/* Form */}
            <ThemedView type="backgroundElement" style={styles.formCard}>
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

            {/* Login link */}
            <View style={styles.footer}>
              <ThemedText themeColor="textSecondary">
                Déjà un compte ?
              </ThemedText>
              <Pressable
                onPress={() => router.back()}
                hitSlop={8}
                style={({ pressed }) => pressed && styles.pressed}
              >
                <ThemedText type="linkPrimary" style={styles.loginLink}>
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
    gap: Spacing.three,
    marginBottom: Spacing.four,
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
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.one,
    marginTop: Spacing.five,
  },
  loginLink: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
  },
  pressed: {
    opacity: 0.7,
  },
});
