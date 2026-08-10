import { Routes } from '@angular/router';
import { BeneficiariosComponent } from './beneficiarios.component';
import { CadastroBeneficiarioComponent } from './cadastro-beneficiario/cadastro-beneficiario.component';
import { DetalhesBeneficiarioComponent } from './detalhes-beneficiario/detalhes-beneficiario.component';

export const BeneficiariosRoutes: Routes = [
  {
    path: '',
    component: BeneficiariosComponent,
  },
  {
    path: 'novo',
    component: CadastroBeneficiarioComponent,
  },
  {
    path: ':id',
    component: DetalhesBeneficiarioComponent,
  },
];

