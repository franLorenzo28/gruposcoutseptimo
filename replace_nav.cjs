const fs = require('fs');

let content = fs.readFileSync('src/components/layout/NavegacionPrincipal.tsx', 'utf8');

const target = `    switch (n.type) {
      case "follow_request":
        return (
          <p className="text-sm leading-snug">
            <span className="font-semibold">{actor || "Alguien"}</span>{" "}
            quiere seguirte
          </p>
        );
      case "follow_accepted":
        return (
          <p className="text-sm leading-snug">
            <span className="font-semibold">{actor || "Alguien"}</span>{" "}
            ahora te sigue
          </p>
        );
      case "message":`;

const replacement = `    switch (n.type) {
      case "follow_request":
        return (
          <p className="text-sm leading-snug">
            <span className="font-semibold">{actor || "Alguien"}</span>{" "}
            quiere seguirte
          </p>
        );
      case "follow_accepted":
      case "new_follower":
        return (
          <p className="text-sm leading-snug">
            <span className="font-semibold">{actor || "Alguien"}</span>{" "}
            ahora te sigue
          </p>
        );
      case "rama_broadcast":
        return (
          <p className="text-sm leading-snug">
            <span className="font-semibold">{actor || "Difusión"}</span> en <span className="font-medium">{d.rama || "unidad"}</span>:{" "}
            <span className="text-muted-foreground">{(d.content || "Envió un comunicado").slice(0, 70)}</span>
          </p>
        );
      case "message":`;

content = content.replace(target, replacement);

fs.writeFileSync('src/components/layout/NavegacionPrincipal.tsx', content, 'utf8');
console.log('Update NavegacionPrincipal done.');
