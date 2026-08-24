import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';

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
  menuItems = [
    { label: 'Beneficiários', icon: 'groups', route: '/beneficiarios' },
    { label: 'Cursos', icon: 'school', route: '/cursos' },
    { label: 'Voluntários', icon: 'volunteer_activism', route: '/voluntarios' },
  ];
}
