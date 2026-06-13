export interface ParsedTemplateHtml {
  styles: string
  body: string
}

export function parseTemplateHtml(html: string): ParsedTemplateHtml {
  const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/i)
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)

  return {
    styles: styleMatch?.[1]?.trim() ?? '',
    body: bodyMatch?.[1]?.trim() ?? html.trim(),
  }
}

export function buildTemplateHtml(styles: string, body: string): string {
  const normalizedBody = body.trim()
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
