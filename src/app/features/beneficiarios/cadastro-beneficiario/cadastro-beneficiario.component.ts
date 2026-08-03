import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { CabecalhoPaginaComponent } from '../../../shared/components/cabecalho-pagina/cabecalho-pagina.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { CpfInputComponent } from '../../../shared/components/cpf-input/cpf-input.component';
import { BotaoComponent } from '../../../shared/components/botao/botao.component';

@Component({
  selector: 'app-cadastro-beneficiario',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCheckboxModule,
    CabecalhoPaginaComponent,
    InputComponent,
    CpfInputComponent,
    BotaoComponent,
  ],
  templateUrl: './cadastro-beneficiario.component.html',
  styleUrl: './cadastro-beneficiario.component.scss',
})
export class CadastroBeneficiarioComponent {
  private router = inject(Router);
  private fb = inject(FormBuilder);

  niveisEscolaridade: string[] = [
    'Ensino Fundamental Incompleto',
    'Ensino Fundamental Completo',
    'Ensino Médio Incompleto',
    'Ensino Médio Completo',
    'Ensino Superior Incompleto',
    'Ensino Superior Completo',
    'Pós-graduação',
  ];

  estadosCivis: string[] = [
    'Solteiro(a)',
    'Casado(a)',
    'Divorciado(a)',
    'Viúvo(a)',
    'União Estável',
  ];

  vinculosEmpregaticios: string[] = [
    'CLT (Carteira Assinada)',
    'Autônomo / Informal',
    'Desempregado(a)',
    'Aposentado(a) / Pensionista',
    'Estagiário(a) / Aprendiz',
    'Servidor Público',
  ];

  form: FormGroup = this.fb.group({
    nome: ['', [Validators.required, Validators.minLength(3)]],
    cpf: ['', [Validators.required]],
    dataNascimento: ['', [Validators.required]],
    escolaridade: [''],
    estadoCivil: [''],
    vinculoEmpregaticio: [''],
    quantidadeFilhos: [0, [Validators.min(0)]],
    emancipado: [false],
    podeSairSozinho: [false],
  });

  voltar(): void {
    this.router.navigate(['/beneficiarios']);
  }
}
