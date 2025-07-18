import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const userData = localStorage.getItem("user");
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error("Failed to parse user data from localStorage", error);
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const navigate = useNavigate();

  const login = useCallback((userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    // Correctly store the full user object, including doctorProfile
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", authToken);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/login");
  }, [navigate]);

  useEffect(() => {
    const handleAuthError = () => {
      logout();
    };
    window.addEventListener("auth-error", handleAuthError);
    return () => {
      window.removeEventListener("auth-error", handleAuthError);
    };
  }, [logout]);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
