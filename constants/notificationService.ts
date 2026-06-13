import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { LogBox } from 'react-native';
LogBox.ignoreLogs(['expo-notifications: Android Push']);

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

// ─── Flag para evitar agendamentos simultâneos ────────────────
let isScheduling = false;

// ─── Agenda notificações de hidratação ───────────────────────
export async function scheduleHydrationNotifications(
  intervalMinutes: number,
  startTime: string,   // "07:00"
  endTime: string,     // "22:00"
  activeDays: number[] // [0,1,2,3,4,5,6]
) {
  // ✅ Evita chamadas simultâneas/duplicadas
  if (isScheduling) {
    console.log('⚠️ Agendamento já em andamento, ignorando chamada duplicada');
    return 0;
  }
  isScheduling = true;

  try {
    await cancelAllNotifications();

    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) return 0;

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

    // ✅ Captura "agora" UMA vez fora do loop e adiciona margem de segurança de 2 minutos.
    // Isso evita que slots muito próximos do momento atual sejam agendados com timestamp
    // já expirado, o que faz o SO disparar tudo imediatamente.
    const now = new Date();
    const safeNow = new Date(now.getTime() + 2 * 60 * 1000); // agora + 2 min

    let count = 0;

    for (let day = 0; day < 7; day++) {
      // ✅ Cria uma data base limpa para cada dia (sem herdar hora/minuto atual)
      const baseDate = new Date(now);
      baseDate.setDate(now.getDate() + day);
      baseDate.setSeconds(0, 0); // zera segundos e milissegundos

      const dayOfWeek = baseDate.getDay();
      if (!activeDays.includes(dayOfWeek)) continue;

      for (let slot = startTotal; slot < endTotal; slot += intervalMinutes) {
        const slotH = Math.floor(slot / 60);
        const slotM = slot % 60;

        const triggerDate = new Date(baseDate);
        triggerDate.setHours(slotH, slotM, 0, 0);

        // ✅ Usa safeNow (com margem) para não agendar timestamps que já expiraram
        if (triggerDate.getTime() <= safeNow.getTime()) continue;

        const message = messages[count % messages.length];

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

        count++;

        // ✅ Limite aumentado para cobrir mais dias
        if (count >= 200) break;
      }
      if (count >= 200) break;
    }

    console.log(`✅ ${count} notificações agendadas`);

    // ✅ Se agendou menos de 20 notificações, avisa no console (debug)
    if (count < 20) {
      console.warn(`⚠️ Poucas notificações agendadas (${count}). Verifique intervalo e horário.`);
    }

    return count;

  } finally {
    // ✅ Sempre libera a flag, mesmo se der erro
    isScheduling = false;
  }
}