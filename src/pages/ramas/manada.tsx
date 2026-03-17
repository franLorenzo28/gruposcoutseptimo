import RamaLanding from "@/components/sections/RamaLanding";
import communityImage from "@/assets/community-scouts.jpg";

const Manada = () => {
  return (
    <RamaLanding
      title="Manada"
      lema="Siempre lo mejor"
      ageRange="7 a 10"
      intro="La puerta de entrada al escultismo: juego, fantasía y trabajo en equipo en un entorno cuidado."
      image={communityImage}
      imageAlt="Manada del Grupo Scout Séptimo"
      accentClass="bg-[#FEB21A]"
      paragraphs={[
        "La Manada es el primer paso en la aventura scout. Niñas y niños descubren el mundo por medio del juego, el simbolismo y la vida en grupo.",
        "Cada encuentro combina canciones, exploraciones, pequeñas construcciones y dinámicas de cooperación para fortalecer confianza y autonomía.",
      ]}
      bullets={[
        "Reuniones semanales con dinámicas de aprendizaje activo.",
        "Actividades en naturaleza adaptadas a su etapa.",
        "Acompañamiento cercano de educadores y familias.",
      ]}
    />
  );
};

export default Manada;

