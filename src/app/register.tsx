import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function RegisterScreen() {
  const theme = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = () => {
    setIsLoading(true);
    // Simulate registration (no backend yet)
    setTimeout(() => {
      setIsLoading(false);
    }, 1500);
  };

  const isFormValid =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    password.trim().length > 0 &&
    confirmPassword.trim().length > 0 &&
    password === confirmPassword;

  const passwordsMatch = password === confirmPassword || confirmPassword.length === 0;

  const getPasswordValidationColor = () => {
    if (confirmPassword.length === 0) return undefined;
    return passwordsMatch ? '#34C759' : '#FF3B30';
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {/* Header */}
            <ThemedView style={styles.headerSection}>
              <View style={[styles.logoContainer, { backgroundColor: theme.backgroundElement }]}>
                <SymbolView
                  tintColor={theme.text}
                  name={{ ios: 'person.badge.plus.fill', web: 'person.badge.plus.fill' } as any}
                  size={36}
                  weight="bold"
                />
              </View>
              <ThemedText type="title" style={styles.title}>
                Créer un compte
              </ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.subtitle}>
                Rejoignez-nous en créant votre profil
              </ThemedText>
            </ThemedView>

            {/* Form */}
            <ThemedView type="backgroundElement" style={styles.formCard}>
              {/* Full Name */}
              <ThemedView style={styles.inputGroup}>
                <ThemedText type="smallBold" style={styles.label}>
                  Nom complet
                </ThemedText>
                <View
                  style={[
                    styles.inputWrapper,
                    { borderColor: theme.backgroundSelected, backgroundColor: theme.background },
                  ]}>
                  <SymbolView
                    tintColor={theme.textSecondary}
                    name={{ ios: 'person.fill', web: 'person.fill' } as any}
                    size={16}
                  />
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder="Jean Dupont"
                    placeholderTextColor={theme.textSecondary}
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </View>
              </ThemedView>

              {/* Email */}
              <ThemedView style={styles.inputGroup}>
                <ThemedText type="smallBold" style={styles.label}>
                  Email
                </ThemedText>
                <View
                  style={[
                    styles.inputWrapper,
                    { borderColor: theme.backgroundSelected, backgroundColor: theme.background },
                  ]}>
                  <SymbolView
                    tintColor={theme.textSecondary}
                    name={{ ios: 'envelope.fill', web: 'envelope.fill' } as any}
                    size={16}
                  />
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder="exemple@email.com"
                    placeholderTextColor={theme.textSecondary}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </ThemedView>

              {/* Password */}
              <ThemedView style={styles.inputGroup}>
                <ThemedText type="smallBold" style={styles.label}>
                  Mot de passe
                </ThemedText>
                <View
                  style={[
                    styles.inputWrapper,
                    { borderColor: theme.backgroundSelected, backgroundColor: theme.background },
                  ]}>
                  <SymbolView
                    tintColor={theme.textSecondary}
                    name={{ ios: 'lock.fill', web: 'lock.fill' } as any}
                    size={16}
                  />
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder="Minimum 8 caractères"
                    placeholderTextColor={theme.textSecondary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <Pressable
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                    hitSlop={8}>
                    <SymbolView
                      tintColor={theme.textSecondary}
                      name={{
                        ios: showPassword ? 'eye.slash.fill' : 'eye.fill',
                        web: showPassword ? 'eye.slash.fill' : 'eye.fill',
                      } as any}
                      size={16}
                    />
                  </Pressable>
                </View>
              </ThemedView>

              {/* Confirm Password */}
              <ThemedView style={styles.inputGroup}>
                <ThemedText type="smallBold" style={styles.label}>
                  Confirmer le mot de passe
                </ThemedText>
                <View
                  style={[
                    styles.inputWrapper,
                    {
                      borderColor: getPasswordValidationColor() ?? theme.backgroundSelected,
                      backgroundColor: theme.background,
                    },
                  ]}>
                  <SymbolView
                    tintColor={getPasswordValidationColor() ?? theme.textSecondary}
                    name={{
                      ios: passwordsMatch && confirmPassword.length > 0
                        ? 'checkmark.circle.fill'
                        : 'lock.fill',
                      web: passwordsMatch && confirmPassword.length > 0
                        ? 'checkmark.circle.fill'
                        : 'lock.fill',
                    } as any}
                    size={16}
                  />
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder="Répétez le mot de passe"
                    placeholderTextColor={theme.textSecondary}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                  />
                  <Pressable
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeButton}
                    hitSlop={8}>
                    <SymbolView
                      tintColor={theme.textSecondary}
                      name={{
                        ios: showConfirmPassword ? 'eye.slash.fill' : 'eye.fill',
                        web: showConfirmPassword ? 'eye.slash.fill' : 'eye.fill',
                      } as any}
                      size={16}
                    />
                  </Pressable>
                </View>
                {!passwordsMatch && confirmPassword.length > 0 && (
                  <ThemedText
                    style={{ color: '#FF3B30', fontSize: 12, marginTop: 4 }}>
                    Les mots de passe ne correspondent pas
                  </ThemedText>
                )}
              </ThemedView>

              {/* Register button */}
              <Pressable
                onPress={handleRegister}
                disabled={!isFormValid || isLoading}
                style={({ pressed }) => [
                  styles.registerButton,
                  {
                    backgroundColor: isFormValid ? theme.text : theme.backgroundSelected,
                    opacity: pressed && isFormValid ? 0.85 : 1,
                  },
                ]}>
                <ThemedText
                  style={[
                    styles.registerButtonText,
                    { color: isFormValid ? theme.background : theme.textSecondary },
                  ]}>
                  {isLoading ? 'Inscription...' : "S'inscrire"}
                </ThemedText>
              </Pressable>
            </ThemedView>

            {/* Login link */}
            <ThemedView style={styles.footer}>
              <ThemedText themeColor="textSecondary">Déjà un compte ?</ThemedText>
              <Pressable
                onPress={() => router.back()}
                hitSlop={8}
                style={({ pressed }) => pressed && styles.pressed}>
                <ThemedText
                  type="linkPrimary"
                  style={styles.loginLink}>
                  Se connecter
                </ThemedText>
              </Pressable>
            </ThemedView>
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
    justifyContent: 'center',
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  headerSection: {
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.five,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
  },
  formCard: {
    borderRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  inputGroup: {
    gap: Spacing.one,
  },
  label: {
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Platform.OS === 'ios' ? Spacing.three : Spacing.two,
    borderRadius: Spacing.three,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    padding: 0,
  },
  eyeButton: {
    padding: Spacing.half,
  },
  registerButton: {
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.one,
  },
  registerButtonText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.one,
    marginTop: Spacing.five,
  },
  loginLink: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.7,
  },
});
