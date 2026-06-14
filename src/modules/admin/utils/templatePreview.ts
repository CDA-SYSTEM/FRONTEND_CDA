const SAMPLE_ITEMS = [
  { description: 'Revisión técnico-mecánica', quantity: '1', unitPrice: '85.000', total: '85.000' },
  { description: 'Emisión certificado RTM', quantity: '1', unitPrice: '65.000', total: '65.000' },
]

const SAMPLE_VALUES: Record<string, string> = {
  'invoice.number': 'FAC-2026-0042',
  'invoice.total': '150.000',
  'invoice.subtotal': '150.000',
  'invoice.tax': '0',
  'client.name': 'María González Pérez',
  'client.document': '52.123.456',
  'vehicle.plate': 'ABC-123',
  'date.full': '13/06/2026',
  'date.day': '13',
  'date.month': '06',
  'date.year': '2026',
}

function renderEachBlocks(html: string): string {
  return html.replace(
    /\{\{#each\s+([\w.]+)\}\}([\s\S]*?)\{\{\/each\}\}/g,
    (_match, _collection, rowTemplate: string) =>
      SAMPLE_ITEMS.map(item =>
        rowTemplate
          .replace(/\{\{description\}\}/g, item.description)
          .replace(/\{\{quantity\}\}/g, item.quantity)
          .replace(/\{\{unitPrice\}\}/g, item.unitPrice)
          .replace(/\{\{total\}\}/g, item.total),
      ).join(''),
  )
}

function renderVariables(html: string): string {
  let result = html
  for (const [tag, value] of Object.entries(SAMPLE_VALUES)) {
    result = result.replace(new RegExp(`\\{\\{${tag}\\}\\}`, 'g'), value)
  }
  result = result.replace(
    /\{\{([\w.]+)\}\}/g,
    (_match, tag: string) =>
      `<span class="preview-variable-placeholder">${tag}</span>`,
  )
  return result
}

export function renderTemplatePreview(html: string): string {
  let result = renderEachBlocks(html)
  result = renderVariables(result)
  return result
}

export function highlightVariables(html: string): string {
  return html.replace(
    /\{\{([\w#/][\w./]*)\}\}/g,
    '<span class="preview-variable-tag">{{$1}}</span>',
  )
}
