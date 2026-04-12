/**
 * Local Database Mock
 * Sistema completo de "base de datos" usando localStorage
 * Simula todas las tablas de Supabase
 */

// Tipos de datos
export interface Profile {
  user_id: string;
  nombre_completo?: string;
  username?: string;
  username_updated_at?: string | null;
  avatar_url?: string;
  telefono?: string;
  edad?: number;
  fecha_nacimiento?: string | null;
  seisena?: string | null;
  patrulla?: string | null;
  equipo_pioneros?: string | null;
  comunidad_rovers?: string | null;
  rol_adulto?: string | null;
  rama?: string;
  is_public?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Event {
  id: string;
  titulo: string;
  descripcion?: string;
  fecha_inicio: string;
  fecha_fin?: string;
  ubicacion?: string;
  imagen_url?: string;
  created_at: string;
}

export interface GalleryImage {
  id: string;
  name: string;
  album?: string;
  url: string;
  created_at: string;
  user_id: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
}

export interface Follow {
  follower_id: string;
  followed_id: string;
  status: "pending" | "accepted";
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  created_at: string;
}

export interface GroupMember {
  group_id: string;
  user_id: string;
  role: "admin" | "member";
  joined_at: string;
}

export interface GroupMessage {
  id: string;
  group_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

class LocalDatabase {
  private readonly KEYS = {
    PROFILES: "scout_db_profiles",
    EVENTS: "scout_db_events",
    GALLERY: "scout_db_gallery",
    MESSAGES: "scout_db_messages",
    CONVERSATIONS: "scout_db_conversations",
    FOLLOWS: "scout_db_follows",
    GROUPS: "scout_db_groups",
    GROUP_MEMBERS: "scout_db_group_members",
    GROUP_MESSAGES: "scout_db_group_messages",
  };

  constructor() {
    this.initializeDatabase();
  }

  private initializeDatabase() {
    // Inicializar datos por defecto si no existen
    if (!localStorage.getItem(this.KEYS.PROFILES)) {
      this.saveProfiles([
        {
          user_id: "1",
          nombre_completo: "Admin Scout",
          username: "admin",
          edad: 25,
          rama: "rovers",
          is_public: true,
          created_at: new Date().toISOString(),
        },
      ]);
    }

    if (!localStorage.getItem(this.KEYS.EVENTS)) {
      this.saveEvents([
        {
          id: "1",
          titulo: "Campamento de Verano 2025",
          descripcion: "Campamento anual en las sierras",
          fecha_inicio: "2025-12-15T10:00:00",
          fecha_fin: "2025-12-20T16:00:00",
          ubicacion: "Sierra de Córdoba",
          created_at: new Date().toISOString(),
        },
        {
          id: "2",
          titulo: "Fogón de Integración",
          descripcion: "Encuentro de todas las unidades",
          fecha_inicio: "2025-11-20T18:00:00",
          ubicacion: "Sede del grupo",
          created_at: new Date().toISOString(),
        },
      ]);
    }

    // Inicializar otras tablas vacías
    if (!localStorage.getItem(this.KEYS.GALLERY)) this.saveGallery([]);
    if (!localStorage.getItem(this.KEYS.MESSAGES)) this.saveMessages([]);
    if (!localStorage.getItem(this.KEYS.CONVERSATIONS))
      this.saveConversations([]);
    if (!localStorage.getItem(this.KEYS.FOLLOWS)) this.saveFollows([]);
    if (!localStorage.getItem(this.KEYS.GROUPS)) this.saveGroups([]);
    if (!localStorage.getItem(this.KEYS.GROUP_MEMBERS))
      this.saveGroupMembers([]);
    if (!localStorage.getItem(this.KEYS.GROUP_MESSAGES))
      this.saveGroupMessages([]);
  }

  // Generar ID único
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ==================== PROFILES ====================
  getProfiles(): Profile[] {
    const data = localStorage.getItem(this.KEYS.PROFILES);
    return data ? JSON.parse(data) : [];
  }

  saveProfiles(profiles: Profile[]) {
    localStorage.setItem(this.KEYS.PROFILES, JSON.stringify(profiles));
  }

  getProfile(userId: string): Profile | null {
    return this.getProfiles().find((p) => p.user_id === userId) || null;
  }

  upsertProfile(profile: Profile | (Partial<Profile> & { user_id: string })) {
    const profiles = this.getProfiles();
    const index = profiles.findIndex((p) => p.user_id === profile.user_id);

    if (index >= 0) {
      // Merge: mantiene campos existentes y sobrescribe/agreg a los nuevos
      profiles[index] = {
        ...profiles[index],
        ...profile,
        updated_at: new Date().toISOString(),
      };
    } else {
      profiles.push({
        ...profile,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Profile);
    }

    this.saveProfiles(profiles);
    // Devolver el perfil actual completo
    return this.getProfile(profile.user_id);
  }

  // ==================== EVENTS ====================
  getEvents(): Event[] {
    const data = localStorage.getItem(this.KEYS.EVENTS);
    return data ? JSON.parse(data) : [];
  }

  saveEvents(events: Event[]) {
    localStorage.setItem(this.KEYS.EVENTS, JSON.stringify(events));
  }

  addEvent(event: Omit<Event, "id" | "created_at">): Event {
    const events = this.getEvents();
    const newEvent: Event = {
      ...event,
      id: this.generateId(),
      created_at: new Date().toISOString(),
    };
    events.push(newEvent);
    this.saveEvents(events);
    return newEvent;
  }

  // ==================== GALLERY ====================
  getGallery(album?: string): GalleryImage[] {
    const data = localStorage.getItem(this.KEYS.GALLERY);
    const images = data ? JSON.parse(data) : [];
    return album
      ? images.filter((img: GalleryImage) => img.album === album)
      : images;
  }

  saveGallery(images: GalleryImage[]) {
    localStorage.setItem(this.KEYS.GALLERY, JSON.stringify(images));
  }

  addImage(image: Omit<GalleryImage, "id" | "created_at">): GalleryImage {
    const images = this.getGallery();
    const newImage: GalleryImage = {
      ...image,
      id: this.generateId(),
      created_at: new Date().toISOString(),
    };
    images.push(newImage);
    this.saveGallery(images);
    return newImage;
  }

  deleteImage(imageId: string) {
    const images = this.getGallery().filter((img) => img.id !== imageId);
    this.saveGallery(images);
  }

  // ==================== MESSAGES ====================
  getMessages(): Message[] {
    const data = localStorage.getItem(this.KEYS.MESSAGES);
    return data ? JSON.parse(data) : [];
  }

  saveMessages(messages: Message[]) {
    localStorage.setItem(this.KEYS.MESSAGES, JSON.stringify(messages));
  }

  getConversationMessages(conversationId: string): Message[] {
    return this.getMessages()
      .filter((m) => m.conversation_id === conversationId)
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );
  }

  addMessage(message: Omit<Message, "id" | "created_at">): Message {
    const messages = this.getMessages();
    const newMessage: Message = {
      ...message,
      id: this.generateId(),
      created_at: new Date().toISOString(),
    };
    messages.push(newMessage);
    this.saveMessages(messages);
    return newMessage;
  }

  // ==================== CONVERSATIONS ====================
  getConversations(): Conversation[] {
    const data = localStorage.getItem(this.KEYS.CONVERSATIONS);
    return data ? JSON.parse(data) : [];
  }

  saveConversations(conversations: Conversation[]) {
    localStorage.setItem(
      this.KEYS.CONVERSATIONS,
      JSON.stringify(conversations),
    );
  }

  getOrCreateConversation(user1Id: string, user2Id: string): Conversation {
    const conversations = this.getConversations();
    const existing = conversations.find(
      (c) =>
        (c.user1_id === user1Id && c.user2_id === user2Id) ||
        (c.user1_id === user2Id && c.user2_id === user1Id),
    );

    if (existing) return existing;

    const newConversation: Conversation = {
      id: this.generateId(),
      user1_id: user1Id,
      user2_id: user2Id,
      created_at: new Date().toISOString(),
    };

    conversations.push(newConversation);
    this.saveConversations(conversations);
    return newConversation;
  }

  // ==================== FOLLOWS ====================
  getFollows(): Follow[] {
    const data = localStorage.getItem(this.KEYS.FOLLOWS);
    return data ? JSON.parse(data) : [];
  }

  saveFollows(follows: Follow[]) {
    localStorage.setItem(this.KEYS.FOLLOWS, JSON.stringify(follows));
  }

  addFollow(followerId: string, followedId: string): Follow {
    const follows = this.getFollows();
    const existing = follows.find(
      (f) => f.follower_id === followerId && f.followed_id === followedId,
    );

    if (existing) return existing;

    const newFollow: Follow = {
      follower_id: followerId,
      followed_id: followedId,
      status: "accepted", // Auto-aceptar en mock
      created_at: new Date().toISOString(),
    };

    follows.push(newFollow);
    this.saveFollows(follows);
    return newFollow;
  }

  removeFollow(followerId: string, followedId: string) {
    const follows = this.getFollows().filter(
      (f) => !(f.follower_id === followerId && f.followed_id === followedId),
    );
    this.saveFollows(follows);
  }

  getFollowers(userId: string): Follow[] {
    return this.getFollows().filter(
      (f) => f.followed_id === userId && f.status === "accepted",
    );
  }

  getFollowing(userId: string): Follow[] {
    return this.getFollows().filter(
      (f) => f.follower_id === userId && f.status === "accepted",
    );
  }

  // ==================== GROUPS ====================
  getGroups(): Group[] {
    const data = localStorage.getItem(this.KEYS.GROUPS);
    return data ? JSON.parse(data) : [];
  }

  saveGroups(groups: Group[]) {
    localStorage.setItem(this.KEYS.GROUPS, JSON.stringify(groups));
  }

  addGroup(group: Omit<Group, "id" | "created_at">): Group {
    const groups = this.getGroups();
    const newGroup: Group = {
      ...group,
      id: this.generateId(),
      created_at: new Date().toISOString(),
    };
    groups.push(newGroup);
    this.saveGroups(groups);
    return newGroup;
  }

  // ==================== GROUP MEMBERS ====================
  getGroupMembers(): GroupMember[] {
    const data = localStorage.getItem(this.KEYS.GROUP_MEMBERS);
    return data ? JSON.parse(data) : [];
  }

  saveGroupMembers(members: GroupMember[]) {
    localStorage.setItem(this.KEYS.GROUP_MEMBERS, JSON.stringify(members));
  }

  getGroupMembersList(groupId: string): GroupMember[] {
    return this.getGroupMembers().filter((m) => m.group_id === groupId);
  }

  addGroupMember(member: Omit<GroupMember, "joined_at">): GroupMember {
    const members = this.getGroupMembers();
    const newMember: GroupMember = {
      ...member,
      joined_at: new Date().toISOString(),
    };
    members.push(newMember);
    this.saveGroupMembers(members);
    return newMember;
  }

  // ==================== GROUP MESSAGES ====================
  getGroupMessages(): GroupMessage[] {
    const data = localStorage.getItem(this.KEYS.GROUP_MESSAGES);
    return data ? JSON.parse(data) : [];
  }

  saveGroupMessages(messages: GroupMessage[]) {
    localStorage.setItem(this.KEYS.GROUP_MESSAGES, JSON.stringify(messages));
  }

  getGroupMessagesList(groupId: string): GroupMessage[] {
    return this.getGroupMessages()
      .filter((m) => m.group_id === groupId)
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );
  }

  addGroupMessage(
    message: Omit<GroupMessage, "id" | "created_at">,
  ): GroupMessage {
    const messages = this.getGroupMessages();
    const newMessage: GroupMessage = {
      ...message,
      id: this.generateId(),
      created_at: new Date().toISOString(),
    };
    messages.push(newMessage);
    this.saveGroupMessages(messages);
    return newMessage;
  }

  // ==================== UTILITY ====================
  clearAll() {
    Object.values(this.KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
    this.initializeDatabase();
  }

  exportData() {
    const data: any = {};
    Object.entries(this.KEYS).forEach(([name, key]) => {
      const value = localStorage.getItem(key);
      data[name] = value ? JSON.parse(value) : [];
    });
    return data;
  }
}

// Singleton
export const localDB = new LocalDatabase();
