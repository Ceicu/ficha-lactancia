/* Panel de Ceci: lista de fichas, resumen, respuestas, fotos estandarizadas, evaluación y devolución. */
(function () {
  const C = window.COMUN, A = window.ANALISIS, E = window.EVAL, F = window.FICHA;
  const esc = C.esc;
  const $ = s => document.querySelector(s);
  const DEMO = !window.CONFIG.SCRIPT_URL;
  const TABS = [['resumen', 'Resumen'], ['respuestas', 'Respuestas'], ['fotos', 'Fotos'], ['evaluacion', 'Evaluación'], ['devolucion', 'Devolución']];
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
    ({ resumen: tabResumen, respuestas: tabRespuestas, fotos: tabFotos, evaluacion: tabEvaluacion, devolucion: tabDevolucion })[tab](v);
    window.scrollTo(0, 0);
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
    v.innerHTML = h || '<p>Sin respuestas.</p>';
    conectarAudios(v);
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
  async function subirProtocolo(inp) {
    const f = inp.files[0]; if (!f) return;
    const est = $('#sub-' + inp.dataset.prot); est.classList.remove('oculto'); est.textContent = 'Subiendo…';
    if (DEMO) { est.textContent = 'Modo prueba: no se sube a ningún lado.'; return; }
    try {
      const blob = f.type.startsWith('image') ? await C.comprimirFoto(f, 2000, 0.9) : f;
      const r = await api({ accion: 'subir', id: actual.id, clase: 'protocolo', pregunta: inp.dataset.prot, etiqueta: inp.dataset.etq, tipo: blob.type, ext: C.extension(blob.type), datos: await C.aBase64(blob) });
      actual.archivos.push(r.archivo);
      tabFotos($('#vista-detalle'));
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
    v.querySelectorAll('[data-ev]').forEach(b => b.addEventListener('click', () => {
      const [tid, iid, val, multi] = [b.dataset.ev, b.dataset.item, b.dataset.v, b.dataset.multi];
      ev[tid] = ev[tid] || {};
      if (multi) { const a = new Set(ev[tid][iid] || []); a.has(val) ? a.delete(val) : a.add(val); ev[tid][iid] = [...a]; b.setAttribute('aria-pressed', a.has(val)); }
      else {
        ev[tid][iid] = ev[tid][iid] === val ? undefined : val;
        b.parentElement.querySelectorAll('[data-ev]').forEach(x => x.setAttribute('aria-pressed', x.dataset.v === ev[tid][iid]));
      }
      cambio(); puntajes();
    }));
    v.querySelectorAll('[data-evin]').forEach(el => el.addEventListener('input', () => { const [tid, iid] = el.dataset.evin.split('.'); ev[tid] = ev[tid] || {}; ev[tid][iid] = el.value; cambio(); puntajes(); }));
    v.querySelectorAll('[data-sug]').forEach(b => b.addEventListener('click', () => {
      ev.martinelli = ev.martinelli || {}; Object.assign(ev.martinelli, sug); cambio(); tabEvaluacion(v);
    }));
    conectarDictado(v);
    $('#guardar-ev').addEventListener('click', guardarEval);
    puntajes();
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
    if (i.tipo === 'texto') return `<div class="titulo">${esc(i.t)}</div><textarea data-evin="${k}" style="margin-top:8px">${esc(val || '')}</textarea><button type="button" class="dictar no-print" data-dictar="${k}">🎙️ Dictar</button>`;
    if (i.tipo === 'numero') return `<div class="titulo">${esc(i.t)}</div><div class="con-unidad" style="margin-top:8px"><input type="number" inputmode="decimal" data-evin="${k}" value="${esc(val || '')}"><span>${esc(i.unidad || '')}</span></div>`;
    if (i.tipo === 'fecha') return `<div class="titulo">${esc(i.t)}</div><input type="date" data-evin="${k}" value="${esc(val || new Date().toISOString().slice(0, 10))}" style="margin-top:8px">`;
    return `<div class="titulo">${esc(i.t)}</div><input type="text" data-evin="${k}" value="${esc(val || '')}" style="margin-top:8px">`;
  }
  function puntajes() {
    const ev = actual.evaluacion;
    E.TESTS.forEach(t => {
      const sc = $('#sc-' + t.id), inn = $('#in-' + t.id);
      if (!sc) return;
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
    const est = $('#ev-estado');
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
      <div class="devolucion" id="dev" contenteditable="true">${html}</div>
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
