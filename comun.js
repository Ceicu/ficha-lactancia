/* Utilidades compartidas: isotipo, almacenamiento local, fotos, audio y conexión con Google. */
(function (global) {
  const ISO = '<svg viewBox="1097 671 256 295" aria-hidden="true"><path fill="var(--lc)" d="M 1139.8 719.9 C 1144.7 712.7 1151.0 707.0 1158.6 703.0 C 1166.1 699.0 1175.2 697.0 1185.6 697.0 C 1187.2 697.0 1188.7 697.1 1190.3 697.2 L 1191.8 697.3 L 1191.8 676.8 L 1190.4 676.7 C 1188.8 676.7 1187.2 676.6 1185.6 676.6 C 1171.6 676.6 1159.2 679.2 1148.8 684.4 C 1138.3 689.5 1129.5 696.8 1122.7 706.1 C 1115.9 715.3 1110.7 726.4 1107.3 739.0 C 1103.9 751.6 1102.1 765.5 1102.1 780.5 C 1102.1 795.5 1103.9 809.5 1107.3 822.2 C 1110.7 834.9 1115.9 846.0 1122.7 855.2 C 1129.5 864.5 1138.3 871.8 1148.8 876.9 C 1159.2 882.1 1171.6 884.7 1185.6 884.7 C 1187.2 884.7 1188.8 884.6 1190.4 884.6 L 1191.8 884.5 L 1191.8 864.0 L 1190.3 864.1 C 1188.7 864.2 1187.2 864.3 1185.6 864.3 C 1175.2 864.3 1166.1 862.3 1158.6 858.3 C 1151.0 854.3 1144.7 848.5 1139.8 841.2 C 1134.8 833.9 1131.1 824.9 1128.7 814.7 C 1126.2 804.3 1125.0 792.8 1125.0 780.5 C 1125.0 768.2 1126.2 756.7 1128.7 746.4 C 1131.1 736.1 1134.8 727.2 1139.8 719.9 "/><path fill="var(--lq)" d="M 1263.9 864.3 C 1253.5 864.3 1244.4 862.3 1236.9 858.3 C 1229.3 854.3 1223.0 848.5 1218.1 841.2 C 1213.2 833.9 1209.4 824.9 1207.0 814.7 C 1204.5 804.3 1203.3 792.9 1203.3 780.5 C 1203.3 768.2 1204.5 756.7 1207.0 746.4 C 1209.4 736.1 1213.2 727.2 1218.1 719.9 C 1223.0 712.7 1229.3 707.0 1236.9 703.0 C 1244.4 699.0 1253.5 697.0 1263.9 697.0 C 1274.3 697.0 1283.3 699.0 1290.8 703.0 C 1298.3 707.0 1304.6 712.7 1309.6 720.0 C 1314.6 727.2 1318.4 736.1 1320.8 746.4 C 1323.3 756.7 1324.5 768.2 1324.5 780.5 C 1324.5 792.9 1323.3 804.3 1320.8 814.7 C 1318.4 824.9 1314.6 833.9 1309.6 841.2 C 1304.6 848.5 1298.3 854.3 1290.8 858.3 C 1283.3 862.3 1274.3 864.3 1263.9 864.3 M 1326.8 855.2 C 1333.6 846.0 1338.8 834.9 1342.2 822.2 C 1345.6 809.5 1347.4 795.5 1347.4 780.5 C 1347.4 765.6 1345.6 751.6 1342.2 739.0 C 1338.8 726.4 1333.6 715.3 1326.8 706.1 C 1320.0 696.8 1311.2 689.5 1300.7 684.4 C 1290.3 679.2 1277.9 676.6 1263.9 676.6 C 1249.9 676.6 1237.6 679.2 1227.1 684.4 C 1216.6 689.5 1207.8 696.8 1201.0 706.1 C 1194.2 715.3 1189.0 726.4 1185.6 739.0 C 1182.2 751.6 1180.4 765.5 1180.4 780.5 C 1180.4 795.5 1182.2 809.5 1185.6 822.2 C 1189.0 834.9 1194.2 846.0 1201.0 855.2 C 1207.8 864.5 1216.6 871.8 1227.1 876.9 C 1237.6 882.1 1249.9 884.7 1263.9 884.7 C 1277.9 884.7 1290.3 882.1 1300.7 876.9 C 1311.2 871.8 1320.0 864.5 1326.8 855.2 "/><path fill="var(--lq)" d="M 1286.2 886.7 L 1285.7 887.9 C 1284.6 890.7 1283.7 893.4 1283.0 896.1 C 1282.3 898.7 1282.0 901.7 1282.0 905.0 L 1282.0 906.2 L 1344.3 918.6 L 1344.8 917.5 C 1346.1 914.4 1347.0 911.5 1347.5 908.7 C 1348.0 906 1348.2 902.9 1348.2 899.7 L 1348.2 898.5 Z M 1286.2 886.7 "/><path fill="var(--lf)" d="M 1264.7 917.4 C 1266.4 920.3 1267.5 923.5 1267.9 926.8 L 1248.5 934.4 C 1246.7 930.8 1245.5 926.9 1244.8 922.6 Z M 1258.4 955.1 C 1257.2 956.4 1256.0 957.5 1254.6 958.4 C 1253.3 959.3 1251.9 960.2 1250.4 961.0 L 1237.2 944.9 C 1238.8 943.4 1240.4 942.1 1242.1 940.9 C 1243.8 939.6 1245.5 938.6 1247.2 937.8 Z M 1230.5 899.8 C 1232.1 899.5 1233.7 899.4 1235.3 899.4 C 1236.9 899.4 1238.6 899.5 1240.4 899.8 L 1241.6 920.5 C 1240.5 920.8 1239.4 920.9 1238.4 920.9 C 1237.4 921.0 1236.3 921.0 1235.3 921.0 C 1234.2 921.0 1233.2 921.0 1232.2 920.9 C 1231.2 920.9 1230.2 920.8 1229.2 920.5 Z M 1223.5 937.8 C 1225.2 938.6 1226.9 939.6 1228.6 940.9 C 1230.3 942.1 1231.9 943.4 1233.5 944.9 L 1220.3 961.0 C 1218.8 960.2 1217.4 959.3 1216.1 958.4 C 1214.7 957.5 1213.5 956.4 1212.3 955.1 Z M 1225.9 922.6 C 1225.2 926.9 1224.0 930.8 1222.2 934.4 L 1202.8 926.8 C 1203.2 923.5 1204.3 920.3 1206.0 917.4 Z M 1225.9 922.6 "/></svg>';
  const MIC = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V22h2v-3.08A7 7 0 0 0 19 12h-2z"/></svg>';

  // ---------- IndexedDB (audios y fotos guardados en el celular hasta enviar) ----------
  function abrirDB(nombre) {
    return new Promise((ok, mal) => {
      const req = indexedDB.open(nombre, 1);
      req.onupgradeneeded = () => req.result.createObjectStore('archivos');
      req.onsuccess = () => ok(req.result);
      req.onerror = () => mal(req.error);
    });
  }
  function Almacen(nombre) {
    let db = null;
    const tx = async (modo, fn) => {
      try { db = db || await abrirDB(nombre); } catch (e) { return null; }
      return new Promise((ok, mal) => {
        const t = db.transaction('archivos', modo);
        const s = t.objectStore('archivos');
        const r = fn(s);
        t.oncomplete = () => ok(r && r.result !== undefined ? r.result : undefined);
        t.onerror = () => mal(t.error);
      });
    };
    return {
      poner: (k, v) => tx('readwrite', s => s.put(v, k)),
      sacar: k => tx('readwrite', s => s.delete(k)),
      leer: k => tx('readonly', s => s.get(k)),
      todos: async () => {
        try { db = db || await abrirDB(nombre); } catch (e) { return []; }
        return new Promise(ok => {
          const out = [];
          const req = db.transaction('archivos').objectStore('archivos').openCursor();
          req.onsuccess = () => { const c = req.result; if (c) { out.push({ clave: c.key, valor: c.value }); c.continue(); } else ok(out); };
          req.onerror = () => ok(out);
        });
      },
      vaciar: () => tx('readwrite', s => s.clear()),
    };
  }

  // ---------- Fotos ----------
  async function comprimirFoto(file, max = 1600, calidad = 0.85) {
    if (!file.type.startsWith('image/') || file.type === 'image/gif') return file;
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' }).catch(() => createImageBitmap(file));
      const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
      const c = document.createElement('canvas');
      c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
      c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
      const blob = await new Promise(ok => c.toBlob(ok, 'image/jpeg', calidad));
      return blob && blob.size < file.size ? blob : file;
    } catch (e) { return file; }
  }

  // ---------- Grabación de audio ----------
  function tipoAudio() {
    if (!global.MediaRecorder) return null;
    const c = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg;codecs=opus'];
    for (const t of c) { try { if (MediaRecorder.isTypeSupported(t)) return t; } catch (e) { } }
    return '';
  }
  function Grabadora() {
    let rec = null, stream = null, partes = [], inicio = 0, timer = null, tope = null;
    return {
      get activa() { return !!rec && rec.state === 'recording'; },
      async empezar(onTick, maxSeg = 300) {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || tipoAudio() === null) throw new Error('sin_mic');
        stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
        const tipo = tipoAudio();
        rec = tipo ? new MediaRecorder(stream, { mimeType: tipo }) : new MediaRecorder(stream);
        partes = [];
        rec.ondataavailable = e => { if (e.data && e.data.size) partes.push(e.data); };
        rec.start(1000);
        inicio = Date.now();
        timer = setInterval(() => onTick && onTick(Math.floor((Date.now() - inicio) / 1000)), 500);
        tope = setTimeout(() => this.parar(), maxSeg * 1000);
        this._fin = new Promise(ok => { rec.onstop = () => ok(); });
      },
      async parar() {
        if (!rec) return null;
        clearInterval(timer); clearTimeout(tope);
        if (rec.state !== 'inactive') rec.stop();
        await this._fin;
        stream.getTracks().forEach(t => t.stop());
        const tipo = rec.mimeType || (partes[0] && partes[0].type) || 'audio/webm';
        const blob = new Blob(partes, { type: tipo });
        const seg = Math.round((Date.now() - inicio) / 1000);
        rec = null; stream = null;
        return { blob, seg };
      },
    };
  }

  // ---------- Conexión con Google Apps Script ----------
  async function api(cuerpo, intentos = 3) {
    const url = (global.CONFIG || {}).SCRIPT_URL;
    if (!url) throw new Error('sin_url');
    let ultimoError;
    for (let i = 0; i < intentos; i++) {
      try {
        const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(cuerpo), redirect: 'follow' });
        const json = await res.json();
        if (!json.ok) throw new Error(json.error || 'error');
        return json;
      } catch (e) {
        ultimoError = e;
        if (e.message === 'clave' || e.message === 'no_encontrada') break;
        await new Promise(ok => setTimeout(ok, 1200 * (i + 1)));
      }
    }
    throw ultimoError;
  }
  function aBase64(blob) {
    return new Promise((ok, mal) => {
      const fr = new FileReader();
      fr.onload = () => ok(String(fr.result).split(',')[1]);
      fr.onerror = () => mal(fr.error);
      fr.readAsDataURL(blob);
    });
  }
  function extension(tipo) {
    if (/jpeg|jpg/.test(tipo)) return 'jpg';
    if (/png/.test(tipo)) return 'png';
    if (/heic/.test(tipo)) return 'heic';
    if (/webm/.test(tipo)) return 'webm';
    if (/mp4/.test(tipo)) return tipo.startsWith('video') ? 'mp4' : 'm4a';
    if (/quicktime/.test(tipo)) return 'mov';
    if (/ogg/.test(tipo)) return 'ogg';
    if (/mpeg/.test(tipo)) return 'mp3';
    return 'bin';
  }
  const mmss = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  global.COMUN = { ISO, MIC, Almacen, comprimirFoto, Grabadora, api, aBase64, extension, mmss, esc };
})(window);
