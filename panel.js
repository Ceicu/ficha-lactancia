/* Panel de Ceci: lista de fichas, resumen, respuestas, fotos estandarizadas, evaluación y devolución. */
(function () {
  const C = window.COMUN, A = window.ANALISIS, E = window.EVAL, F = window.FICHA;
  const esc = C.esc;
  const $ = s => document.querySelector(s);
  const DEMO = !window.CONFIG.SCRIPT_URL;
  const TABS = [['resumen', 'Resumen'], ['consulta', '🩺 Consulta'], ['respuestas', 'Respuestas'], ['fotos', 'Fotos'], ['evaluacion', 'Evaluación'], ['devolucion', 'Devolución']];
  let clave = '';
  try { clave = localStorage.getItem('panel-clave') || ''; } catch (e) { }
  let actual = null, tab = 'resumen';
  const blobs = {};

  // ---------- Datos de ejemplo (modo prueba) ----------
  const hoyISO = d => new Date(Date.now() - d * 86400000).toISOString().slice(0, 10);
  const EJEMPLO = {
    id: 'ejemplo', recibida: new Date().toISOString(), estado: 'Nueva', carpeta: '#', archivos: [], transcripciones: {}, evaluacion: null, devolucion: '',
    ficha: {
      quien_nombre: 'Familia de ejemplo', quien_vinculo: 'amamanta', whatsapp: '0981 000 000', nacio: 'si', bebe_nombre: 'EJEMPLO · Bebé de prueba', bebe_nac: hoyISO(11),
      motivo_chips: ['dolor', 'agarre', 'peso'], motivo_txt: 'Me duele mucho cuando se prende y a veces se suelta y llora. Siento que no se llena.', desde: 'nacimiento',
      que_dijeron: 'La pediatra dijo que le dé fórmula a la noche.', espera: 'Poder darle pecho sin dolor',
      emb_compl: ['dg'], pechos_cambios: 'pocos', cirugia_mamaria: ['ninguna'], sem_gest: '38', tipo_parto: 'ces_urg', piel: 'tarde', primera_hora: 'no',
      primeros_dias: ['formula_sanat', 'ictericia'], bajada: 'd5', peso_nac: '3350', pesos: [{ fecha: hoyISO(7), g: '3080' }, { fecha: hoyISO(1), g: '3180' }],
      frenillo: 'nada', dolor: 7, dolor_cuando: ['prenderse'], pecho_signos: ['grietas', 'aplastado'], alim: ['pecho', 'formula'], objetivo: 'pecho',
      pecho_ofrece: 'der', tomas_dia: '6_7', duracion: 'm40', ritmo: 'despertar', toma_nota: ['chasquidos', 'duerme', 'suelta'], traga: 'aveces', pechos_despues: 'no_noto',
      con_que: ['mamadera'], mam_marca: 'Marca X anticólico', tetina_flujo: 'medio', mam_tiempo: 'm5', mam_como: 'acostado', formula_tipo: 'inicio', formula_ml: '120',
      chupete: 'dormir', pezonera: 'no', extrae: 'no', sabe_mano: 'no', pis: '4_5', caca: '1_2', caca_color: 'amarilla', amarillo: 'no', sueno: 'mucho', regurg: 'poco',
      boca_abierta: 'aveces', cabeza_lado: 'no_se', sentir: ['cansancio', 'frustracion'], whooley1: 'no', whooley2: 'no', apoyo: 'algo', lact_previa: 'primera',
      miedos: 'Que no le alcance mi leche y tener que dejar el pecho', consent: true,
    }
  };

  // ---------- API ----------
  async function api(cuerpo) { return C.api(Object.assign({ clave }, cuerpo)); }

  function aviso(txt) { const a = $('#aviso'); if (!txt) return a.classList.add('oculto'); a.innerHTML = txt; a.classList.remove('oculto'); }
  function mostrar(v) { ['login', 'lista', 'detalle'].forEach(x => $('#vista-' + x).classList.toggle('oculto', x !== v)); $('#tabs').classList.toggle('oculto', v !== 'detalle'); $('#volver').classList.toggle('oculto', v !== 'detalle'); }

  // ---------- Login y lista ----------
  async function iniciar() {
    $('#iso').innerHTML = C.ISO;
    $('#volver').addEventListener('click', () => { location.hash = ''; });
    $('#entrar').addEventListener('click', entrar);
    $('#clave').addEventListener('keydown', e => { if (e.key === 'Enter') entrar(); });
    window.addEventListener('hashchange', ruta);
    if (DEMO) aviso('🧪 Modo prueba: todavía no está conectado a Google. Te muestro una ficha de ejemplo. <a href="index.html">Ver el formulario de la familia</a>');
    ruta();
  }
  async function entrar() {
    clave = $('#clave').value.trim();
    $('#login-error').textContent = '';
    try { await api({ accion: 'listar' }); try { localStorage.setItem('panel-clave', clave); } catch (e) { } ruta(); }
    catch (e) { $('#login-error').textContent = e.message === 'clave' ? 'Esa clave no es. Probá de nuevo.' : 'No me pude conectar. Revisá internet.'; }
  }
  async function ruta() {
    const id = decodeURIComponent(location.hash.slice(1));
    if (!DEMO && !clave) { $('#titulo').textContent = 'Panel de lactancia'; return mostrar('login'); }
    if (id) return abrir(id);
    $('#titulo').textContent = 'Fichas recibidas';
    $('#subtitulo').textContent = 'Solo para Ceci';
    mostrar('lista');
    const cont = $('#vista-lista');
    cont.innerHTML = '<p style="margin-top:20px">Cargando…</p>';
    let fichas;
    if (DEMO) fichas = [{ id: 'ejemplo', recibida: EJEMPLO.recibida, bebe: EJEMPLO.ficha.bebe_nombre, quien: EJEMPLO.ficha.quien_nombre, prioridad: A.analizar(EJEMPLO.ficha).prioridad, estado: 'Nueva' }];
    else {
      try { fichas = (await api({ accion: 'listar' })).fichas; }
      catch (e) { if (e.message === 'clave') { clave = ''; try { localStorage.removeItem('panel-clave'); } catch (x) { } return ruta(); } cont.innerHTML = '<p class="error-txt">No me pude conectar. Revisá internet y recargá.</p>'; return; }
    }
    if (!fichas.length) { cont.innerHTML = '<div class="destacado" style="margin-top:20px">Todavía no llegó ninguna ficha.</div>'; return; }
    cont.innerHTML = fichas.map(f => `<a class="tarjeta ficha-item" href="#${encodeURIComponent(f.id)}">
      <span class="badge b-${esc(f.prioridad)}">${esc(f.prioridad)}</span>
      <div style="min-width:0"><div class="bebe">${esc(f.bebe)}</div><div class="meta">${esc(f.quien)} · ${new Date(f.recibida).toLocaleDateString('es-PY')}</div></div>
      <div class="estado">${esc(f.estado)}</div></a>`).join('');
  }

  // ---------- Detalle ----------
  async function abrir(id) {
    mostrar('detalle');
    $('#vista-detalle').innerHTML = '<p style="margin-top:20px">Cargando ficha…</p>';
    try {
      actual = DEMO ? JSON.parse(JSON.stringify(EJEMPLO)) : await api({ accion: 'ver', id });
    } catch (e) { $('#vista-detalle').innerHTML = '<p class="error-txt" style="margin-top:20px">No pude abrir la ficha.</p>'; return; }
    if (DEMO) { try { const g = JSON.parse(localStorage.getItem('panel-demo-eval') || 'null'); if (g) { actual.evaluacion = g.evaluacion; actual.devolucion = g.devolucion; } } catch (e) { } }
    actual.res = A.analizar(actual.ficha, { fecha: actual.recibida });
    if (!actual.evaluacion) { try { actual.evaluacion = JSON.parse(localStorage.getItem('ev-' + actual.id) || 'null'); } catch (e) { } }
    actual.evaluacion = actual.evaluacion || {};
    $('#titulo').textContent = actual.res.nombre;
    $('#subtitulo').innerHTML = `<span class="badge b-${actual.res.prioridad}">${actual.res.prioridad}</span> ${esc(actual.ficha.quien_nombre || '')}${actual.res.edadDias != null ? ' · ' + A.edadTexto(actual.res.edadDias) + ' al completar' : ''}`;
    $('#tabs').innerHTML = TABS.map(([k, t]) => `<button class="tab" role="tab" data-tab="${k}" aria-selected="${k === tab}">${t}</button>`).join('');
    $('#tabs').querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => { tab = b.dataset.tab; abrirTab(); }));
    abrirTab();
  }
  function abrirTab() {
    $('#tabs').querySelectorAll('[data-tab]').forEach(b => b.setAttribute('aria-selected', b.dataset.tab === tab));
    const v = $('#vista-detalle');
    document.body.classList.toggle('modo-consulta', tab === 'consulta');
    ({ resumen: tabResumen, consulta: tabConsulta, respuestas: tabRespuestas, fotos: tabFotos, evaluacion: tabEvaluacion, devolucion: tabDevolucion })[tab](v);
    window.scrollTo(0, 0);
  }
  function irA(t, destino) {
    tab = t; abrirTab();
    if (!destino) return;
    const el = document.querySelector(`[data-test="${destino}"]`) || (document.querySelector(`[data-grid="${destino}"]`) || {}).parentElement;
    if (el && el.scrollIntoView) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  }

  // ---------- Consulta: protocolo paso a paso al lado de la ficha ----------
  const tieneR = (r, k, v) => (Array.isArray(r[k]) ? r[k] : [r[k]]).includes(v);
  const vacioTxt = s => !s || /^\s*(no|nada|nada a[úu]n|nada todav[íi]a|ninguno|ninguna|ahora nada|no tomo nada|-)\s*\.?\s*$/i.test(s);
  function pasosConsulta() {
    const r = actual.ficha, res = actual.res;
    const t = (k, v) => tieneR(r, k, v);
    const lbl = (k, v) => A.etiqueta(k, v);
    const mam = t('con_que', 'mamadera') || t('motivo_chips', 'acepte_mamadera') || t('motivo_chips', 'mamadera_pecho') || t('motivo_chips', 'extraccion') || ['extraida', 'mixta'].includes(r.objetivo);
    const animo = r.whooley1 === 'si' || r.whooley2 === 'si' || t('salud_diag', 'animo');
    const pesos = A.pesosOrdenados(r);
    const ult = pesos[pesos.length - 1];
    const P = [];

    // 1. Preparación
    P.push({
      k: 'prep', t: 'Antes de empezar', corto: 'Preparar', min: 5,
      preguntar: [],
      hacer: ['Leer «Lo clave» de la ficha (columna de la izquierda).', 'Balanza tarada, guantes, linterna (otro celu), toallita, almohadón.', 'Celu o tablet cargado, con espacio para fotos y video.', 'Lavado de manos y guantes puestos.'],
      tener: ['Con guantes: tocá la pantalla con el nudillo, o usá el teclado de la compu (Tab para moverte, Espacio para marcar, flechas ← → para cambiar de paso).', 'Para escribir sin tocar nada: 🎙️ Dictar en las notas.'],
      evaluar: [['datos', ['fecha', 'modalidad']]], fotos: [],
    });

    // 2. Entrevista
    const preg = ['¿Cómo llegan hoy? ¿Cambió algo desde que completaron la ficha?', '¿Qué les gustaría llevarse de esta consulta?', 'Pañales de las últimas 24 h: cuántos pis y cuántas cacas.', '¿Cuántas tomas hubo ayer y cómo fue la noche?'];
    if (t('pecho_signos', 'fiebre')) preg.unshift('⚠️ ¿Tiene fiebre o escalofríos HOY? Si sí, con pecho rojo o duro: consulta médica hoy (posible mastitis).');
    if (!vacioTxt(r.meds_actual)) preg.push(`Medicación actual: «${r.meds_actual.trim()}». Anotar nombre y dosis, y chequear en e-lactancia.org.`);
    if (!pesos.length) preg.push('Pedir la libreta y copiar los pesos (nacimiento, alta, controles).');
    if (r.frenillo === 'nada' || r.frenillo === 'no_se') preg.push('Nadie le revisó el frenillo todavía: contarle que hoy lo vamos a mirar.');
    if (r.frenillo === 'cortado') preg.push(`Frenillo ya cortado${r.frenillo_det ? ` (${r.frenillo_det.trim()})` : ''}: ¿cuándo fue, qué cambió después y si hicieron ejercicios?`);
    if (r.extrae && r.extrae !== 'no') preg.push(`Extracción: cuándo, cuánto y para qué${r.embudo ? ` (embudo de ${r.embudo} mm: chequear el tamaño)` : ''}.`);
    if (r.trabajo === 'ya' || r.trabajo === 'pronto') preg.push(`Trabajo (${lbl('trabajo', r.trabajo).toLowerCase()}): cuántas horas está fuera y quién le da de comer mientras.`);
    const noSe = [];
    F.SECCIONES.forEach(s => { if (s.si && !s.si(r)) return; s.preguntas.forEach(p => { if ((!p.si || p.si(r)) && r[p.id] === 'no_se') noSe.push(p.t); }); });
    noSe.slice(0, 5).forEach(q => preg.push(`Respondió «no sé»: ${q}`));
    res.alarmas.filter(a => a.nivel === 'alta' && !/fiebre|Whooley/i.test(a.txt)).forEach(a => preg.push('⚠️ ' + a.txt));
    const tenerE = ['Escuchar primero y validar todo lo que viene haciendo, antes de corregir nada.'];
    if (r.objetivo) tenerE.push(`Su objetivo: ${lbl('objetivo', r.objetivo).toLowerCase()}. El plan se arma alrededor de eso.`);
    if (!vacioTxt(r.miedos)) tenerE.push(`Su miedo, con sus palabras: «${r.miedos.trim()}»`);
    if (!vacioTxt(r.que_probaste)) tenerE.push(`Ya probaron: «${r.que_probaste.trim()}»`);
    if (!vacioTxt(r.que_dijeron)) tenerE.push(`Le dijeron: «${r.que_dijeron.trim()}»`);
    if (r.lact_previa_txt) tenerE.push(`Lactancia anterior: «${r.lact_previa_txt.trim()}»`);
    P.push({ k: 'entrevista', t: 'Bienvenida y entrevista', corto: 'Entrevista', min: 10, preguntar: preg, tener: tenerE, evaluar: [], fotos: [] });

    // 3. Bebé en calma
    const tenerB = ['Pesar sin ropa (o con pañal seco), siempre en la misma balanza tarada.'];
    if (ult) tenerB.push(`Último peso de la ficha: ${ult.g.toLocaleString('es-PY')} g (${A.fmtFecha(ult.f)}).`);
    if (r.peso_nac) tenerB.push(`Peso al nacer: ${Number(r.peso_nac).toLocaleString('es-PY')} g.`);
    if (r.cabeza_lado === 'si') tenerB.push('La familia nota que gira la cabeza siempre hacia un lado: mirar rotación e inclinación a ambos lados.');
    if (r.boca_abierta === 'si' || r.ronca === 'si' || r.ronca === 'aveces') tenerB.push('Contaron boca abierta en reposo o ronquidos: mirar respiración nasal.');
    P.push({ k: 'bebe', t: 'Bebé en calma: mirar y pesar', corto: 'Bebé', min: 10, calcPeso: true,
      preguntar: ['¿Cuándo fue el último control con pediatra y qué peso le dio?'],
      hacer: ['Estado general: color, ictericia, tono, respiración, si está alerta o dormido.'],
      tener: tenerB,
      evaluar: [['datos', ['peso_hoy']], ['mof', ['tono', 'respiracion', 'cuello']], ['martinelli', ['a1']]],
      fotos: ['frente_reposo', 'perfil_der', 'perfil_izq', 'postura'] });

    // 4. Pecho y pezón
    const tenerP = [];
    if (r.dolor != null && r.dolor !== '') tenerP.push(`En la ficha marcó dolor ${r.dolor}/10${r.dolor_cuando && r.dolor_cuando.length ? ' (' + lbl('dolor_cuando', r.dolor_cuando).toLowerCase() + ')' : ''}.`);
    if (r.pecho_signos && r.pecho_signos.length && !t('pecho_signos', 'nada')) tenerP.push(`Marcó en el pecho: ${lbl('pecho_signos', r.pecho_signos).toLowerCase()}.`);
    if (r.pechos_cambios === 'pocos' || r.pechos_cambios === 'no') tenerP.push('Pocos cambios en los pechos en el embarazo: mirar forma y tejido mamario (riesgo de baja producción).');
    if (r.cirugia_mamaria && r.cirugia_mamaria.length && !t('cirugia_mamaria', 'ninguna')) tenerP.push(`Cirugía mamaria: ${lbl('cirugia_mamaria', r.cirugia_mamaria).toLowerCase()}.`);
    if (t('salud_diag', 'sop')) tenerP.push('Tiene SOP: tenerlo en cuenta para la producción.');
    P.push({ k: 'pecho', t: 'Pecho y pezón, antes de la toma', corto: 'Pecho', min: 5,
      preguntar: ['Dolor ahora, de 0 a 10.', '¿Algún pecho más duro, rojo o doloroso?'],
      tener: tenerP,
      evaluar: [['pechos', ['pezon_d', 'pezon_i', 'piel', 'mama']]], fotos: [] });

    // 5. Toma observada
    const tenerT = ['Dejar que se acomode como siempre los primeros minutos; recién después ayudar.', 'Pesada antes y después con la misma ropa y el mismo pañal.'];
    if (r.toma_nota && r.toma_nota.length) tenerT.push(`En la toma la familia nota: ${lbl('toma_nota', r.toma_nota).toLowerCase()}.`);
    if (r.duracion) tenerT.push(`Duración que contó: ${lbl('duracion', r.duracion).toLowerCase()}.`);
    P.push({ k: 'toma', t: 'Toma observada', corto: 'Toma', min: 20,
      preguntar: ['Después de ajustar posición o agarre: ¿cuánto duele ahora, de 0 a 10?'],
      tener: tenerT,
      evaluar: [['datos', ['pre']], ['obs', ['postura', 'agarre', 'succion', 'pecho']], ['latch', null], ['bbat', null], ['pechos', ['al_soltar']], ['datos', ['post']], ['obs', ['notas']]],
      puntajes: ['datos', 'latch', 'bbat'],
      fotos: ['agarre_perfil', 'agarre_arriba', 'pezon_frente', 'pezon_perfil', 'video_toma'] });

    // 6. Boca y frenillo
    const tenerO = ['Guantes nuevos antes de lo intraoral.', 'Lengua y frenillo: en el llanto y con la maniobra de elevación (índices en los bordes laterales de la lengua, elevar y llevar hacia atrás).'];
    if (r.frenillo === 'cortado') tenerO.push(`Ya le cortaron el frenillo${r.frenillo_det ? ` (${r.frenillo_det.trim()})` : ''}: mirar cicatriz, posible reinserción y movilidad. Si sigue con chasquidos, buscar compensaciones.`);
    if (Object.keys(E.prefillMartinelli(r)).length) tenerO.push('La historia de Martinelli ya viene sugerida desde la ficha: tocá «usar las sugerencias».');
    P.push({ k: 'boca', t: 'Evaluación orofacial y frenillo', corto: 'Boca', min: 15,
      preguntar: [],
      tener: tenerO,
      evaluar: [['mof', ['busqueda', 'succion_ref', 'mordida', 'nausea', 'snn', 'labios', 'kotlow', 'paladar', 'mandibula', 'lengua_reposo']], ['martinelli', null], ['btat', null], ['mof', ['notas']]],
      puntajes: ['martinelli', 'btat'],
      fotos: ['llanto', 'maniobra', 'protrusion', 'labial', 'paladar'] });

    // 7. Mamadera
    if (mam) {
      const pregM = ['¿Quién le da la mamadera y en qué momento del día?', '¿Qué pasa cuando se la ofrecen: llora, juega con la tetina, la escupe, se atraganta?', '¿Qué mamaderas y tetinas probaron, con qué leche y a qué temperatura?'];
      const tenerM = ['Sin forzar ni demonizar: que la ofrezca otra persona, con el bebé tranquilo y sin mucha hambre.', 'Tetina de flujo lento, más vertical y con pausas (alimentación a ritmo).', 'Si no la acepta, vaso, cucharita o vaso de transición también sirven.'];
      if (r.mam_marca) tenerM.unshift(`Usan: ${r.mam_marca.trim()}${r.tetina_flujo ? ', flujo ' + lbl('tetina_flujo', r.tetina_flujo).toLowerCase() : ''}.`);
      P.push({ k: 'mamadera', t: 'Mamadera observada', corto: 'Mamadera', min: 10, preguntar: pregM, tener: tenerM, evaluar: [['mamadera', null]], fotos: [] });
    }

    // 8. Ánimo
    if (animo) P.push({ k: 'animo', t: 'Cómo está quien amamanta', corto: 'Ánimo', min: 5,
      preguntar: ['¿Cómo estás durmiendo? ¿Cómo te sentís estos días?', 'En las últimas 2 semanas, ¿te sentiste triste o sin ganas de hacer cosas que te gustaban?', '¿Con quién compartís los cuidados? ¿Quién te ayuda?', 'Pasar la escala de Edimburgo (EPDS) si hace falta.'],
      tener: ['Preguntar con calma y sin apuro; validar.', 'Si aparece riesgo (ideas de hacerse daño), la consulta no termina sin un contacto de ayuda y una derivación.'],
      evaluar: [['cierre', ['derivaciones']]], fotos: [] });

    // 9. Plan y cierre
    P.push({ k: 'plan', t: 'Plan y cierre', corto: 'Plan', min: 10,
      preguntar: ['¿Quedó alguna duda? ¿Qué te llevás para hacer hoy?'],
      tener: ['Contar lo que viste con palabras simples.', '3 indicaciones como mucho, y que las practique en la sesión.', 'Acordar el próximo control.'],
      evaluar: [['cierre', ['impresion', 'indicaciones', 'indicaciones_txt', 'derivaciones', 'proximo']]], fotos: [] });

    // 10. Después
    P.push({ k: 'despues', t: 'Después de la consulta', corto: 'Después', min: 5,
      hacer: ['Corregir ortografía y redacción y revisar la coherencia: columna de la izquierda → Informe → ✨ IA.', 'Revisar el informe (para la familia y profesional).', 'Mandar la devolución por WhatsApp o en PDF.', 'Agendar el próximo control.'],
      tener: [], evaluar: [], fotos: [] });
    P.forEach(p => { p.preguntar = p.preguntar || []; p.hacer = p.hacer || []; });
    return P;
  }

  let consultaTeclas = null, informeTimer = null;
  function tabConsulta(v) {
    const ev = actual.evaluacion;
    ev._consulta = ev._consulta || {};
    const cs = ev._consulta; cs.checks = cs.checks || {}; cs.paso = cs.paso || 0;
    ev.datos = ev.datos || {};
    if (!ev.datos.fecha) ev.datos.fecha = new Date().toISOString().slice(0, 10);
    if (!ev.datos.modalidad && ['consultorio', 'domicilio', 'online'].includes(actual.ficha.modalidad)) ev.datos.modalidad = actual.ficha.modalidad;
    const P = pasosConsulta();
    if (cs.paso >= P.length) cs.paso = 0;
    document.body.classList.add('modo-consulta');
    v.innerHTML = `<div class="consulta-movil no-print" role="tablist">
        <button class="chip" data-col="proto" aria-pressed="true">📋 Protocolo</button>
        <button class="chip" data-col="lado" aria-pressed="false">📄 Ficha e informe</button></div>
      <div class="consulta" data-col="proto">
        <aside class="lado tarjeta" id="cons-lado"></aside>
        <section class="proto" id="cons-proto"></section>
      </div>`;
    const cont = v.querySelector('.consulta');
    v.querySelectorAll('[data-col]').forEach(b => b.tagName === 'BUTTON' && b.addEventListener('click', () => {
      cont.dataset.col = b.dataset.col;
      v.querySelectorAll('button[data-col]').forEach(x => x.setAttribute('aria-pressed', x === b));
      if (b.dataset.col === 'lado') ladoConsulta();
      window.scrollTo(0, 0);
    }));
    let ladoVista = 'clave';
    function ladoConsulta(vista) {
      if (vista) ladoVista = vista;
      const L = $('#cons-lado');
      const seg = [['clave', 'Lo clave'], ['todo', 'Todas las respuestas'], ['informe', 'Informe']];
      let h = `<div class="seg">${seg.map(([k, t]) => `<button class="chip" data-lado="${k}" aria-pressed="${k === ladoVista}">${t}</button>`).join('')}</div>`;
      if (ladoVista === 'clave') h += `<div class="resumen">${A.aHTML(actual.res, actual.ficha)}</div>`;
      else if (ladoVista === 'todo') h += respuestasHTML();
      else h += informeHTML();
      L.innerHTML = h;
      L.querySelectorAll('[data-lado]').forEach(b => b.addEventListener('click', () => ladoConsulta(b.dataset.lado)));
      if (ladoVista === 'todo') conectarAudios(L);
      if (ladoVista === 'informe') conectarInforme(L, () => ladoConsulta());
    }
    function refrescarInforme() {
      if (ladoVista !== 'informe') return;
      clearTimeout(informeTimer); informeTimer = setTimeout(() => ladoConsulta(), 500);
    }
    function pintarPaso() {
      const p = P[cs.paso], k = p.k;
      const marcados = pp => pp.preguntar.concat(pp.hacer).filter((_, j) => cs.checks[`${pp.k}.${j}`]).length;
      let h = `<nav class="pasos-nav no-print">${P.map((pp, i) => {
        const tot = pp.preguntar.length + pp.hacer.length, n = marcados(pp);
        return `<button class="chip ${i === cs.paso ? 'actual' : ''} ${tot && n === tot ? 'listo' : ''}" data-paso="${i}" aria-pressed="${i === cs.paso}">${i + 1}. ${esc(pp.corto)}${tot && n === tot ? ' ✓' : ''}</button>`;
      }).join('')}</nav>`;
      h += `<div class="tarjeta paso"><div class="test-tit"><h2>${cs.paso + 1}. ${esc(p.t)}</h2><span class="ayuda" style="margin:0">${p.min} min</span></div>`;
      const lista = (arr, off, tit) => arr.length ? `<h4>${tit}</h4>` + arr.map((it, j) => { const kk = `${k}.${off + j}`; return `<label class="check grande"><input type="checkbox" data-cc="${kk}" ${cs.checks[kk] ? 'checked' : ''}><span>${esc(it)}</span></label>`; }).join('') : '';
      h += lista(p.preguntar, 0, '🗣️ Preguntar');
      h += lista(p.hacer, p.preguntar.length, '✅ Hacer');
      if (p.tener.length) h += `<h4>💡 Tener en cuenta</h4><ul class="tener">${p.tener.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`;
      if (p.evaluar.length) {
        h += `<h4>🩺 Evaluar</h4>`;
        const sug = E.prefillMartinelli(actual.ficha);
        let ultimoTest = null;
        p.evaluar.forEach(([tid, ids]) => {
          const tt = E.TESTS.find(x => x.id === tid);
          const e = ev[tid] || {};
          const items = ids ? tt.items.filter(i => ids.includes(i.id)) : tt.items;
          const conPuntaje = (p.puntajes || []).includes(tid) && (tt.puntaje || tt.martinelli);
          if (tid !== ultimoTest) h += `<div class="sub-test"><span>${tt.emo} ${esc(tt.titulo)}</span>${conPuntaje ? `<span class="score" id="sc-${tid}"></span>` : ''}</div>`;
          ultimoTest = tid;
          let grupo = null;
          items.forEach(i => {
            if (tt.martinelli && !ids && i.grupo !== grupo) {
              grupo = i.grupo;
              const nombres = { historia: 'Historia clínica', anato: 'Anatomofuncional', succion: 'Succión' };
              if (nombres[grupo]) h += `<h5>${nombres[grupo]}</h5>`;
            }
            h += `<div class="item">${campoEval(tt, i, e, tid === 'martinelli' ? sug[i.id] : undefined)}</div>`;
            if (tid === 'datos' && i.id === 'peso_hoy') h += `<div class="interp oculto" id="calc-peso"></div>`;
          });
          if ((p.puntajes || []).includes(tid) && (tt.puntaje || tt.martinelli || tid === 'datos')) h += `<div class="interp oculto" id="in-${tid}"></div>`;
        });
      }
      if (p.fotos.length) {
        h += `<h4>📷 Fotos</h4><div class="fotos-cons">`;
        p.fotos.forEach(fid => {
          const ft = E.FOTOS.tomas.find(x => x.id === fid);
          const ya = actual.archivos.filter(a => a.clase === 'protocolo' && a.pregunta === fid);
          h += `<div class="foto-cons ${ya.length ? 'ya' : ''}"><div><b>${ya.length ? '✅' : '⬜'} ${esc(ft.t)}</b><div class="ayuda">${esc(ft.como)}</div></div>
            <div class="fotos-grid">${ya.map(a => `<div class="foto" data-ver="${a.fileId}"></div>`).join('')}</div>
            <label class="boton-subir no-print">📷 ${ya.length ? 'Otra' : (ft.video ? 'Grabar' : 'Sacar')}<input type="file" accept="${ft.video ? 'video/*' : 'image/*'}" capture="environment" data-prot="${fid}" data-etq="${esc(ft.t)}"></label>
            <div class="ayuda oculto" id="sub-${fid}"></div></div>`;
        });
        h += `</div>`;
      }
      h += `<h4>📝 Notas de este paso</h4>${campoEval({ id: '_notas' }, { id: k, tipo: 'texto', t: '' }, ev._notas || {})}`;
      h += `</div>`;
      h += `<div class="barra-consulta no-print">
        <button class="btn sec" id="cons-prev" ${cs.paso === 0 ? 'disabled' : ''}>◀ Anterior</button>
        <button class="btn sec" id="guardar-ev">Guardar</button>
        <button class="btn prim" id="cons-next">${cs.paso === P.length - 1 ? '✓ Ver informe' : 'Siguiente ▶'}</button></div>
        <p class="ayuda no-print" id="ev-estado" style="text-align:center"></p>`;
      const pr = $('#cons-proto');
      pr.innerHTML = h;
      pr.querySelectorAll('[data-paso]').forEach(b => b.addEventListener('click', () => irPaso(+b.dataset.paso)));
      pr.querySelectorAll('[data-cc]').forEach(c => c.addEventListener('change', () => { cs.checks[c.dataset.cc] = c.checked; cambio(); pintarNav(); }));
      conectarEval(pr, () => { pintarPeso(); refrescarInforme(); }, () => pintarPaso());
      pr.querySelectorAll('[data-ver]').forEach(cargarMiniatura);
      pr.querySelectorAll('[data-prot]').forEach(inp => inp.addEventListener('change', () => subirProtocolo(inp, () => pintarPaso())));
      $('#cons-prev').addEventListener('click', () => irPaso(cs.paso - 1));
      $('#cons-next').addEventListener('click', () => {
        if (cs.paso < P.length - 1) return irPaso(cs.paso + 1);
        guardarEval();
        if (getComputedStyle(v.querySelector('.consulta-movil')).display !== 'none') v.querySelector('button[data-col=lado]').click();
        ladoConsulta('informe');
      });
      $('#guardar-ev').addEventListener('click', guardarEval);
      puntajes(); pintarPeso();
    }
    function pintarNav() {
      const nav = $('#cons-proto .pasos-nav'); if (!nav) return;
      nav.querySelectorAll('[data-paso]').forEach(b => {
        const pp = P[+b.dataset.paso];
        const tot = pp.preguntar.length + pp.hacer.length;
        const n = pp.preguntar.concat(pp.hacer).filter((_, j) => cs.checks[`${pp.k}.${j}`]).length;
        b.classList.toggle('listo', !!tot && n === tot);
        b.textContent = `${+b.dataset.paso + 1}. ${pp.corto}${tot && n === tot ? ' ✓' : ''}`;
      });
    }
    function pintarPeso() {
      const el = $('#calc-peso'); if (!el) return;
      const txt = textoPeso();
      el.textContent = txt; el.classList.toggle('oculto', !txt);
    }
    function irPaso(i) {
      if (i < 0 || i >= P.length) return;
      cs.paso = i; cambio(); pintarPaso();
      const pr = $('#cons-proto'); if (pr.scrollIntoView) pr.scrollIntoView({ block: 'start' });
    }
    if (consultaTeclas) document.removeEventListener('keydown', consultaTeclas);
    consultaTeclas = e => {
      if (tab !== 'consulta' || !document.body.contains($('#cons-proto'))) return;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) && e.target.type !== 'checkbox') return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); irPaso(cs.paso + 1); }
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); irPaso(cs.paso - 1); }
    };
    document.addEventListener('keydown', consultaTeclas);
    ladoConsulta();
    pintarPaso();
  }

  // Peso: cálculo en vivo con el peso de hoy
  function textoPeso() {
    const r = actual.ficha, d = (actual.evaluacion.datos || {});
    const hoy = parseFloat(d.peso_hoy); if (!hoy) return '';
    const fEval = d.fecha ? new Date(d.fecha + 'T12:00:00') : new Date();
    const pesos = A.pesosOrdenados(r).filter(p => p.f < fEval);
    const ult = pesos[pesos.length - 1];
    const partes = [];
    if (ult) { const dias = Math.max(1, Math.round((fEval - ult.f) / 86400000)); partes.push(`Desde el último peso (${A.fmtFecha(ult.f)}): ${hoy - ult.g >= 0 ? '+' : ''}${Math.round(hoy - ult.g)} g en ${dias} ${dias === 1 ? 'día' : 'días'} = ${Math.round((hoy - ult.g) / dias)} g/día`); }
    const nac = parseFloat(r.peso_nac), fn = r.bebe_nac ? new Date(r.bebe_nac + 'T12:00:00') : null;
    if (nac && fn) { const dias = Math.max(1, Math.round((fEval - fn) / 86400000)); partes.push(`Desde el nacimiento: ${hoy - nac >= 0 ? '+' : ''}${Math.round(hoy - nac)} g en ${dias} días = ${Math.round((hoy - nac) / dias)} g/día`); }
    if (!partes.length) return '';
    return partes.join(' · ') + '. Referencia orientativa en los primeros 3 meses: unos 20 a 35 g/día.';
  }

  // ---------- Informe (para la familia o profesional) ----------
  let informeTipo = 'familia';
  function informeHTML() {
    const ia = actual.evaluacion._ia && iaVer;
    const manual = informeTipo === 'familia' && actual.devolucion && !ia;
    const html = ia ? iaInformeHTML(informeTipo) : informeTipo === 'familia' ? (actual.devolucion || generarDevolucion()) : generarInformeClinico();
    return `${iaCajaHTML()}<div class="seg" style="margin-top:6px">
        <button class="chip" data-inf="familia" aria-pressed="${informeTipo === 'familia'}">Para la familia</button>
        <button class="chip" data-inf="clinico" aria-pressed="${informeTipo === 'clinico'}">Profesional</button></div>
      <p class="ayuda">${ia ? 'Redactado con IA a partir de la ficha, lo que marcaste y tus notas.' : manual ? 'Es la versión que editaste a mano en Devolución.' : 'Se arma solo con la ficha y lo que vas marcando.'}</p>
      <div class="devolucion" id="inf-prev">${html}</div>
      <div class="fila-botones no-print">
        <button class="btn sec" id="inf-copiar">📋 Copiar</button>
        <button class="btn sec" id="inf-imprimir">🖨️ PDF</button>
        ${informeTipo === 'familia' ? '<button class="btn prim" id="inf-editar">✏️ Editar y mandar</button>' : ''}</div>`;
  }
  function conectarInforme(L, repintar) {
    conectarIA(L, repintar);
    L.querySelectorAll('[data-inf]').forEach(b => b.addEventListener('click', () => { informeTipo = b.dataset.inf; repintar(); }));
    $('#inf-copiar').addEventListener('click', () => copiar($('#inf-prev').innerText, $('#inf-copiar')));
    $('#inf-imprimir').addEventListener('click', () => imprimirHTML($('#inf-prev').innerHTML));
    const ed = $('#inf-editar'); if (ed) ed.addEventListener('click', () => {
      if (actual.evaluacion._ia && iaVer && (!actual.devolucion || confirm('¿Reemplazo la devolución que editaste a mano por la redactada con IA?'))) { actual.devolucion = $('#inf-prev').innerHTML; sucio = true; }
      tab = 'devolucion'; abrirTab();
    });
  }
  function imprimirHTML(html) {
    const w = window.open('', '_blank');
    if (!w) return alert('Permití las ventanas emergentes para imprimir.');
    w.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Informe</title><link rel="stylesheet" href="${location.href.replace(/[^/]*$/, '')}estilos.css"><style>body{background:#fff;padding:24px;max-width:780px;margin:auto}.devolucion h1{font-family:var(--serif);font-style:italic;color:var(--azul);font-size:26px;margin:0}.devolucion h2{font-size:18px;color:var(--azul);margin:18px 0 6px}.dev-cab{display:flex;gap:12px;align-items:center;border-bottom:2px solid var(--rosa-cl);padding-bottom:12px}.dev-cab .iso{--lc:var(--beige);--lq:var(--azul);--lf:var(--rosa);width:52px}.meta{color:var(--gris);font-size:14px}.firma-dev{margin-top:22px;border-top:2px solid var(--rosa-cl);padding-top:10px;font-size:14px;color:var(--gris)}table{border-collapse:collapse;width:100%}td{padding:4px 8px 4px 0;vertical-align:top}</style></head><body><div class="devolucion">${html}</div><script>setTimeout(()=>print(),400)<\/script></body></html>`);
    w.document.close();
  }
  function generarInformeClinico(sinNotas) {
    const r = actual.ficha, ev = actual.evaluacion, res = actual.res;
    const d = ev.datos || {}, c = ev.cierre || {};
    const fechaEval = d.fecha ? new Date(d.fecha + 'T12:00:00') : new Date();
    const nac = r.bebe_nac ? new Date(r.bebe_nac + 'T12:00:00') : null;
    const edad = nac ? Math.floor((fechaEval - nac) / 86400000) : null;
    const op = (tid, iid, v) => { const it = E.TESTS.find(t => t.id === tid).items.find(i => i.id === iid); return (it.opciones.find(o => o.v === v) || {}).t || v; };
    const ops = (tid, iid) => { const v = (ev[tid] || {})[iid]; if (v == null || v === '' || (Array.isArray(v) && !v.length)) return ''; return Array.isArray(v) ? v.map(x => op(tid, iid, x)).join(', ') : op(tid, iid, v); };
    const fila = (k, v) => v ? `<tr><td style="color:#878787;white-space:nowrap">${esc(k)}</td><td>${v}</td></tr>` : '';
    const sec = (tit, filas) => filas.replace(/\s/g, '') ? `<h2>${tit}</h2><table>${filas}</table>` : '';
    let h = `<div class="dev-cab"><div class="iso">${C.ISO}</div><div><h1>Informe de evaluación en lactancia</h1><div class="meta">${A.fmtFecha(fechaEval)}${d.modalidad ? ' · ' + esc(op('datos', 'modalidad', d.modalidad)) : ''}</div></div></div>`;
    h += sec('Datos', fila('Paciente', esc(r.bebe_nombre || '')) + fila('Edad', edad != null ? esc(A.edadTexto(edad)) : '') + fila('Nacimiento', [r.sem_gest ? r.sem_gest + ' sem' : '', r.tipo_parto ? A.etiqueta('tipo_parto', r.tipo_parto) : '', r.peso_nac ? Number(r.peso_nac).toLocaleString('es-PY') + ' g' : ''].filter(Boolean).map(esc).join(' · ')) + fila('Quien amamanta', esc(r.quien_nombre || '')));
    h += sec('Motivo de consulta', fila('Motivo', esc([r.motivo_chips && r.motivo_chips.length ? A.etiqueta('motivo_chips', r.motivo_chips) : '', r.motivo_txt ? '«' + r.motivo_txt.trim() + '»' : ''].filter(Boolean).join('. '))) + fila('Alimentación', r.alim ? esc(A.etiqueta('alim', r.alim)) : '') + fila('Objetivo', r.objetivo ? esc(A.etiqueta('objetivo', r.objetivo)) : ''));
    const pt = textoPeso();
    const pre = parseFloat(d.pre), post = parseFloat(d.post);
    h += sec('Antropometría', fila('Peso de hoy', d.peso_hoy ? Math.round(d.peso_hoy).toLocaleString('es-PY') + ' g' : '') + fila('Evolución', esc(pt.replace(/\. Referencia.*$/, ''))) + fila('Pesada pre/post', pre && post ? `${pre} → ${post} g (transferencia aprox. ${Math.round(post - pre)} ml)` : ''));
    const sc = id => { const t = E.TESTS.find(x => x.id === id), p = E.puntos(t, ev); return p.n ? `${p.s}/${t.max}${p.n === p.total ? ' · ' + esc(t.interpreta(p.s)) : ` (${p.n} de ${p.total} ítems)`}` : ''; };
    const obs = E.TESTS.find(t => t.id === 'obs'); const eo = ev.obs || {};
    const obsTxt = obs.items.filter(i => i.tipo === 'checks').map(i => { const n = (eo[i.id] || []).length; return n ? `${i.t}: ${n}/${i.opciones.length}` : ''; }).filter(Boolean).join(' · ');
    h += sec('Evaluación de la toma', fila('Observación OMS', esc(obsTxt)) + fila('LATCH', sc('latch')) + fila('BBAT', sc('bbat')) + fila('Pezón al soltar', esc(ops('pechos', 'al_soltar'))) + fila('Notas', esc(eo.notas || '')));
    const m = E.martinelli(ev);
    const mofI = ['busqueda', 'succion_ref', 'mordida', 'nausea', 'snn', 'labios', 'kotlow', 'paladar', 'mandibula', 'tono', 'lengua_reposo', 'respiracion', 'cuello'];
    const mofT = E.TESTS.find(t => t.id === 'mof');
    h += sec('Motricidad orofacial y frenillo', fila('BTAT', sc('btat')) + fila('Martinelli', m.lineas.map(esc).join('<br>')) + mofI.map(i => fila(mofT.items.find(x => x.id === i).t, esc(ops('mof', i)))).join('') + fila('Notas', esc((ev.mof || {}).notas || '')) + fila('Notas frenillo', esc((ev.martinelli || {}).notas || '')));
    h += sec('Pecho y pezón', ['pezon_d', 'pezon_i', 'piel', 'mama'].map(i => fila(E.TESTS.find(t => t.id === 'pechos').items.find(x => x.id === i).t, esc(ops('pechos', i)))).join('') + fila('Notas', esc((ev.pechos || {}).notas || '')));
    if (ev.mamadera) h += sec('Mamadera', ['postura', 'ritmo', 'signos'].map(i => fila(E.TESTS.find(t => t.id === 'mamadera').items.find(x => x.id === i).t, esc(ops('mamadera', i)))).join('') + fila('Tiempo', ev.mamadera.tiempo ? esc(ev.mamadera.tiempo) + ' min' : '') + fila('Notas', esc(ev.mamadera.notas || '')));
    const notas = Object.entries(ev._notas || {}).filter(([, v]) => v && v.trim());
    if (notas.length && !sinNotas) h += `<h2>Notas de la sesión</h2><ul>${notas.map(([, v]) => `<li>${esc(v)}</li>`).join('')}</ul>`;
    if (c.impresion) h += `<h2>Impresión</h2><p>${esc(c.impresion)}</p>`;
    const ind = (c.indicaciones || []).map(v => op('cierre', 'indicaciones', v)); if (c.indicaciones_txt) ind.push(c.indicaciones_txt);
    if (ind.length) h += `<h2>Plan</h2><ol>${ind.map(x => `<li>${esc(x)}</li>`).join('')}</ol>`;
    const der = (c.derivaciones || []).map(v => op('cierre', 'derivaciones', v));
    if (der.length) h += `<h2>Derivaciones</h2><p>${der.map(esc).join(', ')}</p>`;
    if (c.proximo) h += `<h2>Próximo control</h2><p>${esc(c.proximo)}</p>`;
    h += `<div class="firma-dev"><b>${esc(window.CONFIG.NOMBRE)}</b><br>${esc(window.CONFIG.TITULOS)}<br>📱 ${esc(window.CONFIG.WHATSAPP)}</div>`;
    return h;
  }

  // ---------- ✨ IA: control de coherencia, corrección y redacción del informe ----------
  // Llama a Claude desde el navegador con la clave de Anthropic que Ceci guarda en su dispositivo.
  const IA_MODELO = 'claude-opus-5-5';
  const IA_SISTEMA = `Sos la asistente de redacción clínica de la Lic. Cecilia Quevedo (Ceci), fonoaudióloga y asesora en lactancia en Asunción, Paraguay. Después de cada consulta de lactancia, Ceci carga en su panel la ficha que completó la familia, los ítems de evaluación que marcó y notas sueltas, muchas veces dictadas por voz, con errores de ortografía, abreviaturas y frases cortadas.

Tu trabajo tiene cuatro partes.

1. Control de coherencia. Cruzá las notas con los ítems marcados, los puntajes y la ficha. En "incoherencias" anotá cada contradicción concreta (por ejemplo: una nota dice que el agarre es bueno pero el LATCH es bajo; la ficha dice que el frenillo se cortó y una nota dice que no). En "faltantes" anotá los datos que hacen falta para cerrar el informe y no están (peso de hoy, impresión, plan, próximo control, fotos clave, ítems sin evaluar que el caso pide). En "alertas" anotá lo que requiere atención clínica pronto (signos de alarma, derivaciones que el caso sugiere y no figuran). Cada punto en una frase corta y concreta. Si no hay nada, dejá la lista vacía.

2. Notas corregidas. Para cada nota por paso, devolvé el mismo contenido con ortografía, puntuación y redacción corregidas, abreviaturas desarrolladas y frases completas. No agregues información que la nota no tenga y no quites nada clínico. En "paso" usá exactamente la clave que aparece entre corchetes.

3. Informe profesional. Redactá un informe clínico claro y ordenado para otro profesional (pediatría, odontopediatría, kinesiología), con estas secciones en este orden cuando haya datos: Motivo de consulta; Antecedentes relevantes; Evaluación (antropometría, toma, motricidad orofacial y frenillo, pecho y pezón, mamadera si corresponde); Análisis; Plan e indicaciones; Derivaciones; Próximo control. En Análisis integrá los hallazgos y planteá hipótesis con prudencia ("compatible con", "sugiere"), sin diagnósticos que la evaluación no sostenga. Incluí los puntajes (LATCH, BBAT, BTAT, Martinelli) con su interpretación cuando estén. Si una sección no tiene datos, no la pongas.

4. Devolución para la familia. Escribí con la voz de Ceci: cálida, cercana, en primera persona, con voseo y lenguaje neutro ("les", "acompañarles"), párrafos cortos, sin tecnicismos (o explicados con palabras simples) y con pasos concretos para la casa. Secciones sugeridas: Lo que vimos hoy; Lo que está saliendo bien; Lo que vamos a trabajar; Para hacer en casa; Próximo encuentro. Terminá la última sección con "Cualquier duda me escriben!". Como mucho un emoji suave (🤍).

Reglas:
- Nunca escribas "mamá" ni "madre". Nombrá a quien amamanta por su nombre o usá formas neutras ("quien amamanta", "les").
- No demonices la mamadera ni el chupete: si hay indicaciones sobre su uso, formulalas en positivo y sin culpa.
- No inventes datos, valores ni hallazgos. Lo que no está en el material no va en los informes: anotalo en "faltantes".
- Llamá al bebé por su nombre.
- Español de Paraguay y el Río de la Plata. En cada "texto" separá los párrafos con una línea en blanco y escribí las listas como líneas que empiezan con "- ". Sin títulos ni negritas de Markdown.
- No pongas encabezado ni firma: el panel los agrega.`;
  const IA_LISTA = { type: 'array', items: { type: 'string' } };
  const IA_SECCIONES = { type: 'array', items: { type: 'object', additionalProperties: false, required: ['titulo', 'texto'], properties: { titulo: { type: 'string' }, texto: { type: 'string' } } } };
  const IA_ESQUEMA = {
    type: 'object', additionalProperties: false, required: ['control', 'notas_corregidas', 'informe_profesional', 'devolucion_familia'],
    properties: {
      control: { type: 'object', additionalProperties: false, required: ['incoherencias', 'faltantes', 'alertas'], properties: { incoherencias: IA_LISTA, faltantes: IA_LISTA, alertas: IA_LISTA } },
      notas_corregidas: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['paso', 'texto'], properties: { paso: { type: 'string' }, texto: { type: 'string' } } } },
      informe_profesional: IA_SECCIONES,
      devolucion_familia: IA_SECCIONES,
    }
  };
  let iaSDK = null, iaVer = true, iaPidiendo = false, iaMsg = '';
  const iaClave = () => { try { return localStorage.getItem('panel-ia-clave') || ''; } catch (e) { return ''; } };
  function htmlATexto(html) {
    const d = document.createElement('div'); d.innerHTML = html;
    d.querySelectorAll('.dev-cab, .firma-dev').forEach(x => x.remove());
    d.querySelectorAll('br').forEach(b => b.replaceWith('\n'));
    d.querySelectorAll('tr').forEach(tr => { tr.textContent = '- ' + [...tr.querySelectorAll('td')].map(t => t.textContent.trim()).join(': ') + '\n'; });
    d.querySelectorAll('h2').forEach(x => { x.textContent = '\n## ' + x.textContent + '\n'; });
    d.querySelectorAll('li').forEach(li => { li.textContent = '- ' + li.textContent + '\n'; });
    d.querySelectorAll('p').forEach(p => { p.textContent = p.textContent + '\n'; });
    return d.textContent.replace(/\n{3,}/g, '\n\n').trim();
  }
  function fichaTexto() {
    const r = actual.ficha, out = [];
    F.SECCIONES.forEach(s => {
      if (s.si && !s.si(r)) return;
      const filas = s.preguntas.filter(p => !p.si || p.si(r)).map(p => {
        const val = valorTexto(p, r[p.id]), nota = r[p.id + '__nota'];
        const trs = actual.archivos.filter(a => a.pregunta === p.id && a.clase === 'audio').map(a => (actual.transcripciones || {})[a.fileId]).filter(Boolean);
        if (!val && !nota && !trs.length) return '';
        return `- ${p.t}: ${[val, nota ? `(comentario: ${nota})` : '', ...trs.map(t => `(audio: ${t})`)].filter(Boolean).join(' ')}`;
      }).filter(Boolean);
      if (filas.length) out.push(`## ${s.titulo}\n${filas.join('\n')}`);
    });
    return out.join('\n\n');
  }
  function dossierIA() {
    const ev = actual.evaluacion, P = pasosConsulta(), cs = ev._consulta || {}, checks = cs.checks || {};
    const notas = P.map(p => [p, ((ev._notas || {})[p.k] || '').trim()]).filter(([, t]) => t);
    const sinHacer = P.map(p => { const arr = p.preguntar.concat(p.hacer).filter((_, j) => !checks[`${p.k}.${j}`]); return arr.length && arr.length < p.preguntar.length + p.hacer.length ? `- ${p.t}: ${arr.join(' / ')}` : ''; }).filter(Boolean);
    const fotos = actual.archivos.filter(a => a.clase === 'protocolo').map(a => a.etiqueta || a.pregunta);
    return [
      `# Ficha que completó la familia\n${fichaTexto()}`,
      `# Resumen automático de la ficha\n${A.aTexto(actual.res)}`,
      `# Evaluación marcada en la consulta\n${htmlATexto(generarInformeClinico(true))}`,
      `# Notas de Ceci por paso\n${notas.length ? notas.map(([p, t]) => `[${p.k}] ${p.t}:\n${t}`).join('\n\n') : '(sin notas)'}`,
      sinHacer.length ? `# Ítems del protocolo que no marcó como hechos (en pasos que sí empezó)\n${sinHacer.join('\n')}` : '',
      `# Fotos de la consulta\n${fotos.length ? fotos.map(f => '- ' + f).join('\n') : '(ninguna cargada)'}`,
    ].filter(Boolean).join('\n\n');
  }
  async function iaLlamar(contenido) {
    if (!iaSDK) iaSDK = (await import('./vendor/anthropic-sdk.mjs')).default;
    const cliente = new iaSDK({ apiKey: iaClave(), dangerouslyAllowBrowser: true, maxRetries: 2 });
    const pedido = {
      model: IA_MODELO, max_tokens: 16000, system: IA_SISTEMA,
      messages: [{ role: 'user', content: contenido }],
      output_config: { effort: 'medium', format: { type: 'json_schema', schema: IA_ESQUEMA } },
    };
    let r;
    try { r = await cliente.beta.messages.create({ ...pedido, betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' }); }
    catch (e) { if (e && e.status === 400 && /fallback/i.test(e.message || '')) r = await cliente.messages.create(pedido); else throw e; }
    if (r.stop_reason === 'refusal') throw new Error('La IA no pudo procesar este caso. Probá de nuevo en un rato.');
    if (r.stop_reason === 'max_tokens') throw new Error('La respuesta quedó cortada. Probá de nuevo.');
    const txt = r.content.filter(b => b.type === 'text').map(b => b.text).join('');
    return JSON.parse(txt);
  }
  function iaError(e) {
    const s = e && e.status, m = (e && e.message) || '';
    if (s === 401) { try { localStorage.removeItem('panel-ia-clave'); } catch (x) { } return 'La clave de IA no es válida. Pegala de nuevo.'; }
    if (/credit balance|billing/i.test(m)) return 'Tu cuenta de Anthropic se quedó sin crédito. Cargá saldo en console.anthropic.com → Billing.';
    if (s === 429 || s === 529) return 'La IA está con mucho uso. Probá de nuevo en un minuto.';
    if (s >= 500) return 'La IA no respondió. Probá de nuevo en un minuto.';
    if (e instanceof TypeError || /fetch|network/i.test(m)) return 'No hay conexión con la IA. Revisá internet y probá de nuevo.';
    return m || 'No se pudo procesar.';
  }
  async function iaGenerar(alTerminar) {
    if (iaPidiendo) return;
    iaPidiendo = true; iaMsg = '';
    if (alTerminar) alTerminar();
    const t0 = Date.now();
    const tic = () => { const el = document.getElementById('ia-estado'); if (el) el.textContent = `Leyendo y ordenando tus notas… ${Math.round((Date.now() - t0) / 1000)} s (suele tardar menos de un minuto)`; };
    tic(); const int = setInterval(tic, 1000);
    try {
      const out = await iaLlamar(dossierIA());
      actual.evaluacion._ia = Object.assign({ fecha: new Date().toISOString() }, out);
      iaVer = true; cambio(); guardarEval();
    } catch (e) { iaMsg = '⚠️ ' + iaError(e); console.warn(e); }
    finally { clearInterval(int); iaPidiendo = false; }
    if (alTerminar) alTerminar();
  }
  function parrafosHTML(t) {
    const item = l => /^[-•]\s+/.test(l);
    return String(t || '').split(/\n\s*\n/).map(b => {
      const ls = b.split('\n').map(x => x.trim()).filter(Boolean);
      let h = '', lista = [];
      const cerrar = () => { if (lista.length) h += `<ul>${lista.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`; lista = []; };
      ls.forEach(l => { if (item(l)) lista.push(l.replace(/^[-•]\s+/, '')); else { cerrar(); h += `<p>${esc(l)}</p>`; } });
      cerrar(); return h;
    }).join('');
  }
  function iaInformeHTML(tipo) {
    const ia = actual.evaluacion._ia, r = actual.ficha, d = actual.evaluacion.datos || {};
    const fechaEval = d.fecha ? new Date(d.fecha + 'T12:00:00') : new Date();
    const nac = r.bebe_nac ? new Date(r.bebe_nac + 'T12:00:00') : null;
    const edad = nac ? Math.floor((fechaEval - nac) / 86400000) : null;
    const tit = tipo === 'familia' ? 'Devolución de la asesoría' : 'Informe de evaluación en lactancia';
    const meta = [r.bebe_nombre || '', edad != null ? A.edadTexto(edad) : '', A.fmtFecha(fechaEval)].filter(Boolean).map(esc).join(' · ');
    const secs = tipo === 'familia' ? ia.devolucion_familia : ia.informe_profesional;
    return `<div class="dev-cab"><div class="iso">${C.ISO}</div><div><h1>${tit}</h1><div class="meta">${meta}</div></div></div>`
      + (secs || []).map(s => `<h2>${esc(s.titulo)}</h2>${parrafosHTML(s.texto)}`).join('')
      + `<div class="firma-dev"><b>${esc(window.CONFIG.NOMBRE)}</b><br>${esc(window.CONFIG.TITULOS)}<br>📱 ${esc(window.CONFIG.WHATSAPP)}</div>`;
  }
  function iaNotasDistintas() {
    const ia = actual.evaluacion._ia, n = actual.evaluacion._notas || {};
    return ((ia && ia.notas_corregidas) || []).filter(x => n[x.paso] != null && x.texto.trim() && x.texto.trim() !== String(n[x.paso]).trim());
  }
  function iaCajaHTML() {
    const ia = actual.evaluacion._ia;
    if (!iaClave()) return `<div class="ia-caja no-print"><b>✨ Corregir y redactar con IA</b>
      <p class="ayuda" style="margin:4px 0 8px">Revisa la coherencia de todo lo que cargaste, corrige ortografía y redacción de tus notas y arma los dos informes. Pegá tu clave de Anthropic una sola vez en este dispositivo (<a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener">sacarla acá</a>).</p>
      <div class="ia-clave"><input type="password" id="ia-clave-in" placeholder="sk-ant-…" autocomplete="off" spellcheck="false"><button class="btn prim" id="ia-clave-ok">Guardar</button></div>
      <p class="ayuda" id="ia-estado">${esc(iaMsg)}</p></div>`;
    let h = `<div class="ia-caja no-print">`;
    if (iaPidiendo) h += `<b>✨ Procesando…</b>`;
    else if (!ia) h += `<button class="btn prim" id="ia-generar" style="width:100%">✨ Revisar, corregir y redactar con IA</button><p class="ayuda" style="margin:6px 0 0">Usa la ficha, todo lo que marcaste y tus notas. Hacelo al terminar la consulta.</p>`;
    else {
      const c = ia.control || {}, n = (c.incoherencias || []).length + (c.faltantes || []).length + (c.alertas || []).length;
      const grupo = (arr, t) => arr && arr.length ? `<div class="ia-grupo"><b>${t}</b><ul>${arr.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` : '';
      const dif = iaNotasDistintas().length;
      h += `<div class="seg"><button class="chip" data-iaver="1" aria-pressed="${iaVer}">✨ Redactado con IA</button><button class="chip" data-iaver="0" aria-pressed="${!iaVer}">Automático</button></div>
        <p class="ayuda" style="margin:6px 0">Generado ${esc(new Date(ia.fecha).toLocaleString('es-PY', { dateStyle: 'short', timeStyle: 'short' }))} con lo que había cargado en ese momento. Revisalo antes de mandarlo.</p>
        <details class="ia-control" ${n ? 'open' : ''}><summary>🔎 Control de coherencia${n ? ` (${n})` : ': todo en orden'}</summary>${grupo(c.alertas, '🚩 Alertas')}${grupo(c.incoherencias, '⚠️ No coincide')}${grupo(c.faltantes, '📋 Falta')}</details>
        <div class="fila-botones" style="margin-top:8px">${iaPidiendo ? '' : dif ? `<button class="btn sec" id="ia-notas">✍️ Pasar la corrección a mis notas (${dif})</button>` : ''}${iaPidiendo ? '' : '<button class="btn sec" id="ia-generar">↻ Volver a generar</button>'}</div>`;
    }
    return h + `<p class="ayuda" id="ia-estado" style="margin:6px 0 0">${esc(iaMsg)}</p></div>`;
  }
  function conectarIA(L, repintar) {
    const ok = L.querySelector('#ia-clave-ok');
    if (ok) ok.addEventListener('click', () => {
      const v = L.querySelector('#ia-clave-in').value.trim();
      if (!/^sk-ant-/.test(v)) { L.querySelector('#ia-estado').textContent = 'La clave empieza con sk-ant-. Copiala entera.'; return; }
      try { localStorage.setItem('panel-ia-clave', v); } catch (e) { }
      iaMsg = '';
      repintar();
    });
    const g = L.querySelector('#ia-generar');
    if (g) g.addEventListener('click', () => iaGenerar(repintar));
    L.querySelectorAll('[data-iaver]').forEach(b => b.addEventListener('click', () => { iaVer = b.dataset.iaver === '1'; repintar(); }));
    const n = L.querySelector('#ia-notas');
    if (n) n.addEventListener('click', () => {
      const ev = actual.evaluacion; ev._notas = ev._notas || {};
      iaNotasDistintas().forEach(x => { ev._notas[x.paso] = x.texto.trim(); });
      cambio(); guardarEval(); repintar();
      const pr = $('#cons-proto .paso textarea[data-evin^="_notas."]');
      if (pr) pr.value = ev._notas[pr.dataset.evin.split('.')[1]] || '';
    });
  }

  // ---------- Archivos ----------
  async function urlArchivo(a) {
    if (blobs[a.fileId]) return blobs[a.fileId];
    const r = await api({ accion: 'archivo', fileId: a.fileId });
    const bin = atob(r.datos); const u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    blobs[a.fileId] = URL.createObjectURL(new Blob([u8], { type: r.tipo || a.tipo }));
    blobs[a.fileId + ':blob'] = new Blob([u8], { type: r.tipo || a.tipo });
    return blobs[a.fileId];
  }
  function audioHTML(a) {
    const t = (actual.transcripciones || {})[a.fileId];
    return `<div class="audio-item" data-audio="${a.fileId}" style="flex-wrap:wrap">
      <button class="btn-mini" data-cargar="${a.fileId}" style="color:var(--azul);font-weight:700">▶ Escuchar${a.seg ? ' (' + C.mmss(a.seg) + ')' : ''}</button>
      <button class="btn-mini" data-transcribir="${a.fileId}">✍️ ${t ? 'Volver a transcribir' : 'Transcribir'}</button></div>
      <div class="transcripcion ${t ? '' : 'oculto'}" id="tr-${a.fileId}">${esc(t || '')}</div>`;
  }
  function conectarAudios(raiz) {
    raiz.querySelectorAll('[data-cargar]').forEach(b => b.addEventListener('click', async () => {
      const a = actual.archivos.find(x => x.fileId === b.dataset.cargar);
      b.textContent = 'Cargando…';
      try { const u = await urlArchivo(a); const au = document.createElement('audio'); au.controls = true; au.src = u; au.style.flex = '1'; b.replaceWith(au); au.play().catch(() => { }); }
      catch (e) { b.textContent = '⚠️ No se pudo cargar'; }
    }));
    raiz.querySelectorAll('[data-transcribir]').forEach(b => b.addEventListener('click', () => transcribir(b.dataset.transcribir, b)));
  }

  // ---------- Transcripción en tu navegador (Whisper) ----------
  let transcriptor = null;
  async function transcribir(fileId, boton) {
    const a = actual.archivos.find(x => x.fileId === fileId);
    const out = $('#tr-' + fileId);
    out.classList.remove('oculto');
    try {
      boton.disabled = true;
      out.textContent = 'Preparando… (la primera vez descarga el modelo de transcripción, unos minutos; después queda guardado)';
      await urlArchivo(a);
      if (!transcriptor) {
        const { pipeline, env } = await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.2');
        env.allowLocalModels = false;
        transcriptor = await pipeline('automatic-speech-recognition', 'Xenova/whisper-small', {
          progress_callback: p => { if (p.status === 'progress' && p.file && /onnx/.test(p.file)) out.textContent = `Descargando modelo… ${Math.round(p.progress || 0)}%`; }
        });
      }
      out.textContent = 'Transcribiendo… (puede tardar más o menos lo que dura el audio)';
      const buf = await blobs[fileId + ':blob'].arrayBuffer();
      const ctx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
      const audio = await ctx.decodeAudioData(buf);
      const datos = audio.getChannelData(0);
      const r = await transcriptor(datos, { language: 'spanish', task: 'transcribe', chunk_length_s: 30, stride_length_s: 5 });
      const texto = (r.text || '').trim();
      out.textContent = texto || '(no se entendió nada)';
      actual.transcripciones = actual.transcripciones || {};
      actual.transcripciones[fileId] = texto;
      if (!DEMO) await api({ accion: 'transcripcion', id: actual.id, fileId, texto }).catch(() => { });
      boton.textContent = '✍️ Volver a transcribir';
    } catch (e) {
      out.innerHTML = 'No se pudo transcribir en este navegador. Abrí el panel en Chrome de tu compu, o pedímelo en el chat y te lo transcribo.';
    } finally { boton.disabled = false; }
  }

  // ---------- Resumen ----------
  function tabResumen(v) {
    const r = actual.ficha, res = actual.res;
    const wa = String(r.whatsapp || '').replace(/\D/g, '').replace(/^0/, '595');
    const audios = actual.archivos.filter(a => a.clase === 'audio');
    let h = `<div class="tarjeta resumen" style="margin-top:18px">${A.aHTML(res, r)}</div>`;
    h += `<div class="fila-botones no-print">
      <button class="btn sec" id="copiar-res">📋 Copiar resumen</button>
      ${res.mensajeFotos && wa ? `<a class="btn rosa" style="text-decoration:none;text-align:center" target="_blank" href="https://wa.me/${wa}?text=${encodeURIComponent(res.mensajeFotos)}">📷 Pedir fotos por WhatsApp</a>` : ''}
      ${actual.carpeta && actual.carpeta !== '#' ? `<a class="btn sec" style="text-decoration:none;text-align:center" target="_blank" href="${esc(actual.carpeta)}">📁 Carpeta en Drive</a>` : ''}</div>`;
    if (audios.length) {
      h += `<div class="tarjeta"><div class="titulo" style="font-weight:700">🎙️ Audios de la familia (${audios.length})</div>` +
        audios.map(a => `<div style="margin-top:12px"><div class="ayuda" style="margin:0">${esc(a.etiqueta || a.pregunta)}</div>${audioHTML(a)}</div>`).join('') + '</div>';
    }
    h += `<p class="ayuda">Resumen automático a partir de lo que contó la familia. Es una ayuda: tu evaluación manda.</p>`;
    v.innerHTML = h;
    $('#copiar-res').addEventListener('click', () => copiar(A.aTexto(res), $('#copiar-res')));
    conectarAudios(v);
  }
  function copiar(txt, btn) {
    navigator.clipboard.writeText(txt).then(() => { const t = btn.textContent; btn.textContent = '✓ Copiado'; setTimeout(() => btn.textContent = t, 1500); }).catch(() => prompt('Copiá el texto:', txt));
  }

  // ---------- Respuestas ----------
  function valorTexto(p, v) {
    if (v === undefined || v === '' || v === null) return '';
    if (p.tipo === 'pesos') return (Array.isArray(v) ? v : []).filter(x => x.g).map(x => `${x.fecha ? A.fmtFecha(new Date(x.fecha + 'T12:00:00')) : 's/f'}: ${x.g} g`).join(' · ');
    if (p.tipo === 'consentimiento') return v ? 'Sí' : 'No';
    if (p.tipo === 'fecha') return A.fmtFecha(new Date(v + 'T12:00:00'));
    if (p.opciones) return A.etiqueta(p.id, v);
    return String(v) + (p.unidad ? ' ' + p.unidad : '');
  }
  function tabRespuestas(v) {
    v.innerHTML = respuestasHTML() || '<p>Sin respuestas.</p>';
    conectarAudios(v);
  }
  function respuestasHTML() {
    const r = actual.ficha;
    let h = '';
    F.SECCIONES.forEach(s => {
      if (s.si && !s.si(r)) return;
      const filas = s.preguntas.filter(p => !p.si || p.si(r)).map(p => {
        const val = valorTexto(p, r[p.id]);
        const nota = r[p.id + '__nota'];
        const auds = actual.archivos.filter(a => a.pregunta === p.id && a.clase === 'audio');
        const fotos = actual.archivos.filter(a => a.pregunta === p.id && a.clase === 'foto');
        if (!val && !nota && !auds.length && !fotos.length) return '';
        return `<div class="resp"><div class="k">${esc(p.t)}</div>${val ? `<div class="v">${esc(val)}</div>` : ''}${nota ? `<div>💬 ${esc(nota)}</div>` : ''}
          ${auds.map(audioHTML).join('')}${fotos.length ? `<div class="ayuda">📷 ${fotos.length} archivo(s): ver en la pestaña Fotos</div>` : ''}</div>`;
      }).join('');
      if (filas) h += `<div class="tarjeta resp-sec"><h3>${s.emo} ${esc(s.titulo)}</h3>${filas}</div>`;
    });
    return h;
  }

  // ---------- Fotos ----------
  function tabFotos(v) {
    const fam = actual.archivos.filter(a => a.clase === 'foto');
    const prot = actual.archivos.filter(a => a.clase === 'protocolo');
    const ue = actual.ficha.uso_educativo;
    const permiso = ue === 'si' ? `✅ Autoriza el uso educativo y científico (sin datos)${actual.ficha.tapar_ojos === 'no' ? ' · no hace falta tapar los ojos' : ' · <b>tapar los ojos</b>'}` : ue === 'no' ? '⛔ <b>No autoriza</b> el uso educativo ni científico de las fotos.' : 'Sin respuesta sobre el uso educativo de las fotos.';
    let h = `<div class="tarjeta" style="margin-top:18px">${permiso}</div><div class="destacado"><b>Cómo sacarlas, siempre igual</b><ul style="margin:8px 0 0;padding-left:20px">${E.FOTOS.general.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>`;
    E.FOTOS.tomas.forEach((t, i) => {
      const ya = prot.filter(a => a.pregunta === t.id);
      h += `<div class="tarjeta foto-prot"><div class="test-tit"><h3 style="font-size:17px">${i + 1}. ${esc(t.t)}</h3>${ya.length ? '<span class="badge b-Baja">✓</span>' : ''}</div>
        <div class="como">${esc(t.como)}</div>
        <div class="fotos-grid" data-grid="${t.id}">${ya.map(a => `<div class="foto" data-ver="${a.fileId}"></div>`).join('')}</div>
        <label class="boton-subir no-print">📷 ${ya.length ? 'Agregar otra' : 'Sacar o subir'}<input type="file" accept="${t.video ? 'video/*' : 'image/*'}" capture="environment" data-prot="${t.id}" data-etq="${esc(t.t)}"></label>
        <div class="ayuda oculto" id="sub-${t.id}"></div></div>`;
    });
    if (fam.length) h += `<div class="tarjeta"><div class="titulo" style="font-weight:700">Fotos que mandó la familia (${fam.length})</div><div class="fotos-grid">${fam.map(a => `<div class="foto" data-ver="${a.fileId}"></div>`).join('')}</div></div>`;
    v.innerHTML = h;
    v.querySelectorAll('[data-ver]').forEach(cargarMiniatura);
    v.querySelectorAll('[data-prot]').forEach(inp => inp.addEventListener('change', () => subirProtocolo(inp)));
  }
  async function cargarMiniatura(div) {
    const a = actual.archivos.find(x => x.fileId === div.dataset.ver);
    if (!a) return;
    try {
      const u = await urlArchivo(a);
      div.innerHTML = /^video/.test(a.tipo) ? `<video src="${u}" controls playsinline></video>` : `<a href="${u}" target="_blank"><img src="${u}" alt="${esc(a.etiqueta)}"></a>`;
    } catch (e) { div.innerHTML = '<div class="ayuda" style="padding:8px">⚠️</div>'; }
  }
  async function subirProtocolo(inp, alTerminar) {
    const f = inp.files[0]; if (!f) return;
    const est = $('#sub-' + inp.dataset.prot); est.classList.remove('oculto'); est.textContent = 'Subiendo…';
    if (DEMO) { est.textContent = 'Modo prueba: no se sube a ningún lado.'; return; }
    try {
      const blob = f.type.startsWith('image') ? await C.comprimirFoto(f, 2000, 0.9) : f;
      const r = await api({ accion: 'subir', id: actual.id, clase: 'protocolo', pregunta: inp.dataset.prot, etiqueta: inp.dataset.etq, tipo: blob.type, ext: C.extension(blob.type), datos: await C.aBase64(blob) });
      actual.archivos.push(r.archivo);
      alTerminar ? alTerminar() : tabFotos($('#vista-detalle'));
    } catch (e) { est.textContent = '⚠️ No se pudo subir. Probá de nuevo.'; }
  }

  // ---------- Evaluación ----------
  function tabEvaluacion(v) {
    const ev = actual.evaluacion;
    const sug = E.prefillMartinelli(actual.ficha);
    let h = '';
    E.TESTS.forEach(t => {
      if (t.id === 'mamadera' && !(actual.ficha.con_que || []).includes('mamadera')) return;
      const e = ev[t.id] || {};
      h += `<div class="tarjeta" data-test="${t.id}"><div class="test-tit"><h3>${t.emo} ${esc(t.titulo)}</h3><span class="score ${t.puntaje || t.martinelli ? '' : 'oculto'}" id="sc-${t.id}"></span></div>`;
      if (t.ayuda) h += `<p class="ayuda">${esc(t.ayuda)}</p>`;
      let grupo = null;
      t.items.forEach(i => {
        if (t.martinelli && i.grupo !== grupo) {
          grupo = i.grupo;
          const nombres = { historia: 'Historia clínica', anato: 'Evaluación anatomofuncional', info: '', frenillo: '', succion: 'Evaluación de la succión' };
          if (nombres[grupo]) h += `<h4 style="margin:18px 0 0;color:var(--azul)">${nombres[grupo]}</h4>`;
        }
        h += `<div class="item">${campoEval(t, i, e, t.id === 'martinelli' ? sug[i.id] : undefined)}</div>`;
      });
      h += `<div class="interp oculto" id="in-${t.id}"></div></div>`;
    });
    h += `<div class="barra-guardar no-print"><button class="btn prim" id="guardar-ev" style="width:100%">Guardar evaluación</button><p class="ayuda" id="ev-estado" style="text-align:center"></p></div>`;
    v.innerHTML = h;
    conectarEval(v, null, () => tabEvaluacion(v));
    $('#guardar-ev').addEventListener('click', guardarEval);
    puntajes();
  }
  function conectarEval(v, alCambiar, repintar) {
    const ev = actual.evaluacion;
    const sug = E.prefillMartinelli(actual.ficha);
    v.querySelectorAll('[data-ev]').forEach(b => b.addEventListener('click', () => {
      const [tid, iid, val, multi] = [b.dataset.ev, b.dataset.item, b.dataset.v, b.dataset.multi];
      ev[tid] = ev[tid] || {};
      if (multi) { const a = new Set(ev[tid][iid] || []); a.has(val) ? a.delete(val) : a.add(val); ev[tid][iid] = [...a]; b.setAttribute('aria-pressed', a.has(val)); }
      else {
        ev[tid][iid] = ev[tid][iid] === val ? undefined : val;
        b.parentElement.querySelectorAll('[data-ev]').forEach(x => x.setAttribute('aria-pressed', x.dataset.v === ev[tid][iid]));
      }
      cambio(); puntajes(); if (alCambiar) alCambiar();
    }));
    v.querySelectorAll('[data-evin]').forEach(el => el.addEventListener('input', () => { const [tid, iid] = el.dataset.evin.split('.'); ev[tid] = ev[tid] || {}; ev[tid][iid] = el.value; cambio(); puntajes(); if (alCambiar) alCambiar(); }));
    v.querySelectorAll('[data-sug]').forEach(b => b.addEventListener('click', () => {
      ev.martinelli = ev.martinelli || {}; Object.assign(ev.martinelli, sug); cambio(); repintar();
    }));
    conectarDictado(v);
  }
  function campoEval(t, i, e, sugerido) {
    const val = e[i.id];
    const k = `${t.id}.${i.id}`;
    if (i.tipo === 'puntos' || i.tipo === 'una' || i.tipo === 'checks') {
      const multi = i.tipo === 'checks';
      const ops = i.opciones.map(op => `<button type="button" class="chip" data-ev="${t.id}" data-item="${i.id}" data-v="${op.v}" ${multi ? 'data-multi="1"' : ''} aria-pressed="${multi ? (val || []).includes(op.v) : val === op.v}">${i.tipo === 'puntos' ? `<b>${op.p}</b>` : ''}${esc(op.t)}</button>`).join('');
      const s = sugerido !== undefined && val === undefined ? `<div class="sug">Según la ficha: ${esc((i.opciones.find(x => x.v === sugerido) || {}).t || '')} · <button type="button" class="btn-mini" data-sug style="color:var(--azul);padding:0">usar las sugerencias</button></div>` : '';
      return `<div class="titulo">${esc(i.t)}</div><div class="chips ${i.tipo === 'puntos' ? 'op-puntos' : ''}">${ops}</div>${s}`;
    }
    if (i.tipo === 'texto') return `<div class="titulo">${esc(i.t)}</div><textarea data-evin="${k}" spellcheck="true" lang="es" autocapitalize="sentences" style="margin-top:8px">${esc(val || '')}</textarea><button type="button" class="dictar no-print" data-dictar="${k}">🎙️ Dictar</button>`;
    if (i.tipo === 'numero') return `<div class="titulo">${esc(i.t)}</div><div class="con-unidad" style="margin-top:8px"><input type="number" inputmode="decimal" data-evin="${k}" value="${esc(val || '')}"><span>${esc(i.unidad || '')}</span></div>`;
    if (i.tipo === 'fecha') return `<div class="titulo">${esc(i.t)}</div><input type="date" data-evin="${k}" value="${esc(val || new Date().toISOString().slice(0, 10))}" style="margin-top:8px">`;
    return `<div class="titulo">${esc(i.t)}</div><input type="text" data-evin="${k}" value="${esc(val || '')}" style="margin-top:8px">`;
  }
  function puntajes() {
    const ev = actual.evaluacion;
    E.TESTS.forEach(t => {
      const sc = $('#sc-' + t.id) || { set textContent(x) { } }, inn = $('#in-' + t.id);
      if (!inn) return;
      if (t.puntaje) {
        const p = E.puntos(t, ev);
        sc.textContent = p.n ? `${p.s}/${t.max}` : '';
        if (p.n === p.total) { inn.textContent = t.interpreta(p.s); inn.classList.remove('oculto'); } else inn.classList.add('oculto');
      }
      if (t.martinelli) {
        const m = E.martinelli(ev);
        sc.textContent = m.lineas.length ? `${m.anat}/12` : '';
        if (m.lineas.length) { inn.innerHTML = m.lineas.map(esc).join('<br>'); inn.classList.remove('oculto'); } else inn.classList.add('oculto');
      }
      if (t.id === 'datos') {
        const d = ev.datos || {}; const pre = parseFloat(d.pre), post = parseFloat(d.post);
        if (pre && post) { inn.textContent = `Transferencia en la toma: ${Math.round(post - pre)} ml (aprox. 1 g = 1 ml)`; inn.classList.remove('oculto'); } else inn.classList.add('oculto');
      }
    });
  }
  let sucio = false;
  function cambio() { sucio = true; const e = $('#ev-estado'); if (e) e.textContent = 'Cambios sin guardar'; try { localStorage.setItem('ev-' + actual.id, JSON.stringify(actual.evaluacion)); } catch (x) { } }
  async function guardarEval() {
    const est = $('#ev-estado') || {};
    if (DEMO) { try { localStorage.setItem('panel-demo-eval', JSON.stringify({ evaluacion: actual.evaluacion, devolucion: actual.devolucion })); } catch (e) { } est.textContent = '✓ Guardado (modo prueba, solo en este dispositivo)'; sucio = false; return; }
    est.textContent = 'Guardando…';
    try { await api({ accion: 'guardar', id: actual.id, evaluacion: actual.evaluacion, estado: 'Evaluada' }); est.textContent = '✓ Guardado en tu planilla'; sucio = false; }
    catch (e) { est.textContent = '⚠️ No se pudo guardar. Queda una copia en este dispositivo; probá de nuevo.'; }
  }
  window.addEventListener('beforeunload', e => { if (sucio) { e.preventDefault(); e.returnValue = ''; } });

  // ---------- Dictado (Chrome) ----------
  function conectarDictado(raiz) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    raiz.querySelectorAll('[data-dictar]').forEach(b => {
      if (!SR) { b.remove(); return; }
      let rec = null;
      b.addEventListener('click', () => {
        if (rec) { rec.stop(); return; }
        const ta = raiz.querySelector(`[data-evin="${b.dataset.dictar}"]`);
        rec = new SR(); rec.lang = 'es-PY'; rec.continuous = true; rec.interimResults = false;
        const base = ta.value ? ta.value.replace(/\s*$/, ' ') : '';
        let acumulado = '';
        rec.onresult = ev => { for (let i = ev.resultIndex; i < ev.results.length; i++) if (ev.results[i].isFinal) acumulado += ev.results[i][0].transcript + ' '; ta.value = base + acumulado; ta.dispatchEvent(new Event('input')); };
        rec.onend = () => { rec = null; b.classList.remove('on'); b.textContent = '🎙️ Dictar'; };
        rec.onerror = () => { };
        rec.start(); b.classList.add('on'); b.textContent = '■ Parar';
      });
    });
  }

  // ---------- Devolución ----------
  function generarDevolucion() {
    const r = actual.ficha, ev = actual.evaluacion, res = actual.res;
    const d = ev.datos || {}, c = ev.cierre || {};
    const fechaEval = d.fecha ? new Date(d.fecha + 'T12:00:00') : new Date();
    const nac = r.bebe_nac ? new Date(r.bebe_nac + 'T12:00:00') : null;
    const edad = nac ? Math.floor((fechaEval - nac) / 86400000) : null;
    const li = arr => arr.filter(Boolean).map(x => `<li>${x}</li>`).join('');
    const visto = [];
    const pesoHoy = parseFloat(d.peso_hoy), pesoNac = parseFloat(r.peso_nac);
    if (pesoHoy) {
      let t = `Hoy pesó <b>${Math.round(pesoHoy).toLocaleString('es-PY')} g</b>`;
      if (pesoNac) { const dif = pesoHoy - pesoNac; t += ` (al nacer pesó ${Math.round(pesoNac).toLocaleString('es-PY')} g: ${dif >= 0 ? 'ya recuperó su peso de nacimiento y sumó ' + Math.round(dif) + ' g' : 'todavía le faltan ' + Math.round(-dif) + ' g para recuperarlo'})`; }
      visto.push(t + '.');
    }
    const pre = parseFloat(d.pre), post = parseFloat(d.post);
    if (pre && post) visto.push(`En la toma que observamos tomó unos <b>${Math.round(post - pre)} ml</b>.`);
    const bb = E.TESTS.find(t => t.id === 'bbat'), bp = E.puntos(bb, ev);
    if (bp.n === bp.total) {
      const flojos = bb.items.filter(i => (ev.bbat || {})[i.id] !== '2').map(i => i.t.toLowerCase());
      visto.push(bp.s >= 7 ? 'La toma se ve eficaz: buena posición, buen agarre y deglución tranquila.' : `En la toma hay cosas para ajustar, sobre todo ${flojos.join(', ')}.`);
    }
    const bt = E.TESTS.find(t => t.id === 'btat'), btp = E.puntos(bt, ev);
    const m = E.martinelli(ev);
    if (btp.n === btp.total || m.lineas.length) {
      let t = 'Sobre la lengüita: ';
      if (m.lineas.length) t += m.interfiere ? 'según el protocolo de evaluación del frenillo (Martinelli), el frenillo interfiere con el movimiento de la lengua.' : 'según el protocolo de evaluación del frenillo (Martinelli), el frenillo no está interfiriendo con el movimiento de la lengua.';
      else t += bt.interpreta(btp.s).toLowerCase() + '.';
      visto.push(t);
    }
    const pe = ev.pechos || {};
    if (pe.al_soltar === 'aplastado' || pe.al_soltar === 'labial') visto.push('Al soltar, el pezón sale aplastado: es una señal de que el agarre todavía no es lo bastante profundo.');
    if ((pe.piel || []).includes('grieta')) visto.push('Hay grietas en el pezón, que van a mejorar a medida que mejore el agarre.');
    const mo = ev.mof || {};
    if (mo.cuello === 'preferencia' || mo.cuello === 'limitacion') visto.push('Al girar la cabecita tiene preferencia de un lado. Vale que lo mire kinesiología, porque influye en cómo se prende.');
    if (mo.respiracion === 'oral' || mo.respiracion === 'mixta') visto.push('Por momentos respira por la boca: lo vamos a seguir mirando.');
    const ma = ev.mamadera || {};
    if (ma.ritmo === 'corrido' || (ma.signos || []).some(x => ['pierde', 'tos', 'estres'].includes(x))) visto.push('Con la mamadera el ritmo le cuesta un poco: más vertical, con pausas y tetina de flujo lento va a poder regularse mejor.');
    if (c.impresion) visto.push(esc(c.impresion));
    const ind = E.TESTS.find(t => t.id === 'cierre').items.find(i => i.id === 'indicaciones');
    const indic = (c.indicaciones || []).map(v => (ind.opciones.find(o => o.v === v) || {}).t);
    if (c.indicaciones_txt) indic.push(esc(c.indicaciones_txt));
    const der = E.TESTS.find(t => t.id === 'cierre').items.find(i => i.id === 'derivaciones');
    const derv = (c.derivaciones || []).map(v => (der.opciones.find(o => o.v === v) || {}).t);
    const consultar = ['Moja menos de 6 pañales por día (después de la primera semana) o hace muy pocas cacas.', 'Está muy dormido/a, cuesta despertarle para comer, o la piel u ojos se ven cada vez más amarillos.',
      'Tenés fiebre, escalofríos o una zona del pecho roja, caliente y dolorida.', 'Vomita con fuerza, en chorro.', 'El dolor al amamantar empeora en vez de mejorar.',
      'Te sentís muy triste, sin ganas o desbordada/o: pedir ayuda también es cuidar la lactancia.'];
    const nombre = r.bebe_nombre || 'tu bebé';
    return `<div class="dev-cab"><div class="iso">${C.ISO}</div><div><h1>Devolución de la asesoría</h1><div class="meta">${esc(nombre)}${edad != null ? ' · ' + A.edadTexto(edad) : ''} · ${A.fmtFecha(fechaEval)}</div></div></div>
      <p>${esc((r.quien_nombre || '').split(' ')[0] || 'Hola')}, gracias por la confianza 🤍 Te dejo por escrito lo que vimos y el plan para estos días.</p>
      <h2>Lo que nos trajo</h2><p>${esc(r.motivo_txt || '')}</p>
      ${visto.length ? `<h2>Lo que vimos</h2><ul>${li(visto)}</ul>` : '<h2>Lo que vimos</h2><p>[Completá la pestaña Evaluación o escribí acá]</p>'}
      <h2>El plan</h2>${indic.length ? `<ol>${li(indic)}</ol>` : '<p>[Elegí las indicaciones en la pestaña Evaluación o escribí acá]</p>'}
      ${derivHTML(derv)}
      <h2>Consultá sin esperar si…</h2><ul>${li(consultar)}</ul>
      ${c.proximo ? `<h2>Próximo control</h2><p>${esc(c.proximo)}</p>` : ''}
      <p>Cualquier duda me escriben!</p>
      <div class="firma-dev"><b>${esc(window.CONFIG.NOMBRE)}</b><br>${esc(window.CONFIG.TITULOS)}<br>📱 ${esc(window.CONFIG.WHATSAPP)}</div>`;
  }
  function derivHTML(derv) { return derv.length ? `<h2>Para completar el acompañamiento</h2><p>Te sugiero consultar con: ${derv.map(esc).join(', ')}.</p>` : ''; }
  function tabDevolucion(v) {
    const html = actual.devolucion || generarDevolucion();
    v.innerHTML = `<p class="ayuda no-print" style="margin-top:18px">Se arma con la ficha y tu evaluación. Tocá el texto para editarlo.</p>
      <div class="devolucion" id="dev" contenteditable="true" spellcheck="true" lang="es">${html}</div>
      <div class="fila-botones no-print">
        <button class="btn sec" id="dev-regen">↻ Rearmar</button>
        <button class="btn sec" id="dev-copiar">📋 Copiar texto</button>
        <button class="btn sec" id="dev-imprimir">🖨️ PDF / imprimir</button>
        <button class="btn prim" id="dev-guardar">Guardar</button></div>
      <p class="ayuda no-print" id="dev-estado" style="text-align:center"></p>`;
    $('#dev').addEventListener('input', () => { actual.devolucion = $('#dev').innerHTML; sucio = true; });
    $('#dev-regen').addEventListener('click', () => { if (!actual.devolucion || confirm('Se pierden los cambios que hiciste a mano. ¿Rearmo?')) { actual.devolucion = ''; tabDevolucion(v); } });
    $('#dev-copiar').addEventListener('click', () => copiar($('#dev').innerText, $('#dev-copiar')));
    $('#dev-imprimir').addEventListener('click', () => window.print());
    $('#dev-guardar').addEventListener('click', async () => {
      actual.devolucion = $('#dev').innerHTML;
      const est = $('#dev-estado');
      if (DEMO) { try { localStorage.setItem('panel-demo-eval', JSON.stringify({ evaluacion: actual.evaluacion, devolucion: actual.devolucion })); } catch (e) { } est.textContent = '✓ Guardado (modo prueba)'; sucio = false; return; }
      est.textContent = 'Guardando…';
      try { await api({ accion: 'guardar', id: actual.id, devolucion: actual.devolucion, evaluacion: actual.evaluacion, estado: 'Asesoría hecha' }); est.textContent = '✓ Guardado'; sucio = false; }
      catch (e) { est.textContent = '⚠️ No se pudo guardar.'; }
    });
  }

  iniciar();
})();
