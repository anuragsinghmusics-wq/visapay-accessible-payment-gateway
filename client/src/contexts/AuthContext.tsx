import React, { createContext, useContext, useState, useEffect } from "react";

export interface MerchantProfile {
  id: string;
  name: string;
  email: string;
  apiKey: string;
  createdAt?: string;
}

interface AuthContextValue {
  merchant: MerchantProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, merchant: MerchantProfile) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "visapay_merchant_token";
const PROFILE_KEY = "visapay_merchant_profile";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [merchant, setMerchant] = useState<MerchantProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from localStorage on initial mount
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedProfile = localStorage.getItem(PROFILE_KEY);

      if (storedToken && storedProfile) {
        setToken(storedToken);
        setMerchant(JSON.parse(storedProfile));
      }
    } catch (err) {
      console.error("[AuthContext] Failed to restore session:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (newToken: string, newProfile: MerchantProfile) => {
    setToken(newToken);
    setMerchant(newProfile);
    try {
      localStorage.setItem(TOKEN_KEY, newToken);
      localStorage.setItem(PROFILE_KEY, JSON.stringify(newProfile));
    } catch (err) {
      console.error("[AuthContext] Failed to save session:", err);
    }
  };

  const logout = () => {
    setToken(null);
    setMerchant(null);
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(PROFILE_KEY);
    } catch (err) {
      console.error("[AuthContext] Failed to clear session:", err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        merchant,
        token,
        isAuthenticated: Boolean(token && merchant),
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

