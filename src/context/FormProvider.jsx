import { createContext, useContext, useState } from "react";
import { garooInstance } from "../api/axios";

const FormContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useFormData = () => {
    const context = useContext(FormContext);
    if (!context) {
        throw new Error("useFormData debe usarse dentro de un FormProvider");
    }
    return context;
};

export const FormProvider = ({ children }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const sendData = async (form_data) => {
        setLoading(true);
        setError(null);

        try {
            // Para FormData con archivos, no establecer Content-Type manualmente en Axios
            // Axios lo configurará automáticamente si el body es una instancia de FormData
            const response = await garooInstance.post(
                "/services/execute-public/agent-onboarding",
                form_data
            );

            return response.data;
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || "Error al enviar datos";
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <FormContext.Provider
            value={{
                loading,
                error,
                setLoading,
                setError,
                sendData,
            }}
        >
            {children}
        </FormContext.Provider>
    );
};
