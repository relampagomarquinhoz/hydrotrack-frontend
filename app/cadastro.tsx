import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Droplets, Mail, Lock, User, Ruler, Weight, ChevronLeft } from 'lucide-react-native';
import { router } from 'expo-router';

const GENDER_OPTIONS = ['Masculino', 'Feminino', 'Outro'];

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [gender, setGender] = useState('');
  const [step, setStep] = useState(1); // 1 = dados pessoais, 2 = dados físicos

  const handleNextStep = () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Atenção', 'Preencha todos os campos');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem');
      return;
    }
    setStep(2);
  };

  const handleRegister = () => {
    if (!weight || !height || !gender) {
      Alert.alert('Atenção', 'Preencha todos os campos');
      return;
    }
    // Calcular meta de água sugerida (35ml por kg de peso)
    const suggestedGoal = Math.round(parseFloat(weight) * 35);
    Alert.alert(
      'Conta criada!',
      `Bem-vindo(a), ${name}!\nSua meta diária sugerida é ${suggestedGoal} ml`,
      [{ text: 'Começar', onPress: () => router.replace('/(tabs)') }]
    );
  };

  return (
    <LinearGradient colors={['#0D47A1', '#1565C0', '#1E88E5', '#64B5F6']} style={styles.gradient}>
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
            <TouchableOpacity onPress={() => step === 1 ? router.back() : setStep(1)} style={styles.backBtn}>
              <ChevronLeft color="#fff" size={22} />
            </TouchableOpacity>
            <View style={styles.logoRow}>
              <View style={styles.logoCircle}>
                <Droplets color="#1565C0" size={28} />
              </View>
              <Text style={styles.appName}>HydroTrack</Text>
            </View>
            <Text style={styles.subtitle}>Criar nova conta</Text>
          </View>

          {/* Step Indicator */}
          <View style={styles.stepRow}>
            <View style={styles.stepItem}>
              <View style={[styles.stepDot, styles.stepDotActive]}>
                <Text style={styles.stepDotText}>1</Text>
              </View>
              <Text style={styles.stepLabel}>Conta</Text>
            </View>
            <View style={[styles.stepLine, step === 2 && styles.stepLineActive]} />
            <View style={styles.stepItem}>
              <View style={[styles.stepDot, step === 2 && styles.stepDotActive]}>
                <Text style={[styles.stepDotText, step !== 2 && styles.stepDotTextInactive]}>2</Text>
              </View>
              <Text style={[styles.stepLabel, step !== 2 && styles.stepLabelInactive]}>Perfil físico</Text>
            </View>
          </View>

          {/* STEP 1 */}
          {step === 1 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Dados da conta</Text>

              <View style={styles.inputWrap}>
                <User color="#90CAF9" size={16} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Nome completo"
                  placeholderTextColor="#90CAF9"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputWrap}>
                <Mail color="#90CAF9" size={16} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#90CAF9"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputWrap}>
                <Lock color="#90CAF9" size={16} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Senha"
                  placeholderTextColor="#90CAF9"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              <View style={styles.inputWrap}>
                <Lock color="#90CAF9" size={16} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirmar senha"
                  placeholderTextColor="#90CAF9"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              </View>

              <TouchableOpacity style={styles.btnPrimary} onPress={handleNextStep} activeOpacity={0.85}>
                <LinearGradient colors={['#1565C0', '#0D47A1']} style={styles.btnGrad}>
                  <Text style={styles.btnText}>Próximo →</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Perfil físico</Text>
              <Text style={styles.cardHint}>
                Usamos esses dados para calcular sua meta de hidratação ideal.
              </Text>

              <View style={styles.rowInputs}>
                <View style={[styles.inputWrap, { flex: 1 }]}>
                  <Weight color="#90CAF9" size={16} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Peso (kg)"
                    placeholderTextColor="#90CAF9"
                    value={weight}
                    onChangeText={setWeight}
                    keyboardType="numeric"
                  />
                </View>
                <View style={[styles.inputWrap, { flex: 1 }]}>
                  <Ruler color="#90CAF9" size={16} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Altura (cm)"
                    placeholderTextColor="#90CAF9"
                    value={height}
                    onChangeText={setHeight}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <Text style={styles.fieldLabel}>Sexo biológico</Text>
              <View style={styles.genderRow}>
                {GENDER_OPTIONS.map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.genderBtn, gender === g && styles.genderBtnActive]}
                    onPress={() => setGender(g)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.genderText, gender === g && styles.genderTextActive]}>
                      {g}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {weight ? (
                <View style={styles.goalPreview}>
                  <Droplets color="#90CAF9" size={14} />
                  <Text style={styles.goalPreviewText}>
                    Meta sugerida:{' '}
                    <Text style={styles.goalPreviewValue}>
                      {Math.round(parseFloat(weight || '0') * 35)} ml/dia
                    </Text>
                  </Text>
                </View>
              ) : null}

              <TouchableOpacity style={styles.btnPrimary} onPress={handleRegister} activeOpacity={0.85}>
                <LinearGradient colors={['#1565C0', '#0D47A1']} style={styles.btnGrad}>
                  <Text style={styles.btnText}>Criar conta</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* Login link */}
          <TouchableOpacity onPress={() => router.back()} style={styles.loginLink}>
            <Text style={styles.loginLinkText}>
              Já tem uma conta?{' '}
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
  backBtn: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: 4,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appName: { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.75)' },

  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
  },
  stepItem: { alignItems: 'center', gap: 4 },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  stepDotActive: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  stepDotText: { fontSize: 13, fontWeight: '700', color: '#1565C0' },
  stepDotTextInactive: { color: 'rgba(255,255,255,0.7)' },
  stepLabel: { fontSize: 11, color: '#fff', fontWeight: '600' },
  stepLabelInactive: { color: 'rgba(255,255,255,0.5)' },
  stepLine: {
    width: 60,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginHorizontal: 8,
    marginBottom: 14,
    borderRadius: 1,
  },
  stepLineActive: { backgroundColor: '#fff' },

  card: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    gap: 12,
  },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#fff', textAlign: 'center' },
  cardHint: { fontSize: 12, color: 'rgba(255,255,255,0.65)', textAlign: 'center', lineHeight: 18 },

  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  inputIcon: { marginRight: 8 },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    paddingVertical: 12,
  },

  rowInputs: { flexDirection: 'row', gap: 10 },

  fieldLabel: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginBottom: -4 },
  genderRow: { flexDirection: 'row', gap: 8 },
  genderBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  genderBtnActive: {
    borderColor: '#fff',
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  genderText: { fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  genderTextActive: { color: '#fff' },

  goalPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 10,
  },
  goalPreviewText: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  goalPreviewValue: { fontWeight: '700', color: '#fff' },

  btnPrimary: { borderRadius: 12, overflow: 'hidden', marginTop: 4 },
  btnGrad: { paddingVertical: 14, alignItems: 'center', borderRadius: 12 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '800' },

  loginLink: { alignSelf: 'center' },
  loginLinkText: { color: 'rgba(255,255,255,0.65)', fontSize: 13 },
  loginLinkBold: { color: '#fff', fontWeight: '700' },
});