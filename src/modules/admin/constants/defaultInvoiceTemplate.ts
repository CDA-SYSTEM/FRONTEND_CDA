export const DEFAULT_INVOICE_TEMPLATE = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
    .header { text-align: center; border-bottom: 2px solid #eee; padding-bottom: 20px; }
    .invoice-info { display: flex; justify-content: space-between; margin-top: 30px; }
    .details { margin-top: 40px; width: 100%; border-collapse: collapse; }
    .details th, .details td { border: 1px solid #eee; padding: 12px; text-align: left; }
    .details th { background: #f9f9f9; }
    .totals { margin-top: 30px; text-align: right; }
    .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>FACTURA DE VENTA</h1>
    <p>No. {{invoice.number}}</p>
  </div>

  <div class="invoice-info">
    <div>
      <h3>Cliente</h3>
      <p><strong>Nombre:</strong> {{client.name}}</p>
      <p><strong>Documento:</strong> {{client.document}}</p>
    </div>
    <div>
      <h3>Fecha</h3>
      <p>{{date.day}}/{{date.month}}/{{date.year}}</p>
    </div>
  </div>

  <table class="details">
    <thead>
      <tr>
        <th>Descripción</th>
        <th>Cantidad</th>
        <th>Precio Unit.</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      {{#each invoice.items}}
      <tr>
        <td>{{description}}</td>
        <td>{{quantity}}</td>
        <td>$ {{unitPrice}}</td>
        <td>$ {{total}}</td>
      </tr>
      {{/each}}
    </tbody>
  </table>

  <div class="totals">
    <p><strong>Subtotal:</strong> $ {{invoice.subtotal}}</p>
    <p><strong>IVA (0%):</strong> $ {{invoice.tax}}</p>
    <p><strong>TOTAL:</strong> $ {{invoice.total}}</p>
  </div>

  <div class="footer">
    <p>Gracias por su confianza. Centro de Diagnóstico Automotor (CDA).</p>
  </div>
</body>
</html>`
