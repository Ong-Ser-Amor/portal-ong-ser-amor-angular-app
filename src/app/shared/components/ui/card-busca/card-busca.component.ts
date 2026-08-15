import { Component, input, output, signal, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { InputComponent } from '../input/input.component';

@Component({
  selector: 'app-card-busca',
  standalone: true,
  imports: [FormsModule, InputComponent],
  templateUrl: './card-busca.component.html',
  styleUrl: './card-busca.component.scss',
})
export class CardBuscaComponent implements OnInit, OnDestroy {
  placeholder = input<string>('Buscar...');
  valorInicial = input<string>('');
  tempoDebounce = input<number>(300);

  pesquisar = output<string>();

  valor = signal<string>('');

  private buscaSubject = new Subject<string>();
  private sub?: Subscription;

  ngOnInit(): void {
    if (this.valorInicial()) {
      this.valor.set(this.valorInicial());
    }

    this.sub = this.buscaSubject
      .pipe(debounceTime(this.tempoDebounce()))
      .subscribe((texto) => {
        this.pesquisar.emit(texto);
      });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  onValorChange(novoValor: string): void {
    this.valor.set(novoValor);
    this.buscaSubject.next(novoValor);
  }
}
