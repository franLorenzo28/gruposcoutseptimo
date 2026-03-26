import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const notifiedMessageIdsRef = useRef<Set<string>>(new Set());
  const initializedConversationRef = useRef<Set<string>>(new Set());
  const { toast } = useToast();

  const backToMainMenu = useCallback(() => {
    setConversationId(null);
    setMessages([]);
    setSelectedUser(null);
  }, []);

  const formatMessageDateTime = useCallback((dateIso: string) => {
    return new Intl.DateTimeFormat("es-UY", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateIso));
  }, []);

  const notifyIncomingMessage = useCallback(
    (msg: MessageWithSender) => {
      if (msg.sender_id === currentUserId) return;
      if (notifiedMessageIdsRef.current.has(msg.id)) return;
      notifiedMessageIdsRef.current.add(msg.id);
      const from = msg.sender_username
        ? `@${msg.sender_username}`
        : msg.sender_name || "Scout";
      toast({
        title: "Nuevo mensaje",
        description: `${from} • ${formatMessageDateTime(msg.created_at)}`,
      });
    },
    [currentUserId, formatMessageDateTime, toast],
  );

  const lastMessageAt = useMemo(
    () => (messages.length > 0 ? messages[messages.length - 1].created_at : null),
    [messages],
  );

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

  const startConversationWithUser = async (user: ProfileLite) => {
    setSelectedUser(user);
    try {
      if (isLocalBackend()) {
        const convo = await createOrGetConversation(user.user_id);
        setConversationId(convo.id);
        loadMessages(convo.id);
      } else {
        const { data, error } = await supabase.rpc(
          "create_or_get_conversation",
          { other_user_id: user.user_id },
        );
        if (error) throw error;
        setConversationId(String(data));
        loadMessages(String(data));
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  useEffect(() => {
    if (!conversationId) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        backToMainMenu();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [conversationId, backToMainMenu]);

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
        const isInitialLoad = !initializedConversationRef.current.has(convId);
        if (isInitialLoad) {
          initializedConversationRef.current.add(convId);
          messagesWithSender.forEach((msg) => {
            notifiedMessageIdsRef.current.add(msg.id);
          });
          const lastMsg = messagesWithSender[messagesWithSender.length - 1];
          if (lastMsg) {
            toast({
              title: "Último mensaje",
              description: `Enviado el ${formatMessageDateTime(lastMsg.created_at)}`,
            });
          }
        }
        setMessages((prev) => {
          if (!isInitialLoad) {
            const prevIds = new Set(prev.map((m) => m.id));
            messagesWithSender.forEach((msg) => {
              if (!prevIds.has(msg.id)) notifyIncomingMessage(msg);
            });
          }
          return messagesWithSender;
        });
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
    const isInitialLoad = !initializedConversationRef.current.has(convId);
    if (isInitialLoad) {
      initializedConversationRef.current.add(convId);
      messagesWithSender.forEach((msg) => {
        notifiedMessageIdsRef.current.add(msg.id);
      });
      const lastMsg = messagesWithSender[messagesWithSender.length - 1];
      if (lastMsg) {
        toast({
          title: "Último mensaje",
          description: `Enviado el ${formatMessageDateTime(lastMsg.created_at)}`,
        });
      }
    }
    setMessages((prev) => {
      if (!isInitialLoad) {
        const prevIds = new Set(prev.map((m) => m.id));
        messagesWithSender.forEach((msg) => {
          if (!prevIds.has(msg.id)) notifyIncomingMessage(msg);
        });
      }
      return messagesWithSender;
    });
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
            notifyIncomingMessage(enriched);
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
      <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-muted/25 pb-4">
        <div className="mx-auto max-w-6xl px-3 py-2 sm:px-6 sm:py-6">
          <div className="h-[calc(100dvh-6.5rem)] max-h-[960px] overflow-hidden rounded-3xl border border-border/70 bg-card/55 shadow-xl backdrop-blur-sm sm:h-[calc(100dvh-8rem)]">
            <div className="grid h-full min-h-0 lg:grid-cols-[340px_1fr]">
              <aside
                className={`border-r border-border/60 bg-background/75 ${
                  conversationId ? "hidden lg:flex" : "flex"
                } min-h-0 flex-col`}
              >
                <div className="border-b border-border/60 px-4 py-4 sm:px-5">
                  <h2 className="text-lg font-bold tracking-tight">Mensajes</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Estilo DM para scouts con seguimiento mutuo
                  </p>
                </div>

                <div className="px-4 py-3 sm:px-5">
                  <Input
                    placeholder="Buscar por nombre o @usuario"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-10 rounded-xl"
                  />
                </div>

                <div className="flex-1 space-y-1 overflow-auto px-3 pb-3 sm:px-4">
                  {filtered.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border/70 p-4 text-xs text-muted-foreground">
                      {mutualFollows.size === 0
                        ? "Aún no hay contactos mutuos. Seguí y aceptá seguimiento para abrir chats."
                        : "No hay resultados para esa búsqueda."}
                    </div>
                  ) : (
                    filtered.map((u) => {
                      const isActive = selectedUser?.user_id === u.user_id;
                      const displayName = u.nombre_completo || u.username || "Scout";
                      const initial = displayName.charAt(0).toUpperCase();
                      return (
                        <button
                          key={u.user_id}
                          className={`group flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all ${
                            isActive
                              ? "border-primary/45 bg-primary/10"
                              : "border-transparent hover:border-border/70 hover:bg-muted/55"
                          }`}
                          onClick={() => {
                            void startConversationWithUser(u);
                          }}
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/85 to-primary/45 text-sm font-bold text-primary-foreground">
                            {initial}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">{displayName}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {u.username ? `@${u.username}` : "sin usuario"}
                            </p>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>

                <div className="border-t border-border/60 p-3 text-center text-xs text-muted-foreground sm:p-4">
                  Toca un contacto para abrir el chat
                </div>
              </aside>

              <section className={`${!conversationId ? "hidden lg:flex" : "flex"} h-full min-h-0 flex-col overflow-hidden`}>
                <div className="flex items-center gap-3 border-b border-border/60 bg-background/65 px-3 py-3 sm:px-5">
                  {conversationId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="lg:hidden"
                      onClick={backToMainMenu}
                    >
                      Volver
                    </Button>
                  )}
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/85 to-primary/45 text-sm font-bold text-primary-foreground">
                    {(selectedUser?.nombre_completo || selectedUser?.username || "S")
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold sm:text-base">
                      {selectedUser
                        ? selectedUser.nombre_completo || selectedUser.username || "Scout"
                        : "Chat"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {selectedUser?.username ? `@${selectedUser.username}` : "Seleccioná una conversación"}
                      {lastMessageAt ? ` • ${formatMessageDateTime(lastMessageAt)}` : ""}
                    </p>
                  </div>
                </div>

                {!conversationId ? (
                  <div className="grid flex-1 place-items-center p-6 text-center">
                    <div>
                      <p className="text-base font-semibold">Tus mensajes</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Seleccioná un contacto.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div
                      ref={messagesContainerRef}
                      className="min-h-0 flex-1 overflow-auto bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.06),transparent_42%)] p-3 sm:p-5"
                    >
                      <div className="space-y-3">
                        {messages.length === 0 ? (
                          <div className="rounded-2xl border border-dashed border-border/70 bg-background/65 p-6 text-center text-sm text-muted-foreground">
                            Sin mensajes aún. Enviá el primero.
                          </div>
                        ) : (
                          messages.map((m) => {
                            const isMine = m.sender_id === currentUserId;
                            return (
                              <div
                                key={m.id}
                                className={`flex items-end gap-2 ${
                                  isMine ? "justify-end" : "justify-start"
                                }`}
                              >
                                {!isMine && (
                                  <div className="mb-1 flex h-7 w-7 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                                    {(m.sender_username || m.sender_name || "S")
                                      .charAt(0)
                                      .toUpperCase()}
                                  </div>
                                )}

                                <div
                                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-sm sm:max-w-[72%] ${
                                    isMine
                                      ? "rounded-br-md bg-primary text-primary-foreground"
                                      : "rounded-bl-md border border-border/60 bg-background"
                                  }`}
                                >
                                  {!isMine && (
                                    <div className="mb-1 text-[11px] font-medium opacity-70">
                                      {m.sender_username
                                        ? `@${m.sender_username}`
                                        : m.sender_name || "Scout"}
                                    </div>
                                  )}

                                  {m.content.length <= 3 && /^[\p{Emoji}\u200d]+$/u.test(m.content) ? (
                                    <div className="py-1 text-5xl sm:text-6xl">{m.content}</div>
                                  ) : (
                                    <div className="whitespace-pre-wrap break-words text-sm sm:text-[15px]">
                                      {m.content}
                                    </div>
                                  )}

                                  <div className={`mt-1 text-[11px] ${isMine ? "opacity-75" : "opacity-55"}`}>
                                    {new Date(m.created_at).toLocaleTimeString("es-ES", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 border-t border-border/60 bg-background/80 p-2.5 sm:p-3">
                      <div className="flex items-center gap-2 rounded-2xl border border-border/70 bg-background p-2 sm:p-2.5">
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
                          className="h-9 border-0 bg-transparent text-sm shadow-none focus-visible:ring-0 sm:text-base"
                        />

                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 rounded-full">
                              <Smile className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[280px] sm:w-80" align="end">
                            <Tabs defaultValue="emojis">
                              <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="emojis" className="text-xs sm:text-sm">
                                  <Smile className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
                                  Emojis
                                </TabsTrigger>
                                <TabsTrigger value="stickers" className="text-xs sm:text-sm">
                                  <Sticker className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
                                  Stickers
                                </TabsTrigger>
                              </TabsList>

                              <TabsContent value="emojis" className="mt-2">
                                <div className="grid grid-cols-8 gap-1 sm:grid-cols-10">
                                  {EMOJIS.map((emoji, i) => (
                                    <button
                                      key={i}
                                      onClick={() => insertEmoji(emoji)}
                                      className="rounded p-1 text-xl transition-colors hover:bg-muted sm:text-2xl"
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </div>
                              </TabsContent>

                              <TabsContent value="stickers" className="mt-2">
                                <div className="max-h-48 space-y-3 overflow-auto pr-2 sm:max-h-80">
                                  {Object.entries(STICKERS).map(([category, stickers]) => (
                                    <div key={category}>
                                      <div className="mb-2 text-xs font-semibold text-muted-foreground capitalize">
                                        {category === "actividades" && "🏕️ Actividades"}
                                        {category === "scout" && "⚜️ Scout"}
                                        {category === "naturaleza" && "🌲 Naturaleza"}
                                        {category === "energia" && "⚡ Energia"}
                                      </div>
                                      <div className="grid grid-cols-6 gap-2">
                                        {stickers.map((emoji, i) => (
                                          <button
                                            key={i}
                                            onClick={() => sendSticker(emoji)}
                                            className="rounded-lg p-2 text-4xl transition-transform hover:scale-110 hover:bg-muted/50 active:scale-95"
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

                        <Button onClick={send} disabled={!newMessage.trim()} className="h-9 rounded-full px-4">
                          Enviar
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </section>
            </div>
          </div>
        </div>
      </div>
    </EmailVerificationGuard>
  );
}



