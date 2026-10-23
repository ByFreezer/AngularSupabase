import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton, IonGrid, IonRow, IonCol,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonInput, IonButton, IonText,
} from '@ionic/angular';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

@Component({
  selector: 'app-login',
  templateUrl: 'login.page.html',
  standalone: true,
  imports: [
    ReactiveFormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
    IonGrid, IonRow, IonCol, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonInput, IonButton, IonText,
  ],
})
export class LoginPage {
  loading = false;
  error = '';

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  constructor(
    private fb: FormBuilder,
    private sb: SupabaseService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  async submit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    try {
      const { email, password } = this.form.value;
      await this.sb.login(email!, password!);
      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/home';
      this.router.navigateByUrl(returnUrl);
    } catch (e: any) {
      this.error = 'Login incorrecto: ' + e.message;
    } finally {
      this.loading = false;
    }
  }
}
