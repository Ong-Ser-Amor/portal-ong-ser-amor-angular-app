import { CommonModule } from '@angular/common';
import { AfterViewChecked, AfterViewInit, Component, inject, Input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { CpfInputComponent } from '../../../../shared/components/cpf-input/cpf-input.component';

export interface DadosPessoaSubmit {
  nome: string;
  cpf: string;
  dataNascimento: string;
}

@Component({
  selector: 'app-dados-pessoa-step',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatProgressBarModule,
    ButtonComponent,
    InputComponent,
    CpfInputComponent,
  ],
  templateUrl: './dados-pessoa-step.component.html',
  styleUrl: './dados-pessoa-step.component.scss',
})
export class DadosPessoaStepComponent implements AfterViewInit, AfterViewChecked {
  private fb = inject(FormBuilder);

  // Inputs controlados pelo Pai
  private _dadosIniciais: DadosPessoaSubmit = {
    nome: '',
    cpf: '',
    dataNascimento: '',
  };
  private _pessoaEncontrada = false;
  private _carregando = false;
  private viewInicializada = false;

  @Input({ required: true })
  set dadosIniciais(value: DadosPessoaSubmit) {
    this._dadosIniciais = value;
    this.aplicarDadosPendentes();
  }

  get dadosIniciais(): DadosPessoaSubmit {
    return this._dadosIniciais;
  }

  @Input()
  set pessoaEncontrada(value: boolean) {
    this._pessoaEncontrada = value;
  }

  get pessoaEncontrada(): boolean {
    return this._pessoaEncontrada;
  }

  @Input()
  set carregando(value: boolean) {
    this._carregando = value;
  }

  get carregando(): boolean {
    return this._carregando;
  }

  ngAfterViewInit(): void {
    this.viewInicializada = true;
    setTimeout(() => this.aplicarDadosPendentes());
  }

  ngAfterViewChecked(): void {
    this.aplicarDadosPendentes();
  }

  // Outputs para o Pai
  dadosConfirmados = output<DadosPessoaSubmit>();
  voltarSolicitado = output<void>();

  form = this.fb.group({
    nome: ['', [Validators.required, Validators.minLength(3)]],
    cpf: [
      { value: '', disabled: true },
      [Validators.required, Validators.pattern(/^\d{11}$/)],
    ],
    dataNascimento: ['', [Validators.required]],
  });

  aoSubmeter(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    // getRawValue garante que o CPF (que está disabled) é incluído no objeto
    const valores = this.form.getRawValue() as DadosPessoaSubmit;
    this.dadosConfirmados.emit(valores);
  }

  aoVoltar(): void {
    this.voltarSolicitado.emit();
  }

  private aplicarDadosPendentes(): void {
    if (!this.viewInicializada || this.form.dirty) return;

    const atual = this.form.getRawValue();
    const desejado = this._dadosIniciais;
    const precisaAtualizar =
      atual.nome !== desejado.nome ||
      atual.cpf !== desejado.cpf ||
      atual.dataNascimento !== desejado.dataNascimento;

    if (precisaAtualizar) {
      this.form.patchValue(this._dadosIniciais, { emitEvent: false });
    }
  }
}
