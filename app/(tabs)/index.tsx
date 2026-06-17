import { LinearGradient } from 'expo-linear-gradient';
import { Check, Droplets, Flame, Pencil, X } from 'lucide-react-native';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Animated, AppState, Dimensions, KeyboardAvoidingView, Modal, Platform,
  ScrollView, StatusBar, StyleSheet, Text, TextInput,
  TouchableOpacity, View, ActivityIndicator,
} from 'react-native';
import Svg2, { Circle as SvgCircle } from 'react-native-svg';
import { authFetch } from '../../constants/api';
import { useAuth } from '../../constants/AuthContext';
import { useFocusEffect } from 'expo-router';

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = 220;
const STROKE_WIDTH = 14;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const AnimatedSvgCircle = Animated.createAnimatedComponent(SvgCircle);
function AnimatedCircle(props: any) {
  return <AnimatedSvgCircle {...props} />;
}

function getNextReminderInfo(intervalMinutes: number, startTime: string, endTime: string) {
  const now = new Date();
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  const startTotal = startH * 60 + startM;
  const endTotal = endH * 60 + endM;
  const nowTotal = now.getHours() * 60 + now.getMinutes();

  if (nowTotal >= endTotal || nowTotal < startTotal) {
    return { label: startTime, left: 'Amanhã' };
  }
  const minutesSinceStart = nowTotal - startTotal;
  const nextSlot = Math.ceil((minutesSinceStart + 1) / intervalMinutes) * intervalMinutes + startTotal;
  if (nextSlot >= endTotal) {
    return { label: endTime, left: 'Último hoje' };
  }
  const nextH = Math.floor(nextSlot / 60);
  const nextM = nextSlot % 60;
  const label = `${String(nextH).padStart(2, '0')}:${String(nextM).padStart(2, '0')}`;
  const diffMin = nextSlot - nowTotal;
  const left = diffMin >= 60
    ? `${Math.floor(diffMin / 60)} h ${diffMin % 60 > 0 ? diffMin % 60 + ' min' : ''}`.trim()
    : `${diffMin} min`;
  return { label, left };
}

export default function HomeScreen() {
  const { token, userName, notifSettings, setNotifSettings, isLoading } = useAuth();
  const [consumed, setConsumed] = useState(0);
  const [goal, setGoal] = useState(2500);
  const [streak, setStreak] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [goalInput, setGoalInput] = useState('2500');
  const [drinkModalVisible, setDrinkModalVisible] = useState(false);
  const [drinkInput, setDrinkInput] = useState('200');
  const [bottomHeight, setBottomHeight] = useState(140);
  const [loadingAdd, setLoadingAdd] = useState(false);

  // ✅ Configs de notificação vêm do contexto global (atualizadas pelo perfil)
  const reminderInterval = notifSettings.interval_minutes;
  const reminderStart = notifSettings.start_time;
  const reminderEnd = notifSettings.end_time;

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(1)).current;
  const modalAnim = useRef(new Animated.Value(0)).current;
  const drinkModalAnim = useRef(new Animated.Value(0)).current;
  const lastLoadedDateRef = useRef(new Date().toDateString());

  const progress = Math.min(consumed / goal, 1);
  const progressPercent = Math.round(progress * 100);
  const reminderInfo = getNextReminderInfo(reminderInterval, reminderStart, reminderEnd);

  // ✅ FIX 1: campos corretos do backend (data.summary.total_ml, data.summary.daily_goal_ml)
  const loadToday = async () => {
    if (!token) return;
    try {
      const res = await authFetch('/hydration/today', token);
      const data = await res.json();
      if (res.ok && data.summary) {
        setConsumed(data.summary.total_ml ?? 0);
        setGoal(data.summary.daily_goal_ml ?? 2500);
      }
      lastLoadedDateRef.current = new Date().toDateString(); // ✅ marca a data dessa consulta
    } catch (e) {
      // falha silenciosa
    }
  };

  // ✅ FIX 2: streak tem rota própria /hydration/streak → data.streak_days
  const loadStreak = async () => {
    if (!token) return;
    try {
      const res = await authFetch('/hydration/streak', token);
      const data = await res.json();
      if (res.ok) setStreak(data.streak_days ?? 0);
    } catch (e) {}
  };

  const loadNotificationSettings = async () => {
    if (!token) return;
    try {
      const res = await authFetch('/notifications/settings', token);
      const data = await res.json();
      if (res.ok) {
        const s = data.settings ?? data;
        setNotifSettings({
          enabled: s.enabled ?? true,
          interval_minutes: s.interval_minutes ?? 60,
          start_time: typeof s.start_time === 'string' ? s.start_time.substring(0, 5) : '07:00',
          end_time: typeof s.end_time === 'string' ? s.end_time.substring(0, 5) : '22:00',
          active_days: s.active_days ?? [0, 1, 2, 3, 4, 5, 6],
        });
      }
    } catch (e) {}
  };

  useFocusEffect(
    useCallback(() => {
      if (isLoading) return; // ✅ aguarda o token ser carregado do AsyncStorage
      loadToday();
      loadStreak();
      loadNotificationSettings();
    }, [token, isLoading])
  );

  // ✅ Detecta troca de dia ao voltar para o app (resolve o "zerar à meia noite")
  // O useFocusEffect sozinho só dispara ao trocar de aba — se o usuário ficar
  // parado na tela Início, ou minimizar e voltar, ele não rodava de novo.
  // O AppState detecta quando o app volta de background/inactive para active
  // e, se a data mudou desde a última consulta, recarrega os dados do dia.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active') return;
      if (!token || isLoading) return;

      const today = new Date().toDateString();
      if (today !== lastLoadedDateRef.current) {
        loadToday();
        loadStreak();
      }
    });

    return () => subscription.remove();
  }, [token, isLoading]);

  // ✅ Também checa periodicamente enquanto o app fica aberto e ativo na tela
  // (cobre o caso de deixar o celular ligado passando da meia noite sem minimizar)
  useEffect(() => {
    if (!token || isLoading) return;

    const interval = setInterval(() => {
      const today = new Date().toDateString();
      if (today !== lastLoadedDateRef.current) {
        loadToday();
        loadStreak();
      }
    }, 60 * 1000); // checa a cada 1 minuto

    return () => clearInterval(interval);
  }, [token, isLoading]);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 700,
      useNativeDriver: false,
    }).start();
  }, [consumed, goal]);

  const strokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRCUMFERENCE, 0],
  });

  // ✅ FIX 3: envia amount_ml (não amount) conforme o backend espera
  const handleAdd = async (amount: number) => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.06, duration: 90, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 90, useNativeDriver: true }),
    ]).start();
    Animated.sequence([
      Animated.timing(btnScale, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.timing(btnScale, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();

    setConsumed((prev) => Math.min(prev + amount, goal));

    setLoadingAdd(true);
    try {
      await authFetch('/hydration/log', token, {
        method: 'POST',
        body: JSON.stringify({ amount_ml: amount }), // ✅ campo correto
      });
      await loadToday();
      await loadStreak();
    } catch (e) {
      // mantém valor local se falhar
    } finally {
      setLoadingAdd(false);
    }
  };

  const openModal = () => {
    setGoalInput(String(goal));
    setModalVisible(true);
    Animated.spring(modalAnim, { toValue: 1, useNativeDriver: true, tension: 65, friction: 9 }).start();
  };

  const closeModal = () => {
    Animated.timing(modalAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setModalVisible(false));
  };

  // ✅ FIX 4: meta salva via PUT /auth/me com campo daily_goal_ml
  const saveGoal = async () => {
    const parsed = parseInt(goalInput, 10);
    if (!isNaN(parsed) && parsed >= 100 && parsed <= 10000) {
      setGoal(parsed);
      setConsumed((prev) => Math.min(prev, parsed));
      try {
        await authFetch('/auth/me', token, {
          method: 'PUT',
          body: JSON.stringify({ daily_goal_ml: parsed }),
        });
      } catch (e) {
        // falha silenciosa — meta já foi atualizada localmente
      }
    }
    closeModal();
  };

  const openDrinkModal = () => {
    setDrinkInput('200');
    setDrinkModalVisible(true);
    Animated.spring(drinkModalAnim, { toValue: 1, useNativeDriver: true, tension: 65, friction: 9 }).start();
  };

  const closeDrinkModal = () => {
    Animated.timing(drinkModalAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setDrinkModalVisible(false));
  };

  const confirmDrink = () => {
    const parsed = parseInt(drinkInput, 10);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 5000) {
      handleAdd(parsed);
    }
    closeDrinkModal();
  };

  const statusEmoji = progress >= 1 ? '🏆' : progress >= 0.5 ? '🔥' : '💧';
  const statusText = progress >= 1 ? 'Meta atingida! Incrível!' : progress >= 0.5 ? 'Mais da metade! Continue assim!' : `Faltam ${(goal - consumed).toLocaleString()} ml`;
  const modalScale = modalAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] });
  const drinkModalScale = drinkModalAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] });
  const displayName = userName ? userName.split(' ')[0] : 'você';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <LinearGradient colors={['#1565C0', '#1E88E5', '#42A5F5']} style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.streakBadge}>
            <Flame color="#FF6D00" size={15} />
            <Text style={styles.streakText}>Sequência de {streak} dia{streak !== 1 ? 's' : ''}</Text>
          </View>
        </View>
        <View style={styles.userRow}>
          <View style={styles.dropIconWrap}>
            <Droplets color="#fff" size={26} />
          </View>
          <View>
            <Text style={styles.greeting}>Olá, {displayName}! 👋</Text>
            <Text style={styles.goalText}>Meta diária: {goal.toLocaleString()} ml</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: bottomHeight + 16 }]}
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        <Animated.View style={[styles.circleWrap, { transform: [{ scale: scaleAnim }] }]}>
          <Svg2 width={CIRCLE_SIZE} height={CIRCLE_SIZE}>
            <SvgCircle cx={CIRCLE_SIZE / 2} cy={CIRCLE_SIZE / 2} r={RADIUS} stroke="#DDEEFF" strokeWidth={STROKE_WIDTH} fill="none" />
            <AnimatedCircle
              cx={CIRCLE_SIZE / 2} cy={CIRCLE_SIZE / 2} r={RADIUS}
              stroke={progress >= 1 ? '#43A047' : '#1E88E5'}
              strokeWidth={STROKE_WIDTH} fill="none"
              strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round" rotation="-90"
              origin={`${CIRCLE_SIZE / 2}, ${CIRCLE_SIZE / 2}`}
            />
          </Svg2>
          <View style={styles.circleCenter}>
            <Text style={styles.bigNumber}>{consumed.toLocaleString()}</Text>
            <Text style={styles.bigUnit}>ml</Text>
            <Text style={styles.percentText}>{progressPercent}%</Text>
          </View>
        </Animated.View>

        <View style={styles.infoRow}>
          <View style={styles.infoCard}>
            <View style={styles.infoCardDot} />
            <View>
              <Text style={styles.infoCardLabel}>Objetivo</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={styles.infoCardValue}>{goal.toLocaleString()} ml ({progressPercent}%)</Text>
                <TouchableOpacity onPress={openModal} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Pencil color="#1E88E5" size={13} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
          <View style={styles.infoCard}>
            <View style={[styles.infoCardDot, { backgroundColor: '#FFA000' }]} />
            <View>
              <Text style={styles.infoCardLabel}>Próximo lembrete</Text>
              <Text style={styles.infoCardValue}>
                {reminderInfo.label}{' '}
                <Text style={styles.infoCardSub}>(Falta {reminderInfo.left})</Text>
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.statusCard, progress >= 1 && styles.statusDone]}>
          <Text style={styles.statusEmoji}>{statusEmoji}</Text>
          <Text style={styles.statusText}>{statusText}</Text>
        </View>

        <View style={styles.tipCard}>
          <Text style={styles.tipIcon}>💡</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.tipTitle}>Dica do dia</Text>
            <Text style={styles.tipText}>Beber água antes das refeições ajuda na digestão e controle do apetite.</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomArea} onLayout={e => setBottomHeight(e.nativeEvent.layout.height)}>
        <View style={styles.bottomContent}>
          <View style={styles.amountRow}>
            <TouchableOpacity style={styles.stepBtn} activeOpacity={0.7}
              onPress={() => setDrinkInput(v => String(Math.max(50, (parseInt(v) || 200) - 50)))}>
              <Text style={styles.stepBtnText}>−</Text>
            </TouchableOpacity>
            <View style={styles.amountInputWrap}>
              <Text style={styles.amountPrefix}>+</Text>
              <TextInput style={styles.amountInput} value={drinkInput}
                onChangeText={v => setDrinkInput(v.replace(/[^0-9]/g, ''))}
                keyboardType="numeric" maxLength={4} selectTextOnFocus placeholderTextColor="rgba(255,255,255,0.5)" />
              <Text style={styles.amountUnit}>ml</Text>
            </View>
            <TouchableOpacity style={styles.stepBtn} activeOpacity={0.7}
              onPress={() => setDrinkInput(v => String(Math.min(2000, (parseInt(v) || 200) + 50)))}>
              <Text style={styles.stepBtnText}>+</Text>
            </TouchableOpacity>
          </View>
          <Animated.View style={{ transform: [{ scale: btnScale }], width: '100%' }}>
            <TouchableOpacity style={styles.drinkBtn} activeOpacity={0.92} disabled={loadingAdd}
              onPress={() => {
                const parsed = parseInt(drinkInput, 10);
                if (!isNaN(parsed) && parsed > 0) handleAdd(parsed);
              }}>
              {loadingAdd ? <ActivityIndicator color="#1565C0" /> : <Text style={styles.drinkBtnText}>+ BEBER</Text>}
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>

      {/* Modal de meta */}
      <Modal visible={modalVisible} transparent animationType="none" onRequestClose={closeModal}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={closeModal} />
          <Animated.View style={[styles.modalSheet, { opacity: modalAnim, transform: [{ scale: modalScale }] }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconWrap}><Droplets color="#1E88E5" size={22} /></View>
              <Text style={styles.modalTitle}>Alterar meta diária</Text>
              <TouchableOpacity onPress={closeModal} style={styles.modalCloseBtn}><X color="#90A4AE" size={20} /></TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>Defina o volume diário de água (ml) que deseja consumir.</Text>
            <View style={styles.inputRow}>
              <TextInput style={styles.goalInput} value={goalInput} onChangeText={setGoalInput}
                keyboardType="numeric" maxLength={5} selectTextOnFocus autoFocus placeholder="2500" placeholderTextColor="#B0BEC5" />
              <View style={styles.inputUnit}><Text style={styles.inputUnitText}>ml</Text></View>
            </View>
            <Text style={styles.presetsLabel}>Sugestões rápidas</Text>
            <View style={styles.presetsRow}>
              {[1500, 2000, 2500, 3000].map((v) => (
                <TouchableOpacity key={v} style={[styles.presetChip, goalInput === String(v) && styles.presetChipActive]}
                  onPress={() => setGoalInput(String(v))}>
                  <Text style={[styles.presetChipText, goalInput === String(v) && styles.presetChipTextActive]}>{v.toLocaleString()}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={closeModal}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={saveGoal}>
                <Check color="#fff" size={16} />
                <Text style={styles.saveBtnText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal de bebida */}
      <Modal visible={drinkModalVisible} transparent animationType="none" onRequestClose={closeDrinkModal}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={closeDrinkModal} />
          <Animated.View style={[styles.modalSheet, { opacity: drinkModalAnim, transform: [{ scale: drinkModalScale }] }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconWrap}><Droplets color="#1E88E5" size={22} /></View>
              <Text style={styles.modalTitle}>Quanto você bebeu?</Text>
              <TouchableOpacity onPress={closeDrinkModal} style={styles.modalCloseBtn}><X color="#90A4AE" size={20} /></TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>Informe a quantidade de água que você acabou de beber.</Text>
            <View style={styles.inputRow}>
              <TextInput style={styles.goalInput} value={drinkInput} onChangeText={setDrinkInput}
                keyboardType="numeric" maxLength={4} selectTextOnFocus autoFocus placeholder="200" placeholderTextColor="#B0BEC5" />
              <View style={styles.inputUnit}><Text style={styles.inputUnitText}>ml</Text></View>
            </View>
            <Text style={styles.presetsLabel}>Porções comuns</Text>
            <View style={styles.presetsRow}>
              {[150, 200, 300, 500].map((v) => (
                <TouchableOpacity key={v} style={[styles.presetChip, drinkInput === String(v) && styles.presetChipActive]}
                  onPress={() => setDrinkInput(String(v))}>
                  <Text style={[styles.presetChipText, drinkInput === String(v) && styles.presetChipTextActive]}>{v}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={closeDrinkModal}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={confirmDrink}>
                <Check color="#fff" size={16} />
                <Text style={styles.saveBtnText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollView: { flex: 1, backgroundColor: '#fff' },
  header: { paddingTop: 52, paddingHorizontal: 20, paddingBottom: 20, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  streakBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, gap: 5 },
  streakText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dropIconWrap: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 14, padding: 8 },
  greeting: { fontSize: 19, fontWeight: '800', color: '#fff' },
  goalText: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  body: { alignItems: 'center', paddingTop: 28, paddingHorizontal: 20 },
  circleWrap: { width: CIRCLE_SIZE, height: CIRCLE_SIZE, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  circleCenter: { position: 'absolute', alignItems: 'center' },
  bigNumber: { fontSize: 52, fontWeight: '900', color: '#0D2B6B', letterSpacing: -2 },
  bigUnit: { fontSize: 16, color: '#90A4AE', fontWeight: '600', marginTop: -6 },
  percentText: { fontSize: 13, color: '#90A4AE', fontWeight: '700', marginTop: 2 },
  infoRow: { flexDirection: 'row', gap: 12, width: '100%', marginBottom: 14 },
  infoCard: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 8, elevation: 2, shadowColor: '#1565C0', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6 },
  infoCardDot: { width: 4, height: '100%', minHeight: 36, backgroundColor: '#1E88E5', borderRadius: 2 },
  infoCardLabel: { fontSize: 10, color: '#90A4AE', fontWeight: '600', marginBottom: 3 },
  infoCardValue: { fontSize: 13, fontWeight: '800', color: '#1A237E' },
  infoCardSub: { fontSize: 11, color: '#90A4AE', fontWeight: '500' },
  statusCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%', borderWidth: 1.5, borderColor: '#BBDEFB', marginBottom: 14, elevation: 2, shadowColor: '#1565C0', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 },
  statusDone: { borderColor: '#FFC107', backgroundColor: '#FFFDE7' },
  statusEmoji: { fontSize: 26 },
  statusText: { flex: 1, color: '#1565C0', fontWeight: '700', fontSize: 13 },
  tipCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderLeftWidth: 4, borderLeftColor: '#1565C0', borderWidth: 1.5, borderColor: '#BBDEFB', width: '100%' },
  tipIcon: { fontSize: 20 },
  tipTitle: { fontWeight: '800', color: '#1565C0', marginBottom: 3, fontSize: 13 },
  tipText: { color: '#1976D2', fontSize: 12, lineHeight: 18 },
  bottomArea: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  bottomContent: { backgroundColor: '#1E88E5', paddingHorizontal: 24, paddingTop: 14, paddingBottom: 32, alignItems: 'center', gap: 12 },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%' },
  stepBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' },
  stepBtnText: { fontSize: 24, fontWeight: '700', color: '#fff', lineHeight: 28 },
  amountInputWrap: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 6, gap: 2 },
  amountPrefix: { fontSize: 22, fontWeight: '900', color: '#fff', marginBottom: 3 },
  amountInput: { fontSize: 30, fontWeight: '900', color: '#fff', minWidth: 64, textAlign: 'center', padding: 0 },
  amountUnit: { fontSize: 16, color: 'rgba(255,255,255,0.85)', fontWeight: '600', marginBottom: 4 },
  drinkBtn: { backgroundColor: '#fff', borderRadius: 32, paddingVertical: 16, width: '100%', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 8 },
  drinkBtnText: { color: '#1565C0', fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40, elevation: 20, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 16 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  modalIconWrap: { backgroundColor: '#E3F2FD', borderRadius: 10, padding: 8 },
  modalTitle: { flex: 1, fontSize: 17, fontWeight: '800', color: '#0D2B6B' },
  modalCloseBtn: { padding: 4 },
  modalSubtitle: { fontSize: 13, color: '#90A4AE', marginBottom: 20, lineHeight: 18 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: '#BBDEFB', borderRadius: 14, overflow: 'hidden', marginBottom: 20 },
  goalInput: { flex: 1, fontSize: 28, fontWeight: '900', color: '#0D2B6B', paddingHorizontal: 16, paddingVertical: 14, letterSpacing: -1 },
  inputUnit: { backgroundColor: '#E3F2FD', paddingHorizontal: 16, paddingVertical: 14, alignSelf: 'stretch', justifyContent: 'center' },
  inputUnitText: { fontSize: 16, fontWeight: '700', color: '#1E88E5' },
  presetsLabel: { fontSize: 11, fontWeight: '700', color: '#90A4AE', marginBottom: 10, letterSpacing: 0.5 },
  presetsRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  presetChip: { flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderColor: '#BBDEFB', alignItems: 'center' },
  presetChipActive: { backgroundColor: '#1E88E5', borderColor: '#1E88E5' },
  presetChipText: { fontSize: 13, fontWeight: '700', color: '#1E88E5' },
  presetChipTextActive: { color: '#fff' },
  modalActions: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, paddingVertical: 15, borderRadius: 24, borderWidth: 1.5, borderColor: '#BBDEFB', alignItems: 'center' },
  cancelBtnText: { fontSize: 15, fontWeight: '700', color: '#90A4AE' },
  saveBtn: { flex: 2, paddingVertical: 15, borderRadius: 24, backgroundColor: '#1E88E5', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, elevation: 3, shadowColor: '#1565C0', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6 },
  saveBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },
});