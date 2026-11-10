/* Formulario para la familia */
(function () {
  const { SECCIONES } = window.FICHA;
  const C = window.COMUN;
  const esc = C.esc;
  const CLAVE = 'ficha-lactancia-v1';
  const alm = C.Almacen('ficha-lactancia-archivos');
  const $ = s => document.querySelector(s);

  let r = {};
  let paso = 0;
  let medios = {}; // clave -> {blob, tipo, seg, clase, pregunta}
  const urls = {};
  const grab = C.Grabadora();
  let grabandoEn = null;

  try { const g = JSON.parse(localStorage.getItem(CLAVE) || '{}'); r = g.r || {}; paso = g.paso || 0; } catch (e) { }
  function guardar() {
    try { localStorage.setItem(CLAVE, JSON.stringify({ r, paso, t: Date.now() })); } catch (e) { }
    const g = $('#guardado'); if (g) g.textContent = 'Guardado en tu celular ✓';
  }

  const visibles = () => SECCIONES.filter(s => !s.si || s.si(r));
  const pregVisibles = s => s.preguntas.filter(p => !p.si || p.si(r));
  const urlDe = k => { if (!urls[k] && medios[k]) urls[k] = URL.createObjectURL(medios[k].blob); return urls[k]; };

  // ---------- Render ----------
  function render() {
    const secs = visibles();
    if (paso >= secs.length) paso = secs.length - 1;
    const s = secs[paso];
    $('#progreso').style.width = Math.round((paso / secs.length) * 100) + '%';
    $('#paso-txt').textContent = `Paso ${paso + 1} de ${secs.length} · ${s.titulo}`;
    let h = '';
    if (paso === 0) {
      h += `<div class="destacado"><div class="frase">Qué bueno que estés acá 🤍</div>
        <p style="margin:8px 0 0">Con esta ficha conozco a tu bebé y a tu familia antes de la consulta, así aprovechamos mejor el tiempo. Casi todo se responde tocando una opción. Lo que no sepas, saltalo o pasá de largo.</p>
        <p style="margin:8px 0 0">🎤 Si preferís, en cada pregunta podés tocar el micrófono y responderme por audio.</p>
        <p style="margin:8px 0 0">⏱️ Lleva unos 10 a 15 minutos y se guarda sola en tu celular: si se corta, seguís después.</p></div>`;
    }
    h += `<div class="seccion-tit"><span class="emo">${s.emo}</span><h2>${esc(s.titulo)}</h2></div>`;
    if (s.intro) h += `<p class="seccion-intro">${esc(s.intro)}</p>`;
    pregVisibles(s).forEach(p => { h += tarjeta(p); });
    h += `<p class="guardado" id="guardado"></p>`;
    $('#contenido').innerHTML = h;
    $('#atras').classList.toggle('oculto', paso === 0);
    const ultimo = paso === secs.length - 1;
    $('#siguiente').textContent = ultimo ? 'Enviar ficha 🤍' : 'Siguiente';
    conectar();
  }

  function micBtn(p) {
    const tiene = Object.values(medios).some(m => m.pregunta === p.id && m.clase === 'audio');
    return `<button type="button" class="mic${tiene ? ' tiene' : ''}${grabandoEn === p.id ? ' grabando' : ''}" data-mic="${p.id}" aria-label="Responder con audio">${C.MIC}</button>`;
  }
  function audiosDe(p) {
    return Object.entries(medios).filter(([k, m]) => m.pregunta === p.id && m.clase === 'audio')
      .map(([k, m]) => `<div class="audio-item"><audio controls preload="metadata" src="${urlDe(k)}"></audio><button type="button" class="btn-mini" data-borrar="${k}">Borrar</button></div>`).join('');
  }

  function tarjeta(p) {
    const v = r[p.id];
    const req = p.req ? ' <span class="req">*</span>' : '';
    const ayuda = p.ayuda ? `<p class="ayuda">${esc(p.ayuda)}</p>` : '';
    let campo = '';
    const nota = (p.tipo === 'una' || p.tipo === 'varias' || p.tipo === 'escala' || p.tipo === 'numero' || p.tipo === 'fecha')
      && r[p.id + '__nota'] !== undefined
      ? `<textarea class="nota" data-id="${p.id}__nota" placeholder="Comentario (opcional)">${esc(r[p.id + '__nota'])}</textarea>` : '';
    switch (p.tipo) {
      case 'corta': case 'tel':
        campo = `<input type="${p.tipo === 'tel' ? 'tel' : 'text'}" data-id="${p.id}" value="${esc(v)}" autocomplete="${p.tipo === 'tel' ? 'tel' : 'off'}" ${p.tipo === 'tel' ? 'inputmode="tel" placeholder="09xx xxx xxx"' : ''}>`; break;
      case 'texto':
        campo = `<textarea data-id="${p.id}" placeholder="Escribí acá o tocá el 🎤">${esc(v)}</textarea>`; break;
      case 'numero':
        campo = `<div class="con-unidad"><input type="number" inputmode="decimal" data-id="${p.id}" value="${esc(v)}" ${p.min != null ? `min="${p.min}"` : ''} ${p.max != null ? `max="${p.max}"` : ''}>${p.unidad ? `<span>${esc(p.unidad)}</span>` : ''}</div>`; break;
      case 'fecha':
        campo = `<input type="date" data-id="${p.id}" value="${esc(v)}">`; break;
      case 'una': case 'varias': {
        const sel = x => p.tipo === 'una' ? v === x : Array.isArray(v) && v.includes(x);
        campo = `<div class="chips ${p.chips || ''}" role="group">` + p.opciones.map(op =>
          `<button type="button" class="chip" data-op="${p.id}" data-v="${op.v}" aria-pressed="${sel(op.v)}">${esc(op.t)}</button>`).join('') + '</div>';
        break;
      }
      case 'escala':
        campo = '<div class="escala">' + Array.from({ length: 11 }, (_, i) =>
          `<button type="button" data-escala="${p.id}" data-v="${i}" aria-pressed="${String(v) === String(i)}">${i}</button>`).join('') +
          '</div><div class="escala-ref"><span>Nada</span><span>El peor</span></div>';
        break;
      case 'pesos': {
        const filas = Array.isArray(v) && v.length ? v : [{ fecha: '', g: '' }];
        campo = `<div class="pesos-cab"><span>Fecha</span><span>Peso (gramos)</span><span></span></div>` +
          filas.map((f, i) => `<div class="pesos-fila"><input type="date" data-peso="${i}" data-campo="fecha" value="${esc(f.fecha)}"><input type="number" inputmode="numeric" placeholder="3250" data-peso="${i}" data-campo="g" value="${esc(f.g)}"><button type="button" class="btn-mini" data-quitar-peso="${i}" aria-label="Quitar">✕</button></div>`).join('') +
          `<button type="button" class="btn sec" style="margin-top:10px;width:100%" data-agregar-peso>+ Agregar otro control</button>`;
        break;
      }
      case 'fotos': {
        const lista = Object.entries(medios).filter(([k, m]) => m.pregunta === p.id && m.clase === 'foto');
        const sug = p.sugerencias ? `<p class="ayuda">Ideas:</p><ul class="lista-sug">${p.sugerencias.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '';
        campo = sug + `<div class="fotos-grid">` + lista.map(([k, m]) => `<div class="foto">${m.blob.type.startsWith('video') ? `<video src="${urlDe(k)}" muted playsinline></video>` : `<img src="${urlDe(k)}" alt="">`}<button type="button" data-borrar="${k}" aria-label="Quitar">✕</button></div>`).join('') + '</div>' +
          (lista.length < (p.max || 6) ? `<label class="boton-subir">📷 ${lista.length ? 'Agregar otra' : 'Agregar fotos'}${p.video ? ' o videos' : ''}<input type="file" accept="image/*${p.video ? ',video/*' : ''}" multiple data-fotos="${p.id}"></label>` : '');
        break;
      }
      case 'audio':
        campo = `<div style="display:flex;align-items:center;gap:12px;margin-top:12px">${micBtn(p).replace('class="mic', 'style="width:64px;height:64px" class="mic')}<span id="estado-${p.id}" class="ayuda" style="margin:0">${grabandoEn === p.id ? '' : 'Tocá para grabar'}</span></div>` + audiosDe(p);
        return `<div class="tarjeta" data-tarjeta="${p.id}"><div class="titulo">${esc(p.t)}${req}</div>${ayuda}${campo}</div>`;
      case 'consentimiento':
        return `<div class="tarjeta" data-tarjeta="${p.id}"><label class="check"><input type="checkbox" data-check="${p.id}" ${v ? 'checked' : ''}><span>${esc(p.t)}${req}</span></label></div>`;
    }
    const conMic = p.tipo !== 'fotos' && p.tipo !== 'pesos';
    return `<div class="tarjeta" data-tarjeta="${p.id}"><div class="preg"><div class="titulo">${esc(p.t)}${req}${ayuda}</div>${conMic ? micBtn(p) : ''}</div>
      <div class="campo">${campo}</div>${nota}<div class="grab-estado oculto" id="estado-${p.id}"></div>${conMic ? audiosDe(p) : ''}</div>`;
  }

  // ---------- Eventos ----------
  function conectar() {
    const cont = $('#contenido');
    cont.querySelectorAll('[data-id]').forEach(el => el.addEventListener('input', () => { r[el.dataset.id] = el.value; guardar(); }));
    cont.querySelectorAll('[data-op]').forEach(el => el.addEventListener('click', () => elegir(el.dataset.op, el.dataset.v)));
    cont.querySelectorAll('[data-escala]').forEach(el => el.addEventListener('click', () => { r[el.dataset.escala] = Number(el.dataset.v); guardar(); rerender(); }));
    cont.querySelectorAll('[data-check]').forEach(el => el.addEventListener('change', () => { r[el.dataset.check] = el.checked; guardar(); }));
    cont.querySelectorAll('[data-peso]').forEach(el => el.addEventListener('input', () => {
      const i = +el.dataset.peso; r.pesos = Array.isArray(r.pesos) && r.pesos.length ? r.pesos : [{ fecha: '', g: '' }];
      r.pesos[i] = r.pesos[i] || { fecha: '', g: '' }; r.pesos[i][el.dataset.campo] = el.value; guardar();
    }));
    const add = cont.querySelector('[data-agregar-peso]');
    if (add) add.addEventListener('click', () => { r.pesos = Array.isArray(r.pesos) && r.pesos.length ? r.pesos : [{ fecha: '', g: '' }]; r.pesos.push({ fecha: '', g: '' }); guardar(); rerender(); });
    cont.querySelectorAll('[data-quitar-peso]').forEach(el => el.addEventListener('click', () => { if (Array.isArray(r.pesos)) { r.pesos.splice(+el.dataset.quitarPeso, 1); guardar(); rerender(); } }));
    cont.querySelectorAll('[data-fotos]').forEach(el => el.addEventListener('change', () => agregarFotos(el.dataset.fotos, el.files)));
    cont.querySelectorAll('[data-borrar]').forEach(el => el.addEventListener('click', () => borrarMedio(el.dataset.borrar)));
    cont.querySelectorAll('[data-mic]').forEach(el => el.addEventListener('click', () => microfono(el.dataset.mic)));
  }
  function rerender() { const y = window.scrollY; render(); window.scrollTo(0, y); }

  function elegir(id, v) {
    const p = SECCIONES.flatMap(s => s.preguntas).find(q => q.id === id);
    if (p.tipo === 'una') r[id] = r[id] === v ? undefined : v;
    else {
      let a = Array.isArray(r[id]) ? r[id].slice() : [];
      const op = p.opciones.find(x => x.v === v);
      if (a.includes(v)) a = a.filter(x => x !== v);
      else if (op.solo) a = [v];
      else { a = a.filter(x => !(p.opciones.find(o => o.v === x) || {}).solo); a.push(v); }
      r[id] = a;
    }
    guardar(); rerender();
  }

  async function agregarFotos(pid, files) {
    const p = SECCIONES.flatMap(s => s.preguntas).find(q => q.id === pid);
    const ya = Object.values(medios).filter(m => m.pregunta === pid && m.clase === 'foto').length;
    const lista = Array.from(files).slice(0, Math.max(0, (p.max || 6) - ya));
    for (const f of lista) {
      if (f.type.startsWith('video') && f.size > 40 * 1024 * 1024) { alert('Ese video es muy pesado (más de 40 MB). Probá con uno más cortito, de unos 30 segundos.'); continue; }
      const blob = f.type.startsWith('image') ? await C.comprimirFoto(f) : f;
      const k = `foto:${pid}:${Date.now()}${Math.random().toString(36).slice(2, 6)}`;
      medios[k] = { blob, clase: 'foto', pregunta: pid, nombre: f.name };
      await alm.poner(k, medios[k]);
    }
    rerender();
  }
  async function borrarMedio(k) {
    if (!confirm('¿Lo borramos?')) return;
    delete medios[k]; if (urls[k]) { URL.revokeObjectURL(urls[k]); delete urls[k]; }
    await alm.sacar(k); rerender();
  }

  async function microfono(pid) {
    if (grabandoEn && grabandoEn !== pid) { await terminarGrabacion(); }
    if (grabandoEn === pid) { await terminarGrabacion(); return; }
    try {
      grabandoEn = pid;
      document.querySelectorAll(`[data-mic="${pid}"]`).forEach(b => b.classList.add('grabando'));
      const est = $('#estado-' + pid);
      if (est) { est.classList.remove('oculto'); est.textContent = '● Grabando 0:00 · tocá de nuevo para terminar'; }
      await grab.empezar(s => { const e = $('#estado-' + pid); if (e) e.textContent = `● Grabando ${C.mmss(s)} · tocá de nuevo para terminar`; });
    } catch (e) {
      grabandoEn = null;
      document.querySelectorAll(`[data-mic="${pid}"]`).forEach(b => b.classList.remove('grabando'));
      const est = $('#estado-' + pid);
      if (est) { est.classList.remove('oculto'); est.textContent = ''; }
      alert(e && e.name === 'NotAllowedError'
        ? 'Para grabar, tu celular tiene que dar permiso al micrófono. Tocá el candadito de arriba y permitilo. Si no, podés escribir o usar el 🎤 de tu teclado.'
        : 'Este navegador no permite grabar. Podés escribir o usar el micrófono de tu teclado para dictar.');
    }
  }
  async function terminarGrabacion() {
    const pid = grabandoEn; grabandoEn = null;
    const res = await grab.parar();
    if (res && res.blob.size > 1000) {
      const k = `audio:${pid}:${Date.now()}`;
      medios[k] = { blob: res.blob, clase: 'audio', pregunta: pid, seg: res.seg };
      await alm.poner(k, medios[k]);
      const p = SECCIONES.flatMap(s => s.preguntas).find(q => q.id === pid);
      if (p && ['una', 'varias', 'escala', 'numero', 'fecha'].includes(p.tipo) && r[pid + '__nota'] === undefined) r[pid + '__nota'] = '';
      guardar();
    }
    rerender();
  }

  // ---------- Validación y navegación ----------
  function faltantes(s) {
    return pregVisibles(s).filter(p => {
      if (!p.req) return false;
      const v = r[p.id];
      const tieneAudio = Object.values(medios).some(m => m.pregunta === p.id && m.clase === 'audio');
      if (p.tipo === 'consentimiento') return !v;
      if (tieneAudio) return false;
      return v === undefined || v === '' || (Array.isArray(v) && !v.length);
    });
  }
  async function siguiente() {
    if (grabandoEn) await terminarGrabacion();
    const secs = visibles();
    const f = faltantes(secs[paso]);
    document.querySelectorAll('.tarjeta.falta').forEach(t => t.classList.remove('falta'));
    if (f.length) {
      f.forEach(p => { const t = document.querySelector(`[data-tarjeta="${p.id}"]`); if (t) t.classList.add('falta'); });
      const t = document.querySelector(`[data-tarjeta="${f[0].id}"]`);
      if (t) t.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (paso === secs.length - 1) return enviar();
    paso++; guardar(); render(); window.scrollTo(0, 0);
  }
  async function atras() { if (grabandoEn) await terminarGrabacion(); if (paso > 0) { paso--; guardar(); render(); window.scrollTo(0, 0); } }

  // ---------- Envío ----------
  function fichaLimpia() {
    const vis = new Set(visibles().flatMap(s => pregVisibles(s).map(p => p.id)));
    const out = {};
    Object.keys(r).forEach(k => { const base = k.replace(/__nota$/, ''); if (vis.has(base) && r[k] !== undefined && r[k] !== '') out[k] = r[k]; });
    if (Array.isArray(out.pesos)) out.pesos = out.pesos.filter(p => p.fecha || p.g);
    return out;
  }
  async function enviar() {
    const ficha = fichaLimpia();
    const res = window.ANALISIS.analizar(ficha);
    const resumen = { prioridad: res.prioridad, html: window.ANALISIS.aHTML(res, ficha), texto: window.ANALISIS.aTexto(res) };
    const lista = Object.entries(medios).filter(([k, m]) => {
      const base = m.pregunta; return visibles().some(s => pregVisibles(s).some(p => p.id === base));
    });
    pantallaEnvio(lista.length);
    const paso1 = $('#e1'), paso2 = $('#e2'), paso3 = $('#e3');
    if (!window.CONFIG.SCRIPT_URL) {
      await new Promise(ok => setTimeout(ok, 900));
      paso1.textContent = '✓ Respuestas (modo prueba: no se guardó nada)'; paso2.textContent = `✓ ${lista.length} archivos (modo prueba)`;
      paso3.textContent = '✓ Listo';
      return gracias(true);
    }
    try {
      const { id } = await C.api({ accion: 'enviar', ficha, resumen });
      paso1.textContent = '✓ Respuestas enviadas';
      let fallidos = 0, i = 0;
      for (const [k, m] of lista) {
        i++; paso2.textContent = `Subiendo ${m.clase === 'audio' ? 'audios' : 'fotos'}… ${i} de ${lista.length}`;
        try {
          const datos = await C.aBase64(m.blob);
          const etiqueta = (SECCIONES.flatMap(s => s.preguntas).find(q => q.id === m.pregunta) || {}).t || m.pregunta;
          await C.api({ accion: 'subir', id, clase: m.clase, pregunta: m.pregunta, etiqueta, tipo: m.blob.type || 'application/octet-stream', ext: C.extension(m.blob.type || ''), datos, seg: m.seg || null });
        } catch (e) { fallidos++; }
      }
      paso2.textContent = lista.length ? `✓ ${lista.length - fallidos} de ${lista.length} archivos subidos` : '✓ Sin archivos';
      await C.api({ accion: 'terminar', id, total: lista.length, fallidos }).catch(() => { });
      paso3.textContent = '✓ Listo';
      try { localStorage.removeItem(CLAVE); } catch (e) { }
      await alm.vaciar();
      gracias(false, fallidos);
    } catch (e) {
      $('#envio-error').innerHTML = `No se pudo enviar. Revisá tu conexión y tocá <b>Reintentar</b>. Tus respuestas siguen guardadas en tu celular.<br><small style="opacity:.6">Detalle: ${C.esc(String((e && e.message) || e))}</small>`;
      $('#reintentar').classList.remove('oculto');
    }
  }
  function pantallaEnvio(n) {
    document.querySelector('.barra').classList.add('oculto');
    $('#contenido').innerHTML = `<div class="pantalla"><div class="seccion-tit"><span class="emo">📨</span><h2>Enviando…</h2></div>
      <p>No cierres esta página hasta que termine.</p>
      <ul class="envio-lista"><li id="e1">Enviando respuestas…</li><li id="e2">${n ? `${n} archivos para subir` : ''}</li><li id="e3"></li></ul>
      <p id="envio-error" class="error-txt"></p>
      <button class="btn prim oculto" id="reintentar" style="width:100%">Reintentar</button></div>`;
    $('#reintentar').addEventListener('click', enviar);
    window.scrollTo(0, 0);
  }
  function gracias(prueba, fallidos) {
    const wa = (window.CONFIG.WHATSAPP || '').replace(/\D/g, '');
    $('#progreso').style.width = '100%';
    $('#paso-txt').textContent = '¡Listo!';
    $('#contenido').innerHTML = `<div class="pantalla"><div class="destacado azul" style="text-align:center;padding:26px 18px">
      <div class="iso" style="margin:0 auto 12px;width:70px">${C.ISO}</div>
      <div class="frase" style="font-size:26px">¡Gracias por tomarte este tiempo!</div>
      <p style="margin:10px 0 0">Ya me llegó todo. Lo leo con calma antes de vernos.</p></div>
      ${fallidos ? `<p class="error-txt">Algunos archivos no se pudieron subir (${fallidos}). Si querés, mandámelos por WhatsApp.</p>` : ''}
      ${prueba ? '<p class="ayuda" style="text-align:center">Modo prueba: todavía no está conectado a Google.</p>' : ''}
      <a class="btn rosa" style="display:block;text-align:center;text-decoration:none;margin-top:14px" href="https://wa.me/${wa}">Escribirle a Ceci por WhatsApp</a>
      <p class="firma"><b>${esc(window.CONFIG.NOMBRE)}</b><br>${esc(window.CONFIG.TITULOS)}</p></div>`;
    window.scrollTo(0, 0);
  }

  // ---------- Inicio ----------
  async function iniciar() {
    $('#iso').innerHTML = C.ISO;
    $('#siguiente').addEventListener('click', siguiente);
    $('#atras').addEventListener('click', atras);
    const guardados = await alm.todos();
    guardados.forEach(({ clave, valor }) => { if (valor && valor.blob) medios[clave] = valor; });
    render();
    if (!window.CONFIG.SCRIPT_URL) $('#modo-prueba').classList.remove('oculto');
  }
  window.addEventListener('beforeunload', e => { if (grabandoEn) { e.preventDefault(); e.returnValue = ''; } });
  iniciar();
})();
