import { LinearGradient } from 'expo-linear-gradient';
import { Bell, Check, Droplets, Flame, Pencil, Volume2, X } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg2, { Circle as SvgCircle } from 'react-native-svg';

const { width } = Dimensions.get('window');

const STREAK = 1;
const NEXT_REMINDER = '18:00';
const REMINDER_LEFT = '4 h 0 min';

const CIRCLE_SIZE = 220;
const STROKE_WIDTH = 14;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function HomeScreen() {
  const [consumed, setConsumed] = useState(200);
  const [goal, setGoal] = useState(2500);
  const [modalVisible, setModalVisible] = useState(false);
  const [goalInput, setGoalInput] = useState('2500');

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(1)).current;
  const modalAnim = useRef(new Animated.Value(0)).current;

  const progress = Math.min(consumed / goal, 1);
  const progressPercent = Math.round(progress * 100);

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

  const handleAdd = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.06, duration: 90, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 90, useNativeDriver: true }),
    ]).start();
    Animated.sequence([
      Animated.timing(btnScale, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.timing(btnScale, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
    setConsumed((prev) => Math.min(prev + 200, goal));
  };

  const openModal = () => {
    setGoalInput(String(goal));
    setModalVisible(true);
    Animated.spring(modalAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 65,
      friction: 9,
    }).start();
  };

  const closeModal = () => {
    Animated.timing(modalAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setModalVisible(false));
  };

  const saveGoal = () => {
    const parsed = parseInt(goalInput, 10);
    if (!isNaN(parsed) && parsed >= 100 && parsed <= 10000) {
      setGoal(parsed);
      // Reset consumed if it exceeds new goal
      setConsumed((prev) => Math.min(prev, parsed));
    }
    closeModal();
  };

  const statusEmoji = progress >= 1 ? '🏆' : progress >= 0.5 ? '🔥' : '💧';
  const statusText =
    progress >= 1
      ? 'Meta atingida! Incrível!'
      : progress >= 0.5
      ? 'Mais da metade! Continue assim!'
      : `Faltam ${(goal - consumed).toLocaleString()} ml`;

  const modalScale = modalAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.85, 1],
  });
  const modalOpacity = modalAnim;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* ── Header ── */}
      <LinearGradient colors={['#1565C0', '#1E88E5', '#42A5F5']} style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.streakBadge}>
            <Flame color="#FF6D00" size={15} />
            <Text style={styles.streakText}>Sequência de {STREAK} dia</Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconBtn}>
              <Bell color="#fff" size={20} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn}>
              <Volume2 color="#fff" size={20} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.userRow}>
          <View style={styles.dropIconWrap}>
            <Droplets color="#fff" size={26} />
          </View>
          <View>
            <Text style={styles.greeting}>Olá, Pedro! 👋</Text>
            <Text style={styles.goalText}>Meta diária: {goal.toLocaleString()} ml</Text>
          </View>
        </View>
      </LinearGradient>

      {/* ── Body ── */}
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false} style={{ backgroundColor: '#fff' }}>

        {/* ── Circular Progress ── */}
        <Animated.View style={[styles.circleWrap, { transform: [{ scale: scaleAnim }] }]}>
          <Svg2 width={CIRCLE_SIZE} height={CIRCLE_SIZE}>
            <SvgCircle
              cx={CIRCLE_SIZE / 2}
              cy={CIRCLE_SIZE / 2}
              r={RADIUS}
              stroke="#DDEEFF"
              strokeWidth={STROKE_WIDTH}
              fill="none"
            />
            <AnimatedCircle
              cx={CIRCLE_SIZE / 2}
              cy={CIRCLE_SIZE / 2}
              r={RADIUS}
              stroke={progress >= 1 ? '#43A047' : '#1E88E5'}
              strokeWidth={STROKE_WIDTH}
              fill="none"
              strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              rotation="-90"
              origin={`${CIRCLE_SIZE / 2}, ${CIRCLE_SIZE / 2}`}
            />
          </Svg2>
          <View style={styles.circleCenter}>
            <Text style={styles.bigNumber}>{consumed.toLocaleString()}</Text>
            <Text style={styles.bigUnit}>ml</Text>
            <Text style={styles.percentText}>{progressPercent}%</Text>
          </View>
        </Animated.View>

        {/* ── Info cards ── */}
        <View style={styles.infoRow}>
          <View style={styles.infoCard}>
            <View style={styles.infoCardDot} />
            <View>
              <Text style={styles.infoCardLabel}>Objetivo</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={styles.infoCardValue}>
                  {goal.toLocaleString()} ml ({progressPercent}%)
                </Text>
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
                {NEXT_REMINDER}{' '}
                <Text style={styles.infoCardSub}>(Falta {REMINDER_LEFT})</Text>
              </Text>
            </View>
          </View>
        </View>

        {/* ── Status ── */}
        <View style={[styles.statusCard, progress >= 1 && styles.statusDone]}>
          <Text style={styles.statusEmoji}>{statusEmoji}</Text>
          <Text style={styles.statusText}>{statusText}</Text>
        </View>

        {/* ── Tip ── */}
        <View style={styles.tipCard}>
          <Text style={styles.tipIcon}>💡</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.tipTitle}>Dica do dia</Text>
            <Text style={styles.tipText}>
              Beber água antes das refeições ajuda na digestão e controle do apetite.
            </Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Button ── */}
      <View style={styles.bottomArea}>
        <View style={styles.bottomContent}>
          <View style={styles.amountBubble}>
            <Text style={styles.amountBig}>+200</Text>
            <Text style={styles.amountSub}>ml</Text>
          </View>
          <Animated.View style={{ transform: [{ scale: btnScale }], width: '100%' }}>
            <TouchableOpacity style={styles.drinkBtn} onPress={handleAdd} activeOpacity={0.92}>
              <Text style={styles.drinkBtnText}>+ BEBER</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>

      {/* ── Goal Edit Modal ── */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="none"
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={closeModal} />

          <Animated.View
            style={[
              styles.modalSheet,
              { opacity: modalOpacity, transform: [{ scale: modalScale }] },
            ]}
          >
            {/* Modal header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalIconWrap}>
                <Droplets color="#1E88E5" size={22} />
              </View>
              <Text style={styles.modalTitle}>Alterar meta diária</Text>
              <TouchableOpacity onPress={closeModal} style={styles.modalCloseBtn}>
                <X color="#90A4AE" size={20} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Defina o volume diário de água (ml) que deseja consumir.
            </Text>

            {/* Input */}
            <View style={styles.inputRow}>
              <TextInput
                style={styles.goalInput}
                value={goalInput}
                onChangeText={setGoalInput}
                keyboardType="numeric"
                maxLength={5}
                selectTextOnFocus
                autoFocus
                placeholder="2500"
                placeholderTextColor="#B0BEC5"
              />
              <View style={styles.inputUnit}>
                <Text style={styles.inputUnitText}>ml</Text>
              </View>
            </View>

            {/* Quick presets */}
            <Text style={styles.presetsLabel}>Sugestões rápidas</Text>
            <View style={styles.presetsRow}>
              {[1500, 2000, 2500, 3000].map((v) => (
                <TouchableOpacity
                  key={v}
                  style={[styles.presetChip, goalInput === String(v) && styles.presetChipActive]}
                  onPress={() => setGoalInput(String(v))}
                >
                  <Text
                    style={[styles.presetChipText, goalInput === String(v) && styles.presetChipTextActive]}
                  >
                    {v.toLocaleString()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Actions */}
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
    </View>
  );
}

const AnimatedSvgCircle = Animated.createAnimatedComponent(SvgCircle);
function AnimatedCircle(props: any) {
  return <AnimatedSvgCircle {...props} />;
}

const styles = StyleSheet.create({
  // ── Root ──
  container: { flex: 1, backgroundColor: '#fff' }, // ← branco

  // ── Header ──
  header: {
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 5,
  },
  streakText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  headerIcons: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20,
    padding: 8,
  },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dropIconWrap: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 14,
    padding: 8,
  },
  greeting: { fontSize: 19, fontWeight: '800', color: '#fff' },
  goalText: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

  // ── Body ──
  body: { alignItems: 'center', paddingTop: 28, paddingHorizontal: 20 },

  // ── Circle ──
  circleWrap: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  circleCenter: { position: 'absolute', alignItems: 'center' },
  bigNumber: { fontSize: 52, fontWeight: '900', color: '#0D2B6B', letterSpacing: -2 },
  bigUnit: { fontSize: 16, color: '#90A4AE', fontWeight: '600', marginTop: -6 },
  percentText: { fontSize: 13, color: '#90A4AE', fontWeight: '700', marginTop: 2 },

  // ── Info cards ──
  infoRow: { flexDirection: 'row', gap: 12, width: '100%', marginBottom: 14 },
  infoCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    elevation: 2,
    shadowColor: '#1565C0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
  },
  infoCardDot: {
    width: 4,
    height: '100%',
    minHeight: 36,
    backgroundColor: '#1E88E5',
    borderRadius: 2,
  },
  infoCardLabel: { fontSize: 10, color: '#90A4AE', fontWeight: '600', marginBottom: 3 },
  infoCardValue: { fontSize: 13, fontWeight: '800', color: '#1A237E' },
  infoCardSub: { fontSize: 11, color: '#90A4AE', fontWeight: '500' },

  // ── Status ──
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    borderWidth: 1.5,
    borderColor: '#BBDEFB',
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#1565C0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  statusDone: { borderColor: '#FFC107', backgroundColor: '#FFFDE7' },
  statusEmoji: { fontSize: 26 },
  statusText: { flex: 1, color: '#1565C0', fontWeight: '700', fontSize: 13 },

  // ── Tip ──
  tipCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#1565C0',
    borderWidth: 1.5,
    borderColor: '#BBDEFB',
    width: '100%',
  },
  tipIcon: { fontSize: 20 },
  tipTitle: { fontWeight: '800', color: '#1565C0', marginBottom: 3, fontSize: 13 },
  tipText: { color: '#1976D2', fontSize: 12, lineHeight: 18 },

  // ── Bottom ──
  bottomArea: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  bottomContent: {
    backgroundColor: '#1E88E5',
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 32,
    alignItems: 'center',
    gap: 12,
  },
  amountBubble: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 4,
  },
  amountBig: { fontSize: 28, fontWeight: '900', color: '#fff' },
  amountSub: { fontSize: 16, color: 'rgba(255,255,255,0.85)', fontWeight: '600', marginBottom: 3 },
  drinkBtn: {
    backgroundColor: '#fff',
    borderRadius: 32,
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },
  drinkBtnText: { color: '#1565C0', fontSize: 18, fontWeight: '900', letterSpacing: 1 },

  // ── Modal ──
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  modalIconWrap: {
    backgroundColor: '#E3F2FD',
    borderRadius: 10,
    padding: 8,
  },
  modalTitle: { flex: 1, fontSize: 17, fontWeight: '800', color: '#0D2B6B' },
  modalCloseBtn: { padding: 4 },
  modalSubtitle: { fontSize: 13, color: '#90A4AE', marginBottom: 20, lineHeight: 18 },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#BBDEFB',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 20,
  },
  goalInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: '900',
    color: '#0D2B6B',
    paddingHorizontal: 16,
    paddingVertical: 14,
    letterSpacing: -1,
  },
  inputUnit: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  inputUnitText: { fontSize: 16, fontWeight: '700', color: '#1E88E5' },

  presetsLabel: { fontSize: 11, fontWeight: '700', color: '#90A4AE', marginBottom: 10, letterSpacing: 0.5 },
  presetsRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  presetChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#BBDEFB',
    alignItems: 'center',
  },
  presetChipActive: { backgroundColor: '#1E88E5', borderColor: '#1E88E5' },
  presetChipText: { fontSize: 13, fontWeight: '700', color: '#1E88E5' },
  presetChipTextActive: { color: '#fff' },

  modalActions: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#BBDEFB',
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: 15, fontWeight: '700', color: '#90A4AE' },
  saveBtn: {
    flex: 2,
    paddingVertical: 15,
    borderRadius: 24,
    backgroundColor: '#1E88E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    elevation: 3,
    shadowColor: '#1565C0',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  saveBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },
});