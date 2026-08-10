/**
 * Formata um CEP no padrão '00000-000'
 */
export function formatarCep(cep: string | null | undefined): string {
  if (!cep) return '';

  const limpo = cep.replace(/\D/g, '');
  if (limpo.length !== 8) return cep;

  return `${limpo.substring(0, 5)}-${limpo.substring(5)}`;
}
