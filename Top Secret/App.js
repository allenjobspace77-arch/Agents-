
"use strict";

// =============================================
// GHOSTNET | CENTRO DE OPERACIONES
// =============================================

const CLAVE_ALMACENAMIENTO = "ghostnet_operational_agents_v1";

const AGENTES_INICIALES = [
  { codenom: "NOVA", especialidad: "Criptografía", rango: "Elite" },
  { codenom: "TITAN", especialidad: "Infiltración", rango: "Veterano" },
  { codenom: "BLADE", especialidad: "Ciberdefensa", rango: "Operativo" }
];

const CODENOMS_PROHIBIDOS = ["TRAIDOR", "RENEGADO"];

const RIESGO_POR_RANGO = {
  Elite: 90,
  Veterano: 65,
  Operativo: 35
};

const appRoot = document.getElementById("app-root");

if (appRoot) {
  iniciarAplicacion();
}

function iniciarAplicacion() {
  // Evita sobrescribir los datos guardados.
  let redDeAgentes = cargarAgentes();

  appRoot.innerHTML = `
    <section class="stats-grid mb-4">
      <article class="stat-card">
        <span class="stat-label">AGENTES REGISTRADOS</span>
        <strong class="stat-value" id="total-agentes">0</strong>
        <span class="stat-caption">Expedientes operativos</span>
      </article>

      <article class="stat-card">
        <span class="stat-label">AGENTES ÉLITE</span>
        <strong class="stat-value accent-purple" id="total-elite">0</strong>
        <span class="stat-caption">Rango de máxima prioridad</span>
      </article>

      <article class="stat-card">
        <span class="stat-label">ESTADO DEL SISTEMA</span>
        <strong class="stat-value accent-green">ACTIVO</strong>
        <span class="stat-caption">Sincronización local</span>
      </article>
    </section>

    <div class="row g-4">
      <section class="col-lg-4">
        <div class="ghost-card h-100">
          <div class="panel-heading">
            <div>
              <div class="eyebrow">NUEVO EXPEDIENTE</div>
              <h2 class="panel-title">Reclutar agente</h2>
            </div>
            <span class="panel-symbol">＋</span>
          </div>

          <div class="panel-body">
            <form id="form-reclutar">
              <div class="mb-3">
                <label for="input-codenom" class="form-label">
                  Nombre clave
                </label>
                <input
                  type="text"
                  id="input-codenom"
                  class="form-control ghost-input"
                  placeholder="Ej. ORION"
                  maxlength="30"
                  autocomplete="off"
                  required
                >
              </div>

              <div class="mb-3">
                <label for="input-especialidad" class="form-label">
                  Especialidad táctica
                </label>
                <input
                  type="text"
                  id="input-especialidad"
                  class="form-control ghost-input"
                  placeholder="Ej. Análisis de datos"
                  maxlength="80"
                  required
                >
              </div>

              <div class="mb-4">
                <label for="select-rango" class="form-label">
                  Rango asignado
                </label>
                <select id="select-rango"
                        class="form-select ghost-input">
                  <option value="Operativo">Operativo</option>
                  <option value="Veterano">Veterano</option>
                  <option value="Elite">Élite</option>
                </select>
              </div>

              <button type="submit" class="btn btn-ghost-primary w-100">
                <span>＋</span> Registrar agente
              </button>
            </form>

            <div id="mensaje-operaciones"
                 class="mt-3" aria-live="polite"></div>

            <div class="panel-divider"></div>

            <button id="btn-retirar"
                    type="button"
                    class="btn btn-ghost-danger w-100">
              Retirar último agente
            </button>
            <p class="helper-text mt-2 mb-0">
              El retiro elimina el último registro operativo guardado.
            </p>
          </div>
        </div>
      </section>

      <section class="col-lg-8">
        <div class="ghost-card">
          <div class="panel-heading">
            <div>
              <div class="eyebrow">BASE DE DATOS</div>
              <h2 class="panel-title">Agentes desplegados</h2>
            </div>
            <span id="contador-agentes" class="counter-pill">0 agentes</span>
          </div>

          <div class="panel-body">
            <div id="lista-agentes" class="row g-3"></div>
            <div id="estado-lista" class="empty-state d-none">
              No hay agentes registrados.
            </div>
          </div>
        </div>
      </section>
    </div>
  `;

  const formulario = document.getElementById("form-reclutar");
  const botonRetirar = document.getElementById("btn-retirar");
  const inputCodenom = document.getElementById("input-codenom");
  const inputEspecialidad = document.getElementById("input-especialidad");
  const selectRango = document.getElementById("select-rango");
  const listaAgentes = document.getElementById("lista-agentes");
  const contador = document.getElementById("contador-agentes");
  const estadoLista = document.getElementById("estado-lista");
  const mensaje = document.getElementById("mensaje-operaciones");

  // Convierte los datos a texto seguro antes de usar innerHTML.
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

  const claseRango = (rango) => {
    if (rango === "Elite") return "rank-elite";
    if (rango === "Veterano") return "rank-veteran";
    return "rank-operative";
  };

  const crearTarjetaAgente = (agente, indice) => `
    <div class="col-md-6">
      <article class="agent-card">
        <div class="agent-card-top">
          <span class="agent-index">AGENTE / ${(indice + 1)
            .toString().padStart(2, "0")}</span>
          <span class="rank-badge ${claseRango(agente.rango)}">
            ${escaparHTML(agente.rango)}
          </span>
        </div>

        <h3 class="agent-name">${escaparHTML(agente.codenom)}</h3>

        <div class="agent-detail">
          <span>ESPECIALIDAD</span>
          <strong>${escaparHTML(agente.especialidad)}</strong>
        </div>

        <div class="agent-detail">
          <span>ESTADO</span>
          <strong class="accent-green">REGISTRADO</strong>
        </div>
      </article>
    </div>
  `;

  function mostrarMensaje(texto, tipo = "success") {
    mensaje.innerHTML = `
      <div class="notice notice-${tipo}" role="status">
        ${escaparHTML(texto)}
      </div>
    `;
  }

  function renderizarRed() {
    let acumuladorHTML = "";

    for (let i = 0; i < redDeAgentes.length; i++) {
      acumuladorHTML += crearTarjetaAgente(redDeAgentes[i], i);
    }

    listaAgentes.innerHTML = acumuladorHTML;
    contador.textContent = `${redDeAgentes.length} agente(s)`;

    document.getElementById("total-agentes").textContent =
      redDeAgentes.length;

    document.getElementById("total-elite").textContent =
      redDeAgentes.filter((agente) => agente.rango === "Elite").length;

    estadoLista.classList.toggle("d-none", redDeAgentes.length !== 0);
  }

  function reportarCambio(anterior, nueva) {
    console.log(
      `GhostNet | Antes: ${anterior.length} | Ahora: ${nueva.length}`
    );
    console.log("¿Misma referencia?", anterior === nueva);
  }

  formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();

    const codenom = inputCodenom.value.trim().toUpperCase();
    const especialidad = inputEspecialidad.value.trim();
    const rango = selectRango.value;

    if (!codenom || !especialidad) {
      mostrarMensaje("Completa todos los campos.", "danger");
      return;
    }

    if (CODENOMS_PROHIBIDOS.includes(codenom)) {
      mostrarMensaje(
        `El nombre clave ${codenom} está prohibido.`,
        "danger"
      );
      return;
    }

    if (redDeAgentes.some((agente) => agente.codenom === codenom)) {
      mostrarMensaje("Ese nombre clave ya está registrado.", "danger");
      return;
    }

    const redAnterior = redDeAgentes;

    const nuevoAgente = {
      id: crearId(),
      codenom,
      especialidad,
      rango,
      activo: true,
      peligro: RIESGO_POR_RANGO[rango],
      origen: "operativo"
    };

    // Actualización inmutable: crea un nuevo arreglo.
    redDeAgentes = [...redDeAgentes, nuevoAgente];

    guardarAgentes(redDeAgentes);
    reportarCambio(redAnterior, redDeAgentes);
    renderizarRed();

    formulario.reset();
    inputCodenom.focus();

    mostrarMensaje(`${codenom} se registró correctamente.`);
  });

  botonRetirar.addEventListener("click", () => {
    if (redDeAgentes.length === 0) {
      mostrarMensaje("No hay agentes que retirar.", "danger");
      return;
    }

    const redAnterior = redDeAgentes;
    const agenteRetirado = redDeAgentes[redDeAgentes.length - 1];

    // Conserva todos menos el último, sin usar pop().
    redDeAgentes = redDeAgentes.slice(0, -1);

    guardarAgentes(redDeAgentes);
    reportarCambio(redAnterior, redDeAgentes);
    renderizarRed();

    mostrarMensaje(
      `${agenteRetirado.codenom} fue retirado de la lista operativa.`
    );
  });

  renderizarRed();
}

// Funciones compartidas a través de localStorage.

function crearId() {
  return `op-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function cargarAgentes() {
  try {
    const guardados = localStorage.getItem(CLAVE_ALMACENAMIENTO);

    if (guardados === null) {
      const iniciales = AGENTES_INICIALES.map((agente) => ({
        ...agente,
        id: crearId(),
        activo: true,
        peligro: RIESGO_POR_RANGO[agente.rango],
        origen: "operativo"
      }));

      guardarAgentes(iniciales);
      return iniciales;
    }

    const datos = JSON.parse(guardados);

    if (
      !Array.isArray(datos) ||
      !datos.every((agente) =>
        agente &&
        typeof agente.codenom === "string" &&
        typeof agente.especialidad === "string" &&
        ["Operativo", "Veterano", "Elite"].includes(agente.rango)
      )
    ) {
      throw new Error("Formato de agentes no válido.");
    }

    return datos;
  } catch (error) {
    console.error("No se pudieron cargar los agentes:", error);
    alert(
      "No se pudieron leer los datos guardados. Revisa la consola del navegador."
    );
    return [];
  }
}

function guardarAgentes(agentes) {
  try {
    localStorage.setItem(CLAVE_ALMACENAMIENTO, JSON.stringify(agentes));
    return true;
  } catch (error) {
    console.error("No se pudieron guardar los agentes:", error);
    alert("No se pudieron guardar los cambios en el navegador.");
    return false;
  }
}
