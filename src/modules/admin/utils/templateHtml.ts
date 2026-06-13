function stripOuterWrapper(html: string): string {
  return html
    .replace(/^<!DOCTYPE\s+html[^>]*>/i, '')
    .replace(/<html[^>]*>/gi, '')
    .replace(/<\/html>/gi, '')
    .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '')
    .replace(/<body[^>]*>/gi, '')
    .replace(/<\/body>/gi, '')
    .trim()
}

export interface ParsedTemplateHtml {
  styles: string
  body: string
}

export function parseTemplateHtml(html: string): ParsedTemplateHtml {
  const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/i)
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)

  let body = bodyMatch?.[1]?.trim() ?? html.trim()
  body = stripOuterWrapper(body)

  return {
    styles: styleMatch?.[1]?.trim() ?? '',
    body,
  }
}

export function buildTemplateHtml(styles: string, body: string): string {
  const normalizedBody = stripOuterWrapper(body)
  const normalizedStyles = styles.trim()

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
${normalizedStyles}
  </style>
</head>
<body>
${normalizedBody}
</body>
</html>`
}
