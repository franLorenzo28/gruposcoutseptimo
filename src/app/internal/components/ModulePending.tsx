import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InternalPageHeader } from "./InternalPageHeader";

export function ModulePending({ title, description }: { title: string; description: string }) {
  return <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6 sm:px-6">
    <InternalPageHeader eyebrow="En preparación" title={title} description={description} />
    <Card>
      <CardHeader><CardTitle className="text-xl">Este espacio todavía no está disponible</CardTitle></CardHeader>
      <CardContent className="flex flex-col items-start gap-4">
        <p className="text-sm leading-relaxed text-muted-foreground">Mientras lo preparamos, puedes consultar los documentos del grupo o los anuncios de tu unidad. Para saber cómo participar en una actividad, contacta a tu equipo educativo.</p>
        <div className="flex flex-wrap gap-2"><Button asChild><Link to="/interno/documentos">Ver documentos</Link></Button><Button asChild variant="outline"><Link to="/interno/anuncios">Ver anuncios</Link></Button></div>
      </CardContent>
    </Card>
  </section>;
}

