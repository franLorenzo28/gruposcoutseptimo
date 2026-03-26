import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import Dashboard from "./admin/Dashboard";

export default function AdminPanel() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const userStr = localStorage.getItem("adminUser");
      if (userStr) {
        const userData = JSON.parse(userStr);
        setUser(userData);
      }
    } catch (err) {
      console.error("Error al leer usuario:", err);
    }
    setLoading(false);
  }, []);

  if (loading) return <div className="p-8 text-center">Cargando...</div>;

  const isAdmin = user?.role === "admin";

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="page-animate min-h-screen bg-gradient-to-b from-background via-background/95 to-muted/25">
      <Dashboard />
    </div>
  );
}

