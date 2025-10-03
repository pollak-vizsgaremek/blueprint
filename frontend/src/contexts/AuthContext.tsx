"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { jwtDecode } from "jwt-decode";
import { LoginResponse, User } from "@/types";

interface JWTPayload {
  userId: number;
  email: string;
  name: string;
  role: "admin" | "user";
  dateOfBirth: string | null;
  exp: number;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
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
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Decode user info from JWT token
  const getUserFromToken = (token: string): User | null => {
    try {
      const decoded = jwtDecode<JWTPayload>(token);

      // Check if token is expired
      if (decoded.exp * 1000 < Date.now()) {
        return null;
      }

      return {
        id: decoded.userId,
        name: decoded.name,
        email: decoded.email,
        role: decoded.role,
        dateOfBirth: decoded.dateOfBirth,
      };
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  };

  // Load token from localStorage on mount and set up token expiration check
  useEffect(() => {
    const storedToken = localStorage.getItem("token");

    if (storedToken) {
      const userData = getUserFromToken(storedToken);
      if (userData) {
        setToken(storedToken);
        setUser(userData);
      } else {
        // Token is invalid or expired, remove it
        localStorage.removeItem("token");
      }
    }
    setIsLoading(false);
  }, []);

  // Check token expiration periodically
  useEffect(() => {
    if (!token) return;

    const checkTokenExpiration = () => {
      const userData = getUserFromToken(token);
      if (!userData) {
        // Token expired, logout user
        logout();
      }
    };

    // Check every minute
    const interval = setInterval(checkTokenExpiration, 60000);

    return () => clearInterval(interval);
  }, [token]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        }
      );

      if (!response.ok) {
        throw new Error("Login failed");
      }

      const data: LoginResponse = await response.json();

      // Decode user info from token instead of using response user data
      const userData = getUserFromToken(data.token);
      if (!userData) {
        throw new Error("Invalid token received");
      }

      setToken(data.token);
      setUser(userData);

      // Store only token in localStorage
      localStorage.setItem("token", data.token);
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
  };

  const value: AuthContextType = {
    token,
    user,
    login,
    logout,
    isLoading,
    isAdmin: user?.role === "admin",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
