import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

type AuthContextType = {
  token: string | null;
  userName: string;
  setToken: (token: string | null) => void;
  setUserName: (name: string) => void;
  logout: () => void;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  token: null,
  userName: '',
  setToken: () => {},
  setUserName: () => {},
  logout: () => {},
  isLoading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [userName, setUserNameState] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadFromStorage() {
      try {
        const savedToken = await AsyncStorage.getItem('@hydrotrack_token');
        const savedName = await AsyncStorage.getItem('@hydrotrack_username');
        if (savedToken) setTokenState(savedToken);
        if (savedName) setUserNameState(savedName);
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

  const logout = async () => {
    setTokenState(null);
    setUserNameState('');
    try {
      await AsyncStorage.multiRemove(['@hydrotrack_token', '@hydrotrack_username']);
    } catch (e) {
      console.warn('Erro ao fazer logout:', e);
    }
  };

  return (
    <AuthContext.Provider value={{ token, userName, setToken, setUserName, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}