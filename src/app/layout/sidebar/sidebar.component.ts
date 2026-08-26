import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { AutorizacaoService } from '../../core/services/autorizacao.service';
import { PERFIL_ACESSO, PerfilAcesso } from '../../core/models/usuario.model';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
  perfis?: PerfilAcesso[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MatListModule,
    MatIconModule,
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  private readonly autorizacaoService = inject(AutorizacaoService);

  private readonly todosMenuItems: MenuItem[] = [
    {
      label: 'Beneficiários',
      icon: 'groups',
      route: '/beneficiarios',
      perfis: [PERFIL_ACESSO.ADMINISTRADOR],
    },
    {
      label: 'Cursos',
      icon: 'school',
      route: '/cursos',
      perfis: [
        PERFIL_ACESSO.ADMINISTRADOR,
        PERFIL_ACESSO.COORDENADOR_CURSOS,
        PERFIL_ACESSO.PROFESSOR,
      ],
    },
    {
      label: 'Voluntários',
      icon: 'volunteer_activism',
      route: '/voluntarios',
      perfis: [PERFIL_ACESSO.ADMINISTRADOR],
    },
  ];

  readonly menuItems = computed(() => {
    return this.todosMenuItems.filter((item) => {
      if (!item.perfis || item.perfis.length === 0) {
        return true;
      }
      return this.autorizacaoService.temPerfilAcesso(item.perfis);
    });
  });
}
