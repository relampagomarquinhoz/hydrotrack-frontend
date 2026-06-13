import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { router, useFocusEffect } from 'expo-router';
import { Bell, Calculator, Camera, ChevronRight, Clock, Droplets, KeyRound, LogOut, Moon, Pencil, Settings, ShieldCheck, Sun, User, X } from 'lucide-react-native';
import React, { useState, useCallback } from 'react';
import { ActivityIndicator, Alert, Image, Linking, Modal, ScrollView, StatusBar, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../constants/AuthContext';
import { authFetch } from '../../constants/api';
import { scheduleHydrationNotifications, requestNotificationPermission } from '../../constants/notificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const INTERVAL_OPTIONS = [
  { label: '30 min', value: 30 },
  { label: '1 hora', value: 60 },
  { label: '1h30', value: 90 },
  { label: '2 horas', value: 120 },
];
const DAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export default function ProfileScreen() {
  const { userName, token, logout, isAdmin, setNotifSettings } = useAuth();
  const [alerts, setAlerts] = useState(true);
  const [calcVisible, setCalcVisible] = useState(false);
  const [notifVisible, setNotifVisible] = useState(false);
  const [calcWeight, setCalcWeight] = useState('');
  const [calcAge, setCalcAge] = useState('');
  const [calcResult, setCalcResult] = useState<number | null>(null);
  const [interval, setIntervalVal] = useState(60);
  const [startHour, setStartHour] = useState('07:00');
  const [endHour, setEndHour] = useState('22:00');
  const [activeDays, setActiveDays] = useState([0, 1, 2, 3, 4, 5, 6]);
  const [userEmail, setUserEmail] = useState('');
  const [userGoal, setUserGoal] = useState<number | null>(null);
  // ✅ Foto de perfil local
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  // Estados — Editar perfil
  const [editVisible, setEditVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editWeight, setEditWeight] = useState('');
  const [editHeight, setEditHeight] = useState('');
  const [editGender, setEditGender] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Estados — Alterar senha
  const [passVisible, setPassVisible] = useState(false);
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passLoading, setPassLoading] = useState(false);

  const bg = '#F0F7FF';
  const cardBg = '#fff';
  const text = '#1A237E';
  const textSub = '#546E7A';
  const border = '#BBDEFB';

  useFocusEffect(useCallback(() => {
    if (!token) return;

    authFetch('/auth/me', token).then(r => r.json()).then(d => {
      if (d.user) {
        const email = d.user.email ?? '';
        setUserEmail(email);
        setUserGoal(d.user.daily_goal_ml ?? null);
        // Pré-preenche os campos de edição
        setEditName(d.user.name ?? '');
        setEditWeight(d.user.weight_kg ? String(d.user.weight_kg) : '');
        setEditHeight(d.user.height_cm ? String(d.user.height_cm) : '');
        setEditGender(d.user.gender ?? '');
        // Carrega foto salva por usuário
        if (email) {
          AsyncStorage.getItem(`@hydrotrack_photo_${email}`).then(uri => {
            if (uri) setPhotoUri(uri);
          }).catch(() => {});
        }
      }
    }).catch(() => {});

    authFetch('/notifications/settings', token).then(r => r.json()).then(async d => {
      if (d.success !== false) {
        const s = d.settings ?? d;
        const iv  = s.interval_minutes ?? 60;
        const sh  = typeof s.start_time === 'string' ? s.start_time.substring(0,5) : '07:00';
        const eh  = typeof s.end_time === 'string' ? s.end_time.substring(0,5) : '22:00';
        const ad  = s.active_days ?? [0,1,2,3,4,5,6];
        const en  = s.enabled ?? true;
        setIntervalVal(iv);
        setStartHour(sh);
        setEndHour(eh);
        setActiveDays(ad);
        setAlerts(en);

        // ✅ Reagenda ao abrir o app — garante que as 60 notificações estão sempre frescas
        if (en) {
          scheduleHydrationNotifications(iv, sh, eh, ad).catch(() => {});
        }
      }
    }).catch(() => {});
  }, [token]));

  const toggleDay = (i: number) => setActiveDays(prev =>
    prev.includes(i) ? prev.filter(d => d !== i) : [...prev, i]
  );

  const handleCalc = () => {
    const w = parseFloat(calcWeight);
    const a = parseInt(calcAge);
    if (!w || !a) { Alert.alert('Atenção', 'Preencha peso e idade'); return; }
    const mlPerKg = a < 18 ? 40 : a <= 55 ? 35 : 30;
    setCalcResult(Math.round(w * mlPerKg));
  };

  const handleApplyCalcResult = async () => {
    if (!calcResult) return;
    try {
      await authFetch('/auth/me', token, {
        method: 'PUT',
        body: JSON.stringify({ daily_goal_ml: calcResult }),
      });
      setUserGoal(calcResult);
      setCalcVisible(false);
      setCalcResult(null);
      setCalcWeight('');
      setCalcAge('');
      Alert.alert('Meta atualizada!', `Sua nova meta diária é ${calcResult.toLocaleString()} ml.`);
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível salvar a meta. Tente novamente.');
    }
  };

  const handleSaveNotif = async () => {
    // ✅ Atualiza contexto global imediatamente — tela início reflete na hora
    setNotifSettings({
      enabled: alerts,
      interval_minutes: interval,
      start_time: startHour,
      end_time: endHour,
      active_days: activeDays,
    });

    try {
      await authFetch('/notifications/settings', token, {
        method: 'PUT',
        body: JSON.stringify({
          enabled: alerts,
          interval_minutes: interval,
          start_time: startHour,
          end_time: endHour,
          active_days: activeDays,
        }),
      });
    } catch (e) {}

    // ✅ Reagenda notificações locais com as novas configurações
    if (alerts) {
      await scheduleHydrationNotifications(interval, startHour, endHour, activeDays);
    } else {
      const { cancelAllNotifications } = await import('../../constants/notificationService');
      await cancelAllNotifications();
    }

    if (alerts) {
      // Garante permissão antes de tentar agendar
      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert('Permissão negada', 'Permita notificações nas configurações do dispositivo para receber lembretes.');
        return;
      }
      const count = await scheduleHydrationNotifications(interval, startHour, endHour, activeDays);
      setNotifVisible(false);
      Alert.alert('Salvo!', `${count} lembretes agendados!\nA cada ${interval >= 60 ? `${interval / 60}h` : `${interval}min`}, das ${startHour} às ${endHour}.`);
    } else {
      const { cancelAllNotifications } = await import('../../constants/notificationService');
      await cancelAllNotifications();
      setNotifVisible(false);
      Alert.alert('Salvo!', 'Lembretes desativados.');
    }
  };

  // Salvar edição de perfil
  const handleSaveEdit = async () => {
    if (!editName.trim()) { Alert.alert('Atenção', 'O nome não pode ficar vazio.'); return; }
    setEditLoading(true);
    try {
      const res = await authFetch('/auth/me', token, {
        method: 'PUT',
        body: JSON.stringify({
          name:      editName.trim(),
          weight_kg: editWeight  ? parseFloat(editWeight)  : undefined,
          height_cm: editHeight  ? parseFloat(editHeight)  : undefined,
          gender:    editGender  || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { Alert.alert('Erro', data.message || 'Não foi possível salvar.'); return; }
      if (data.user?.daily_goal_ml) setUserGoal(data.user.daily_goal_ml);
      setEditVisible(false);
      Alert.alert('Sucesso!', 'Perfil atualizado com sucesso.');
    } catch {
      Alert.alert('Erro', 'Não foi possível conectar ao servidor.');
    } finally {
      setEditLoading(false);
    }
  };

  // Alterar senha
  const handleChangePassword = async () => {
    if (!currentPass || !newPass || !confirmPass) { Alert.alert('Atenção', 'Preencha todos os campos.'); return; }
    if (newPass.length < 6) { Alert.alert('Atenção', 'A nova senha deve ter pelo menos 6 caracteres.'); return; }
    if (newPass !== confirmPass) { Alert.alert('Erro', 'A nova senha e a confirmação não coincidem.'); return; }
    setPassLoading(true);
    try {
      const res = await authFetch('/auth/change-password', token, {
        method: 'POST',
        body: JSON.stringify({ currentPassword: currentPass, newPassword: newPass }),
      });
      const data = await res.json();
      if (!res.ok) { Alert.alert('Erro', data.message || 'Não foi possível alterar a senha.'); return; }
      setPassVisible(false);
      setCurrentPass(''); setNewPass(''); setConfirmPass('');
      Alert.alert('Sucesso!', 'Senha alterada com sucesso.');
    } catch {
      Alert.alert('Erro', 'Não foi possível conectar ao servidor.');
    } finally {
      setPassLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sair', 'Deseja realmente sair da conta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => { logout(); router.replace('/login'); } },
    ]);
  };

  // ✅ Abre câmera ou galeria e salva URI localmente
  const handlePhoto = () => {
    Alert.alert('Foto de perfil', 'Escolha uma opção', [
      {
        text: 'Câmera',
        onPress: async () => {
          const perm = await ImagePicker.requestCameraPermissionsAsync();
          if (!perm.granted) { Alert.alert('Permissão negada', 'Permita o acesso à câmera nas configurações.'); return; }
          const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
          });
          if (!result.canceled && result.assets[0]) {
            const uri = result.assets[0].uri;
            setPhotoUri(uri);
            if (userEmail) await AsyncStorage.setItem(`@hydrotrack_photo_${userEmail}`, uri);
          }
        },
      },
      {
        text: 'Galeria',
        onPress: async () => {
          const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!perm.granted) { Alert.alert('Permissão negada', 'Permita o acesso à galeria nas configurações.'); return; }
          const result = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
          });
          if (!result.canceled && result.assets[0]) {
            const uri = result.assets[0].uri;
            setPhotoUri(uri);
            if (userEmail) await AsyncStorage.setItem(`@hydrotrack_photo_${userEmail}`, uri);
          }
        },
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const notifSummary = alerts
    ? `A cada ${interval >= 60 ? `${interval / 60}h` : `${interval}min`} · ${startHour}–${endHour}`
    : 'Lembretes desativados';
  const displayName = userName || 'Usuário';

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#1565C0', '#1E88E5', '#42A5F5']} style={styles.header}>
        <View style={styles.avatarWrap}>
          {/* ✅ Mostra foto real se tiver, senão ícone padrão */}
          <TouchableOpacity onPress={handlePhoto} activeOpacity={0.85}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.avatarPhoto} />
            ) : (
              <View style={styles.avatar}><User color="#1565C0" size={38} /></View>
            )}
            <View style={styles.cameraBtn}><Camera color="#fff" size={14} /></View>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerName}>{displayName}</Text>
        {userEmail ? <Text style={styles.headerEmail}>{userEmail}</Text> : null}
        {userGoal ? (
          <Text style={styles.headerGoal}>Meta: {userGoal.toLocaleString()} ml/dia</Text>
        ) : null}
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionRow}>
          <Settings color="#1565C0" size={16} />
          <Text style={[styles.sectionTitle, { color: text }]}>Configurações</Text>
        </View>

        <View style={[styles.settingsCard, { backgroundColor: cardBg, borderColor: border }]}>
          <TouchableOpacity style={styles.settingRow} onPress={handlePhoto} activeOpacity={0.7}>
            <View style={[styles.settingIconWrap, { backgroundColor: '#E3F2FD' }]}><Camera color="#1565C0" size={18} /></View>
            <View style={styles.settingText}>
              <Text style={[styles.settingLabel, { color: text }]}>Alterar foto de perfil</Text>
              <Text style={[styles.settingHint, { color: textSub }]}>{photoUri ? 'Foto definida ✓' : 'Câmera ou galeria'}</Text>
            </View>
            <ChevronRight color={textSub} size={16} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: border }]} />

          <TouchableOpacity style={styles.settingRow} onPress={() => setEditVisible(true)} activeOpacity={0.7}>
            <View style={[styles.settingIconWrap, { backgroundColor: '#E8F5E9' }]}><Pencil color="#2E7D32" size={18} /></View>
            <View style={styles.settingText}>
              <Text style={[styles.settingLabel, { color: text }]}>Editar dados do perfil</Text>
              <Text style={[styles.settingHint, { color: textSub }]}>Nome, peso, altura e gênero</Text>
            </View>
            <ChevronRight color={textSub} size={16} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: border }]} />

          <TouchableOpacity style={styles.settingRow} onPress={() => setPassVisible(true)} activeOpacity={0.7}>
            <View style={[styles.settingIconWrap, { backgroundColor: '#FCE4EC' }]}><KeyRound color="#C62828" size={18} /></View>
            <View style={styles.settingText}>
              <Text style={[styles.settingLabel, { color: text }]}>Alterar senha</Text>
              <Text style={[styles.settingHint, { color: textSub }]}>Troque sua senha de acesso</Text>
            </View>
            <ChevronRight color={textSub} size={16} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: border }]} />

          <TouchableOpacity style={styles.settingRow} onPress={() => setCalcVisible(true)} activeOpacity={0.7}>
            <View style={[styles.settingIconWrap, { backgroundColor: '#E8F5E9' }]}><Calculator color="#2E7D32" size={18} /></View>
            <View style={styles.settingText}>
              <Text style={[styles.settingLabel, { color: text }]}>Calcular meta de água</Text>
              <Text style={[styles.settingHint, { color: textSub }]}>Baseado no seu peso e idade</Text>
            </View>
            <ChevronRight color={textSub} size={16} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: border }]} />

          <View style={styles.settingRow}>
            <View style={[styles.settingIconWrap, { backgroundColor: alerts ? '#FFF8E1' : '#F5F5F5' }]}>
              <Bell color={alerts ? '#F57F17' : textSub} size={18} />
            </View>
            <View style={styles.settingText}>
              <Text style={[styles.settingLabel, { color: text }]}>Alertas de hidratação</Text>
              <Text style={[styles.settingHint, { color: textSub }]}>{notifSummary}</Text>
            </View>
            <Switch value={alerts} onValueChange={setAlerts} trackColor={{ false: '#BBDEFB', true: '#F57F17' }} thumbColor="#fff" />
          </View>

          {alerts && (
            <>
              <View style={[styles.divider, { backgroundColor: border, marginLeft: 64 }]} />
              <TouchableOpacity style={[styles.settingRow, styles.subRow]} onPress={() => setNotifVisible(true)} activeOpacity={0.7}>
                <View style={[styles.settingIconWrap, { backgroundColor: '#EDE7F6' }]}><Clock color="#6A1B9A" size={18} /></View>
                <View style={styles.settingText}>
                  <Text style={[styles.settingLabel, { color: text }]}>Configurar lembretes</Text>
                  <Text style={[styles.settingHint, { color: textSub }]}>Intervalo, horário e dias</Text>
                </View>
                <ChevronRight color={textSub} size={16} />
              </TouchableOpacity>
            </>
          )}
        </View>

        {isAdmin && (
          <TouchableOpacity
            style={styles.adminBtn}
            onPress={() => Linking.openURL('https://hydrotrack-frontend.vercel.app/painel-admin.html')}
            activeOpacity={0.8}
          >
            <ShieldCheck color="#C62828" size={18} />
            <View style={{ flex: 1 }}>
              <Text style={styles.adminBtnText}>Painel Admin</Text>
              <Text style={styles.adminBtnHint}>Ver métricas do app</Text>
            </View>
            <ChevronRight color="#C62828" size={16} />
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <LogOut color="#C62828" size={18} />
          <Text style={styles.logoutText}>Sair da conta</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal Calculadora */}
      <Modal visible={calcVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: cardBg }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}><Droplets color="#1565C0" size={20} /><Text style={[styles.modalTitle, { color: text }]}>Calcular meta de água</Text></View>
              <TouchableOpacity onPress={() => { setCalcVisible(false); setCalcResult(null); setCalcWeight(''); setCalcAge(''); }}><X color={textSub} size={20} /></TouchableOpacity>
            </View>
            <Text style={[styles.modalHint, { color: textSub }]}>A fórmula leva em conta seu peso e idade para estimar a ingestão diária ideal.</Text>
            <View style={[styles.calcInput, { borderColor: border }]}>
              <Text style={[styles.calcInputLabel, { color: textSub }]}>Peso (kg)</Text>
              <TextInput style={[styles.calcInputField, { color: text }]} placeholder="Ex: 70" placeholderTextColor={textSub} value={calcWeight} onChangeText={setCalcWeight} keyboardType="numeric" />
            </View>
            <View style={[styles.calcInput, { borderColor: border }]}>
              <Text style={[styles.calcInputLabel, { color: textSub }]}>Idade</Text>
              <TextInput style={[styles.calcInputField, { color: text }]} placeholder="Ex: 25" placeholderTextColor={textSub} value={calcAge} onChangeText={setCalcAge} keyboardType="numeric" />
            </View>
            <TouchableOpacity onPress={handleCalc} activeOpacity={0.85}>
              <LinearGradient colors={['#1565C0', '#0D47A1']} style={styles.calcBtn}><Text style={styles.calcBtnText}>Calcular</Text></LinearGradient>
            </TouchableOpacity>
            {calcResult !== null && (
              <View style={styles.resultBox}>
                <Text style={[styles.resultLabel, { color: textSub }]}>Sua meta diária sugerida</Text>
                <View style={styles.resultValueRow}><Droplets color="#1565C0" size={22} /><Text style={styles.resultValue}>{calcResult.toLocaleString()} ml</Text></View>
                <Text style={[styles.resultSub, { color: textSub }]}>≈ {Math.round(calcResult / 250)} copos de 250 ml por dia</Text>
                <TouchableOpacity onPress={handleApplyCalcResult} activeOpacity={0.85} style={styles.applyGoalBtn}>
                  <Text style={styles.applyGoalBtnText}>Usar esta meta</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal Notificações */}
      <Modal visible={notifVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: cardBg }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}><Bell color="#F57F17" size={20} /><Text style={[styles.modalTitle, { color: text }]}>Configurar lembretes</Text></View>
              <TouchableOpacity onPress={() => setNotifVisible(false)}><X color={textSub} size={20} /></TouchableOpacity>
            </View>
            <Text style={[styles.notifSectionLabel, { color: text }]}>Intervalo entre lembretes</Text>
            <View style={styles.intervalRow}>
              {INTERVAL_OPTIONS.map(opt => (
                <TouchableOpacity key={opt.value} style={[styles.intervalBtn, { borderColor: border }, interval === opt.value && styles.intervalBtnActive]} onPress={() => setIntervalVal(opt.value)} activeOpacity={0.8}>
                  <Text style={[styles.intervalLabel, { color: textSub }, interval === opt.value && styles.intervalLabelActive]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.notifSectionLabel, { color: text }]}>Período de notificações</Text>
            <View style={styles.timeRow}>
              <View style={styles.timeBlock}>
                <Sun color="#F57F17" size={16} />
                <Text style={[styles.timeLabel, { color: textSub }]}>Início</Text>
                <TextInput style={[styles.timeInput, { borderColor: border, color: text }]} value={startHour} onChangeText={setStartHour} placeholder="07:00" placeholderTextColor={textSub} keyboardType="numbers-and-punctuation" maxLength={5} />
              </View>
              <View style={[styles.timeDash, { backgroundColor: border }]} />
              <View style={styles.timeBlock}>
                <Moon color="#6A1B9A" size={16} />
                <Text style={[styles.timeLabel, { color: textSub }]}>Fim</Text>
                <TextInput style={[styles.timeInput, { borderColor: border, color: text }]} value={endHour} onChangeText={setEndHour} placeholder="22:00" placeholderTextColor={textSub} keyboardType="numbers-and-punctuation" maxLength={5} />
              </View>
            </View>
            <Text style={[styles.notifSectionLabel, { color: text }]}>Dias ativos</Text>
            <View style={styles.daysRow}>
              {DAYS.map((d, i) => (
                <TouchableOpacity key={i} style={[styles.dayBtn, { borderColor: border }, activeDays.includes(i) && styles.dayBtnActive]} onPress={() => toggleDay(i)} activeOpacity={0.8}>
                  <Text style={[styles.dayLabel, { color: textSub }, activeDays.includes(i) && styles.dayLabelActive]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity onPress={handleSaveNotif} activeOpacity={0.85}>
              <LinearGradient colors={['#1565C0', '#0D47A1']} style={styles.calcBtn}><Text style={styles.calcBtnText}>Salvar configurações</Text></LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Modal Editar Perfil */}
      <Modal visible={editVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: cardBg }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}><Pencil color="#2E7D32" size={20} /><Text style={[styles.modalTitle, { color: text }]}>Editar dados do perfil</Text></View>
              <TouchableOpacity onPress={() => setEditVisible(false)}><X color={textSub} size={20} /></TouchableOpacity>
            </View>

            <View style={[styles.calcInput, { borderColor: border }]}>
              <Text style={[styles.calcInputLabel, { color: textSub }]}>Nome</Text>
              <TextInput style={[styles.calcInputField, { color: text }]} placeholder="Seu nome" placeholderTextColor={textSub} value={editName} onChangeText={setEditName} autoCapitalize="words" />
            </View>

            <View style={[styles.calcInput, { borderColor: border }]}>
              <Text style={[styles.calcInputLabel, { color: textSub }]}>Peso (kg)</Text>
              <TextInput style={[styles.calcInputField, { color: text }]} placeholder="Ex: 70" placeholderTextColor={textSub} value={editWeight} onChangeText={setEditWeight} keyboardType="numeric" />
            </View>

            <View style={[styles.calcInput, { borderColor: border }]}>
              <Text style={[styles.calcInputLabel, { color: textSub }]}>Altura (cm)</Text>
              <TextInput style={[styles.calcInputField, { color: text }]} placeholder="Ex: 170" placeholderTextColor={textSub} value={editHeight} onChangeText={setEditHeight} keyboardType="numeric" />
            </View>

            <Text style={[styles.notifSectionLabel, { color: text }]}>Gênero</Text>
            <View style={styles.intervalRow}>
              {['Masculino', 'Feminino', 'Outro'].map(g => (
                <TouchableOpacity key={g} style={[styles.intervalBtn, { borderColor: border }, editGender === g && styles.intervalBtnActive]} onPress={() => setEditGender(g)} activeOpacity={0.8}>
                  <Text style={[styles.intervalLabel, { color: textSub }, editGender === g && styles.intervalLabelActive]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity onPress={handleSaveEdit} activeOpacity={0.85} disabled={editLoading}>
              <LinearGradient colors={['#2E7D32', '#1B5E20']} style={styles.calcBtn}>
                {editLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.calcBtnText}>Salvar alterações</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Alterar Senha */}
      <Modal visible={passVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: cardBg }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}><KeyRound color="#C62828" size={20} /><Text style={[styles.modalTitle, { color: text }]}>Alterar senha</Text></View>
              <TouchableOpacity onPress={() => { setPassVisible(false); setCurrentPass(''); setNewPass(''); setConfirmPass(''); }}>
                <X color={textSub} size={20} />
              </TouchableOpacity>
            </View>

            <View style={[styles.calcInput, { borderColor: border }]}>
              <Text style={[styles.calcInputLabel, { color: textSub }]}>Senha atual</Text>
              <TextInput style={[styles.calcInputField, { color: text }]} placeholder="••••••" placeholderTextColor={textSub} value={currentPass} onChangeText={setCurrentPass} secureTextEntry />
            </View>

            <View style={[styles.calcInput, { borderColor: border }]}>
              <Text style={[styles.calcInputLabel, { color: textSub }]}>Nova senha</Text>
              <TextInput style={[styles.calcInputField, { color: text }]} placeholder="Mínimo 6 caracteres" placeholderTextColor={textSub} value={newPass} onChangeText={setNewPass} secureTextEntry />
            </View>

            <View style={[styles.calcInput, { borderColor: border }]}>
              <Text style={[styles.calcInputLabel, { color: textSub }]}>Confirmar nova senha</Text>
              <TextInput style={[styles.calcInputField, { color: text }]} placeholder="Repita a nova senha" placeholderTextColor={textSub} value={confirmPass} onChangeText={setConfirmPass} secureTextEntry />
            </View>

            <TouchableOpacity onPress={handleChangePassword} activeOpacity={0.85} disabled={passLoading}>
              <LinearGradient colors={['#C62828', '#B71C1C']} style={styles.calcBtn}>
                {passLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.calcBtnText}>Alterar senha</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 56, paddingBottom: 28, alignItems: 'center', gap: 4, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  avatarWrap: { position: 'relative', marginBottom: 4 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.6)' },
  avatarPhoto: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: 'rgba(255,255,255,0.6)' },
  cameraBtn: { position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, backgroundColor: '#1565C0', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  headerName: { fontSize: 20, fontWeight: '800', color: '#fff' },
  headerEmail: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  headerGoal: { fontSize: 12, color: 'rgba(255,255,255,0.9)', fontWeight: '600', backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginTop: 4 },
  body: { padding: 20, gap: 12, paddingBottom: 40 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 6 },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  settingsCard: { borderRadius: 20, borderWidth: 1, overflow: 'hidden', elevation: 3, shadowColor: '#1565C0', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  subRow: { paddingLeft: 20 },
  settingText: { flex: 1 },
  settingIconWrap: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  settingLabel: { fontSize: 14, fontWeight: '600' },
  settingHint: { fontSize: 11, marginTop: 1 },
  divider: { height: 0.5, marginHorizontal: 16 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 16, borderWidth: 1.5, borderColor: '#FFCDD2', backgroundColor: '#FFF5F5', marginTop: 4 },
  logoutText: { color: '#C62828', fontSize: 15, fontWeight: '700' },
  adminBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 16, borderWidth: 1.5, borderColor: '#FFCDD2', backgroundColor: '#FFF5F5', marginTop: 4 },
  adminBtnText: { fontSize: 14, fontWeight: '700', color: '#C62828' },
  adminBtnHint: { fontSize: 11, color: '#EF9A9A', marginTop: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, gap: 14, elevation: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modalTitle: { fontSize: 17, fontWeight: '800' },
  modalHint: { fontSize: 13, lineHeight: 18 },
  calcInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  calcInputLabel: { fontSize: 13, fontWeight: '600' },
  calcInputField: { fontSize: 15, fontWeight: '700', textAlign: 'right', flex: 1 },
  calcBtn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  calcBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  resultBox: { backgroundColor: '#E3F2FD', borderRadius: 16, padding: 16, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#BBDEFB' },
  resultLabel: { fontSize: 12 },
  resultValueRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  resultValue: { fontSize: 32, fontWeight: '900', color: '#1565C0' },
  resultSub: { fontSize: 12 },
  applyGoalBtn: { marginTop: 4, backgroundColor: '#1565C0', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 24, alignSelf: 'stretch', alignItems: 'center' },
  applyGoalBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  notifSectionLabel: { fontSize: 13, fontWeight: '700', marginBottom: -4 },
  intervalRow: { flexDirection: 'row', gap: 8 },
  intervalBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', backgroundColor: 'transparent' },
  intervalBtnActive: { backgroundColor: '#E3F2FD', borderColor: '#1565C0' },
  intervalLabel: { fontSize: 12, fontWeight: '600' },
  intervalLabelActive: { color: '#1565C0', fontWeight: '800' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  timeBlock: { flex: 1, alignItems: 'center', gap: 4 },
  timeLabel: { fontSize: 11, fontWeight: '600' },
  timeInput: { borderWidth: 1.5, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14, fontSize: 18, fontWeight: '800', textAlign: 'center', width: '100%' },
  timeDash: { width: 16, height: 2, borderRadius: 1, marginTop: 18 },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayBtn: { width: 38, height: 38, borderRadius: 19, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center' },
  dayBtnActive: { backgroundColor: '#1565C0', borderColor: '#1565C0' },
  dayLabel: { fontSize: 12, fontWeight: '700' },
  dayLabelActive: { color: '#fff' },
});