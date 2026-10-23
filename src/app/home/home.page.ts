import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon, IonChip, IonCard,
  IonCardHeader, IonCardTitle, IonCardContent, IonInput, IonList, IonItem, IonLabel, IonItemSliding,
  IonItemOptions, IonItemOption, IonToast,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { createOutline, trashOutline, imagesOutline, logInOutline, logOutOutline } from 'ionicons/icons';
import { SupabaseService } from '../services/supabase.service';
import { Client } from '../models/client.model';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  standalone: true,
  imports: [
    ReactiveFormsModule, RouterLink, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon,
    IonChip, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonInput, IonList, IonItem, IonLabel,
    IonItemSliding, IonItemOptions, IonItemOption, IonToast,
  ],
})
export class HomePage implements OnInit {
  clients: Client[] = [];
  editingClientId: string | null = null;
  toastMessage = '';
  isToastOpen = false;

  clientForm = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    empresa: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
  });

  constructor(
    private fb: FormBuilder,
    public sb: SupabaseService,
    private router: Router,
  ) {
    addIcons({ createOutline, trashOutline, imagesOutline, logInOutline, logOutOutline });
  }

  async ngOnInit() {
    await this.sb.ready;
    await this.loadClients();
  }

  async loadClients() {
    try {
      this.clients = await this.sb.getClients();
    } catch (e: any) {
      this.showToast('Error cargando clientes: ' + e.message);
    }
  }

  // Si no hay sesión, pide login antes de insertar/editar/borrar
  private requireLogin(): boolean {
    if (this.sb.currentUser()) return true;
    this.router.navigate(['/login'], { queryParams: { returnUrl: '/home' } });
    return false;
  }

  goLogin() { this.router.navigate(['/login'], { queryParams: { returnUrl: '/home' } }); }

  async logout() {
    await this.sb.logout();
    this.resetForm();
    this.showToast('Sesión cerrada');
  }

  async saveClient() {
    if (!this.requireLogin() || this.clientForm.invalid) return;
    try {
      const value = this.clientForm.value as Client;
      if (this.editingClientId) {
        await this.sb.updateClient(this.editingClientId, value);
        this.showToast('Cliente actualizado');
      } else {
        await this.sb.addClient(value);
        this.showToast('Cliente insertado');
      }
      this.resetForm();
      await this.loadClients();
    } catch (e: any) {
      this.showToast('Error al guardar (¿eres admin?): ' + e.message);
    }
  }

  editClient(client: Client) {
    if (!this.requireLogin()) return;
    this.editingClientId = client.id!;
    this.clientForm.patchValue({ nombre: client.nombre, empresa: client.empresa, email: client.email });
  }

  async deleteClient(id: string) {
    if (!this.requireLogin()) return;
    try {
      await this.sb.deleteClient(id);
      this.showToast('Cliente eliminado');
      await this.loadClients();
    } catch (e: any) {
      this.showToast('Error eliminando: ' + e.message);
    }
  }

  resetForm() {
    this.clientForm.reset();
    this.editingClientId = null;
  }

  showToast(msg: string) { this.toastMessage = msg; this.isToastOpen = true; }
  setToastOpen(open: boolean) { this.isToastOpen = open; }
}
