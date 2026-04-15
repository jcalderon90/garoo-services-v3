import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authInstance } from "../api/axios";

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

const STORAGE_KEY = "garooToken";

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const logout = useCallback(() => {
        setUser(null);
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    const verifyToken = useCallback(async () => {
        const token = localStorage.getItem(STORAGE_KEY);
        if (!token) return false;

        try {
            // Using our new /me endpoint
            const response = await authInstance.get("/auth/me");

            if (response.status === 200) {
                const userData = response.data;
                setUser(userData);
                return true;
            }
            
            logout();
            return false;
        } catch (error) {
            console.error("Session verification error:", error);
            logout();
            return false;
        }
    }, [logout]);

    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem(STORAGE_KEY);
            if (token) {
                await verifyToken();
            }
            setLoading(false);
        };

        initAuth();

        const interval = setInterval(() => {
            verifyToken();
        }, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, [verifyToken]);

    const login = async (email, password) => {
        try {
            const response = await authInstance.post("/auth/login", {
                email,
                password
            });

            const { user: userData, token } = response.data;
            
            if (token) {
                localStorage.setItem(STORAGE_KEY, token);
                setUser(userData);
                return userData;
            } else {
                throw new Error("Token not received");
            }
        } catch (error) {
            console.error("Login process error:", error);
            const errorMessage = error.response?.data?.error || error.message || "Credenciales inválidas";
            throw new Error(errorMessage);
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
