import { Component, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton, IonGrid, IonRow, IonCol,
  IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonSpinner, IonText,
} from '@ionic/angular';
import { SupabaseService } from '../services/supabase.service';
import { StorageImage } from '../models/client.model';

@Component({
  selector: 'app-gallery',
  templateUrl: 'gallery.page.html',
  standalone: true,
  imports: [
    DecimalPipe, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton, IonGrid, IonRow, IonCol,
    IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonSpinner, IonText,
  ],
})
export class GalleryPage implements OnInit {
  images: StorageImage[] = [];
  loading = true;
  error = '';

  constructor(private sb: SupabaseService) {}

  async ngOnInit() {
    try {
      this.images = await this.sb.getImages();
    } catch (e: any) {
      this.error = 'Error cargando imágenes: ' + e.message;
    } finally {
      this.loading = false;
    }
  }
}