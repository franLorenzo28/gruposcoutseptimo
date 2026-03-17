import RamaLanding from "@/components/sections/RamaLanding";
import communityImage from "@/assets/community-scouts.jpg";

const Comite = () => {
  return (
    <RamaLanding
      title="Comité de Padres"
      lema="Apoyar y construir comunidad"
      ageRange="Familias voluntarias"
      intro="Madres, padres y referentes que hacen posible la logística y el sostén de la vida de grupo."
      image={communityImage}
      imageAlt="Comité de familias del Grupo Scout Séptimo"
      accentClass="bg-zinc-600"
      paragraphs={[
        "El Comité de Padres acompaña el proyecto educativo con una mirada de comunidad y corresponsabilidad.",
        "Su trabajo fortalece la continuidad del grupo: recursos, eventos, mantenimiento y apoyo en salidas y campamentos.",
      ]}
      bullets={[
        "Gestión de recursos y mejora de infraestructura.",
        "Organización de actividades de apoyo y financiamiento.",
        "Acompañamiento activo a la propuesta educativa anual.",
      ]}
    />
  );
};

export default Comite;

