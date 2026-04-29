"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { User } from "@/types";
import { useRouter } from "next/navigation";
import axios from "axios";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void | {}>;
  register: (
    name: string,
    email: string,
    password: string,
    dateOfBirth: string,
  ) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  isLoading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const fetchUser = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/users/profile`,
        {
          withCredentials: true,
        },
      );

      setUser(response.data.user);
    } catch (_error) {
      setUser(null);
    }
  };

  // Fetch user info from cookie on mount
  useEffect(() => {
    fetchUser().finally(() => {
      setIsLoading(false);
    });
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/users/login`,
        { email, password },
        {
          withCredentials: true, // Include cookies in request
        },
      );

      setUser(response.data.user);
    } catch (error: any) {
      const payload = error.response?.data;
      const errorMessage = "A bejelentkezés sikertelen.";
      const authError = new Error(errorMessage) as Error & { code?: string };
      authError.code = payload?.code;
      throw authError;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    dateOfBirth: string,
  ) => {
    setIsLoading(true);
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/users`,
        { name, email, password, dateOfBirth },
        {
          withCredentials: true, // Include cookies in request
        },
      );
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Sikertelen regisztráció";
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/users/logout`,
        {},
        {
          withCredentials: true, // Include cookies in request
        },
      );
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      router.replace("/login");
      router.refresh();
    }
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    refreshUser: fetchUser,
    setUser,
    isLoading,
    isAdmin: user?.role === "admin",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
