import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

// ─── Tipo das configs de notificação ─────────────────────────
export type NotifSettings = {
  enabled: boolean;
  interval_minutes: number;
  start_time: string;
  end_time: string;
  active_days: number[];
};

const DEFAULT_NOTIF: NotifSettings = {
  enabled: true,
  interval_minutes: 60,
  start_time: '07:00',
  end_time: '22:00',
  active_days: [0, 1, 2, 3, 4, 5, 6],
};

type AuthContextType = {
  token: string | null;
  userName: string;
  isAdmin: boolean;
  setToken: (token: string | null) => void;
  setUserName: (name: string) => void;
  setIsAdmin: (value: boolean) => void;
  logout: () => void;
  isLoading: boolean;
  // ✅ Configs de notificação compartilhadas entre telas
  notifSettings: NotifSettings;
  setNotifSettings: (s: NotifSettings) => void;
};

const AuthContext = createContext<AuthContextType>({
  token: null,
  userName: '',
  isAdmin: false,
  setToken: () => {},
  setUserName: () => {},
  setIsAdmin: () => {},
  logout: () => {},
  isLoading: true,
  notifSettings: DEFAULT_NOTIF,
  setNotifSettings: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [userName, setUserNameState] = useState('');
  const [isAdmin, setIsAdminState] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [notifSettings, setNotifSettingsState] = useState<NotifSettings>(DEFAULT_NOTIF);

  useEffect(() => {
    async function loadFromStorage() {
      try {
        const savedToken = await AsyncStorage.getItem('@hydrotrack_token');
        const savedName = await AsyncStorage.getItem('@hydrotrack_username');
        const savedIsAdmin = await AsyncStorage.getItem('@hydrotrack_isadmin');
        const savedNotif = await AsyncStorage.getItem('@hydrotrack_notif');
        if (savedToken) setTokenState(savedToken);
        if (savedName) setUserNameState(savedName);
        if (savedIsAdmin === 'true') setIsAdminState(true);
        // ✅ Carrega configs de notificação salvas localmente
        if (savedNotif) setNotifSettingsState(JSON.parse(savedNotif));
      } catch (e) {
        console.warn('Erro ao carregar sessão:', e);
      } finally {
        setIsLoading(false);
      }
    }
    loadFromStorage();
  }, []);

  const setToken = async (t: string | null) => {
    setTokenState(t);
    try {
      if (t) await AsyncStorage.setItem('@hydrotrack_token', t);
      else await AsyncStorage.removeItem('@hydrotrack_token');
    } catch (e) {
      console.warn('Erro ao salvar token:', e);
    }
  };

  const setUserName = async (name: string) => {
    setUserNameState(name);
    try {
      await AsyncStorage.setItem('@hydrotrack_username', name);
    } catch (e) {
      console.warn('Erro ao salvar nome:', e);
    }
  };

  const setIsAdmin = async (value: boolean) => {
    setIsAdminState(value);
    try {
      await AsyncStorage.setItem('@hydrotrack_isadmin', value ? 'true' : 'false');
    } catch (e) {
      console.warn('Erro ao salvar isAdmin:', e);
    }
  };

  // ✅ Salva configs de notificação no estado e no AsyncStorage
  const setNotifSettings = async (s: NotifSettings) => {
    setNotifSettingsState(s);
    try {
      await AsyncStorage.setItem('@hydrotrack_notif', JSON.stringify(s));
    } catch (e) {
      console.warn('Erro ao salvar configs de notificação:', e);
    }
  };

  const logout = async () => {
    setTokenState(null);
    setUserNameState('');
    setIsAdminState(false);
    setNotifSettingsState(DEFAULT_NOTIF);
    try {
      await AsyncStorage.multiRemove([
        '@hydrotrack_token',
        '@hydrotrack_username',
        '@hydrotrack_isadmin',
        '@hydrotrack_notif',
      ]);
    } catch (e) {
      console.warn('Erro ao fazer logout:', e);
    }
  };

  return (
    <AuthContext.Provider value={{
      token, userName, isAdmin,
      setToken, setUserName, setIsAdmin,
      logout, isLoading,
      notifSettings, setNotifSettings,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}