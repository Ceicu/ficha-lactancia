/* Página de fotos para evaluación de motricidad orofacial.
   Usa el mismo Apps Script que la ficha de lactancia: acciones enviar → subir → terminar.
   Link para un paciente: fotos.html?n=Nombre%20Apellido */
(function () {
  const C = window.COMUN, D = window.DIBUJOS;
  const $ = s => document.querySelector(s);
  const esc = C.esc;
  const alm = C.Almacen('fotos-mo');
  const LS = 'fotos-mo-datos';
  const params = new URLSearchParams(location.search);

  let datos = {};
  try { datos = JSON.parse(localStorage.getItem(LS) || '{}'); } catch (e) { datos = {}; }
  if (params.get('n') && !datos.nombre) datos.nombre = params.get('n');
  const guardarDatos = () => { try { localStorage.setItem(LS, JSON.stringify(datos)); } catch (e) { } };

  // fotos[n] = [{clave, blob, url}]
  const fotos = {};
  D.fotos.forEach(f => { fotos[f.n] = []; });

  $('#iso').innerHTML = C.ISO;

  const marca = ok => ok ? D.check.si : D.check.no;
  const primerNombre = () => (datos.nombre || '').trim().split(/\s+/)[0] || '';

  function render() {
    const nom = primerNombre();
    $('#contenido').innerHTML = `
      <div class="destacado" style="margin-top:18px">
        <p class="frase" style="margin:0 0 6px">Hola${nom ? ', ' + esc(nom) : ''} 👋</p>
        Con estas fotos puedo ver lo que en la videollamada no se ve bien. Seguí los dibujitos, sacá cada foto y mandámelas desde acá mismo.
        <p style="margin:8px 0 0"><b>Son 14 fotos.</b> Te lleva unos 20 minutos. Lo que vayas cargando queda guardado en tu celular aunque cierres la página.</p>
      </div>

      <div class="tarjeta">
        <label class="titulo" for="nombre"><b>Tu nombre y apellido</b></label>
        <input class="campo" id="nombre" autocomplete="name" value="${esc(datos.nombre || '')}" style="width:100%;padding:12px;border:1.5px solid var(--gris-cl);border-radius:12px;background:#fff">
        <label class="titulo" for="whatsapp" style="margin-top:12px;display:block"><b>Tu WhatsApp</b> <span style="color:var(--gris);font-weight:400">(opcional)</span></label>
        <input class="campo" id="whatsapp" type="tel" autocomplete="tel" value="${esc(datos.whatsapp || '')}" style="width:100%;padding:12px;border:1.5px solid var(--gris-cl);border-radius:12px;background:#fff">
      </div>

      <div class="seccion-tit"><span class="emo">☀️</span><h2>1. El lugar y la luz</h2></div>
      <p class="seccion-intro">La luz tiene que darte <b>en la cara</b>, no en la espalda.</p>
      <div class="par">${D.lugar.map(x => `<div class="tarjeta"><div class="dib">${x.svg}</div><div class="lab">${marca(x.ok)} ${x.ok ? 'Así sí' : 'Así no'}</div><p class="mini">${x.txt}</p></div>`).join('')}</div>
      <div class="reglas">
        <div class="tarjeta"><b class="t">Fondo</b>Pared lisa y clara. Sin cuadros ni muebles atrás.</div>
        <div class="tarjeta"><b class="t">Luz</b>De día, con luz natural. Sin flash.</div>
        <div class="tarjeta"><b class="t">Distancia</b>1 a 1,5 metros para la cara. Si querés ver más cerca, usá el zoom 2x: <b>no acerques el celular</b>, porque deforma la cara.</div>
        <div class="tarjeta"><b class="t">Vos</b>Pelo atrás, sin anteojos ni gorra. Sin filtros ni modo belleza.</div>
      </div>

      <div class="seccion-tit"><span class="emo">🙂</span><h2>2. La cabeza derecha</h2></div>
      <p class="seccion-intro">Imaginá una línea <b style="color:#e48a92">rosa</b> que va desde tu oreja hasta debajo del ojo. Tiene que quedar <b>horizontal</b>, como el piso.</p>
      <div class="trio">${D.cabeza.map(x => `<div class="tarjeta"><div class="dib">${x.svg}</div><div class="lab" style="font-size:12.5px">${marca(x.ok)} ${x.txt}</div></div>`).join('')}</div>
      <div class="destacado">Truco: mirá un punto en la pared, a la altura de tus ojos, y quedate mirándolo.</div>
      <div class="destacado suave">En las fotos <b>en reposo</b> no acomodes la boca ni la lengua: dejalas como quedan solas. Eso es justo lo que necesito ver.</div>

      <div class="seccion-tit"><span class="emo">🧰</span><h2>3. Tené esto a mano</h2></div>
      <p class="seccion-intro">Para las fotos y también para la evaluación por videollamada. Dejalo todo junto y cerca.</p>
      <div class="mats">${D.materiales.map(m => `<div class="mat">${m.icono}<div><b>${m.t}</b>${m.s ? `<span>${m.s}</span>` : ''}</div></div>`).join('')}</div>

      <div class="seccion-tit"><span class="emo">📷</span><h2>4. Las fotos</h2></div>
      <p class="seccion-intro">Tocá <b>Sacar o elegir foto</b> en cada una. Podés sacarla en el momento o elegirla de tu galería.</p>
      <div id="lista-fotos">${D.fotos.map(tarjetaFoto).join('')}</div>

      <div class="seccion-tit"><span class="emo">✅</span><h2>5. Antes de mandar, revisá</h2></div>
      <div class="tarjeta" style="font-size:15px">
        ☐ Luz de frente, cara bien iluminada<br>☐ Pared lisa atrás<br>☐ Cabeza derecha, mirando al frente<br>☐ Sin filtros ni anteojos
      </div>
      <div class="destacado suave" style="font-size:15px">Si alguna foto no te sale, no pasa nada: mandá las que puedas y la vemos juntos en la sesión.</div>
    `;
    $('#nombre').addEventListener('input', e => { datos.nombre = e.target.value; guardarDatos(); });
    $('#whatsapp').addEventListener('input', e => { datos.whatsapp = e.target.value; guardarDatos(); });
    D.fotos.forEach(f => pintarFotos(f.n));
    actualizarProgreso();
  }

  function tarjetaFoto(f) {
    return `<div class="tarjeta foto-card" id="card-${f.n}">
      <div class="cab"><div class="num">${f.n}</div><div><h3>${esc(f.titulo)}</h3>${f.ayuda ? '<span class="tag">Pedí ayuda a alguien</span>' : ''}</div></div>
      <div class="cuerpo"><div class="dib">${f.svg}</div><ul>${f.pasos.map(p => `<li>${p}</li>`).join('')}</ul></div>
      <div id="fotos-${f.n}"></div>
    </div>`;
  }

  function pintarFotos(n) {
    const f = D.fotos.find(x => x.n === n);
    const lista = fotos[n];
    const cont = $('#fotos-' + n);
    if (!cont) return;
    cont.innerHTML =
      (lista.length ? `<div class="fotos-grid">${lista.map((x, i) => `<div class="foto"><img src="${x.url}" alt="Foto ${n}"><button type="button" data-borrar="${n}:${i}" aria-label="Borrar">✕</button></div>`).join('')}</div>` : '') +
      (lista.length < f.max ? `<label class="boton-subir">📷 ${lista.length ? 'Agregar la otra foto' : 'Sacar o elegir foto'}<input type="file" accept="image/*" ${f.max > 1 ? 'multiple' : ''} data-foto="${n}"></label>` : '<div class="estado-fotos">✅ Lista. Si querés cambiarla, borrala con la ✕ y cargala de nuevo.</div>');
    $('#card-' + n).classList.toggle('lista', lista.length > 0);
  }

  document.addEventListener('change', async e => {
    const inp = e.target.closest('input[data-foto]');
    if (!inp) return;
    const n = Number(inp.dataset.foto);
    const f = D.fotos.find(x => x.n === n);
    for (const file of Array.from(inp.files || [])) {
      if (fotos[n].length >= f.max) break;
      const blob = await C.comprimirFoto(file, 2000, 0.88);
      const clave = n + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
      await alm.poner(clave, { n, blob }).catch(() => { });
      fotos[n].push({ clave, blob, url: URL.createObjectURL(blob) });
    }
    pintarFotos(n);
    actualizarProgreso();
  });

  document.addEventListener('click', async e => {
    const b = e.target.closest('[data-borrar]');
    if (!b) return;
    const [n, i] = b.dataset.borrar.split(':').map(Number);
    const x = fotos[n][i];
    if (!x) return;
    await alm.sacar(x.clave).catch(() => { });
    URL.revokeObjectURL(x.url);
    fotos[n].splice(i, 1);
    pintarFotos(n);
    actualizarProgreso();
  });

  function actualizarProgreso() {
    const listas = D.fotos.filter(f => fotos[f.n].length > 0).length;
    $('#progreso').style.width = Math.round(listas / D.fotos.length * 100) + '%';
    $('#paso-txt').textContent = `${listas} de ${D.fotos.length} fotos listas`;
    const btn = $('#enviar');
    btn.disabled = listas === 0;
    btn.textContent = listas === D.fotos.length ? 'Enviar las 14 fotos a Ceci' : `Enviar fotos a Ceci (${listas} de ${D.fotos.length})`;
  }

  async function restaurar() {
    const todos = await alm.todos();
    todos.sort((a, b) => String(a.clave).localeCompare(String(b.clave)));
    for (const { clave, valor } of todos) {
      if (!valor || !fotos[valor.n]) continue;
      fotos[valor.n].push({ clave, blob: valor.blob, url: URL.createObjectURL(valor.blob) });
    }
  }

  async function enviar() {
    const nombre = (datos.nombre || '').trim();
    if (!nombre) { alert('Escribí tu nombre arriba, así sé de quién son las fotos.'); $('#nombre').focus(); return; }
    const faltan = D.fotos.filter(f => !fotos[f.n].length);
    if (faltan.length && !confirm(`Te faltan ${faltan.length} foto(s): ${faltan.map(f => f.n).join(', ')}. ¿Querés mandar igual las que tenés?`)) return;
    const items = [];
    D.fotos.forEach(f => fotos[f.n].forEach((x, i) => items.push({ f, x, i })));
    $('#barra').classList.add('oculto');
    $('#contenido').innerHTML = `<div class="pantalla"><div class="tarjeta"><h2 style="margin-top:0">Enviando…</h2>
      <p>No cierres esta página hasta que termine.</p>
      <ul class="envio-lista"><li id="e1">Preparando…</li><li id="e2">${items.length} fotos para subir</li></ul>
      <div class="progreso" style="background:var(--gris-cl)"><i id="p-envio"></i></div>
      <p class="error-txt" id="envio-error"></p></div></div>`;
    window.scrollTo(0, 0);
    let fallidos = 0;
    try {
      const lista = D.fotos.map(f => `${f.n}. ${f.titulo}: ${fotos[f.n].length ? '✅' : '—'}`);
      const ficha = { tipo: 'fotos-mo', nacio: 'si', bebe_nombre: '📷 Fotos MO · ' + nombre, quien_nombre: nombre, whatsapp: datos.whatsapp || '', fotos: lista };
      const html = `<p><b>Fotos para evaluación de motricidad orofacial</b> enviadas por ${esc(nombre)}.</p><ul>${lista.map(l => `<li>${esc(l)}</li>`).join('')}</ul>`;
      const { id } = await C.api({ accion: 'enviar', ficha, resumen: { prioridad: 'Fotos MO', texto: 'Fotos para evaluación MO (' + items.length + ' fotos).\n' + lista.join('\n'), html } });
      $('#e1').textContent = '✅ Datos enviados';
      let k = 0;
      for (const { f, x, i } of items) {
        k++;
        $('#e2').textContent = `Subiendo foto ${k} de ${items.length}…`;
        try {
          const datosB64 = await C.aBase64(x.blob);
          const etiqueta = String(f.n).padStart(2, '0') + ' ' + f.titulo + (f.max > 1 ? ' (' + (i + 1) + ')' : '');
          await C.api({ accion: 'subir', id, clase: 'foto', pregunta: 'foto_' + f.n, etiqueta, tipo: x.blob.type || 'image/jpeg', ext: C.extension(x.blob.type || 'image/jpeg'), datos: datosB64 });
        } catch (e) { fallidos++; }
        $('#p-envio').style.width = Math.round(k / items.length * 100) + '%';
      }
      await C.api({ accion: 'terminar', id, total: items.length, fallidos }).catch(() => { });
      if (fallidos < items.length) { await alm.vaciar().catch(() => { }); }
      $('#contenido').innerHTML = `<div class="pantalla"><div class="destacado azul" style="text-align:center;padding:26px 18px">
        <div class="iso" style="margin:0 auto 10px;width:70px">${C.ISO}</div>
        <p class="frase" style="font-size:26px;margin:0">¡Gracias${primerNombre() ? ', ' + esc(primerNombre()) : ''}!</p>
        <p style="margin:8px 0 0">Me llegaron ${items.length - fallidos} foto(s). Las miro antes de la sesión.</p></div>
        ${fallidos ? `<p class="error-txt">${fallidos} foto(s) no se pudieron subir. Si querés, mandámelas por WhatsApp.</p>` : ''}</div>`;
    } catch (e) {
      $('#envio-error').innerHTML = `No se pudo enviar. Revisá tu conexión y volvé a intentar: tus fotos siguen guardadas en tu celular.<br><button class="btn prim" id="reintentar" type="button" style="margin-top:10px">Reintentar</button><br><small style="opacity:.6">Detalle: ${esc(String((e && e.message) || e))}</small>`;
      $('#reintentar').addEventListener('click', () => { $('#barra').classList.remove('oculto'); render(); });
    }
  }

  $('#enviar').addEventListener('click', enviar);
  restaurar().then(render);
})();
