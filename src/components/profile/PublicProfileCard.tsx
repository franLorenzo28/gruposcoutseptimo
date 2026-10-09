import { Compass, Leaf } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export type PublicIdentity = {
  user_id: string;
  nombre_completo: string;
  username: string | null;
  avatar_url: string | null;
  descripcion_personal: string | null;
};

type PublicProfileCardProps = {
  profile: Pick<PublicIdentity, "nombre_completo" | "username" | "avatar_url" | "descripcion_personal">;
  avatarPreview?: string | null;
  className?: string;
};

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return words.length > 1
    ? `${words[0]![0]}${words[words.length - 1]![0]}`.toUpperCase()
    : (words[0]?.slice(0, 2) || "GS").toUpperCase();
}

export default function PublicProfileCard({ profile, avatarPreview, className }: PublicProfileCardProps) {
  const name = profile.nombre_completo?.trim() || "Tu nombre";
  return (
    <article className={cn("overflow-hidden rounded-[28px] border border-[#d8dccd] bg-[#fbfaf6] text-[#193428] shadow-[0_22px_60px_-34px_rgba(12,45,27,.5)] dark:border-white/10 dark:bg-[#18291f] dark:text-[#f7f3e8]", className)}>
      <div className="relative h-32 overflow-hidden bg-[#173d2b] text-[#e8c778]">
        <div className="absolute -right-10 -top-20 h-52 w-52 rounded-full border-[34px] border-white/[.07]" aria-hidden="true" />
        <div className="absolute bottom-[-68px] right-12 h-36 w-36 rounded-full border-[24px] border-[#e8c778]/15" aria-hidden="true" />
        <div className="absolute left-6 top-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.23em]">
          <Compass className="h-4 w-4" aria-hidden="true" /> Grupo Scout Séptimo
        </div>
        <Leaf className="absolute bottom-5 right-7 h-10 w-10 -rotate-12 text-[#e8c778]/50" aria-hidden="true" />
      </div>
      <div className="relative px-6 pb-7 sm:px-7">
        <Avatar className="-mt-11 h-[88px] w-[88px] border-4 border-[#fbfaf6] shadow-lg dark:border-[#18291f]">
          <AvatarImage src={avatarPreview || profile.avatar_url || undefined} alt={`Foto de ${name}`} className="object-cover" />
          <AvatarFallback className="bg-[#e8e8d7] font-serif text-2xl font-semibold text-[#234334] dark:bg-[#294c38] dark:text-white">{initials(name)}</AvatarFallback>
        </Avatar>
        <p className="mt-4 text-[10px] font-bold uppercase tracking-[.23em] text-[#9b752c] dark:text-[#e8c778]">Perfil de la comunidad</p>
        <h2 translate="no" className="mt-1 break-words font-serif text-[30px] font-semibold leading-tight">{name}</h2>
        {profile.username && <p translate="no" className="mt-1 break-all text-sm font-medium text-[#587263] dark:text-[#b6cbb9]">@{profile.username}</p>}
        <div className="mt-5 border-t border-[#d8dccd] pt-5 dark:border-white/10">
          <p className="whitespace-pre-wrap break-words text-sm leading-6 text-[#465c4e] dark:text-[#d2dfd1]">
            {profile.descripcion_personal?.trim()
              ? <span translate="no">{profile.descripcion_personal.trim()}</span>
              : "Todavía no hay una presentación. Contá algo sobre vos para que la comunidad te conozca."}
          </p>
        </div>
      </div>
    </article>
  );
}
