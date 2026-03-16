import { Facebook, Instagram, Mail, Phone, MapPin, Heart, Youtube } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import logoImage from "@/assets/grupo-scout-logo.png";

interface FooterLinkProps {
  to: string;
  children: React.ReactNode;
  external?: boolean;
}

const FooterLink = ({ to, children, external = false }: FooterLinkProps) => {
  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const className =
    "text-sm hover:text-primary transition-all duration-300 inline-flex items-center group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary";

  if (external) {
    return (
      <a
        href={to}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        tabIndex={0}
        aria-label={typeof children === "string" ? children : undefined}
      >
        <span className="group-hover:translate-x-1 transition-transform duration-300">
          {children}
        </span>
      </a>
    );
  }

  return (
    <Link to={to} onClick={scrollTop} className={className} tabIndex={0} aria-label={typeof children === "string" ? children : undefined}>
      <span className="group-hover:translate-x-1 transition-transform duration-300">
        {children}
      </span>
    </Link>
  );
};

interface SocialLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
}

const SocialLink = ({ href, icon, label }: SocialLinkProps) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="w-10 h-10 bg-white/10 hover:bg-primary rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-primary/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    aria-label={label}
    tabIndex={0}
  >
    {icon}
  </a>
);

const FooterNew = () => {
  const currentYear = new Date().getFullYear();
  return (
    <footer role="contentinfo" aria-label="Pie de página Grupo Scout Séptimo" className="bg-background/80 backdrop-blur-sm text-gray-300 border-t border-white/5">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12 mb-8">
          {/* Logo & Description - Larger on desktop */}
          <div className="lg:col-span-5">
            <div className="flex items-center space-x-3 mb-4">
              <img
                src={logoImage}
                alt="Grupo Scout Séptimo"
                className="w-12 h-12 object-contain transition-transform duration-300 hover:scale-110"
              />
              <div>
                <div className="text-xl font-bold text-white">
                  Grupo Scout Séptimo
                </div>
                <div className="text-sm text-gray-400">de Montevideo</div>
              </div>
            </div>

            <p className="text-base text-gray-400 mb-6 leading-relaxed max-w-md">
              Formando personas comprometidas con nuestra sociedad desde 1964. Una comunidad de
              aventura, valores y crecimiento personal.
            </p>

            {/* Social Links */}
            <div className="flex space-x-3 mb-6">
              <SocialLink
                href="https://instagram.com/grupo_scout_septimo"
                icon={<Instagram className="w-5 h-5" />}
                label="Instagram"
              />
              <SocialLink
                href="https://www.youtube.com/@linceastuto"
                icon={<Youtube className="w-5 h-5" />}
                label="YouTube"
              />
              <SocialLink
                href="https://facebook.com/gruposcoutseptimomontevideo"
                icon={<Facebook className="w-5 h-5" />}
                label="Facebook"
              />
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-3">
            <h3 className="text-white font-bold mb-4 text-lg">
              Enlaces Rápidos
            </h3>
            <ul className="space-y-2.5">
              <li>
                <FooterLink to="/">Inicio</FooterLink>
              </li>
              <li>
                <FooterLink to="/linea-temporal">Lánea Temporal</FooterLink>
              </li>
              <li>
                <FooterLink to="/historia">Historia</FooterLink>
              </li>
              <li>
                <FooterLink to="/bauen">BAUEN</FooterLink>
              </li>
              <li>
                <FooterLink to="/eventos">Eventos</FooterLink>
              </li>
              <li>
                <FooterLink to="/galeria">Galeráa</FooterLink>
              </li>
              <li>
                <FooterLink to="/contacto">Contacto</FooterLink>
              </li>
            </ul>
          </div>

          {/* Ramas */}
          <div className="lg:col-span-2">
            <h3 className="text-white font-bold mb-4 text-lg">Ramas</h3>
            <ul className="space-y-2.5">
              <li>
                <FooterLink to="/ramas/manada">Manada</FooterLink>
              </li>
              <li>
                <FooterLink to="/ramas/tropa">Tropa</FooterLink>
              </li>
              <li>
                <FooterLink to="/ramas/pioneros">Pioneros</FooterLink>
              </li>
              <li>
                <FooterLink to="/ramas/rovers">Rovers</FooterLink>
              </li>
              <li>
                <FooterLink to="/ramas/staff">Staff</FooterLink>
              </li>
              <li>
                <FooterLink to="/ramas/comite">Comité</FooterLink>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="lg:col-span-2">
            <h3 className="text-white font-bold mb-4 text-lg">Contacto</h3>
            <ul className="space-y-3">
              <li className="flex items-start group">
                <MapPin className="w-5 h-5 mr-2 mt-0.5 text-primary flex-shrink-0 transition-transform duration-300 group-hover:scale-110" />
                <span className="text-sm leading-relaxed">
                  Volteadores 1753, Montevideo
                </span>
              </li>
              <li className="flex items-center group">
                <Phone className="w-5 h-5 mr-2 text-primary flex-shrink-0 transition-transform duration-300 group-hover:rotate-12" />
                <a
                  href="tel:+59898138668"
                  className="text-sm hover:text-primary transition-colors"
                >
                  +598 098 138 668
                </a>
              </li>
              <li className="flex items-center group">
                <Mail className="w-5 h-5 mr-2 text-primary flex-shrink-0 transition-transform duration-300 group-hover:-translate-y-1" />
                <a
                  href="mailto:scoutsseptimo7@gmail.com"
                  className="text-sm hover:text-primary transition-colors break-all"
                >
                  scoutsseptimo7@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-700 mb-8"></div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-400 text-center md:text-left flex items-center gap-1.5">
            © {currentYear} Grupo Scout Séptimo de Montevideo.
            <span className="hidden sm:inline">Hecho con</span>
            <Heart className="w-4 h-4 text-primary inline-block fill-current animate-pulse" />
          </p>

          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <button className="hover:text-primary transition-colors duration-300 hover:underline underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary" tabIndex={0} aria-label="Polática de Privacidad">
              Polática de Privacidad
            </button>
            <button className="hover:text-primary transition-colors duration-300 hover:underline underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary" tabIndex={0} aria-label="Términos y Condiciones">
              Términos y Condiciones
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterNew;


