const checklistBase = [
  'Estado de limpieza adecuado',
  'Sin peso adicional no autorizado',
  'Alarma desactivada (si aplica)',
  'Certificado de conversion a gas vigente (si aplica)',
]

export function InspeccionPage() {
  return (
    <article className="panel">
      <h2>Inspeccion Tecnica - NTC 5375</h2>
      <p>Checklist base para pruebas de interfaz antes de integrar backend.</p>

      <ul className="checklist">
        {checklistBase.map((item) => (
          <li key={item}>
            <label>
              <input type="checkbox" />
              <span>{item}</span>
            </label>
          </li>
        ))}
      </ul>
    </article>
  )
}
