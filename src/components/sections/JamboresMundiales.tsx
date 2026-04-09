import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";

interface Jamboree {
  year: number;
  number: string;
  theme: string;
  location: string;
  country: string;
  dates: string;
  details?: string;
}

const jamborees: Jamboree[] = [
  {
    year: 1967,
    number: "12º",
    theme: "Por la Amistad",
    location: "Farragut State Park, Idaho",
    country: "EE.UU.",
    dates: "31 julio - 9 agosto 1967",
    details: "El Séptimo concurrió a este jamboree",
  },
  {
    year: 1971,
    number: "13º",
    theme: "Por el Entendimiento",
    location: "Los Altos de Asagiri, Monte Fuji",
    country: "Japón",
    dates: "2 - 10 agosto 1971",
  },
  {
    year: 1975,
    number: "14º",
    theme: "Cinco Dedos, Una Sola Mano",
    location: "Lago Mjosa, Lillehammer",
    country: "Noruega",
    dates: "29 julio - 7 agosto 1975",
  },
  {
    year: 1983,
    number: "15º",
    theme: "El Espíritu está Vivo, 75 Años",
    location: "Kananaskis, Alberta",
    country: "Canadá",
    dates: "5 - 15 julio 1983",
  },
  {
    year: 1987,
    number: "16º",
    theme: "Uniendo el Mundo Alrededor",
    location: "Campamento Scout Cataract, Appin",
    country: "Australia",
    dates: "30 diciembre 1987 - 7 enero 1988",
  },
  {
    year: 1991,
    number: "17º",
    theme: "Muchas Tierras, un Solo Mundo",
    location: "Parque Nacional Seoraksan",
    country: "Corea del Sur",
    dates: "8 - 16 agosto 1991",
  },
  {
    year: 1995,
    number: "18º",
    theme: "El Futuro es Ahora",
    location: "Dronten",
    country: "Países Bajos",
    dates: "1 - 11 agosto 1995",
  },
  {
    year: 1998,
    number: "19º",
    theme: "Construyendo la Paz Juntos",
    location: "Picarquín",
    country: "Chile",
    dates: "27 diciembre 1998 - 6 enero 1999",
  },
  {
    year: 2002,
    number: "20º",
    theme: "Comparte Nuestro Mundo, Comparte Nuestras Culturas",
    location: "Saltship",
    country: "Tailandia",
    dates: "28 diciembre 2002 - 8 enero 2003",
  },
  {
    year: 2007,
    number: "21º",
    theme: "Un Mundo, una Promesa - 100 Años, Jamboree del Centenario",
    location: "Parque Haylands, Chelmsford",
    country: "Reino Unido",
    dates: "27 julio - 8 agosto 2007",
  },
  {
    year: 2011,
    number: "22º",
    theme: "Simplemente Escultismo",
    location: "Rinkaby, Kristianstad, Scania",
    country: "Suecia",
    dates: "27 julio - 7 agosto 2011",
  },
  {
    year: 2015,
    number: "23º",
    theme: "Un Espíritu de Unidad",
    location: "Kyrara-Hama, Yamaguchi",
    country: "Japón",
    dates: "28 julio - 8 agosto 2015",
  },
  {
    year: 2019,
    number: "24º",
    theme: "Abre Un Nuevo Mundo",
    location: "Reserva Scout Nacional 'The Summit Bechtel Family'",
    country: "EE.UU.",
    dates: "22 julio - 2 agosto 2019",
  },
  {
    year: 2023,
    number: "25º",
    theme: "Dibuja tu Mundo",
    location: "Saemangeum, Buan-Gun",
    country: "Corea del Sur",
    dates: "1 - 12 agosto 2023",
  },
];

export const JamboresMundiales = () => {
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold mb-2">Jamborees Mundiales</h2>
        <p className="text-muted-foreground">
          Un Jamboree Scout Mundial es un gran campamento de scouts provenientes
          de todo el mundo. Suele tener lugar cada cuatro años. Su nombre hace
          referencia a una antigua expresión anglosajona que refiere una
          "reunión ruidosa", que fue la idea del fundador Robert Baden-Powell
          para un encuentro masivo de scouts.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {jamborees.map((jamboree) => (
          <button
            key={jamboree.year}
            onClick={() =>
              setSelectedYear(selectedYear === jamboree.year ? null : jamboree.year)
            }
            className="text-left transition-transform hover:scale-105"
          >
            <Card
              className={`cursor-pointer transition-all ${
                selectedYear === jamboree.year
                  ? "ring-2 ring-primary bg-primary/5"
                  : "hover:shadow-lg"
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm text-muted-foreground">{jamboree.year}</p>
                    <h3 className="font-bold text-lg">{jamboree.number} Jamboree</h3>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {jamboree.country}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm font-semibold text-primary">
                    {jamboree.theme}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {jamboree.location}
                  </p>
                </div>

                {selectedYear === jamboree.year && (
                  <div className="pt-3 border-t animate-in fade-in">
                    <p className="text-xs text-muted-foreground mb-2">
                      <span className="font-semibold">Fechas:</span>{" "}
                      {jamboree.dates}
                    </p>
                    {jamboree.details && (
                      <p className="text-xs text-muted-foreground italic">
                        {jamboree.details}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </button>
        ))}
      </div>

      <Card className="bg-primary/10 border-primary/20">
        <CardHeader>
          <h3 className="font-semibold flex items-center gap-2">
            <ArrowRight className="w-4 h-4" />
            Información Histórica
          </h3>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            Los Jamborees Mundiales representan la quintaesencia del movimiento
            scout, reuniendo a miles de jóvenes de diferentes países y culturas
            en un mismo objetivo: vivir la promesa y la ley scout.
          </p>
          <p>
            Cada jamboree tiene un tema particular que refleja los valores y
            desafíos de su época, desde la amistad y el entendimiento en los
            años 60, hasta temas actuales de sostenibilidad y nuevos mundos.
          </p>
          <p className="text-xs text-muted-foreground">
            Haz clic en cualquier jamboree para ver más detalles.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default JamboresMundiales;
