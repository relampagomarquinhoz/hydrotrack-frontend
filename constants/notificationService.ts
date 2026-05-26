import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
// Suprime aviso do Expo Go sobre push tokens (não usamos push remoto)
import { LogBox } from 'react-native';
LogBox.ignoreLogs(['expo-notifications: Android Push']);

// Configura como as notificações aparecem quando o app está aberto
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ─── Solicita permissão ───────────────────────────────────────
export async function requestNotificationPermission(): Promise<boolean> {
  if (!Device.isDevice) {
    console.log('Notificações só funcionam em dispositivo físico');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Permissão de notificação negada');
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('hydrotrack', {
      name: 'HydroTrack Lembretes',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1565C0',
      sound: 'default',
    });
  }

  return true;
}

// ─── Cancela todas as notificações agendadas ─────────────────
export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// ─── Agenda notificações de hidratação ───────────────────────
export async function scheduleHydrationNotifications(
  intervalMinutes: number,
  startTime: string,  // "07:00"
  endTime: string,    // "22:00"
  activeDays: number[] // [0,1,2,3,4,5,6]
) {
  // Cancela notificações anteriores
  await cancelAllNotifications();

  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return;

  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  const startTotal = startH * 60 + startM;
  const endTotal = endH * 60 + endM;

  const messages = [
    '💧 Hora de beber água! Mantenha-se hidratado.',
    '🚰 Lembrete: beba um copo de água agora!',
    '💦 Seu corpo precisa de água. Beba agora!',
    '🌊 Hidratação é saúde! Hora de beber água.',
    '⚡ Energia baixa? Beba água e se revitalize!',
  ];

  let count = 0;
  // Agenda para os próximos 7 dias
  for (let day = 0; day < 7; day++) {
    const date = new Date();
    date.setDate(date.getDate() + day);
    const dayOfWeek = date.getDay(); // 0=Dom, 6=Sáb

    if (!activeDays.includes(dayOfWeek)) continue;

    // Para cada slot de tempo no dia
    for (let slot = startTotal; slot < endTotal; slot += intervalMinutes) {
      const slotH = Math.floor(slot / 60);
      const slotM = slot % 60;

      const triggerDate = new Date(date);
      triggerDate.setHours(slotH, slotM, 0, 0);

      // Não agenda no passado
      if (triggerDate <= new Date()) continue;

      const message = messages[count % messages.length];
      count++;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '💧 HydroTrack',
          body: message,
          sound: 'default',
          data: { type: 'hydration_reminder' },
          ...(Platform.OS === 'android' && { channelId: 'hydrotrack' }),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
        },
      });

      // Limite de 60 notificações (limite do iOS/Android)
      if (count >= 60) break;
    }
    if (count >= 60) break;
  }

  console.log(`✅ ${count} notificações agendadas`);
  return count;
}
