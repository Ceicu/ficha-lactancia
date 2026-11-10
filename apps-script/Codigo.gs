/**
 * Ficha de lactancia · Ceci Quevedo — guardado en Google (planilla + Drive + mail).
 *
 * Cómo se instala (una sola vez):
 *  1. Pegá todo este código en un proyecto nuevo de Apps Script (script.google.com).
 *  2. Elegí la función "instalar" arriba y tocá "Ejecutar". Aceptá los permisos.
 *  3. En "Registro de ejecución" aparecen el link de la planilla, el de la carpeta y tu CLAVE del panel.
 *  4. Implementar → Nueva implementación → Tipo: Aplicación web →
 *     Ejecutar como: Yo · Quién tiene acceso: Cualquier persona → Implementar.
 *  5. Copiá la URL que termina en /exec y pegala en config.js (SCRIPT_URL).
 */

const ZONA = 'America/Asuncion';
const COLS = ['ID', 'Recibida', 'Bebé', 'Quien completa', 'WhatsApp', 'Prioridad', 'Estado', 'Carpeta',
  'Ficha (JSON)', 'Resumen', 'Resumen HTML', 'Evaluación (JSON)', 'Devolución', 'Archivos (JSON)', 'Transcripciones (JSON)', 'Carpeta ID'];
const C = {}; COLS.forEach((n, i) => { C[n] = i + 1; });

const FAC_COLS = ['Fecha', 'Mes', 'ID ficha', 'Paciente', 'A nombre de', 'RUC', 'Mail', 'WhatsApp', 'Servicio', 'Monto (Gs.)', 'Pagado', 'Factura (pendiente/hecha)', 'N.º de factura', 'Notas'];

function props() { return PropertiesService.getScriptProperties(); }

function instalar() {
  const p = props();
  let carpeta;
  if (p.getProperty('CARPETA_ID')) carpeta = DriveApp.getFolderById(p.getProperty('CARPETA_ID'));
  else { carpeta = DriveApp.createFolder('Fichas de lactancia (formulario)'); p.setProperty('CARPETA_ID', carpeta.getId()); }
  let ss;
  if (p.getProperty('PLANILLA_ID')) ss = SpreadsheetApp.openById(p.getProperty('PLANILLA_ID'));
  else {
    ss = SpreadsheetApp.create('Fichas de lactancia · Ceci Quevedo');
    DriveApp.getFileById(ss.getId()).moveTo(carpeta);
    p.setProperty('PLANILLA_ID', ss.getId());
  }
  const h = ss.getSheets()[0];
  h.setName('Fichas');
  h.getRange(1, 1, 1, COLS.length).setValues([COLS]).setFontWeight('bold').setBackground('#5D7DA3').setFontColor('#ffffff');
  h.setFrozenRows(1);
  h.setColumnWidths(9, 7, 120);
  let fac = ss.getSheetByName('Facturación');
  if (!fac) fac = ss.insertSheet('Facturación');
  fac.getRange(1, 1, 1, FAC_COLS.length).setValues([FAC_COLS]).setFontWeight('bold').setBackground('#F6B2B6');
  fac.setFrozenRows(1);
  if (!p.getProperty('CLAVE')) p.setProperty('CLAVE', String(Math.floor(100000 + Math.random() * 900000)));
  Logger.log('✅ Listo');
  Logger.log('Planilla: ' + ss.getUrl());
  Logger.log('Carpeta: ' + carpeta.getUrl());
  Logger.log('Tu CLAVE para el panel: ' + p.getProperty('CLAVE'));
  Logger.log('Mails a: ' + correoDestino());
}

/** Para cambiar la clave: escribila entre comillas y ejecutá esta función. */
function cambiarClave() { props().setProperty('CLAVE', '123456'); Logger.log('Clave nueva: ' + props().getProperty('CLAVE')); }

/** Para guardar el link del panel (aparece en los mails). */
function guardarLinkPanel() { props().setProperty('PANEL_URL', 'https://TU-USUARIO.github.io/ficha-lactancia/panel.html'); }

/** AVISOS. Elegí uno: completá los datos entre comillas y ejecutá la función. */
function configurarWhatsApp() {
  props().setProperties({ AVISO: 'whatsapp', WA_TEL: '+595981XXXXXX', WA_APIKEY: 'PEGAR_ACA_LA_APIKEY' });
  avisoWhatsApp('✅ Listo: los avisos de fichas nuevas te van a llegar por acá.');
}
function configurarTelegram() {
  props().setProperties({ AVISO: 'telegram', TG_TOKEN: 'PEGAR_TOKEN_DEL_BOT', TG_CHAT: 'PEGAR_CHAT_ID' });
  avisoTelegram('✅ Listo: los avisos de fichas nuevas te van a llegar por acá.');
}
function sinAvisos() { props().setProperty('AVISO', 'ninguno'); }
function avisoWhatsApp(texto) {
  const p = props();
  const url = 'https://api.callmebot.com/whatsapp.php?phone=' + encodeURIComponent(p.getProperty('WA_TEL')) + '&text=' + encodeURIComponent(texto) + '&apikey=' + encodeURIComponent(p.getProperty('WA_APIKEY'));
  const r = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  Logger.log('WhatsApp: ' + r.getResponseCode());
}
function avisoTelegram(texto) {
  const p = props();
  const r = UrlFetchApp.fetch('https://api.telegram.org/bot' + p.getProperty('TG_TOKEN') + '/sendMessage', {
    method: 'post', muteHttpExceptions: true,
    payload: { chat_id: p.getProperty('TG_CHAT'), text: texto.replace(/\*/g, '') }
  });
  Logger.log('Telegram: ' + r.getResponseCode());
}

function correoDestino() { return props().getProperty('EMAIL') || Session.getEffectiveUser().getEmail(); }
function hoja() { return SpreadsheetApp.openById(props().getProperty('PLANILLA_ID')).getSheetByName('Fichas'); }
function json(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

function doGet() { return json({ ok: true, servicio: 'Ficha de lactancia', listo: !!props().getProperty('PLANILLA_ID') }); }

function doPost(e) {
  let req;
  try { req = JSON.parse(e.postData.contents); } catch (err) { return json({ ok: false, error: 'formato' }); }
  const privadas = ['listar', 'ver', 'archivo', 'guardar', 'transcripcion'];
  if (privadas.indexOf(req.accion) >= 0 || (req.accion === 'subir' && req.clase === 'protocolo')) {
    if (String(req.clave || '') !== String(props().getProperty('CLAVE'))) return json({ ok: false, error: 'clave' });
  }
  const lock = LockService.getScriptLock();
  const escribe = ['enviar', 'subir', 'terminar', 'guardar', 'transcripcion'].indexOf(req.accion) >= 0;
  if (escribe) lock.waitLock(30000);
  try {
    switch (req.accion) {
      case 'enviar': return json(enviar(req));
      case 'subir': return json(subir(req));
      case 'terminar': return json(terminar(req));
      case 'listar': return json(listar());
      case 'ver': return json(ver(req.id));
      case 'archivo': return json(archivo(req.fileId));
      case 'guardar': return json(guardar(req));
      case 'transcripcion': return json(transcripcion(req));
      default: return json({ ok: false, error: 'accion' });
    }
  } catch (err) {
    return json({ ok: false, error: String(err && err.message || err) });
  } finally { if (escribe) lock.releaseLock(); }
}

function filaDe(id) {
  const h = hoja();
  const f = h.getRange(2, 1, Math.max(1, h.getLastRow() - 1), 1).createTextFinder(String(id)).matchEntireCell(true).findNext();
  if (!f) throw new Error('no_encontrada');
  return f.getRow();
}
function celda(fila, col) { return hoja().getRange(fila, C[col]); }
function leerJSON(fila, col, porDefecto) { try { return JSON.parse(celda(fila, col).getValue() || '') } catch (e) { return porDefecto; } }

function enviar(req) {
  const f = req.ficha || {};
  const ahora = new Date();
  const id = Utilities.formatDate(ahora, ZONA, 'yyMMdd-HHmm') + '-' + Math.random().toString(36).slice(2, 6);
  const bebe = f.nacio === 'no' ? 'Prenatal' + (f.sem_actual ? ' ' + f.sem_actual + ' sem' : '') : (f.bebe_nombre || 'Bebé');
  const raiz = DriveApp.getFolderById(props().getProperty('CARPETA_ID'));
  const carpeta = raiz.createFolder(Utilities.formatDate(ahora, ZONA, 'yyyy-MM-dd') + ' · ' + bebe + ' · ' + (f.quien_nombre || ''));
  const fila = new Array(COLS.length).fill('');
  fila[C['ID'] - 1] = id;
  fila[C['Recibida'] - 1] = ahora;
  fila[C['Bebé'] - 1] = bebe;
  fila[C['Quien completa'] - 1] = f.quien_nombre || '';
  fila[C['WhatsApp'] - 1] = "'" + (f.whatsapp || '');
  fila[C['Prioridad'] - 1] = (req.resumen && req.resumen.prioridad) || '';
  fila[C['Estado'] - 1] = 'Nueva';
  fila[C['Carpeta'] - 1] = carpeta.getUrl();
  fila[C['Ficha (JSON)'] - 1] = JSON.stringify(f);
  fila[C['Resumen'] - 1] = (req.resumen && req.resumen.texto || '').slice(0, 49000);
  fila[C['Resumen HTML'] - 1] = (req.resumen && req.resumen.html || '').slice(0, 49000);
  fila[C['Archivos (JSON)'] - 1] = '[]';
  fila[C['Transcripciones (JSON)'] - 1] = '{}';
  fila[C['Carpeta ID'] - 1] = carpeta.getId();
  hoja().appendRow(fila);
  if (f.factura === 'si') {
    const fac = SpreadsheetApp.openById(props().getProperty('PLANILLA_ID')).getSheetByName('Facturación');
    if (fac) fac.appendRow([ahora, Utilities.formatDate(ahora, ZONA, 'yyyy-MM'), id, bebe, f.factura_nombre || '', "'" + (f.factura_ruc || ''), f.factura_mail || '', "'" + (f.whatsapp || ''), 'Asesoría de lactancia', '', '', 'pendiente', '', '']);
  }
  return { ok: true, id: id };
}

function subir(req) {
  const fila = filaDe(req.id);
  const carpeta = DriveApp.getFolderById(celda(fila, 'Carpeta ID').getValue());
  const archivos = leerJSON(fila, 'Archivos (JSON)', []);
  const n = archivos.length + 1;
  const etiqueta = String(req.etiqueta || req.pregunta || '').replace(/[\\/:*?"<>|]/g, '').slice(0, 60);
  const nombre = ('0' + n).slice(-2) + ' · ' + (req.clase === 'audio' ? 'Audio' : req.clase === 'protocolo' ? 'Protocolo' : 'Foto') + ' · ' + etiqueta + '.' + (req.ext || 'bin');
  const blob = Utilities.newBlob(Utilities.base64Decode(req.datos), req.tipo || 'application/octet-stream', nombre);
  const archivo = carpeta.createFile(blob);
  const item = { fileId: archivo.getId(), nombre: nombre, tipo: req.tipo, clase: req.clase, pregunta: req.pregunta, etiqueta: req.etiqueta || '', seg: req.seg || null, url: archivo.getUrl(), fecha: new Date().toISOString() };
  archivos.push(item);
  celda(fila, 'Archivos (JSON)').setValue(JSON.stringify(archivos));
  return { ok: true, archivo: item };
}

function terminar(req) {
  const fila = filaDe(req.id);
  const h = hoja();
  const v = h.getRange(fila, 1, 1, COLS.length).getValues()[0];
  const prio = v[C['Prioridad'] - 1];
  const panel = props().getProperty('PANEL_URL');
  const archivos = leerJSON(fila, 'Archivos (JSON)', []);
  const audios = archivos.filter(function (a) { return a.clase === 'audio'; }).length;
  const fotos = archivos.length - audios;
  const color = { Alta: '#C0504D', Media: '#C9893A', Baja: '#5E8F6E' }[prio] || '#5D7DA3';
  let html = '<div style="font-family:Ubuntu,Arial,sans-serif;color:#2E4562;max-width:640px;margin:auto">';
  html += '<div style="background:#5D7DA3;color:#fff;border-radius:16px;padding:16px 18px;margin-bottom:14px">';
  html += '<div style="font-family:Georgia,serif;font-style:italic;font-weight:700;font-size:22px">Nueva ficha de lactancia</div>';
  html += '<div style="opacity:.9;margin-top:4px">' + esc(v[C['Bebé'] - 1]) + ' · ' + esc(v[C['Quien completa'] - 1]) + ' · WhatsApp ' + esc(String(v[C['WhatsApp'] - 1]).replace(/^'/, '')) + '</div></div>';
  html += v[C['Resumen HTML'] - 1];
  html += '<p style="margin-top:18px">📎 ' + audios + ' audio(s) y ' + fotos + ' foto(s) o video(s)' + (req.fallidos ? ' · ⚠️ ' + req.fallidos + ' no se pudieron subir' : '') + '.</p>';
  html += '<p><a href="' + v[C['Carpeta'] - 1] + '" style="color:#5D7DA3">Abrir la carpeta en Drive</a>';
  if (panel) html += ' · <a href="' + panel + '#' + req.id + '" style="color:#5D7DA3">Abrir en tu panel</a>';
  html += '</p><p style="color:#878787;font-size:12px">Resumen automático a partir de lo que contó la familia. Es una ayuda, no reemplaza tu evaluación.</p></div>';
  const aviso = (props().getProperty('AVISO') || (props().getProperty('WA_APIKEY') ? 'whatsapp' : 'mail')).toLowerCase();
  // Mensaje corto: sin datos clínicos, solo nombre, prioridad y link.
  let corto = (prio === 'Alta' ? '🚩' : '🍼') + ' Nueva ficha de lactancia\n*' + v[C['Bebé'] - 1] + '* · ' + v[C['Quien completa'] - 1] + '\nPrioridad: *' + prio + '*\n📎 ' + audios + ' audio(s), ' + fotos + ' foto(s)';
  if (panel) corto += '\n' + panel + '#' + req.id;
  if (aviso === 'whatsapp') avisoWhatsApp(corto);
  else if (aviso === 'telegram') avisoTelegram(corto);
  else if (aviso === 'mail') MailApp.sendEmail({ to: correoDestino(), subject: (prio === 'Alta' ? '🚩 ' : '🍼 ') + 'Ficha de lactancia: ' + v[C['Bebé'] - 1] + ' · Prioridad ' + prio, htmlBody: html, name: 'Ficha de lactancia' });
  return { ok: true };
}

function listar() {
  const h = hoja();
  if (h.getLastRow() < 2) return { ok: true, fichas: [] };
  const vals = h.getRange(2, 1, h.getLastRow() - 1, COLS.length).getValues();
  const fichas = vals.filter(function (v) { return v[0]; }).map(function (v) {
    return { id: v[C['ID'] - 1], recibida: v[C['Recibida'] - 1], bebe: v[C['Bebé'] - 1], quien: v[C['Quien completa'] - 1], prioridad: v[C['Prioridad'] - 1], estado: v[C['Estado'] - 1] };
  }).reverse();
  return { ok: true, fichas: fichas };
}

function ver(id) {
  const fila = filaDe(id);
  const v = hoja().getRange(fila, 1, 1, COLS.length).getValues()[0];
  const parse = function (s, d) { try { return JSON.parse(s || ''); } catch (e) { return d; } };
  return {
    ok: true, id: id, recibida: v[C['Recibida'] - 1], estado: v[C['Estado'] - 1], carpeta: v[C['Carpeta'] - 1],
    ficha: parse(v[C['Ficha (JSON)'] - 1], {}), evaluacion: parse(v[C['Evaluación (JSON)'] - 1], null),
    devolucion: v[C['Devolución'] - 1], archivos: parse(v[C['Archivos (JSON)'] - 1], []), transcripciones: parse(v[C['Transcripciones (JSON)'] - 1], {})
  };
}

function archivo(fileId) {
  const f = DriveApp.getFileById(fileId);
  // Solo archivos dentro de la carpeta del formulario
  const raiz = props().getProperty('CARPETA_ID');
  const padre = f.getParents().hasNext() ? f.getParents().next() : null;
  const abuelo = padre && padre.getParents().hasNext() ? padre.getParents().next() : null;
  if (!abuelo || abuelo.getId() !== raiz) throw new Error('prohibido');
  const b = f.getBlob();
  return { ok: true, tipo: b.getContentType(), datos: Utilities.base64Encode(b.getBytes()) };
}

function guardar(req) {
  const fila = filaDe(req.id);
  if (req.evaluacion !== undefined) celda(fila, 'Evaluación (JSON)').setValue(JSON.stringify(req.evaluacion));
  if (req.devolucion !== undefined) celda(fila, 'Devolución').setValue(String(req.devolucion).slice(0, 49000));
  if (req.estado) celda(fila, 'Estado').setValue(req.estado);
  return { ok: true };
}

function transcripcion(req) {
  const fila = filaDe(req.id);
  const t = leerJSON(fila, 'Transcripciones (JSON)', {});
  t[req.fileId] = req.texto;
  celda(fila, 'Transcripciones (JSON)').setValue(JSON.stringify(t));
  return { ok: true };
}

function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
