import { CommonModule } from '@angular/common';
import {
  Component,
  effect,
  inject,
  input,
  output,
  OnInit,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { BotaoComponent } from '../../../../shared/components/botao/botao.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import {
  NivelFormacao,
  TipoVoluntario,
} from '../../../../core/models/voluntario.model';

export interface DadosVoluntarioSubmit {
  formacaoAcademica: string;
  statusFormacao: string;
  tipoVoluntario: string;
}

@Component({
  selector: 'app-dados-voluntario-step',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    BotaoComponent,
    InputComponent,
  ],
  templateUrl: './dados-voluntario-step.component.html',
  styleUrl: './dados-voluntario-step.component.scss',
})
export class DadosVoluntarioStepComponent implements OnInit {
  private fb = inject(FormBuilder);

  // Inputs
  dadosIniciais = input.required<DadosVoluntarioSubmit>();
  carregando = input<boolean>(false);
  modoEdicao = input<boolean>(false);

  // Outputs
  dadosSubmetidos = output<DadosVoluntarioSubmit>();
  voltarSolicitado = output<void>();

  // Domínios
  tiposVoluntario: TipoVoluntario[] = ['COORDENADOR', 'PROFESSOR', 'GERAL'];
  niveis: NivelFormacao[] = ['COMPLETO', 'CURSANDO', 'INCOMPLETO'];

  form = this.fb.group({
    formacaoAcademica: ['', [Validators.minLength(2)]],
    statusFormacao: [''],
    tipoVoluntario: ['', [Validators.required]],
  });

  ngOnInit() {
    this.form.patchValue(this.dadosIniciais(), { emitEvent: false });
  }

  aoSubmeter(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const valores = this.form.getRawValue() as DadosVoluntarioSubmit;
    this.dadosSubmetidos.emit(valores);
  }

  aoVoltar(): void {
    this.voltarSolicitado.emit();
  }

  get textoBotaoSubmit(): string {
    return this.modoEdicao() ? 'Atualizar voluntário' : 'Salvar voluntário';
  }
}
