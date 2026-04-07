function RulesPanel() {
  return (
    <section className="panel sidebar-card">
      <div className="panel__eyebrow">Reglas</div>
      <h2>Como jugar</h2>
      <div className="rules-list">
        <p>Elimina dos fichas iguales para seguir limpiando la mesa.</p>
        <p>Una ficha solo puede tomarse si no tiene otra encima.</p>
        <p>Necesita al menos un costado libre para estar disponible.</p>
        <p>Flores y estaciones pueden combinarse dentro de su propia categoria.</p>
      </div>
    </section>
  );
}

export default RulesPanel;
