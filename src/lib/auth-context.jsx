import { createContext, useContext, useEffect, useState } from "react";
import {
  getCustomer,
  onCustomerAuthChange,
  customerSignIn,
  customerSignOut,
  signUp,
  resetPassword,
  updatePassword,
} from "./auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    getCustomer().then((u) => {
      if (!cancelled) {
        setUser(u);
        setLoading(false);
      }
    });

    const unsubscribe = onCustomerAuthChange((u) => {
      if (!cancelled) setUser(u);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    const u = await customerSignIn(email, password);
    setUser(u);
    return u;
  };

  const register = async (email, password, metadata = {}) => {
    const u = await signUp(email, password, metadata);
    setUser(u);
    return u;
  };

  const logout = async () => {
    await customerSignOut();
    setUser(null);
  };

  const requestPasswordReset = async (email) => {
    await resetPassword(email);
  };

  const changePassword = async (newPassword) => {
    await updatePassword(newPassword);
  };

  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user),
    login,
    register,
    logout,
    requestPasswordReset,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}