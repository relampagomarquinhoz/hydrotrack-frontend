import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, StatusBar, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Droplets, Mail, Lock } from 'lucide-react-native';
import { router } from 'expo-router';
import { authFetch, getRoleFromToken } from '../constants/api';
import { useAuth } from '../constants/AuthContext';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setToken, setUserName, setIsAdmin } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) { Alert.alert('Atenção', 'Preencha todos os campos'); return; }

    setLoading(true);
    try {
      const isAdminLogin = email.toLowerCase().trim() === 'admin@hydrotrack.com';
      const route = isAdminLogin ? '/admin/login' : '/auth/login';

      const res = await authFetch(route, null, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        Alert.alert('Erro', data.message || 'Email ou senha inválidos');
        return;
      }

      // ✅ isAdmin vem do token JWT, não do email digitado
      const role = getRoleFromToken(data.token);
      setToken(data.token);
      setIsAdmin(role === 'admin');
      if (data.user?.name) setUserName(data.user.name);
      if (role === 'admin') setUserName('Administrador');

      router.replace('/(tabs)');
    } catch (e) {
      Alert.alert('Erro de conexão', 'Não foi possível conectar ao servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#0D47A1', '#1565C0', '#1E88E5', '#64B5F6']} style={styles.gradient}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
        <View style={styles.logoSection}>
          <View style={styles.logoCircle}><Droplets color="#1565C0" size={40} /></View>
          <Text style={styles.appName}>HydroTrack</Text>
          <Text style={styles.tagline}>Beba água. Viva melhor.</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Entrar na conta</Text>
          <View style={styles.inputWrap}>
            <Mail color="#90CAF9" size={18} style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#90CAF9"
              value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          </View>
          <View style={styles.inputWrap}>
            <Lock color="#90CAF9" size={18} style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="Senha" placeholderTextColor="#90CAF9"
              value={password} onChangeText={setPassword} secureTextEntry />
          </View>
          <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} activeOpacity={0.85} disabled={loading}>
            <LinearGradient colors={['#1565C0', '#0D47A1']} style={styles.loginGrad}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.loginText}>Entrar</Text>
              }
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.registerBtn} activeOpacity={0.75} onPress={() => router.push('/cadastro')}>
            <Text style={styles.registerText}>Criar Conta</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ marginTop: 8, alignSelf: 'center' }} onPress={() => router.push('/esqueci-senha')} activeOpacity={0.75}>
            <Text style={styles.forgotText}>Esqueci minha senha</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.bubblesRow}>
          {[32, 20, 14, 24, 10].map((size, i) => (
            <View key={i} style={[styles.bubble, { width: size, height: size, borderRadius: size / 2, opacity: 0.18 + i * 0.04 }]} />
          ))}
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 28, gap: 28 },
  logoSection: { alignItems: 'center', gap: 10 },
  logoCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#0D47A1', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 16 },
  appName: { fontSize: 34, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  tagline: { fontSize: 14, color: 'rgba(255,255,255,0.75)', letterSpacing: 0.3 },
  card: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 28, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', gap: 12 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 4, textAlign: 'center' },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 14, paddingHorizontal: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: '#fff', fontSize: 15, paddingVertical: 14 },
  loginBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 4 },
  loginGrad: { paddingVertical: 16, alignItems: 'center', borderRadius: 14 },
  loginText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  registerBtn: { paddingVertical: 14, borderRadius: 14, borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)', alignItems: 'center' },
  registerText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  forgotText: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },
  bubblesRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 8 },
  bubble: { backgroundColor: '#fff' },
});