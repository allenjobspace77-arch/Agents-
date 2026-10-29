
"use strict";

// =============================================
// GHOSTNET | CENTRO DE INTELIGENCIA
// =============================================

const CLAVE_AGENTES_OPERATIVOS = "ghostnet_operational_agents_v1";

const AGENTES_SECRETOS = [
  {
    id: "intel-phantom",
    codenom: "PHANTOM",
    nombreReal: "Elena Rostova",
    pais: "Alemania",
    peligro: 85,
    activo: true
  },
  {
    id: "intel-specter",
    codenom: "SPECTER",
    nombreReal: "Marcus Vance",
    pais: "Reino Unido",
    peligro: 40,
    activo: false
  },
  {
    id: "intel-mirage",
    codenom: "MIRAGE",
    nombreReal: "Kaelen Voss",
    pais: "Japón",
    peligro: 95,
    activo: true
  },
  {
    id: "intel-raven",
    codenom: "RAVEN",
    nombreReal: "Damian Cruz",
    pais: "México",
    peligro: 60,
    activo: true
  }
];

const appRootAgente = document.getElementById("app-rootagents");

if (appRootAgente) {
  iniciarInteligencia();
}

function iniciarInteligencia() {
  let filtroActual = "todos";

  appRootAgente.innerHTML = `
    <section class="stats-grid mb-4">
      <article class="stat-card">
        <span class="stat-label">AGENTES ANALIZADOS</span>
        <strong class="stat-value" id="intel-total">0</strong>
        <span class="stat-caption">Base clasificada y operativa</span>
      </article>

      <article class="stat-card">
        <span class="stat-label">ACTIVOS</span>
        <strong class="stat-value accent-green" id="intel-activos">0</strong>
        <span class="stat-caption">Personal desplegado</span>
      </article>

      <article class="stat-card">
        <span class="stat-label">RIESGO PROMEDIO</span>
        <strong class="stat-value accent-red" id="intel-riesgo">0%</strong>
        <span class="stat-caption">Índice de amenaza estimado</span>
      </article>
    </section>

    <section class="ghost-card mb-4">
      <div class="panel-heading">
        <div>
          <div class="eyebrow">PANEL DE CONTROL</div>
          <h2 class="panel-title">Análisis de red</h2>
        </div>
        <span class="panel-symbol">⌁</span>
      </div>

      <div class="panel-body">
        <div class="toolbar">
          <div class="filter-group" role="group"
               aria-label="Filtrar agentes">
            <button type="button" id="btn-todos"
                    class="filter-btn active">Todos</button>
            <button type="button" id="btn-activos"
                    class="filter-btn">Solo activos</button>
          </div>

          <button type="button" id="btn-auditoria"
                  class="btn btn-ghost-primary">
            Ejecutar auditoría
          </button>
        </div>

        <div id="alerta-riesgo" class="mt-3"
             aria-live="polite"></div>
      </div>
    </section>

    <section class="ghost-card">
      <div class="panel-heading">
        <div>
          <div class="eyebrow">EXPEDIENTES DISPONIBLES</div>
          <h2 class="panel-title">Directorio de agentes</h2>
        </div>
        <span class="counter-pill" id="intel-contador">0 registros</span>
      </div>

      <div class="panel-body">
        <div id="contenedor-tarjetas" class="row g-3"></div>
        <div id="intel-vacio" class="empty-state d-none">
          No hay agentes que coincidan con el filtro.
        </div>
      </div>
    </section>
  `;

  const contenedorTarjetas =
    document.getElementById("contenedor-tarjetas");

  const alertaContenedor = document.getElementById("alerta-riesgo");

  const contador = document.getElementById("intel-contador");

  const estadoVacio = document.getElementById("intel-vacio");

  const botonTodos = document.getElementById("btn-todos");
  const botonActivos = document.getElementById("btn-activos");
  const botonAuditoria = document.getElementById("btn-auditoria");

  // Evita insertar texto recibido como HTML.
  const escaparHTML = (texto) => String(texto).replace(
    /[&<>"']/g,
    (caracter) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[caracter]
  );

  // Obtiene los agentes reclutados en la página principal.
  function obtenerAgentesOperativos() {
    try {
      const datos = localStorage.getItem(CLAVE_AGENTES_OPERATIVOS);

      if (datos === null) return [];

      const lista = JSON.parse(datos);

      if (!Array.isArray(lista)) return [];

      return lista
        .filter((agente) =>
          agente &&
          typeof agente.codenom === "string" &&
          typeof agente.especialidad === "string" &&
          ["Operativo", "Veterano", "Elite"].includes(agente.rango)
        )
        .map((agente) => ({
          id: String(agente.id || agente.codenom),
          codenom: agente.codenom,
          nombreReal: agente.especialidad,
          pais: "Base operativa",
          peligro: Number.isFinite(Number(agente.peligro))
            ? Math.min(100, Math.max(0, Number(agente.peligro)))
            : 0,
          activo: agente.activo !== false,
          origen: "operativo",
          rango: agente.rango
        }));
    } catch (error) {
      console.error("Error al consultar la red operativa:", error);
      return [];
    }
  }

  // Los agentes clasificados y operativos se mantienen separados
  // mediante su identificador para no duplicarlos.
  function obtenerRedCompleta() {
    const operativos = obtenerAgentesOperativos();

    const idsOperativos = new Set(
      operativos.map((agente) => agente.codenom.toUpperCase())
    );

    const clasificados = AGENTES_SECRETOS.filter(
      (agente) => !idsOperativos.has(agente.codenom.toUpperCase())
    ).map((agente) => ({
      ...agente,
      origen: "clasificado",
      rango: agente.peligro >= 80
        ? "Elite"
        : agente.peligro >= 50
          ? "Veterano"
          : "Operativo"
    }));

    return [...clasificados, ...operativos];
  }

  const crearTarjetaAgente = (agente) => {
    const riesgo = Math.min(100, Math.max(0, Number(agente.peligro) || 0));

    const nivelRiesgo = riesgo >= 80
      ? "risk-high"
      : riesgo >= 50
        ? "risk-medium"
        : "risk-low";

    const etiquetaRiesgo = riesgo >= 80
      ? "ALTO"
      : riesgo >= 50
        ? "MODERADO"
        : "BAJO";

    const origen = agente.origen === "operativo"
      ? "OPERACIONES"
      : "CLASIFICADO";

    return `
      <div class="col-md-6 col-xl-4">
        <article class="agent-card intelligence-card">
          <div class="agent-card-top">
            <span class="agent-index">${escaparHTML(origen)}</span>
            <span class="agent-status ${
              agente.activo ? "status-active" : "status-inactive"
            }">
              ${agente.activo ? "ACTIVO" : "INACTIVO"}
            </span>
          </div>

          <div class="intel-avatar" aria-hidden="true">
            ${escaparHTML(agente.codenom.slice(0, 1))}
          </div>

          <h3 class="agent-name">${escaparHTML(agente.codenom)}</h3>

          <p class="intel-identity">
            ${escaparHTML(agente.nombreReal)}
          </p>

          <div class="agent-detail">
            <span>UBICACIÓN</span>
            <strong>${escaparHTML(agente.pais)}</strong>
          </div>

          <div class="agent-detail">
            <span>RANGO</span>
            <strong>${escaparHTML(agente.rango || "Sin asignar")}</strong>
          </div>

          <div class="risk-heading">
            <span>NIVEL DE AMENAZA</span>
            <strong class="${nivelRiesgo}">${riesgo}%</strong>
          </div>

          <div class="risk-track"
               role="progressbar"
               aria-label="Nivel de amenaza"
               aria-valuemin="0"
               aria-valuemax="100"
               aria-valuenow="${riesgo}">
            <div class="risk-fill ${nivelRiesgo}"
                 style="width: ${riesgo}%"></div>
          </div>

          <div class="risk-footer">
            <span class="${nivelRiesgo}">${etiquetaRiesgo}</span>
            <span>ÍNDICE / 100</span>
          </div>
        </article>
      </div>
    `;
  };

  // Función de orden superior: recibe un callback de criterio.
  const filtrarAgentes = (lista, criterioCallback) => {
    const resultado = [];

    for (let i = 0; i < lista.length; i++) {
      if (criterioCallback(lista[i])) {
        resultado.push(lista[i]);
      }
    }

    return resultado;
  };

  const estaActivo = (agente) => agente.activo === true;

  // Recibe una función para extraer el valor numérico.
  const calcularPromedio = (lista, extractorCallback) => {
    if (lista.length === 0) return 0;

    let suma = 0;

    for (let i = 0; i < lista.length; i++) {
      suma += extractorCallback(lista[i]);
    }

    return Math.round(suma / lista.length);
  };

  function renderizarAgentes() {
    const redCompleta = obtenerRedCompleta();

    const listaVisible = filtroActual === "activos"
      ? filtrarAgentes(redCompleta, estaActivo)
      : redCompleta;

    let acumuladorHTML = "";

    for (let i = 0; i < listaVisible.length; i++) {
      acumuladorHTML += crearTarjetaAgente(listaVisible[i]);
    }

    contenedorTarjetas.innerHTML = acumuladorHTML;

    contador.textContent = `${listaVisible.length} registro(s)`;

    estadoVacio.classList.toggle("d-none", listaVisible.length !== 0);

    document.getElementById("intel-total").textContent =
      redCompleta.length;

    document.getElementById("intel-activos").textContent =
      filtrarAgentes(redCompleta, estaActivo).length;

    document.getElementById("intel-riesgo").textContent =
      `${calcularPromedio(redCompleta, (agente) => agente.peligro)}%`;

    botonTodos.classList.toggle("active", filtroActual === "todos");
    botonActivos.classList.toggle("active", filtroActual === "activos");

    botonTodos.setAttribute(
      "aria-pressed",
      String(filtroActual === "todos")
    );

    botonActivos.setAttribute(
      "aria-pressed",
      String(filtroActual === "activos")
    );
  }

  botonTodos.addEventListener("click", () => {
    filtroActual = "todos";
    renderizarAgentes();
  });

  botonActivos.addEventListener("click", () => {
    filtroActual = "activos";
    renderizarAgentes();
  });

  botonAuditoria.addEventListener("click", () => {
    const redCompleta = obtenerRedCompleta();

    const promedio = calcularPromedio(
      redCompleta,
      (agente) => agente.peligro
    );

    const nivel = promedio >= 80
      ? "CRÍTICO"
      : promedio >= 50
        ? "MODERADO"
        : "CONTROLADO";

    alertaContenedor.innerHTML = `
      <div class="audit-report" role="status">
        <div class="audit-icon">!</div>
        <div class="audit-content">
          <div class="eyebrow">AUDITORÍA COMPLETADA</div>
          <h3 class="audit-title">Riesgo de red: ${nivel}</h3>
          <p class="audit-description">
            Se analizaron ${redCompleta.length} agentes.
            El índice de amenaza promedio es
            <strong>${promedio}%</strong>.
          </p>
          <div class="risk-track">
            <div class="risk-fill ${
              promedio >= 80
                ? "risk-high"
                : promedio >= 50
                  ? "risk-medium"
                  : "risk-low"
            }" style="width: ${promedio}%"></div>
          </div>
        </div>
      </div>
    `;
  });

  // Permite refrescar la inteligencia al volver desde otra página
  // o cuando otra pestaña modifica los agentes guardados.
  window.addEventListener("focus", renderizarAgentes);

  window.addEventListener("storage", (evento) => {
    if (evento.key === CLAVE_AGENTES_OPERATIVOS) {
      renderizarAgentes();
    }
  });

  renderizarAgentes();
}
