import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

// Protege rutas que exigen sesión iniciada (la galería)
export const authGuard: CanActivateFn = async (_route, state) => {
  const sb = inject(SupabaseService);
  const router = inject(Router);
  await sb.ready;
  if (sb.currentUser()) return true;
  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};
