import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import axios from "axios";
import { API, AuthContext } from "../App";

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Use ref to prevent double processing in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      try {
        // Extract session_id from URL fragment
        const hash = window.location.hash;
        const sessionIdMatch = hash.match(/session_id=([^&]+)/);
        
        if (!sessionIdMatch) {
          console.error("No session_id found");
          navigate("/");
          return;
        }

        const sessionId = sessionIdMatch[1];

        // Exchange session_id for user data and session cookie
        const response = await axios.post(
          `${API}/auth/session`,
          { session_id: sessionId },
          { withCredentials: true }
        );

        // Update auth context
        AuthContext.setUser(response.data);

        // Clear the hash and redirect to dashboard
        window.history.replaceState(null, "", "/dashboard");
        navigate("/dashboard", { state: { user: response.data }, replace: true });
      } catch (error) {
        console.error("Auth callback error:", error);
        navigate("/");
      }
    };

    processAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
        <p className="text-neutral-400 font-body">Входим в систему...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
