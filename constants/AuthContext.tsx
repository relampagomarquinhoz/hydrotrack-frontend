import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

type AuthContextType = {
  token: string | null;
  userName: string;
  isAdmin: boolean;
  setToken: (token: string | null) => void;
  setUserName: (name: string) => void;
  setIsAdmin: (value: boolean) => void;
  logout: () => void;
  isLoading: boolean;
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
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [userName, setUserNameState] = useState('');
  const [isAdmin, setIsAdminState] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadFromStorage() {
      try {
        const savedToken = await AsyncStorage.getItem('@hydrotrack_token');
        const savedName = await AsyncStorage.getItem('@hydrotrack_username');
        const savedIsAdmin = await AsyncStorage.getItem('@hydrotrack_isadmin');
        if (savedToken) setTokenState(savedToken);
        if (savedName) setUserNameState(savedName);
        if (savedIsAdmin === 'true') setIsAdminState(true);
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

  const logout = async () => {
    setTokenState(null);
    setUserNameState('');
    setIsAdminState(false);
    try {
      await AsyncStorage.multiRemove(['@hydrotrack_token', '@hydrotrack_username', '@hydrotrack_isadmin']);
    } catch (e) {
      console.warn('Erro ao fazer logout:', e);
    }
  };

  return (
    <AuthContext.Provider value={{ token, userName, isAdmin, setToken, setUserName, setIsAdmin, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}