import { Injectable, signal, computed } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { Client, StorageImage } from '../models/client.model';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private supabase: SupabaseClient;

  currentUser = signal<User | null>(null);
  userRole = signal<'admin' | 'user' | null>(null);
  isAdmin = computed(() => this.userRole() === 'admin');
  // Promesa que se resuelve cuando se ha recuperado la sesión inicial (la usa el guard)
  ready: Promise<void>;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
    this.ready = this.initSession();

    this.supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        this.currentUser.set(null);
        this.userRole.set(null);
      }
    });
  }

  // ---------- AUTH ----------
  private async initSession() {
    const { data: { session } } = await this.supabase.auth.getSession();
    if (session?.user) {
      this.currentUser.set(session.user);
      await this.loadRole(session.user.id);
    }
  }

  async login(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    this.currentUser.set(data.user);
    await this.loadRole(data.user.id);
  }

  async logout() {
    await this.supabase.auth.signOut();
    this.currentUser.set(null);
    this.userRole.set(null);
  }

  private async loadRole(userId: string) {
    const { data, error } = await this.supabase
      .from('profiles').select('role').eq('id', userId).maybeSingle();
    this.userRole.set(!error && data ? data.role : 'user');
  }

  // ---------- CRUD CLIENTES ----------
  async getClients(): Promise<Client[]> {
    const { data, error } = await this.supabase
      .from('clients').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async addClient(client: Client): Promise<void> {
    const { error } = await this.supabase.from('clients').insert([{
      nombre: client.nombre, empresa: client.empresa, email: client.email,
    }]);
    if (error) throw error;
  }

  async updateClient(id: string, client: Partial<Client>): Promise<void> {
    // .select() para detectar si RLS ha bloqueado el update (devuelve 0 filas sin error)
    const { data, error } = await this.supabase
      .from('clients').update(client).eq('id', id).select();
    if (error) throw error;
    if (!data || data.length === 0) throw new Error('Sin permisos (RLS): solo admins');
  }

  async deleteClient(id: string): Promise<void> {
    const { data, error } = await this.supabase
      .from('clients').delete().eq('id', id).select();
    if (error) throw error;
    if (!data || data.length === 0) throw new Error('Sin permisos (RLS): solo admins');
  }

  // ---------- STORAGE ----------
  async getImages(): Promise<StorageImage[]> {
    const { data, error } = await this.supabase.storage
      .from(environment.bucket)
      .list('', { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });
    if (error) throw error;

    const files = (data || []).filter(f => f.id && !f.name.startsWith('.'));
    if (files.length === 0) return [];

    const { data: signed, error: err2 } = await this.supabase.storage
      .from(environment.bucket)
      .createSignedUrls(files.map(f => f.name), 3600);
    if (err2) throw err2;

    return files.map((f, i) => ({
      name: f.name,
      url: signed?.[i]?.signedUrl ?? '',
      size: f.metadata?.['size'],
      created_at: f.created_at,
    })).filter(i => i.url);
  }
}
