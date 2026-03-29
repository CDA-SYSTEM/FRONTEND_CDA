const colaFacturacion = [
  { placa: 'ABC123', estado: 'Listo para factura' },
  { placa: 'KLM45D', estado: 'Pendiente evidencia' },
]

export function FacturacionPage() {
  return (
    <article className="panel">
      <h2>Cola de Facturacion</h2>
      <p>Vista de referencia para integracion posterior en tiempo real.</p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Placa</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {colaFacturacion.map((fila) => (
              <tr key={fila.placa}>
                <td>{fila.placa}</td>
                <td>{fila.estado}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  )
}
