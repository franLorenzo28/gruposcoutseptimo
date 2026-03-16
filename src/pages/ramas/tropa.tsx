import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import tropaImage from "@/assets/tropa-nueva.jpeg";

const Tropa = () => {
  return (
    <div className="min-h-screen">
      <section className="section-padding">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2">Rama Scout</h1>
          <p className="text-xl text-primary font-semibold mb-6">Lema: "Siempre Listos"</p>
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardContent className="p-8">
                <p className="text-lg text-muted-foreground mb-4">
                  La Rama Scout reúne a adolescentes de 11 a 14 años, en una etapa llena de energáa, descubrimientos y búsqueda de independencia.
                </p>
                <p className="text-lg text-muted-foreground mb-4">
                  A través de patrullas, construcciones, campamentos, juegos y proyectos, aprenden a trabajar en equipo, a tomar decisiones y a asumir responsabilidades.
                </p>
                <p className="text-lg text-muted-foreground">
                  La vida de Tropa es pura aventura: noches bajo las estrellas, desafáos personales y la emoción de aprender haciendo. Cada scout vive la Ley y la Promesa, construyendo dáa a dáa su carácter y su compromiso con los demás scouts de la unidad.
                </p>
                <ul className="list-disc pl-5 mt-6 text-muted-foreground space-y-2">
                  <li>Edades: 11–14 años</li>
                  <li>Actividades al aire libre y campamentos</li>
                  <li>Desarrollo de habilidades prácticas y trabajo en equipo</li>
                </ul>
                <div className="mt-6">
                  <Button asChild>
                    <Link to="/contacto">Contactar</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div>
              <img
                src={tropaImage}
                alt="Grupo Scout Séptimo - Rama Tropa"
                loading="lazy"
                width="600"
                height="400"
                className="rounded-lg shadow-md"
              />
            </div>
          </div>
        </div>
      </section>
      {/* Footer global en App.tsx */}
    </div>
  );
};

export default Tropa;

