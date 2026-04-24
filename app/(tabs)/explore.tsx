import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  StatusBar,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  ScrollView,
  Animated,
  PanResponder,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Droplets, TrendingUp, FileText, X, Award, Calendar, BarChart2, Star, Trash2 } from 'lucide-react-native';

const GOAL = 2500;

const INITIAL_HISTORY = [
  { id: '1', date: '12/03', amount: 2500, goal: GOAL },
  { id: '2', date: '11/03', amount: 1800, goal: GOAL },
  { id: '3', date: '10/03', amount: 2300, goal: GOAL },
  { id: '4', date: '09/03', amount: 2700, goal: GOAL },
  { id: '5', date: '08/03', amount: 1500, goal: GOAL },
  { id: '6', date: '07/03', amount: 2100, goal: GOAL },
  { id: '7', date: '06/03', amount: 2500, goal: GOAL },
];

type HistoryItem = { id: string; date: string; amount: number; goal: number };

// ─── Placeholder: substitua esta função pela chamada real à sua API ───────────
async function fetchReportFromAPI(historyData: HistoryItem[]): Promise<ReportData> {
  await new Promise((resolve) => setTimeout(resolve, 1200));
  const totalWeek = historyData.reduce((a, b) => a + b.amount, 0);
  const avgDay = Math.round(totalWeek / historyData.length);
  const daysMetGoal = historyData.filter((d) => d.amount >= d.goal).length;
  const bestDay = historyData.reduce((a, b) => (a.amount > b.amount ? a : b));
  return {
    avgDay,
    totalWeek,
    daysMetGoal,
    totalDays: historyData.length,
    bestDay: { date: bestDay.date, amount: bestDay.amount },
  };
}
// ─────────────────────────────────────────────────────────────────────────────

type ReportData = {
  avgDay: number;
  totalWeek: number;
  daysMetGoal: number;
  totalDays: number;
  bestDay: { date: string; amount: number };
};

function ReportModal({
  visible,
  onClose,
  historyData,
}: {
  visible: boolean;
  onClose: () => void;
  historyData: HistoryItem[];
}) {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (visible) {
      setReport(null);
      setError(null);
      setLoading(true);
      fetchReportFromAPI(historyData)
        .then((data) => setReport(data))
        .catch(() => setError('Não foi possível carregar o relatório. Verifique sua conexão.'))
        .finally(() => setLoading(false));
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={modal.overlay}>
        <View style={modal.sheet}>
          {/* Handle */}
          <View style={modal.handle} />

          {/* Header */}
          <View style={modal.header}>
            <View style={modal.headerLeft}>
              <FileText color="#1565C0" size={20} />
              <Text style={modal.title}>Relatório Semanal</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={modal.closeBtn}>
              <X color="#90A4AE" size={20} />
            </TouchableOpacity>
          </View>

          <Text style={modal.subtitle}>Resumo dos últimos 7 dias</Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Loading */}
            {loading && (
              <View style={modal.centered}>
                <ActivityIndicator size="large" color="#1E88E5" />
                <Text style={modal.loadingText}>Buscando dados do banco…</Text>
              </View>
            )}

            {/* Error */}
            {error && !loading && (
              <View style={modal.centered}>
                <Text style={modal.errorText}>{error}</Text>
              </View>
            )}

            {/* Content */}
            {report && !loading && (
              <View style={modal.content}>
                {/* Média diária */}
                <View style={modal.card}>
                  <View style={[modal.iconWrap, { backgroundColor: '#E3F2FD' }]}>
                    <TrendingUp color="#1E88E5" size={22} />
                  </View>
                  <View style={modal.cardText}>
                    <Text style={modal.cardLabel}>Média diária</Text>
                    <Text style={modal.cardValue}>{report.avgDay.toLocaleString()} ml</Text>
                  </View>
                  <View style={[modal.pill, report.avgDay >= GOAL ? modal.pillGreen : modal.pillBlue]}>
                    <Text style={[modal.pillText, report.avgDay >= GOAL ? modal.pillTextGreen : modal.pillTextBlue]}>
                      {report.avgDay >= GOAL ? 'Acima da meta' : `${Math.round((report.avgDay / GOAL) * 100)}% da meta`}
                    </Text>
                  </View>
                </View>

                {/* Total na semana */}
                <View style={modal.card}>
                  <View style={[modal.iconWrap, { backgroundColor: '#E8F5E9' }]}>
                    <Droplets color="#43A047" size={22} />
                  </View>
                  <View style={modal.cardText}>
                    <Text style={modal.cardLabel}>Total na semana</Text>
                    <Text style={modal.cardValue}>{(report.totalWeek / 1000).toFixed(2)} L</Text>
                  </View>
                </View>

                {/* Dias que bateu a meta */}
                <View style={modal.card}>
                  <View style={[modal.iconWrap, { backgroundColor: '#FFF8E1' }]}>
                    <Award color="#F9A825" size={22} />
                  </View>
                  <View style={modal.cardText}>
                    <Text style={modal.cardLabel}>Dias que bateu a meta</Text>
                    <Text style={modal.cardValue}>
                      {report.daysMetGoal} de {report.totalDays} dias
                    </Text>
                  </View>
                  {/* Mini progress */}
                  <View style={modal.metaBarWrap}>
                    {Array.from({ length: report.totalDays }).map((_, i) => (
                      <View
                        key={i}
                        style={[
                          modal.metaDot,
                          i < report.daysMetGoal ? modal.metaDotFilled : modal.metaDotEmpty,
                        ]}
                      />
                    ))}
                  </View>
                </View>

                {/* Melhor dia */}
                <View style={modal.card}>
                  <View style={[modal.iconWrap, { backgroundColor: '#FCE4EC' }]}>
                    <Star color="#E91E63" size={22} />
                  </View>
                  <View style={modal.cardText}>
                    <Text style={modal.cardLabel}>Melhor dia</Text>
                    <Text style={modal.cardValue}>
                      {report.bestDay.date} — {report.bestDay.amount.toLocaleString()} ml
                    </Text>
                  </View>
                </View>

                {/* Nota de rodapé */}
                <Text style={modal.footnote}>
                  * Dados sincronizados com o banco de dados
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Delete Confirmation Modal ────────────────────────────────────────────────
function DeleteConfirmModal({
  visible,
  item,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  item: HistoryItem | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={deleteModal.overlay}>
        <View style={deleteModal.box}>
          <View style={deleteModal.iconWrap}>
            <Trash2 color="#E53935" size={28} />
          </View>
          <Text style={deleteModal.title}>Excluir Registro</Text>
          <Text style={deleteModal.message}>
            Deseja excluir o registro do dia{' '}
            <Text style={deleteModal.highlight}>{item?.date}</Text> com{' '}
            <Text style={deleteModal.highlight}>{item?.amount.toLocaleString()} ml</Text>?
          </Text>
          <View style={deleteModal.actions}>
            <TouchableOpacity style={deleteModal.cancelBtn} onPress={onCancel} activeOpacity={0.8}>
              <Text style={deleteModal.cancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={deleteModal.confirmBtn} onPress={onConfirm} activeOpacity={0.8}>
              <Trash2 color="#fff" size={14} />
              <Text style={deleteModal.confirmText}>Excluir</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Swipeable History Card ───────────────────────────────────────────────────
const SWIPE_THRESHOLD = -72;

function HistoryCard({
  item,
  onDelete,
}: {
  item: HistoryItem;
  onDelete: (item: HistoryItem) => void;
}) {
  const reached = item.amount >= item.goal;
  const pct = Math.min(Math.round((item.amount / item.goal) * 100), 100);

  const translateX = useRef(new Animated.Value(0)).current;
  const rowHeight = useRef(new Animated.Value(82)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 8 && Math.abs(gs.dy) < 20,
      onPanResponderMove: (_, gs) => {
        if (gs.dx < 0) translateX.setValue(Math.max(gs.dx, SWIPE_THRESHOLD - 8));
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dx < SWIPE_THRESHOLD / 2) {
          Animated.spring(translateX, { toValue: SWIPE_THRESHOLD, useNativeDriver: false }).start();
        } else {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: false }).start();
        }
      },
    })
  ).current;

  const closeSwipe = () =>
    Animated.spring(translateX, { toValue: 0, useNativeDriver: false }).start();

  const handleDelete = () => {
    closeSwipe();
    onDelete(item);
  };

  return (
    <View style={styles.swipeContainer}>
      {/* Delete background */}
      <View style={styles.deleteBackground}>
        <TouchableOpacity style={styles.deleteAction} onPress={handleDelete} activeOpacity={0.8}>
          <Trash2 color="#fff" size={22} />
          <Text style={styles.deleteLabel}>Excluir</Text>
        </TouchableOpacity>
      </View>

      {/* Card foreground */}
      <Animated.View style={{ transform: [{ translateX }] }} {...panResponder.panHandlers}>
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <View style={styles.dateWrap}>
              <Text style={styles.dateText}>{item.date}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <View style={styles.cardTop}>
                <Text style={[styles.amount, reached && styles.amountGreen]}>
                  {item.amount.toLocaleString()} ml
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.badge, reached ? styles.badgeGreen : styles.badgeBlue]}>
                    {reached ? '✓ Meta' : `${pct}%`}
                  </Text>
                  <TouchableOpacity onPress={handleDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Trash2 color="#CFD8DC" size={16} />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.miniBar}>
                <View style={[styles.miniFill, { width: `${pct}%` }, reached && styles.miniFillGreen]} />
              </View>
            </View>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

export default function HistoryScreen() {
  const [reportVisible, setReportVisible] = useState(false);
  const [history, setHistory] = useState(INITIAL_HISTORY);
  const [deleteTarget, setDeleteTarget] = useState<HistoryItem | null>(null);

  const totalWeek = history.reduce((a, b) => a + b.amount, 0);
  const avgDay = history.length > 0 ? Math.round(totalWeek / history.length) : 0;

  const handleDeleteRequest = (item: HistoryItem) => setDeleteTarget(item);

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      setHistory((prev) => prev.filter((h) => h.id !== deleteTarget.id));
      setDeleteTarget(null);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <LinearGradient colors={['#1565C0', '#1E88E5', '#42A5F5']} style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Histórico</Text>
            <Text style={styles.headerSub}>Últimos {history.length} dias</Text>
          </View>
          <TouchableOpacity
            style={styles.reportBtn}
            onPress={() => setReportVisible(true)}
            activeOpacity={0.8}
          >
            <FileText color="#1565C0" size={16} />
            <Text style={styles.reportBtnText}>Relatório</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <TrendingUp color="#fff" size={18} />
            <Text style={styles.statValue}>{avgDay.toLocaleString()} ml</Text>
            <Text style={styles.statLabel}>Média/dia</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Droplets color="#fff" size={18} />
            <Text style={styles.statValue}>{(totalWeek / 1000).toFixed(1)} L</Text>
            <Text style={styles.statLabel}>Total na semana</Text>
          </View>
        </View>
      </LinearGradient>

      {history.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Droplets color="#B0BEC5" size={48} />
          <Text style={styles.emptyText}>Nenhum registro encontrado</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <HistoryCard item={item} onDelete={handleDeleteRequest} />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      <ReportModal
        visible={reportVisible}
        onClose={() => setReportVisible(false)}
        historyData={history}
      />

      <DeleteConfirmModal
        visible={!!deleteTarget}
        item={deleteTarget}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F7FF' },
  header: {
    paddingTop: 56,
    paddingHorizontal: 24,
    paddingBottom: 28,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 2 },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)' },
  reportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    gap: 6,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  reportBtnText: { color: '#1565C0', fontWeight: '700', fontSize: 13 },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
  },
  statBox: { flex: 1, alignItems: 'center', gap: 4 },
  statDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.3)' },
  statValue: { fontSize: 20, fontWeight: '800', color: '#fff' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)' },
  list: { padding: 16, gap: 10 },
  swipeContainer: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 0,
  },
  deleteBackground: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: '#E53935',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteAction: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    flex: 1,
    width: '100%',
  },
  deleteLabel: { color: '#fff', fontSize: 10, fontWeight: '700' },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { color: '#90A4AE', fontSize: 15, fontWeight: '600' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    elevation: 3,
    shadowColor: '#1565C0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  dateWrap: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    minWidth: 56,
  },
  dateText: { color: '#1565C0', fontWeight: '700', fontSize: 14 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  amount: { fontSize: 17, fontWeight: '700', color: '#1E88E5' },
  amountGreen: { color: '#2E7D32' },
  badge: { fontSize: 11, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeBlue: { backgroundColor: '#E3F2FD', color: '#1565C0' },
  badgeGreen: { backgroundColor: '#E8F5E9', color: '#2E7D32' },
  miniBar: { height: 6, backgroundColor: '#E3F2FD', borderRadius: 3, overflow: 'hidden' },
  miniFill: { height: '100%', backgroundColor: '#1E88E5', borderRadius: 3 },
  miniFillGreen: { backgroundColor: '#43A047' },
});

const modal = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 12,
    maxHeight: '85%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    backgroundColor: '#CFD8DC',
    borderRadius: 2,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 18, fontWeight: '800', color: '#1565C0' },
  subtitle: { fontSize: 12, color: '#90A4AE', marginBottom: 20 },
  closeBtn: {
    backgroundColor: '#F0F4F8',
    borderRadius: 20,
    padding: 6,
  },
  centered: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  loadingText: { color: '#90A4AE', fontSize: 13 },
  errorText: { color: '#E53935', fontSize: 14, textAlign: 'center' },
  content: { gap: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FBFF',
    borderRadius: 16,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E3EDF7',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: { flex: 1 },
  cardLabel: { fontSize: 11, color: '#90A4AE', fontWeight: '600', marginBottom: 2 },
  cardValue: { fontSize: 16, fontWeight: '800', color: '#1A237E' },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  pillBlue: { backgroundColor: '#E3F2FD' },
  pillGreen: { backgroundColor: '#E8F5E9' },
  pillText: { fontSize: 10, fontWeight: '700' },
  pillTextBlue: { color: '#1565C0' },
  pillTextGreen: { color: '#2E7D32' },
  metaBarWrap: { flexDirection: 'row', gap: 4 },
  metaDot: { width: 10, height: 10, borderRadius: 5 },
  metaDotFilled: { backgroundColor: '#F9A825' },
  metaDotEmpty: { backgroundColor: '#ECEFF1' },
  footnote: {
    fontSize: 11,
    color: '#B0BEC5',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
});

const deleteModal = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  box: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  iconWrap: {
    backgroundColor: '#FFEBEE',
    borderRadius: 50,
    padding: 14,
    marginBottom: 16,
  },
  title: { fontSize: 18, fontWeight: '800', color: '#1A237E', marginBottom: 8 },
  message: { fontSize: 14, color: '#607D8B', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  highlight: { fontWeight: '700', color: '#1565C0' },
  actions: { flexDirection: 'row', gap: 12, width: '100%' },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#F0F4F8',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelText: { color: '#607D8B', fontWeight: '700', fontSize: 14 },
  confirmBtn: {
    flex: 1,
    backgroundColor: '#E53935',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  confirmText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});