import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Droplets, KeyRound, Lock, Mail, ShieldCheck } from 'lucide-react-native';
import { router } from 'expo-router';
import { authFetch } from '../constants/api';

// ─── Etapas ──────────────────────────────────────────────────
// 1 → usuário digita o email
// 2 → usuário digita o código de 6 dígitos
// 3 → usuário digita a nova senha + confirmação

export default function ForgotPasswordScreen() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);

  // Campos
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Refs para foco automático nos inputs do código
  const codeRefs = useRef<(TextInput | null)[]>([]);

  // ─── Step 1: solicita o código ──────────────────────────────
  const handleSendCode = async () => {
    if (!email.trim()) {
      Alert.alert('Atenção', 'Digite seu email');
      return;
    }
    setLoading(true);
    try {
      const res = await authFetch('/auth/forgot-password', null, {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      // Sempre avança (backend não vaza se email existe)
      setStep(2);
    } catch {
      Alert.alert('Erro de conexão', 'Verifique sua internet e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 2: valida o código (avança localmente, validação real no step 3) ──
  const handleVerifyCode = () => {
    const fullCode = code.join('');
    if (fullCode.length < 6) {
      Alert.alert('Atenção', 'Digite os 6 dígitos do código');
      return;
    }
    setStep(3);
  };

  // ─── Step 3: redefine a senha ───────────────────────────────
  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Atenção', 'Preencha todos os campos');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Atenção', 'A senha deve ter pelo menos 6 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem');
      return;
    }

    setLoading(true);
    try {
      const res = await authFetch('/auth/reset-password', null, {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: code.join(''),
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        Alert.alert('Erro', data.message || 'Código inválido ou expirado');
        // Volta para o step do código para o usuário tentar novamente
        setStep(2);
        return;
      }

      Alert.alert('Senha redefinida!', 'Sua senha foi alterada com sucesso.', [
        { text: 'Fazer login', onPress: () => router.replace('/login') },
      ]);
    } catch {
      Alert.alert('Erro de conexão', 'Verifique sua internet e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Handler dos inputs do código ──────────────────────────
  const handleCodeChange = (value: string, index: number) => {
    const digit = value.replace(/[^0-9]/g, '').slice(-1);
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);
    // Avança para o próximo campo automaticamente
    if (digit && index < 5) {
      codeRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      codeRefs.current[index - 1]?.focus();
    }
  };

  // ─── Rótulos de cada step ───────────────────────────────────
  const stepLabels = ['Email', 'Código', 'Nova senha'];

  return (
    <LinearGradient
      colors={['#0D47A1', '#1565C0', '#1E88E5', '#64B5F6']}
      style={styles.gradient}
    >
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => (step === 1 ? router.back() : setStep((s) => (s - 1) as 1 | 2 | 3))}
              style={styles.backBtn}
            >
              <ChevronLeft color="#fff" size={22} />
            </TouchableOpacity>
            <View style={styles.logoRow}>
              <View style={styles.logoCircle}>
                <Droplets color="#1565C0" size={28} />
              </View>
              <Text style={styles.appName}>HydroTrack</Text>
            </View>
            <Text style={styles.subtitle}>Redefinir senha</Text>
          </View>

          {/* Step Indicator */}
          <View style={styles.stepRow}>
            {stepLabels.map((label, i) => {
              const stepNum = (i + 1) as 1 | 2 | 3;
              const isActive = step >= stepNum;
              const isCurrent = step === stepNum;
              return (
                <React.Fragment key={label}>
                  <View style={styles.stepItem}>
                    <View style={[styles.stepDot, isActive && styles.stepDotActive]}>
                      <Text style={[styles.stepDotText, !isActive && styles.stepDotTextInactive]}>
                        {stepNum}
                      </Text>
                    </View>
                    <Text style={[styles.stepLabel, !isCurrent && !isActive && styles.stepLabelInactive]}>
                      {label}
                    </Text>
                  </View>
                  {i < 2 && (
                    <View style={[styles.stepLine, step > stepNum && styles.stepLineActive]} />
                  )}
                </React.Fragment>
              );
            })}
          </View>

          {/* ── STEP 1: Email ── */}
          {step === 1 && (
            <View style={styles.card}>
              <View style={styles.cardIconWrap}>
                <Mail color="#1565C0" size={28} />
              </View>
              <Text style={styles.cardTitle}>Informe seu email</Text>
              <Text style={styles.cardHint}>
                Enviaremos um código de 6 dígitos para você redefinir sua senha.
              </Text>

              <View style={styles.inputWrap}>
                <Mail color="#90CAF9" size={16} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Digite seu email"
                  placeholderTextColor="#90CAF9"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoFocus
                />
              </View>

              <TouchableOpacity
                style={styles.btnPrimary}
                onPress={handleSendCode}
                activeOpacity={0.85}
                disabled={loading}
              >
                <LinearGradient colors={['#1565C0', '#0D47A1']} style={styles.btnGrad}>
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.btnText}>Enviar código →</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* ── STEP 2: Código ── */}
          {step === 2 && (
            <View style={styles.card}>
              <View style={styles.cardIconWrap}>
                <ShieldCheck color="#1565C0" size={28} />
              </View>
              <Text style={styles.cardTitle}>Digite o código</Text>
              <Text style={styles.cardHint}>
                Enviamos um código de 6 dígitos para{'\n'}
                <Text style={styles.emailHighlight}>{email}</Text>
              </Text>

              {/* Inputs individuais do código */}
              <View style={styles.codeRow}>
                {code.map((digit, i) => (
                  <TextInput
                    key={i}
                    ref={(ref) => { codeRefs.current[i] = ref; }}
                    style={[styles.codeInput, digit ? styles.codeInputFilled : null]}
                    value={digit}
                    onChangeText={(v) => handleCodeChange(v, i)}
                    onKeyPress={({ nativeEvent }) => handleCodeKeyPress(nativeEvent.key, i)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                    autoFocus={i === 0}
                  />
                ))}
              </View>

              <TouchableOpacity
                style={styles.btnPrimary}
                onPress={handleVerifyCode}
                activeOpacity={0.85}
              >
                <LinearGradient colors={['#1565C0', '#0D47A1']} style={styles.btnGrad}>
                  <Text style={styles.btnText}>Verificar código →</Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Reenviar código */}
              <TouchableOpacity
                style={styles.resendBtn}
                onPress={handleSendCode}
                activeOpacity={0.7}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#90CAF9" size="small" />
                ) : (
                  <Text style={styles.resendText}>Reenviar código</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* ── STEP 3: Nova senha ── */}
          {step === 3 && (
            <View style={styles.card}>
              <View style={styles.cardIconWrap}>
                <KeyRound color="#1565C0" size={28} />
              </View>
              <Text style={styles.cardTitle}>Nova senha</Text>
              <Text style={styles.cardHint}>
                Escolha uma senha segura com pelo menos 6 caracteres.
              </Text>

              <View style={styles.inputWrap}>
                <Lock color="#90CAF9" size={16} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Nova senha"
                  placeholderTextColor="#90CAF9"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  autoFocus
                />
              </View>

              <View style={styles.inputWrap}>
                <Lock color="#90CAF9" size={16} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirmar nova senha"
                  placeholderTextColor="#90CAF9"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              </View>

              {/* Indicador de força da senha */}
              {newPassword.length > 0 && (
                <View style={styles.strengthRow}>
                  {[1, 2, 3, 4].map((level) => {
                    const strength =
                      newPassword.length >= 10 && /[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword)
                        ? 4
                        : newPassword.length >= 8
                        ? 3
                        : newPassword.length >= 6
                        ? 2
                        : 1;
                    return (
                      <View
                        key={level}
                        style={[
                          styles.strengthBar,
                          level <= strength && [
                            styles.strengthBarFilled,
                            strength === 1 && { backgroundColor: '#E53935' },
                            strength === 2 && { backgroundColor: '#FB8C00' },
                            strength === 3 && { backgroundColor: '#FDD835' },
                            strength === 4 && { backgroundColor: '#43A047' },
                          ],
                        ]}
                      />
                    );
                  })}
                  <Text style={styles.strengthLabel}>
                    {newPassword.length < 6
                      ? 'Muito fraca'
                      : newPassword.length < 8
                      ? 'Fraca'
                      : newPassword.length >= 10 && /[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword)
                      ? 'Forte'
                      : 'Média'}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.btnPrimary}
                onPress={handleResetPassword}
                activeOpacity={0.85}
                disabled={loading}
              >
                <LinearGradient colors={['#1565C0', '#0D47A1']} style={styles.btnGrad}>
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.btnText}>Redefinir senha</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* Link voltar para login */}
          <TouchableOpacity onPress={() => router.replace('/login')} style={styles.loginLink}>
            <Text style={styles.loginLinkText}>
              Lembrou a senha?{' '}
              <Text style={styles.loginLinkBold}>Entrar</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1 },
  scroll: { paddingHorizontal: 24, paddingTop: 56, paddingBottom: 32, gap: 20 },

  header: { alignItems: 'center', gap: 8 },
  backBtn: { position: 'absolute', left: 0, top: 0, padding: 4 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
  },
  appName: { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.75)' },

  // Step indicator
  stepRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  stepItem: { alignItems: 'center', gap: 4 },
  stepDot: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)',
  },
  stepDotActive: { backgroundColor: '#fff', borderColor: '#fff' },
  stepDotText: { fontSize: 13, fontWeight: '700', color: '#1565C0' },
  stepDotTextInactive: { color: 'rgba(255,255,255,0.7)' },
  stepLabel: { fontSize: 11, color: '#fff', fontWeight: '600' },
  stepLabelInactive: { color: 'rgba(255,255,255,0.5)' },
  stepLine: {
    width: 48, height: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginHorizontal: 8, marginBottom: 14, borderRadius: 1,
  },
  stepLineActive: { backgroundColor: '#fff' },

  // Card
  card: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 24, padding: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    gap: 14, alignItems: 'center',
  },
  cardIconWrap: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  cardHint: {
    fontSize: 13, color: 'rgba(255,255,255,0.75)',
    textAlign: 'center', lineHeight: 20,
  },
  emailHighlight: { color: '#fff', fontWeight: '700' },

  // Input padrão
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12, paddingHorizontal: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    width: '100%',
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, color: '#fff', fontSize: 14, paddingVertical: 13 },

  // Inputs do código
  codeRow: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  codeInput: {
    width: 44, height: 52, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)',
    color: '#fff', fontSize: 22, fontWeight: '900',
    textAlign: 'center',
  },
  codeInputFilled: {
    backgroundColor: 'rgba(255,255,255,0.28)',
    borderColor: '#fff',
  },

  // Força da senha
  strengthRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6, width: '100%',
  },
  strengthBar: {
    flex: 1, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  strengthBarFilled: { backgroundColor: '#43A047' },
  strengthLabel: {
    fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: '600', minWidth: 60,
  },

  // Botão principal
  btnPrimary: { borderRadius: 12, overflow: 'hidden', width: '100%' },
  btnGrad: { paddingVertical: 14, alignItems: 'center', borderRadius: 12 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '800' },

  // Reenviar código
  resendBtn: { paddingVertical: 4 },
  resendText: { color: 'rgba(255,255,255,0.65)', fontSize: 13, textDecorationLine: 'underline' },

  // Link login
  loginLink: { alignSelf: 'center' },
  loginLinkText: { color: 'rgba(255,255,255,0.65)', fontSize: 13 },
  loginLinkBold: { color: '#fff', fontWeight: '700' },
});
