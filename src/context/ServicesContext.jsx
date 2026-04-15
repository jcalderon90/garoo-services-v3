import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { garooInstance } from "../api/axios";
import { useAuth } from "./AuthContext";

const ServicesContext = createContext();

export const useServices = () => {
    const context = useContext(ServicesContext);
    if (!context) {
        throw new Error("useServices must be used within a ServicesProvider");
    }
    return context;
};

export const ServicesProvider = ({ children }) => {
    const { user } = useAuth();
    const [userServices, setUserServices] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchUserServices = useCallback(async () => {
        if (!user || (!user._id && !user.id)) {
            setUserServices([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            // Updated to use our new local endpoint
            const response = await garooInstance.get("/services/my-services");
            
            const fetchedList = response.data?.services_list || [];
            
            // Backend now provides full metadata (icon, color, path, etc.)
            const enrichedServices = fetchedList.map(s => ({
                ...s,
                id: s.slug, // Compatibility
                label: s.name,      // For UI
                sublabel: s.client_name || "Garoo Service" // For UI
            }));

            setUserServices(enrichedServices);
        } catch (error) {
            console.error("Error fetching user services:", error);
            setUserServices([]);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchUserServices();
    }, [fetchUserServices]);

    const hasServicePermission = (serviceId) => {
        if (!user) return false;
        if (user.role === "admin") return true; // Global admin access
        return userServices.some(s => s.id === serviceId);
    };

    return (
        <ServicesContext.Provider value={{ userServices, loading, fetchUserServices, hasServicePermission }}>
            {children}
        </ServicesContext.Provider>
    );
};
