import { Routes } from '@angular/router';
import { BeneficiariosComponent } from './beneficiarios.component';
import { CadastroBeneficiarioComponent } from './cadastro-beneficiario/cadastro-beneficiario.component';

export const BeneficiariosRoutes: Routes = [
  {
    path: '',
    component: BeneficiariosComponent,
  },
  {
    path: 'novo',
    component: CadastroBeneficiarioComponent,
  },
];

