import RamaLanding from "@/components/sections/RamaLanding";
import communityImage from "@/assets/community-scouts.jpg";

const Manada = () => {
  return (
    <RamaLanding
      title="Manada"
      lema="Siempre lo mejor"
      ageRange="7 a 10"
      intro="La puerta de entrada al escultismo: juego, fantasia y trabajo en equipo en un entorno cuidado."
      image={communityImage}
      imageAlt="Manada del Grupo Scout Septimo"
      accentClass="bg-[#FEB21A]"
      paragraphs={[
        "La Manada es el primer paso en la aventura scout. Ninas y ninos descubren el mundo por medio del juego, el simbolismo y la vida en grupo.",
        "Cada encuentro combina canciones, exploraciones, pequenas construcciones y dinamicas de cooperacion para fortalecer confianza y autonomia.",
      ]}
      bullets={[
        "Reuniones semanales con dinamicas de aprendizaje activo.",
        "Actividades en naturaleza adaptadas a su etapa.",
        "Acompanamiento cercano de educadores y familias.",
      ]}
    />
  );
};

export default Manada;

