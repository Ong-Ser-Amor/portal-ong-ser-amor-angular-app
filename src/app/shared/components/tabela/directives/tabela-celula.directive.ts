import { Directive, Input, TemplateRef, inject } from '@angular/core';

export interface ContextoCelulaTabela<T> {
  $implicit: T;
  coluna: string;
}

@Directive({
  selector: 'ng-template[appTabelaCelula]',
  standalone: true,
})
export class TabelaCelulaDirective<T> {
  templateRef = inject(TemplateRef<ContextoCelulaTabela<T>>);

  @Input('appTabelaCelula') nomeColuna!: string;

  static ngTemplateContextGuard<T>(
    dir: TabelaCelulaDirective<T>,
    ctx: unknown
  ): ctx is ContextoCelulaTabela<T> {
    return true;
  }
}
