import RamaLanding from "@/components/sections/RamaLanding";
import communityImage from "@/assets/community-scouts.jpg";

const Staff = () => {
  return (
    <RamaLanding
      title="Educadores"
      lema="Formar para servir"
      ageRange="Adultos voluntarios"
      intro="El equipo adulto sostiene el proyecto educativo y acompana cada proceso de crecimiento juvenil."
      image={communityImage}
      imageAlt="Equipo de educadores del Grupo Scout Septimo"
      accentClass="bg-violet-700"
      paragraphs={[
        "Los educadores planifican, coordinan y evalúan la propuesta educativa de cada rama con mirada integral.",
        "Su tarea combina formacion continua, vocacion de servicio y presencia cercana para que cada joven crezca con seguridad y confianza.",
      ]}
      bullets={[
        "Diseno anual de actividades y objetivos formativos.",
        "Acompanamiento personalizado y trabajo con familias.",
        "Formacion permanente en metodo scout y proteccion.",
      ]}
    />
  );
};

export default Staff;

