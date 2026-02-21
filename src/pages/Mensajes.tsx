import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { isLocalBackend, apiFetch } from "@/lib/backend";
import { getFollowers, getFollowing } from "@/lib/follows";
import { createOrGetConversation, listDMs, sendDM } from "@/lib/dms";
import { useToast } from "@/hooks/use-toast";
import { Smile, Sticker } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EmailVerificationGuard from "@/components/EmailVerificationGuard";
import { useProfiles, useFollows } from "@/hooks/useQueryData";

interface ProfileLite {
  user_id: string;
  nombre_completo: string | null;
  username?: string | null;
  avatar_url?: string | null;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

interface MessageWithSender extends Message {
  sender_username?: string | null;
  sender_name?: string | null;
}

// Emojis comunes scouts
const EMOJIS = [
  "😊",
  "😂",
  "❤️",
  "👍",
  "🙏",
  "🎉",
  "🔥",
  "⭐",
  "👏",
  "🙌",
  "💪",
  "✨",
  "🌟",
  "🏕️",
  "⛺",
  "🎒",
  "🔦",
  "🧭",
  "🪵",
  "🔥",
];

// Stickers scouts al estilo Instagram
const STICKERS = {
  actividades: ["🏕️", "🥾", "🔥", "⛺", "🎒", "🧗"],
  scout: ["⚜️", "🪢", "🦅", "🐺", "🏆", "🎯"],
  naturaleza: ["🌲", "🌙", "☀️", "⛰️", "🌊", "🌸"],
  energia: ["💪", "⚡", "🔦", "🧭", "✨", "⭐"],
};

export default function Mensajes() {
  const [directory, setDirectory] = useState<ProfileLite[]>([]);
  const [mutualFollows, setMutualFollows] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<ProfileLite | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      if (isLocalBackend()) {
        // me
        const me = (await apiFetch("/profiles/me")) as any;
        const myId = String(me.id || me.user_id);
        setCurrentUserId(myId);
        // mutuals
        const { data: iFollow } = await getFollowing(myId);
        const { data: followsMe } = await getFollowers(myId);
        const iFollowSet = new Set<string>(
          (iFollow || []).map((f: any) =>
            String(f.followed_id || f.following_id),
          ),
        );
        const followsMeSet = new Set<string>(
          (followsMe || []).map((f: any) => String(f.follower_id)),
        );
        const mutuals = new Set<string>();
        iFollowSet.forEach((id) => {
          if (followsMeSet.has(id)) mutuals.add(id);
        });
        setMutualFollows(mutuals);
        // Directory = perfiles de mutuals
        const ids = Array.from(mutuals);
        const profiles = ids.length
          ? await apiFetch("/profiles/batch", {
              method: "POST",
              body: JSON.stringify({ ids }),
            })
          : [];
        setDirectory(
          (profiles as any[]).map((p) => ({
            user_id: String((p as any).user_id),
            nombre_completo: (p as any).nombre_completo ?? null,
            username: (p as any).username ?? null,
            avatar_url: (p as any).avatar_url ?? null,
          })),
        );
        return;
      }
      // Supabase path
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        setCurrentUserId(userData.user.id);
        const { data: iFollow } = await supabase
          .from("follows")
          .select("followed_id")
          .eq("follower_id", userData.user.id)
          .eq("status", "accepted");
        const { data: followsMe } = await supabase
          .from("follows")
          .select("follower_id")
          .eq("followed_id", userData.user.id)
          .eq("status", "accepted");
        const iFollowSet = new Set((iFollow || []).map((f) => f.followed_id));
        const followsMeSet = new Set(
          (followsMe || []).map((f) => f.follower_id),
        );
        const mutuals = new Set<string>();
        iFollowSet.forEach((id: unknown) => {
          if (typeof id === "string" && followsMeSet.has(id)) mutuals.add(id);
        });
        setMutualFollows(mutuals);
      }
      const { data, error } = await supabase.rpc("list_profiles_directory");
      if (error) {
        console.error(error);
      } else {
        setDirectory(
          (data as any[]).map((r) => ({
            user_id: String(r.user_id),
            nombre_completo: r.nombre_completo ?? null,
            username: r.username ?? null,
            avatar_url: r.avatar_url ?? null,
          })),
        );
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    // Filtrar: solo usuarios que se siguen mutuamente (excluyendo el usuario actual)
    const users = directory.filter(
      (u) => u.user_id !== currentUserId && mutualFollows.has(u.user_id),
    );

    if (!q) return users.slice(0, 10);
    return users
      .filter((u) => {
        const matchesUsername = (u.username || "").toLowerCase().includes(q);
        const matchesName = (u.nombre_completo || "").toLowerCase().includes(q);
        // También buscar si escriben @username
        const matchesAt =
          q.startsWith("@") &&
          (u.username || "").toLowerCase().includes(q.slice(1));
        return matchesUsername || matchesName || matchesAt;
      })
      .slice(0, 10);
  }, [search, directory, currentUserId, mutualFollows]);

  const startConversation = async () => {
    if (!selectedUser) return;
    try {
      if (isLocalBackend()) {
        const convo = await createOrGetConversation(selectedUser.user_id);
        setConversationId(convo.id);
        loadMessages(convo.id);
      } else {
        const { data, error } = await supabase.rpc(
          "create_or_get_conversation",
          { other_user_id: selectedUser.user_id },
        );
        if (error) throw error;
        setConversationId(String(data));
        loadMessages(String(data));
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const loadMessages = async (convId: string) => {
    if (isLocalBackend()) {
      try {
        const data = await listDMs(convId);
        const messagesWithSender: MessageWithSender[] = (data as Message[]).map(
          (msg) => {
            const sender = directory.find((u) => u.user_id === msg.sender_id);
            return {
              ...msg,
              sender_username: sender?.username,
              sender_name: sender?.nombre_completo,
            };
          },
        );
        setMessages(messagesWithSender);
        setTimeout(() => {
          const el = messagesContainerRef.current;
          if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
        }, 100);
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
      return;
    }
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    const messagesWithSender: MessageWithSender[] = (data as Message[]).map(
      (msg) => {
        const sender = directory.find((u) => u.user_id === msg.sender_id);
        return {
          ...msg,
          sender_username: sender?.username,
          sender_name: sender?.nombre_completo,
        };
      },
    );
    setMessages(messagesWithSender);
    setTimeout(() => {
      const el = messagesContainerRef.current;
      if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }, 100);
  };

  // Real-time/polling para mensajes nuevos
  useEffect(() => {
    if (!conversationId) return;
    if (isLocalBackend()) {
      const interval = setInterval(() => {
        loadMessages(conversationId);
      }, 1500);
      return () => clearInterval(interval);
    }
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          const sender = directory.find((u) => u.user_id === newMsg.sender_id);
          const enriched: MessageWithSender = {
            ...newMsg,
            sender_username: sender?.username,
            sender_name: sender?.nombre_completo,
          };
          setMessages((prev) => {
            if (prev.some((m) => m.id === enriched.id)) return prev;
            return [...prev, enriched];
          });
          setTimeout(() => {
            const el = messagesContainerRef.current;
            if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
          }, 100);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, directory]);

  const send = async () => {
    if (!conversationId || !newMessage.trim()) return;

    const tempMessage = newMessage.trim();
    setNewMessage(""); // Limpiar inmediatamente para mejor UX

    try {
      const inserted = await sendDM(conversationId, tempMessage);
      const sender = directory.find((u) => u.user_id === inserted.sender_id);
      const enriched: MessageWithSender = {
        ...inserted,
        sender_username: sender?.username,
        sender_name: sender?.nombre_completo,
      };
      setMessages((prev) => [...prev, enriched]);
      setTimeout(() => {
        const el = messagesContainerRef.current;
        if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
      }, 50);
    } catch (e: any) {
      setNewMessage(tempMessage); // Restaurar mensaje si falla
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const insertEmoji = (emoji: string) => {
    setNewMessage((prev) => prev + emoji);
  };

  const sendSticker = async (sticker: string) => {
    if (!conversationId) return;
    try {
      if (isLocalBackend()) {
        await sendDM(conversationId, sticker);
      } else {
        const { data: userData } = await supabase.auth.getUser();
        const sender_id = userData.user?.id;
        const { error } = await supabase.from("messages").insert({
          conversation_id: conversationId,
          sender_id,
          content: sticker,
        });
        if (error) throw error;
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  return (
    <EmailVerificationGuard featureName="Mensajes">
    <div className="min-h-screen bg-background/60 backdrop-blur-sm pb-20">
      {/* Navigation global en App.tsx */}
      <div className="h-16 sm:h-20"></div>

      <div className="max-w-5xl mx-auto px-2 sm:px-4 py-4 sm:py-6 lg:py-8">
        {/* Layout responsive: stack en móvil, grid en desktop */}
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 lg:gap-6">
          
          {/* Panel de contactos - Solo visible si no hay conversación abierta en móvil */}
          <Card className={`lg:col-span-1 ${conversationId && 'hidden lg:block'}`}>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-lg sm:text-xl">Conversaciones</CardTitle>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Solo con personas que se siguen mutuamente
              </p>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              <Input
                placeholder="Buscar por nombre o @usuario"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 sm:h-10"
              />
              <div className="mt-3 space-y-2 max-h-[300px] sm:max-h-[400px] lg:max-h-64 overflow-auto">
                {filtered.length === 0 ? (
                  <div className="text-xs sm:text-sm text-muted-foreground text-center py-8">
                    {mutualFollows.size === 0 
                      ? "Aún no sigues a nadie mutuamente. Ve a 'Usuarios' para comenzar a seguir a otros scouts."
                      : "No hay contactos disponibles con ese nombre"}
                  </div>
                ) : (
                  filtered.map((u) => (
                    <button
                      key={u.user_id}
                      className={`w-full text-left p-2.5 sm:p-3 rounded-lg border transition-colors ${
                        selectedUser?.user_id === u.user_id
                          ? "bg-muted/30 border-primary/50 shadow-sm"
                          : "hover:bg-muted/50 border-border"
                      }`}
                      onClick={() => setSelectedUser(u)}
                    >
                      <div className="font-medium text-sm sm:text-base">
                        {u.nombre_completo || "Scout"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {u.username ? `@${u.username}` : "Sin username"}
                      </div>
                    </button>
                  ))
                )}
              </div>
              <Button
                className="w-full mt-3 h-9 sm:h-10"
                disabled={!selectedUser}
                onClick={startConversation}
              >
                Abrir chat
              </Button>
            </CardContent>
          </Card>

          {/* Panel de chat */}
          <Card className={`lg:col-span-2 ${!conversationId && 'hidden lg:block'}`}>
            <CardHeader className="pb-3 sm:pb-6">
              <div className="flex items-center gap-2">
                {conversationId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="lg:hidden -ml-2"
                    onClick={() => {
                      setConversationId(null);
                      setMessages([]);
                      setSelectedUser(null);
                    }}
                  >
                    ← Volver
                  </Button>
                )}
                <CardTitle className="text-lg sm:text-xl">
                  {selectedUser 
                    ? `Chat con ${selectedUser.nombre_completo || selectedUser.username || 'Scout'}`
                    : 'Chat'}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-2 sm:px-6">
              {!conversationId ? (
                <div className="text-muted-foreground text-sm sm:text-base text-center py-12 sm:py-16">
                  👈 Selecciona un usuario de la lista para comenzar a chatear
                </div>
              ) : (
                <div className="flex flex-col">
                  {/* Área de mensajes */}
                  <div ref={messagesContainerRef} className="flex-1 overflow-auto space-y-2 sm:space-y-3 p-2 sm:p-4 border rounded-lg mb-3 sm:mb-4 h-[calc(100vh-400px)] sm:h-[60vh] bg-muted/20">
                    {messages.length === 0 ? (
                      <div className="text-muted-foreground text-xs sm:text-sm text-center py-12">
                        Sin mensajes aún. ¡Enváa el primero! 💬
                      </div>
                    ) : (
                      <>
                        {messages.map((m) => {
                          const isMine = m.sender_id === currentUserId;
                          return (
                            <div
                              key={m.id}
                              className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                            >
                              <div
                                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-3 py-2 shadow-sm ${
                                  isMine 
                                    ? "bg-primary text-primary-foreground rounded-br-sm" 
                                    : "bg-white dark:bg-muted rounded-bl-sm"
                                }`}
                              >
                                {!isMine && (
                                  <div className="text-xs opacity-70 mb-1 font-medium">
                                    {m.sender_username
                                      ? `@${m.sender_username}`
                                      : m.sender_name || "Scout"}
                                  </div>
                                )}
                                {/* Detectar si es un sticker (solo emoji, 1-3 caracteres) */}
                                {m.content.length <= 3 && /^[\p{Emoji}\u200d]+$/u.test(m.content) ? (
                                  <div className="text-6xl sm:text-7xl py-2">
                                    {m.content}
                                  </div>
                                ) : (
                                  <div className="text-sm sm:text-base whitespace-pre-wrap break-words">
                                    {m.content}
                                  </div>
                                )}
                                <div
                                  className={`text-xs mt-1 ${isMine ? "opacity-70" : "opacity-50"}`}
                                >
                                  {new Date(m.created_at).toLocaleTimeString(
                                    "es-ES",
                                    { hour: "2-digit", minute: "2-digit" },
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {/* sentinel removido; se usa scroll del contenedor */}
                      </>
                    )}
                  </div>

                  {/* Área de input */}
                  <div className="flex gap-1.5 sm:gap-2">
                    <Input
                      placeholder="Escribe un mensaje..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          send();
                        }
                      }}
                      className="flex-1 h-9 sm:h-10 text-sm sm:text-base"
                    />

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="icon" className="h-9 w-9 sm:h-10 sm:w-10 shrink-0">
                          <Smile className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[280px] sm:w-80" align="end">
                        <Tabs defaultValue="emojis">
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="emojis" className="text-xs sm:text-sm">
                              <Smile className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                              Emojis
                            </TabsTrigger>
                            <TabsTrigger value="stickers" className="text-xs sm:text-sm">
                              <Sticker className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                              Stickers
                            </TabsTrigger>
                          </TabsList>

                          <TabsContent value="emojis" className="mt-2">
                            <div className="grid grid-cols-8 sm:grid-cols-10 gap-1">
                              {EMOJIS.map((emoji, i) => (
                                <button
                                  key={i}
                                  onClick={() => insertEmoji(emoji)}
                                  className="text-xl sm:text-2xl hover:bg-muted rounded p-1 transition-colors"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </TabsContent>

                          <TabsContent value="stickers" className="mt-2">
                            <div className="space-y-3 max-h-48 sm:max-h-80 overflow-auto pr-2">
                              {Object.entries(STICKERS).map(([category, stickers]) => (
                                <div key={category}>
                                  <div className="text-xs font-semibold text-muted-foreground mb-2 capitalize">
                                    {category === 'actividades' && '🏕️ Actividades'}
                                    {category === 'scout' && '⚜️ Scout'}
                                    {category === 'naturaleza' && '🌲 Naturaleza'}
                                    {category === 'energia' && '⚡ Energáa'}
                                  </div>
                                  <div className="grid grid-cols-6 gap-2">
                                    {stickers.map((emoji, i) => (
                                      <button
                                        key={i}
                                        onClick={() => sendSticker(emoji)}
                                        className="text-4xl hover:scale-110 transition-transform active:scale-95 p-2 rounded-lg hover:bg-muted/50"
                                      >
                                        {emoji}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </TabsContent>
                        </Tabs>
                      </PopoverContent>
                    </Popover>

                    <Button onClick={send} disabled={!newMessage.trim()} className="h-9 sm:h-10 shrink-0">
                      Enviar
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </EmailVerificationGuard>
  );
}


