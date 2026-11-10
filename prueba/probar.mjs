// Prueba automática del backend (Apps Script). No llama a "terminar" para no mandar avisos.
const URL = process.env.SCRIPT_URL;
const post = async (cuerpo) => {
  const r = await fetch(URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(cuerpo), redirect: 'follow' });
  const t = await r.text();
  try { return JSON.parse(t); } catch { return { ok: false, error: 'no_json', status: r.status, cuerpo: t.slice(0, 300) }; }
};
const jpg = Buffer.from('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==', 'base64').toString('base64');
const audio = Buffer.from('GkXfo0AgQoaBAUL3gQFC8oEEQvOBCEKCQAR3ZWJtQoeBAkKFgQIYU4BnQI0VSalmQCgq17FAAw9CQE2AQAZ3aGFtbXlXQUAGd2hhbW15RIlACECPQAAAAAAAFlSua0AxrkAu14EBY8WBAZyBACK1nEADdW5khkAFVl9WUDglhohAA1ZQOIOBAeBABrCBCLqBCB9DtnVAIueBAKNAHIEAAIAwAQCdASoIAAgAAUAmJaQAA3AA/vz0AAA=', 'base64').toString('base64');
const out = [];
const g = await fetch(URL, { redirect: 'follow' }); out.push(['GET', g.status, (await g.text()).slice(0, 200)]);
const e = await post({ accion: 'enviar', ficha: { quien_nombre: 'PRUEBA AUTOMÁTICA (borrar)', whatsapp: '0000', nacio: 'si', bebe_nombre: 'PRUEBA', consent: true }, resumen: { prioridad: 'Baja', texto: 'Prueba automática', html: '<p>Prueba automática</p>' } });
out.push(['enviar', JSON.stringify(e)]);
if (e.ok) {
  out.push(['subir foto', JSON.stringify(await post({ accion: 'subir', id: e.id, clase: 'foto', pregunta: 'fotos', etiqueta: 'prueba', tipo: 'image/jpeg', ext: 'jpg', datos: jpg }))]);
  out.push(['subir audio', JSON.stringify(await post({ accion: 'subir', id: e.id, clase: 'audio', pregunta: 'motivo_txt', etiqueta: 'prueba', tipo: 'audio/webm', ext: 'webm', datos: audio, seg: 1 }))]);
}
out.push(['listar sin clave (debe dar error clave)', JSON.stringify(await post({ accion: 'listar', clave: 'x' }))]);
for (const o of out) console.log('RESULTADO', ...o);
