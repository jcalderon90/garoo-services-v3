import axios from "axios";

// URL Base de tu backend local
const GAROO_API_BASE = import.meta.env.VITE_GAROO_API_URL || "http://localhost:5000/api";

// Configuración común para todas las instancias
const commonConfig = {
    baseURL: GAROO_API_BASE,
    timeout: 30000,
};

// Instancia para autenticación (usada en login)
const authInstance = axios.create({ ...commonConfig });

// Instancia principal de la plataforma (usada para todo el backend local)
const garooInstance = axios.create({ ...commonConfig });

// Instancia específica para RocknRolla (servicio externo)
const applicationsInstance = axios.create({
    ...commonConfig,
    baseURL: "https://rockanrolla-garoo.koyeb.app",
});

// Función para configurar interceptores de seguridad y manejo de sesiones
const setupInterceptors = (instance) => {
    // Interceptor de solicitudes: adjunta el token JWT
    instance.interceptors.request.use(
        async (config) => {
            const token = localStorage.getItem("garooToken");
            
            // Verificación preventiva del token contra el backend
            const isAuthVerify = config.url === "auth-verify" || config.url?.endsWith("/auth/me");
            
            if (token && !config.isPublic && !isAuthVerify) {
                try {
                    await axios.get(`${GAROO_API_BASE}/auth/me`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                } catch (error) {
                    console.warn("Auth check failed:", error.message);
                }
            }

            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        },
        (error) => Promise.reject(error)
    );

    // Interceptor de respuestas: maneja la expiración de la sesión (401)
    instance.interceptors.response.use(
        (response) => response,
        (error) => {
            if (error.response?.status === 401) {
                localStorage.removeItem("garooToken");
                // Redirigir a login solo si no está en una página pública
                if (window.location.pathname !== "/login" && !window.location.pathname.includes("/outbound-call-form")) {
                    window.location.href = "/login";
                }
            }
            return Promise.reject(error);
        }
    );
};

// Aplicar interceptores
setupInterceptors(authInstance);
setupInterceptors(garooInstance);
setupInterceptors(applicationsInstance);

export { authInstance, garooInstance, applicationsInstance };
