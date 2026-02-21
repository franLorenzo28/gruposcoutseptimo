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
    <div className="min-h-screen bg-background/60 backdrop-blur-sm">
      <Dashboard />
    </div>
  );
}
