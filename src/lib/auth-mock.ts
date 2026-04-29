/**
 * Mock Authentication Service
 * Reemplaza Supabase con autenticación local usando localStorage
 */

export interface User {
  id: string;
  email: string;
  nombre?: string;
  apellido?: string;
  avatar_url?: string;
  created_at: string;
  user_metadata?: {
    nombre?: string;
    apellido?: string;
    telefono?: string;
    username?: string;
    [key: string]: any;
  };
}

export interface Session {
  user: User;
  access_token: string;
  expires_at: number;
}

export interface AuthResponse {
  data: {
    user: User | null;
    session: Session | null;
  };
  error: Error | null;
}

class AuthMockService {
  private readonly STORAGE_KEY = "scout_auth_session";
  private readonly USERS_KEY = "scout_users";

  /**
   * Obtener sesión actual
   */
  getSession(): Promise<{ data: { session: Session | null }; error: null }> {
    const sessionData = localStorage.getItem(this.STORAGE_KEY);
    if (!sessionData) {
      return Promise.resolve({ data: { session: null }, error: null });
    }

    try {
      const session = JSON.parse(sessionData) as Session;

      // Verificar si la sesión expiró
      if (session.expires_at < Date.now()) {
        localStorage.removeItem(this.STORAGE_KEY);
        return Promise.resolve({ data: { session: null }, error: null });
      }

      return Promise.resolve({ data: { session }, error: null });
    } catch {
      return Promise.resolve({ data: { session: null }, error: null });
    }
  }

  /**
   * Obtener usuario actual (similar a getSession pero devuelve solo user)
   */
  async getUser(): Promise<{ data: { user: User | null }; error: null }> {
    const {
      data: { session },
    } = await this.getSession();
    return { data: { user: session?.user || null }, error: null };
  }

  /**
   * Iniciar sesión con email y contraseña
   */
  async signInWithPassword({
    email,
    password: _password,
  }: {
    email: string;
    password: string;
  }): Promise<AuthResponse> {
    // Mock: Validación simple
    const users = this.getUsers();
    const user = users.find((u) => u.email === email);

    if (!user) {
      return {
        data: { user: null, session: null },
        error: new Error("Usuario no encontrado"),
      };
    }

    // Crear sesión (expira en 7 días)
    const session: Session = {
      user,
      access_token: this.generateToken(),
      expires_at: Date.now() + 7 * 24 * 60 * 60 * 1000,
    };

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(session));

    return {
      data: { user, session },
      error: null,
    };
  }

  /**
   * Registrar nuevo usuario
   */
  async signUp({
    email,
    password: _password,
    options,
  }: {
    email: string;
    password: string;
    options?: { data?: { nombre?: string; apellido?: string } };
  }): Promise<AuthResponse> {
    const users = this.getUsers();

    // Verificar si el email ya existe
    if (users.find((u) => u.email === email)) {
      return {
        data: { user: null, session: null },
        error: new Error("El email ya está registrado"),
      };
    }

    // Crear nuevo usuario
    const newUser: User = {
      id: this.generateId(),
      email,
      nombre: options?.data?.nombre,
      apellido: options?.data?.apellido,
      created_at: new Date().toISOString(),
    };

    users.push(newUser);
    this.saveUsers(users);

    // Crear sesión automática
    const session: Session = {
      user: newUser,
      access_token: this.generateToken(),
      expires_at: Date.now() + 7 * 24 * 60 * 60 * 1000,
    };

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(session));

    return {
      data: { user: newUser, session },
      error: null,
    };
  }

  /**
   * Cerrar sesión
   */
  async signOut(): Promise<{ error: null }> {
    localStorage.removeItem(this.STORAGE_KEY);
    return { error: null };
  }

  /**
   * Escuchar cambios de autenticación
   */
  onAuthStateChange(
    _callback: (event: string, session: Session | null) => void,
  ): { data: { subscription: { unsubscribe: () => void } } } {
    // Mock: No hay eventos en tiempo real, solo retornamos unsubscribe vacío
    return {
      data: {
        subscription: {
          unsubscribe: () => {},
        },
      },
    };
  }

  /**
   * Actualizar usuario
   */
  async updateUser(
    updates: Partial<User> & { password?: string },
  ): Promise<AuthResponse> {
    const {
      data: { session },
    } = await this.getSession();

    if (!session) {
      return {
        data: { user: null, session: null },
        error: new Error("No hay sesión activa"),
      };
    }

    const users = this.getUsers();
    const userIndex = users.findIndex((u) => u.id === session.user.id);

    if (userIndex === -1) {
      return {
        data: { user: null, session: null },
        error: new Error("Usuario no encontrado"),
      };
    }

    // Actualizar usuario (ignoramos password en el mock)
    const { password: _password, ...userUpdates } = updates;
    users[userIndex] = { ...users[userIndex], ...userUpdates } as User;
    this.saveUsers(users);

    // Actualizar sesión
    const updatedSession = {
      ...session,
      user: users[userIndex],
    };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedSession));

    return {
      data: { user: users[userIndex]!, session: updatedSession as Session },
      error: null,
    };
  }

  // Helpers privados
  private getUsers(): User[] {
    const usersData = localStorage.getItem(this.USERS_KEY);
    if (!usersData) {
      // Usuarios de ejemplo para desarrollo
      const defaultUsers: User[] = [
        {
          id: "1",
          email: "admin@scout.com",
          nombre: "Admin",
          apellido: "Scout",
          created_at: new Date().toISOString(),
        },
      ];
      this.saveUsers(defaultUsers);
      return defaultUsers;
    }
    return JSON.parse(usersData);
  }

  private saveUsers(users: User[]): void {
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
  }

  private generateId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateToken(): string {
    return `token_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
  }
}

// Exportar instancia singleton
export const authMock = new AuthMockService();
