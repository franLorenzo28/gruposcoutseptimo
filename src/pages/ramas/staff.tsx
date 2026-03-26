import RamaLanding from "@/components/sections/RamaLanding";
import { getOptimizedImageProps } from "@/lib/optimized-images";

const Staff = () => {
  const communityImages = getOptimizedImageProps("community");
  return (
    <RamaLanding
      title="Educadores"
      lema="Formar para servir"
      ageRange="Adultos voluntarios"
      intro="El equipo adulto sostiene el proyecto educativo y acompaña cada proceso de crecimiento juvenil."
      image={communityImages}
      imageAlt="Equipo de educadores del Grupo Scout Séptimo"
      accentClass="bg-violet-700"
      paragraphs={[
        "Los educadores planifican, coordinan y evalúan la propuesta educativa de cada rama con mirada integral.",
        "Su tarea combina formación continua, vocación de servicio y presencia cercana para que cada joven crezca con seguridad y confianza.",
      ]}
      bullets={[
        "Diseño anual de actividades y objetivos formativos.",
        "Acompañamiento personalizado y trabajo con familias.",
        "Formación permanente en método scout y protección.",
      ]}
    />
  );
};

export default Staff;

