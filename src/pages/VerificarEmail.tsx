import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { verifyEmailToken } from "@/lib/email-verification";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";

const VerificarEmail = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const token = searchParams.get("token");
    
    if (!token) {
      setStatus("error");
      setMessage("Token de verificación no encontrado");
      return;
    }

    verifyEmail(token);
  }, [searchParams]);

  const verifyEmail = async (token: string) => {
    try {
      console.log('🔍 Verificando email con token:', token);
      
      const result = await verifyEmailToken(token);
      
      console.log('✅ Resultado:', result);
      
      if (result.success) {
        setStatus("success");
        setMessage(result.message || "Email verificado correctamente");
        
        toast({
          title: "✅ Email verificado",
          description: "Tu cuenta ha sido verificada exitosamente. Ahora podés acceder a todas las funcionalidades!",
        });

        // Redirigir a Comuni 7 después de 3 segundos
        setTimeout(() => {
          navigate("/usuarios");
        }, 3000);
      } else {
        setStatus("error");
        setMessage(result.message || "No se pudo verificar el email");
      }
    } catch (error: any) {
      console.error('❌ Error verificando:', error);
      setStatus("error");
      setMessage(error.message || "No se pudo verificar el email");
      
      toast({
        title: "Error de verificación",
        description: error.message || "No se pudo verificar el email",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-card border rounded-lg p-8 shadow-lg">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            {status === "loading" && (
              <Loader2 className="w-16 h-16 text-primary animate-spin" />
            )}
            {status === "success" && (
              <CheckCircle2 className="w-16 h-16 text-green-500" />
            )}
            {status === "error" && (
              <XCircle className="w-16 h-16 text-destructive" />
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-center mb-4">
            {status === "loading" && "Verificando email..."}
            {status === "success" && "¡Email verificado!"}
            {status === "error" && "Error de verificación"}
          </h1>

          {/* Message */}
          <p className="text-center text-muted-foreground mb-6">
            {message}
          </p>

          {/* Actions */}
          <div className="space-y-3">
            {status === "success" && (
              <Button
                className="w-full"
                onClick={() => navigate("/perfil")}
              >
                Ir a mi perfil
              </Button>
            )}
            
            {status === "error" && (
              <>
                <Button
                  className="w-full"
                  onClick={() => navigate("/perfil")}
                >
                  Ir a mi perfil
                </Button>
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => navigate("/auth")}
                >
                  <Mail className="w-4 h-4" />
                  Volver a inicio de sesión
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Help text */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          ¿Necesitas ayuda?{" "}
          <a href="/contacto" className="text-primary hover:underline">
            Contáctanos
          </a>
        </p>
      </div>
    </div>
  );
};

export default VerificarEmail;
