/* Análisis automático de la ficha: prioridad, signos de alarma, hipótesis,
   qué mirar en la evaluación, cómo encararle, fotos a pedir y base de la devolución.
   Es una ayuda para Ceci: no reemplaza su criterio clínico. */
(function (global) {
  const F = () => global.FICHA;
  const DIA = 86400000;

  function etiquetas() {
    const map = {};
    F().SECCIONES.forEach(s => s.preguntas.forEach(p => { map[p.id] = p; }));
    return map;
  }
  function etiqueta(id, v) {
    const p = etiquetas()[id];
    if (!p || !p.opciones) return v;
    const f = x => (p.opciones.find(op => op.v === x) || {}).t || x;
    return Array.isArray(v) ? v.map(f).join(', ') : f(v);
  }
  const tiene = (r, id, v) => Array.isArray(r[id]) ? r[id].includes(v) : r[id] === v;
  const num = x => { const n = parseFloat(String(x ?? '').replace(',', '.')); return isFinite(n) ? n : null; };
  const fecha = s => { if (!s) return null; const d = new Date(s + (s.length === 10 ? 'T12:00:00' : '')); return isNaN(d) ? null : d; };
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmtFecha = d => d ? d.toLocaleDateString('es-PY', { day: 'numeric', month: 'numeric', year: 'numeric' }) : '';
  const fmtG = n => n == null ? '' : Math.round(n).toLocaleString('es-PY') + ' g';

  function edadTexto(dias) {
    if (dias == null) return '';
    if (dias < 0) return '';
    if (dias < 31) return dias + (dias === 1 ? ' día' : ' días');
    const sem = Math.floor(dias / 7);
    if (dias < 120) return sem + ' semanas';
    return Math.floor(dias / 30.4) + ' meses';
  }

  function pesosOrdenados(r) {
    const lista = (Array.isArray(r.pesos) ? r.pesos : [])
      .map(p => ({ f: fecha(p.fecha), g: num(p.g) }))
      .filter(p => p.f && p.g && p.g > 300);
    lista.sort((a, b) => a.f - b.f);
    return lista;
  }

  function analizar(r, opciones) {
    opciones = opciones || {};
    const hoy = opciones.fecha ? new Date(opciones.fecha) : new Date();
    const nac = fecha(r.bebe_nac);
    const prenatal = r.nacio === 'no';
    const edad = nac ? Math.floor((hoy - nac) / DIA) : null;
    const sg = num(r.sem_gest);
    const pesoNac = num(r.peso_nac);
    const pesos = pesosOrdenados(r);
    const alarmas = []; // {nivel:'alta'|'media', txt}
    const hip = [];     // {titulo, porque}
    const mirar = new Set();
    const datos = [];   // [etiqueta, valor]
    const factoresProd = [];
    const nombre = (r.bebe_nombre || 'El bebé').trim();
    const alarma = (nivel, txt) => alarmas.push({ nivel, txt });

    if (prenatal) return analizarPrenatal(r, hoy);

    // ---------- Datos clave ----------
    if (edad != null) datos.push(['Edad', edadTexto(edad) + (nac ? ` (nació el ${fmtFecha(nac)})` : '')]);
    if (sg) {
      let t = sg + ' semanas';
      if (sg < 37 && edad != null) {
        const corr = edad - (40 - sg) * 7;
        t += corr >= 0 ? ` · edad corregida ${edadTexto(corr)}` : ` · todavía no llegó a las 40 sem corregidas`;
      }
      datos.push(['Gestación al nacer', t]);
    }
    if (r.tipo_parto) datos.push(['Parto', etiqueta('tipo_parto', r.tipo_parto)]);
    if (r.gesta) datos.push(['Embarazo n.º', r.gesta + (r.perdidas === 'si' ? ` · ${r.perdidas_n ? r.perdidas_n + ' pérdida(s)' : 'con pérdidas previas'}` : '') + (r.partos_prev && r.partos_prev.length ? ` · partos previos: ${etiqueta('partos_prev', r.partos_prev).toLowerCase()}` : '')]);
    if (r.familia_ant && !tiene(r, 'familia_ant', 'ninguno')) datos.push(['En la familia', etiqueta('familia_ant', r.familia_ant) + (r.familia_txt ? ` (${r.familia_txt})` : '')]);
    if (r.donde_duerme || r.despertares) datos.push(['Sueño', [r.donde_duerme && etiqueta('donde_duerme', r.donde_duerme), r.posicion_dormir && etiqueta('posicion_dormir', r.posicion_dormir).toLowerCase(), r.despertares && `se despierta ${etiqueta('despertares', r.despertares)} veces de noche`, r.como_duerme && `se duerme ${etiqueta('como_duerme', r.como_duerme).toLowerCase()}`].filter(Boolean).join(' · ')]);
    if (r.vinculo) datos.push(['Vínculo', etiqueta('vinculo', r.vinculo) + (r.piel_casa ? ` · piel con piel: ${etiqueta('piel_casa', r.piel_casa).toLowerCase()}` : '') + (r.porteo ? ` · porteo: ${etiqueta('porteo', r.porteo).toLowerCase()}` : '')]);
    if (r.factura === 'si') datos.push(['Factura', `${r.factura_nombre || ''} · RUC ${r.factura_ruc || '¿?'} · ${r.factura_mail || ''}`]);
    if (r.uso_educativo) datos.push(['Uso educativo de fotos', r.uso_educativo === 'si' ? 'Autoriza' + (r.tapar_ojos === 'no' ? ' (sin tapar ojos)' : ' (tapar los ojos)') : 'NO autoriza']);
    if (pesoNac) datos.push(['Peso al nacer', fmtG(pesoNac)]);

    // ---------- Peso ----------
    let ultimo = pesos.length ? pesos[pesos.length - 1] : null;
    let gananciaDia = null;
    if (ultimo && pesoNac && nac) {
      const edadControl = Math.floor((ultimo.f - nac) / DIA);
      const pct = (ultimo.g - pesoNac) / pesoNac;
      datos.push(['Último peso', `${fmtG(ultimo.g)} el ${fmtFecha(ultimo.f)} (día ${edadControl}) · ${pct >= 0 ? '+' : ''}${(pct * 100).toFixed(1)}% vs. nacimiento`]);
      if (pct <= -0.10) alarma('alta', `Bajó ${(Math.abs(pct) * 100).toFixed(1)}% del peso de nacimiento (≥10%). Coordinar con pediatría.`);
      else if (pct <= -0.07 && edadControl <= 5) alarma('media', `Bajó ${(Math.abs(pct) * 100).toFixed(1)}% del peso de nacimiento en los primeros días (7–10%).`);
      if (pct < 0 && edadControl >= 14) alarma('alta', `Al día ${edadControl} todavía no recuperó el peso de nacimiento.`);
      else if (pct < 0 && edadControl >= 10) alarma('media', `Al día ${edadControl} todavía no recuperó el peso de nacimiento (se espera entre los días 10 y 14).`);
    }
    if (pesos.length >= 2) {
      const a = pesos[pesos.length - 2], b = ultimo;
      const dias = (b.f - a.f) / DIA;
      if (dias >= 3) {
        gananciaDia = (b.g - a.g) / dias;
        const edadB = nac ? (b.f - nac) / DIA : 30;
        datos.push(['Ganancia reciente', `${Math.round(gananciaDia)} g/día (entre ${fmtFecha(a.f)} y ${fmtFecha(b.f)})`]);
        if (edadB >= 5 && edadB <= 120) {
          if (gananciaDia < 10) alarma('alta', `Ganancia de ${Math.round(gananciaDia)} g/día: muy por debajo de lo esperado (20–35 g/día en los primeros meses).`);
          else if (gananciaDia < 20) alarma('media', `Ganancia de ${Math.round(gananciaDia)} g/día: por debajo de lo esperado (20–35 g/día).`);
        }
      }
    } else if (!ultimo) {
      mirar.add('Pesar hoy y pedir la libreta: no hay historial de peso cargado.');
    }

    // ---------- Pañales ----------
    if (edad != null && edad >= 5) {
      if (r.pis === 'm4') alarma('alta', 'Menos de 4 pañales mojados por día.');
      else if (r.pis === '4_5') alarma('media', 'Solo 4 o 5 pañales mojados por día (se esperan 6 o más).');
      if (edad <= 42) {
        if (r.caca === 'ninguno') alarma('alta', 'Sin cacas en el día, con menos de 6 semanas.');
        else if (r.caca === '1_2') alarma('media', 'Solo 1 o 2 cacas por día, con menos de 6 semanas.');
      }
      if (r.caca_color === 'negra') alarma('alta', 'Caca negra o verde muy oscura después del día 5 (meconio persistente).');
      if (r.uratos === 'si') alarma('media', 'Uratos (manchas rojizas) en el pañal después de los primeros días.');
    }
    if (r.pis) datos.push(['Pañales', `${etiqueta('pis', r.pis)} mojados · ${etiqueta('caca', r.caca) || '¿?'} con caca`]);

    // ---------- Tomas ----------
    if (r.alim) datos.push(['Se alimenta con', etiqueta('alim', r.alim)]);
    if (r.tomas_dia) datos.push(['Tomas en 24 h', etiqueta('tomas_dia', r.tomas_dia) + (r.duracion ? ` · ${etiqueta('duracion', r.duracion)} cada una` : '')]);
    if (edad != null && edad < 60) {
      if (r.tomas_dia === 'm6') alarma('alta', 'Menos de 6 tomas por día en un bebé de menos de 2 meses.');
      else if (r.tomas_dia === '6_7') alarma('media', 'Solo 6 o 7 tomas por día (se esperan 8 a 12).');
      if (r.intervalo === 'm6' && edad < 30) alarma('media', 'Pasa más de 6 horas sin comer, con menos de un mes.');
    }
    const somnoliento = r.sueno === 'mucho' || r.ritmo === 'despertar' || tiene(r, 'toma_nota', 'duerme');
    const amarillo = r.amarillo === 'si' || r.amarillo === 'poco' || tiene(r, 'bebe_diag', 'ictericia');
    if (somnoliento && amarillo) alarma('alta', 'Está somnoliento y con la piel u ojos amarillos: derivar a pediatría hoy.');
    else if (amarillo && edad != null && edad >= 14) alarma('media', 'Sigue amarillo después de las 2 semanas: control con pediatría.');
    if (r.regurg === 'chorro') alarma('alta', 'Vómitos con fuerza, en chorro: derivar a pediatría.');
    if (tiene(r, 'toma_nota', 'atraganta') && (tiene(r, 'bebe_diag', 'cardio') || tiene(r, 'bebe_diag', 'respiratorio') || tiene(r, 'bebe_diag', 'neuro')))
      alarma('media', 'Se atraganta o tose en las tomas y tiene un diagnóstico de base: cuidar la coordinación succión-deglución-respiración.');

    // ---------- Pechos y dolor ----------
    const dolor = num(r.dolor);
    if (dolor != null) datos.push(['Dolor', `${dolor}/10` + (r.dolor_cuando ? ` · ${etiqueta('dolor_cuando', r.dolor_cuando)}` : '')]);
    if (tiene(r, 'pecho_signos', 'fiebre') && (tiene(r, 'pecho_signos', 'rojo') || tiene(r, 'pecho_signos', 'duro')))
      alarma('alta', 'Fiebre o escalofríos con pecho rojo o duro: posible mastitis. Consulta médica hoy.');
    else if (tiene(r, 'pecho_signos', 'fiebre')) alarma('alta', 'Fiebre o escalofríos: consulta médica.');
    else if (tiene(r, 'pecho_signos', 'rojo')) alarma('media', 'Zona roja, caliente o dolorida en el pecho: vigilar mastitis.');
    if (tiene(r, 'pecho_signos', 'bulto')) alarma('media', 'Bulto que no se va: si dura más de una semana, control médico.');
    if (dolor != null && dolor >= 7) alarma('media', `Dolor intenso al amamantar (${dolor}/10).`);
    if (tiene(r, 'pecho_signos', 'sangrado')) alarma('media', 'Pezón con sangrado.');

    // ---------- Quien amamanta ----------
    if (r.whooley1 === 'si' || r.whooley2 === 'si')
      alarma('alta', 'Tamizaje de ánimo positivo (preguntas de Whooley). Explorar con cuidado y ofrecer derivación a salud mental perinatal.');
    if (tiene(r, 'sentir', 'limite')) alarma('media', 'Dice que está al límite.');
    if (r.apoyo === 'poco') alarma('media', 'Cuenta con poco o nada de apoyo en casa.');
    if (r.vinculo === 'cuesta') alarma('media', 'Le está costando conectar con el bebé: explorar con cuidado, junto con el ánimo.');
    if (r.posicion_dormir === 'panza') alarma('media', 'Duerme boca abajo: conversar sobre sueño seguro.');
    if (r.donde_duerme === 'cama' && r.fuma === 'si') alarma('media', 'Comparten cama y alguien fuma en casa: conversar sobre sueño seguro.');

    // ---------- Bebé ----------
    if (sg && sg < 34) alarma('alta', `Prematuro de ${sg} semanas: considerar edad corregida y energía para la succión.`);
    else if (sg && sg < 37) alarma('media', `Prematuro tardío (${sg} semanas): más riesgo de somnolencia, ictericia y poca transferencia.`);
    ['cardio', 'neuro', 'genetico'].forEach(d => { if (tiene(r, 'bebe_diag', d)) alarma('media', `Diagnóstico de base (${etiqueta('bebe_diag', d).toLowerCase()}): coordinar con su equipo médico.`); });

    // ---------- Factores de riesgo de producción ----------
    const fp = (cond, txt) => { if (cond) factoresProd.push(txt); };
    fp(tiene(r, 'emb_compl', 'dg') || tiene(r, 'salud_diag', 'diabetes'), 'diabetes');
    fp(tiene(r, 'salud_diag', 'obesidad'), 'sobrepeso u obesidad');
    fp(tiene(r, 'salud_diag', 'sop'), 'SOP');
    fp(tiene(r, 'salud_diag', 'tiroides') || tiene(r, 'emb_compl', 'tiroides'), 'tiroides');
    fp(tiene(r, 'emb_compl', 'hta'), 'hipertensión o preeclampsia');
    fp(tiene(r, 'cirugia_mamaria', 'reduccion'), 'reducción mamaria');
    fp(tiene(r, 'cirugia_mamaria', 'aumento'), 'implantes mamarios');
    fp(r.pechos_cambios === 'no' || r.pechos_cambios === 'pocos', 'pocos cambios en los pechos en el embarazo');
    fp(r.hemorragia === 'si', 'hemorragia en el parto');
    fp(r.tipo_parto === 'ces_urg', 'cesárea de urgencia');
    fp(tiene(r, 'primeros_dias', 'neo'), 'separación por internación en neo');
    fp(tiene(r, 'primeros_dias', 'formula_sanat'), 'fórmula en el sanatorio');
    fp(r.piel === 'no' || r.primera_hora === 'no', 'sin piel con piel o sin toma en la primera hora');
    fp(r.fertilidad === 'si', 'tratamiento de fertilidad');
    fp(r.bajada === 'd5' || r.bajada === 'no_senti', 'bajada de leche tardía');
    fp(tiene(r, 'salud_diag', 'bariatrica'), 'cirugía bariátrica');
    fp(r.anticonc === 'combinado', 'anticonceptivo combinado');
    fp(sg && sg < 37, 'prematurez');

    // ---------- Hipótesis ----------
    const sFren = [];
    const sf = (c, t) => { if (c) sFren.push(t); };
    sf(tiene(r, 'toma_nota', 'chasquidos'), 'chasquidos');
    sf(tiene(r, 'toma_nota', 'pierde'), 'pierde leche por los costados');
    sf(tiene(r, 'pecho_signos', 'aplastado'), 'pezón aplastado al soltar');
    sf(tiene(r, 'pecho_signos', 'grietas'), 'grietas');
    sf(dolor != null && dolor >= 4, `dolor ${dolor}/10`);
    sf(tiene(r, 'toma_nota', 'suelta'), 'se suelta y se vuelve a prender');
    sf(tiene(r, 'toma_nota', 'muerde'), 'muerde');
    sf(tiene(r, 'toma_nota', 'cansa'), 'se cansa');
    sf(r.duracion === 'm40', 'tomas de más de 40 min');
    sf(r.boca_abierta === 'si', 'boca abierta en reposo');
    sf(r.frenillo === 'tiene', 'ya le dijeron que tiene frenillo');
    sf(tiene(r, 'familia_ant', 'frenillo'), 'antecedentes de frenillo en la familia');

    const sTransf = [];
    const st = (c, t) => { if (c) sTransf.push(t); };
    st(r.duracion === 'm40' || r.duracion === '20_40', 'tomas largas');
    st(tiene(r, 'toma_nota', 'duerme'), 'se duerme enseguida');
    st(r.traga === 'no' || r.traga === 'aveces', 'poca deglución audible');
    st(r.pechos_despues === 'no' || r.pechos_despues === 'no_noto', 'pechos sin cambio después de la toma');
    st(r.despues_toma === 'pide' || r.despues_toma === 'llora', 'no queda satisfecho');
    st(alarmas.some(a => /peso|g\/día/.test(a.txt)), 'peso por debajo de lo esperado');
    st(r.pis === 'm4' || r.pis === '4_5' || r.caca === 'ninguno' || r.caca === '1_2', 'pocos pañales');

    if (sTransf.length >= 3) hip.push({ titulo: 'Transferencia de leche ineficaz', porque: sTransf.join(', ') });
    if (sFren.length >= 3 || r.frenillo === 'tiene') {
      hip.push({ titulo: 'Posible restricción lingual', porque: sFren.join(', ') + '. Evaluar con Martinelli y BTAT antes de concluir.' });
      mirar.add('Frenillo lingual: protocolo de Martinelli y BTAT, con maniobra de elevación.');
    }
    const sAgarre = [];
    if (tiene(r, 'dolor_cuando', 'prenderse')) sAgarre.push('dolor al prenderse');
    if (tiene(r, 'pecho_signos', 'aplastado')) sAgarre.push('pezón deformado al soltar');
    if (tiene(r, 'pecho_signos', 'grietas')) sAgarre.push('grietas');
    if (tiene(r, 'toma_nota', 'chasquidos')) sAgarre.push('chasquidos');
    if (sAgarre.length >= 2) hip.push({ titulo: 'Agarre superficial', porque: sAgarre.join(', ') });
    if (factoresProd.length >= 3 || (factoresProd.length >= 1 && tiene(r, 'motivo_chips', 'produccion')))
      hip.push({ titulo: 'Riesgo de baja producción', porque: factoresProd.join(', ') });
    const sExceso = [];
    if (tiene(r, 'motivo_chips', 'exceso')) sExceso.push('lo refiere');
    if (tiene(r, 'toma_nota', 'atraganta')) sExceso.push('se atraganta');
    if (tiene(r, 'toma_nota', 'gases')) sExceso.push('muchos gases');
    if (tiene(r, 'toma_nota', 'regurgita') || r.regurg === 'mucho') sExceso.push('regurgita');
    if (r.duracion === 'm10') sExceso.push('tomas cortas');
    if (sExceso.length >= 3 && !tiene(r, 'motivo_chips', 'produccion')) hip.push({ titulo: 'Posible hiperproducción o eyección fuerte', porque: sExceso.join(', ') });
    if (tiene(r, 'pecho_signos', 'blanco')) hip.push({ titulo: 'Posible vasoespasmo del pezón', porque: 'pezón blanco o morado después de la toma' });
    if (tiene(r, 'pecho_signos', 'ardor')) hip.push({ titulo: 'Ardor o pinchazos', porque: 'diferenciar vasoespasmo, agarre o candidiasis' });
    if (r.pecho_ofrece === 'der' || r.pecho_ofrece === 'izq' || r.cabeza_lado === 'si') {
      const lado = r.pecho_ofrece === 'der' ? 'derecho' : r.pecho_ofrece === 'izq' ? 'izquierdo' : null;
      hip.push({ titulo: 'Preferencia de un lado', porque: (lado ? `usa casi siempre el pecho ${lado}` : '') + (r.cabeza_lado === 'si' ? (lado ? ' y ' : '') + 'gira la cabeza hacia un lado' : '') + '. Evaluar cuello (tortícolis) y considerar kinesiología.' });
      mirar.add('Cuello y postura: rotación e inclinación cervical, asimetrías.');
    }
    if (r.boca_abierta === 'si' || r.ronca === 'si') {
      hip.push({ titulo: 'Respiración y postura oral en reposo', porque: [r.boca_abierta === 'si' && 'boca abierta en reposo', r.ronca === 'si' && 'ronca o respira con ruido'].filter(Boolean).join(', ') + '. Si ronca, considerar ORL.' });
      mirar.add('Postura de labios y lengua en reposo, respiración nasal.');
    }
    if (r.extrae && r.extrae !== 'no' && r.extrae_dolor === 'si') mirar.add('Extracción: tamaño de embudo y técnica (le duele al extraerse).');
    if (r.alim && r.alim.length === 1 && r.alim[0] === 'extraida' && num(r.extrae_veces) != null && num(r.extrae_veces) < 6 && edad != null && edad < 90)
      alarma('media', `Exclusiva con leche extraída y solo ${num(r.extrae_veces)} extracciones por día: puede no alcanzar para sostener la producción.`);
    if (tiene(r, 'con_que', 'mamadera') && (r.tetina_flujo === 'rapido' || r.mam_tiempo === 'm5' || r.mam_como === 'acostado'))
      hip.push({ titulo: 'Mamadera muy rápida', porque: [r.tetina_flujo === 'rapido' && 'tetina de flujo rápido', r.mam_tiempo === 'm5' && 'la toma en menos de 5 min', r.mam_como === 'acostado' && 'más horizontal y de corrido'].filter(Boolean).join(', ') + '. Proponer mamadera a ritmo (pausada) para que conviva mejor con el pecho.' });
    if (r.pezon_forma === 'planos' || r.pezon_forma === 'invertidos') mirar.add('Pezones: forma y protractilidad.');
    if (r.trabajo === 'pronto') mirar.add('Plan de vuelta al trabajo: extracción, conservación y forma de ofrecer.');

    // Siempre
    mirar.add('Peso de hoy (comparar con la libreta) y pañales reales de las últimas 24 h.');
    mirar.add('Toma observada completa: BBAT y LATCH, deglución audible, pechos antes y después.');
    mirar.add('Motricidad oral: reflejos, succión no nutritiva, labios, paladar y frenillo labial.');
    if (tiene(r, 'con_que', 'mamadera')) mirar.add(`Mamadera observada: postura, ritmo y flujo de la tetina${r.mam_marca ? ` (${r.mam_marca})` : ''}.`);
    if (r.pezonera === 'si') mirar.add('Pezonera: tamaño, colocación y transferencia con y sin ella.');
    if (dolor != null && dolor > 0) mirar.add('Pezón al salir de la boca (forma) y estado de la piel.');
    if (amarillo) mirar.add('Color de piel y escleras (ictericia).');

    // ---------- Prioridad ----------
    let prioridad = 'Baja';
    if (alarmas.some(a => a.nivel === 'alta')) prioridad = 'Alta';
    else if (alarmas.length >= 2 || hip.length >= 2 || (dolor != null && dolor >= 7)) prioridad = 'Media';
    else if (alarmas.length === 1 || hip.length === 1) prioridad = 'Media';

    // ---------- Cómo encararle ----------
    const enc = [];
    if (tiene(r, 'sentir', 'cansancio') || tiene(r, 'sentir', 'frustracion') || tiene(r, 'sentir', 'limite'))
      enc.push('Llega con ' + [tiene(r, 'sentir', 'cansancio') && 'cansancio', tiene(r, 'sentir', 'frustracion') && 'frustración', tiene(r, 'sentir', 'limite') && 'la sensación de estar al límite'].filter(Boolean).join(', ') + '. Empezá validando todo lo que viene haciendo.');
    if (tiene(r, 'sentir', 'culpa')) enc.push('Siente culpa: nombrarlo y sacarle peso.');
    if (r.perdidas === 'si') enc.push('Tuvo pérdidas de embarazo: tenerlo presente con delicadeza.');
    if (r.vinculo === 'conociendo' || r.vinculo === 'cuesta') enc.push(`Sobre el vínculo dice: «${etiqueta('vinculo', r.vinculo).toLowerCase()}». Validar que el vínculo se construye de a poco.`);
    if (tiene(r, 'calma', 'cuesta')) enc.push('Le cuesta mucho calmar al bebé: sumar recursos de calma además del pecho.');
    if (tiene(r, 'familia_ant', 'lactancia') || r.lact_previa === 'dificil' || r.lact_previa === 'no_pude') enc.push('Hay lactancias difíciles en su historia o su familia: preguntar qué le quedó de eso.');
    if (r.miedos) enc.push(`Su miedo, con sus palabras: «${r.miedos.trim()}».`);
    if (tiene(r, 'alim', 'formula') || tiene(r, 'con_que', 'mamadera') || (r.chupete && r.chupete !== 'no'))
      enc.push('Usa ' + [tiene(r, 'alim', 'formula') && 'fórmula', tiene(r, 'con_que', 'mamadera') && 'mamadera', r.chupete && r.chupete !== 'no' && 'chupete'].filter(Boolean).join(', ') + ': presentalo como herramienta, no como error.');
    if (r.objetivo) enc.push(`Su objetivo: ${etiqueta('objetivo', r.objetivo).toLowerCase()}. Armá el plan alrededor de eso.`);
    if (r.apoyo === 'poco') enc.push('Tiene poco apoyo: plan corto, de 2 o 3 indicaciones, y pensar quién puede ayudar.');
    else enc.push('Dale un plan corto y concreto: más de 3 indicaciones abruman.');

    // ---------- Fotos a pedir ----------
    const fotos = [];
    if (sFren.length >= 2 || r.frenillo === 'tiene') fotos.push('su boquita bien abierta cuando llora, que se vea la lengua');
    if (dolor != null && dolor > 0 || tiene(r, 'pecho_signos', 'aplastado')) fotos.push('tu pezón justo cuando suelta el pecho, de frente y de costado');
    if (r.alim && tiene(r, 'alim', 'pecho')) fotos.push('una de perfil mientras toma el pecho (o un video cortito de 30 segundos)');
    if (!pesos.length) fotos.push('la página de pesos de la libreta');
    if (tiene(r, 'con_que', 'mamadera') && !r.mam_marca) fotos.push('la mamadera y la tetina que usan');

    const res = {
      prenatal: false, prioridad, edadDias: edad, nombre, datos, alarmas, hipotesis: hip,
      mirar: Array.from(mirar), encarar: enc, fotos, factoresProd,
      quien: r.quien_nombre || '', whatsapp: r.whatsapp || '',
    };
    res.treinta = enTreinta(r, res, edad, ultimo, pesoNac);
    res.mensajeFotos = fotos.length ? mensajeFotos(r, fotos) : '';
    return res;
  }

  function enTreinta(r, res, edad, ultimo, pesoNac) {
    const p = [];
    let a = `${res.nombre}, ${edadTexto(edad) || 'edad sin dato'}`;
    if (r.sem_gest) a += `, ${r.sem_gest} sem`;
    if (r.tipo_parto) a += `, ${etiqueta('tipo_parto', r.tipo_parto).toLowerCase()}`;
    p.push(a + '.');
    if (ultimo && pesoNac) p.push(`${fmtG(pesoNac)} → ${fmtG(ultimo.g)} (${fmtFecha(ultimo.f)}).`);
    if (r.alim) p.push(`Toma ${etiqueta('alim', r.alim).toLowerCase()}${r.tomas_dia ? `, ${etiqueta('tomas_dia', r.tomas_dia).toLowerCase()} veces por día` : ''}.`);
    if (r.motivo_chips && r.motivo_chips.length) p.push(`Consulta por: ${etiqueta('motivo_chips', r.motivo_chips).toLowerCase()}.`);
    const altas = res.alarmas.filter(x => x.nivel === 'alta');
    p.push(`Prioridad ${res.prioridad.toLowerCase()}` + (altas.length ? `: ${altas[0].txt.replace(/\.$/, '')}.` : res.hipotesis.length ? `: lo principal parece ${res.hipotesis[0].titulo.toLowerCase()}.` : '.'));
    return p.join(' ');
  }

  function mensajeFotos(r, fotos) {
    const nombre = (r.quien_nombre || '').split(' ')[0];
    const lista = fotos.length === 1 ? fotos[0] : fotos.slice(0, -1).join(', ') + ' y ' + fotos[fotos.length - 1];
    return `${nombre ? nombre + ', g' : 'G'}racias por completar la ficha 🤍\nPara llegar mejor preparada, ¿me podrías mandar antes de la consulta ${lista}?\nCon luz de ventana y sin flash, así se ve todo bien. Cualquier duda me escriben!`;
  }

  function analizarPrenatal(r, hoy) {
    const datos = [], alarmas = [], hip = [], mirar = [], enc = [];
    const sem = num(r.sem_actual);
    const fpp = fecha(r.fpp);
    if (sem) datos.push(['Semanas de embarazo', `${sem} semanas al ${fmtFecha(hoy)}`]);
    if (fpp) datos.push(['Fecha probable de parto', fmtFecha(fpp)]);
    let ventana = '';
    if (fpp) {
      const s32 = new Date(fpp - 8 * 7 * DIA), s35 = new Date(fpp - 5 * 7 * DIA);
      ventana = `entre el ${fmtFecha(s32)} y el ${fmtFecha(s35)}`;
    } else if (sem) {
      const s32 = new Date(+hoy + (32 - sem) * 7 * DIA), s35 = new Date(+hoy + (35 - sem) * 7 * DIA);
      ventana = `entre el ${fmtFecha(s32)} y el ${fmtFecha(s35)}`;
    }
    if (ventana) datos.push(['Encuentro prenatal ideal (sem 32–35)', ventana]);
    if (r.plan_alim) datos.push(['Cómo se imagina la alimentación', etiqueta('plan_alim', r.plan_alim)]);
    if (r.lugar_parto) datos.push(['Dónde va a nacer', r.lugar_parto]);
    if (r.factura === 'si') datos.push(['Factura', `${r.factura_nombre || ''} · RUC ${r.factura_ruc || '¿?'} · ${r.factura_mail || ''}`]);
    if (r.gesta) datos.push(['Embarazo n.º', r.gesta + (r.perdidas === 'si' ? ` · ${r.perdidas_n ? r.perdidas_n + ' pérdida(s)' : 'con pérdidas previas'}` : '')]);
    if (r.familia_ant && !tiene(r, 'familia_ant', 'ninguno')) datos.push(['En la familia', etiqueta('familia_ant', r.familia_ant) + (r.familia_txt ? ` (${r.familia_txt})` : '')]);
    if (r.perdidas === 'si') enc.push('Tuvo pérdidas de embarazo: tenerlo presente con delicadeza.');
    const fp = [];
    const f = (c, t) => { if (c) fp.push(t); };
    f(tiene(r, 'emb_compl', 'dg') || tiene(r, 'salud_diag', 'diabetes'), 'diabetes');
    f(tiene(r, 'salud_diag', 'obesidad'), 'sobrepeso u obesidad');
    f(tiene(r, 'salud_diag', 'sop'), 'SOP');
    f(tiene(r, 'salud_diag', 'tiroides') || tiene(r, 'emb_compl', 'tiroides'), 'tiroides');
    f(tiene(r, 'emb_compl', 'hta'), 'hipertensión o preeclampsia');
    f(tiene(r, 'cirugia_mamaria', 'reduccion'), 'reducción mamaria');
    f(tiene(r, 'cirugia_mamaria', 'aumento'), 'implantes mamarios');
    f(r.pechos_cambios === 'no' || r.pechos_cambios === 'pocos', 'pocos cambios en los pechos');
    f(r.fertilidad === 'si', 'tratamiento de fertilidad');
    f(tiene(r, 'salud_diag', 'bariatrica'), 'cirugía bariátrica');
    f(tiene(r, 'emb_compl', 'app'), 'amenaza de parto prematuro');
    if (fp.length) hip.push({ titulo: 'Factores a considerar para la producción', porque: fp.join(', ') + '. Hablar de calostro prenatal (si su equipo lo indica) y de un plan para los primeros días.' });
    if (r.lact_previa === 'dificil' || r.lact_previa === 'no_pude') hip.push({ titulo: 'Lactancia anterior difícil', porque: r.lact_previa_txt || etiqueta('lact_previa', r.lact_previa) });
    if (r.pezon_forma === 'planos' || r.pezon_forma === 'invertidos') hip.push({ titulo: 'Pezones planos o invertidos', porque: 'trabajar agarre profundo y posturas desde el primer día' });
    if (r.whooley1 === 'si' || r.whooley2 === 'si') alarmas.push({ nivel: 'alta', txt: 'Tamizaje de ánimo positivo (preguntas de Whooley): explorar y ofrecer acompañamiento de salud mental perinatal.' });
    if (r.apoyo === 'poco') alarmas.push({ nivel: 'media', txt: 'Poco o nada de apoyo en casa: armar red para el puerperio.' });
    if (tiene(r, 'salud_diag', 'animo')) alarmas.push({ nivel: 'media', txt: 'Antecedente de depresión o ansiedad: más riesgo en el puerperio.' });
    mirar.push('Pechos y pezones (forma, protractilidad, cicatrices).', 'Plan de nacimiento: piel con piel, primera hora, alojamiento conjunto.',
      'Señales de hambre, frecuencia esperada, pañales de los primeros días.', 'Qué llevar y a quién llamar si algo no va bien.');
    if (r.trabajo === 'pronto' || r.trabajo === 'despues') mirar.push('Vuelta al trabajo: extracción y conservación.');
    if (r.miedos) enc.push(`Su miedo, con sus palabras: «${r.miedos.trim()}».`);
    enc.push('Validar la decisión que tomen sobre la alimentación, sea cual sea.');
    let prioridad = alarmas.some(a => a.nivel === 'alta') ? 'Alta' : (alarmas.length || hip.length >= 2) ? 'Media' : 'Baja';
    const nombre = 'Embarazo' + (sem ? ` de ${sem} semanas` : '');
    const treinta = `${nombre}${fpp ? `, FPP ${fmtFecha(fpp)}` : ''}.${ventana ? ` Encuentro prenatal ideal ${ventana}.` : ''} ${hip.length ? 'A considerar: ' + hip.map(h => h.titulo.toLowerCase()).join('; ') + '.' : 'Sin factores de riesgo marcados.'}`;
    return { prenatal: true, prioridad, edadDias: null, nombre, datos, alarmas, hipotesis: hip, mirar, encarar: enc, fotos: [], factoresProd: fp, treinta, mensajeFotos: '', quien: r.quien_nombre || '', whatsapp: r.whatsapp || '' };
  }

  // ---------- Presentación ----------
  const COLOR = { Alta: '#C0504D', Media: '#C9893A', Baja: '#5E8F6E' };

  function aHTML(res, r) {
    const li = arr => arr.map(x => `<li>${esc(x)}</li>`).join('');
    let h = '';
    h += `<div style="background:${COLOR[res.prioridad]}15;border-left:5px solid ${COLOR[res.prioridad]};border-radius:12px;padding:12px 14px;margin:0 0 14px">`;
    h += `<div style="font-weight:700;color:${COLOR[res.prioridad]};margin-bottom:4px">⚡ En 30 segundos · Prioridad ${esc(res.prioridad)}</div>${esc(res.treinta)}</div>`;
    if (res.alarmas.length) {
      h += `<h3 style="margin:16px 0 6px">🚩 Signos de alarma</h3><ul style="margin:0;padding-left:20px">`;
      res.alarmas.forEach(a => { h += `<li style="margin:3px 0">${a.nivel === 'alta' ? '<b style="color:#C0504D">URGENTE</b> · ' : ''}${esc(a.txt)}</li>`; });
      h += '</ul>';
    } else h += `<p>🚩 Sin signos de alarma en lo que contó la familia.</p>`;
    if (res.hipotesis.length) {
      h += `<h3 style="margin:16px 0 6px">🧠 Qué priorizar (hipótesis)</h3><ol style="margin:0;padding-left:20px">`;
      res.hipotesis.forEach(x => { h += `<li style="margin:4px 0"><b>${esc(x.titulo)}:</b> ${esc(x.porque)}</li>`; });
      h += '</ol>';
    }
    h += `<h3 style="margin:16px 0 6px">👀 Qué mirar en la evaluación</h3><ul style="margin:0;padding-left:20px">${li(res.mirar)}</ul>`;
    h += `<h3 style="margin:16px 0 6px">💛 Cómo encararle</h3><ul style="margin:0;padding-left:20px">${li(res.encarar)}</ul>`;
    if (res.datos.length) {
      h += `<h3 style="margin:16px 0 6px">📋 Datos clave</h3><table style="border-collapse:collapse;width:100%">`;
      res.datos.forEach(([k, v]) => { h += `<tr><td style="padding:4px 8px 4px 0;color:#878787;vertical-align:top;white-space:nowrap">${esc(k)}</td><td style="padding:4px 0">${esc(v)}</td></tr>`; });
      h += '</table>';
    }
    if (r) {
      const q = [['Lo que le preocupa', r.motivo_txt], ['Lo que ya le dijeron', r.que_dijeron], ['Lo que espera', r.espera]].filter(x => x[1]);
      if (q.length) {
        h += `<h3 style="margin:16px 0 6px">🗣️ Con sus palabras</h3>`;
        q.forEach(([k, v]) => { h += `<p style="margin:6px 0"><span style="color:#878787">${esc(k)}:</span> «${esc(v)}»</p>`; });
      }
    }
    if (res.mensajeFotos) {
      h += `<h3 style="margin:16px 0 6px">📷 Fotos a pedir · mensaje listo para WhatsApp</h3><div style="background:#F7F3EF;border-radius:12px;padding:10px 12px;white-space:pre-wrap">${esc(res.mensajeFotos)}</div>`;
    }
    return h;
  }

  function aTexto(res) {
    const L = [];
    L.push(`⚡ ${res.treinta}`);
    if (res.alarmas.length) { L.push('', '🚩 SIGNOS DE ALARMA'); res.alarmas.forEach(a => L.push(`- ${a.nivel === 'alta' ? 'URGENTE · ' : ''}${a.txt}`)); }
    if (res.hipotesis.length) { L.push('', '🧠 QUÉ PRIORIZAR'); res.hipotesis.forEach((x, i) => L.push(`${i + 1}. ${x.titulo}: ${x.porque}`)); }
    L.push('', '👀 QUÉ MIRAR'); res.mirar.forEach(x => L.push(`- ${x}`));
    L.push('', '💛 CÓMO ENCARARLE'); res.encarar.forEach(x => L.push(`- ${x}`));
    if (res.mensajeFotos) L.push('', '📷 MENSAJE PARA PEDIR FOTOS', res.mensajeFotos);
    return L.join('\n');
  }

  global.ANALISIS = { analizar, aHTML, aTexto, etiqueta, edadTexto, fmtFecha, esc, pesosOrdenados };
})(typeof window !== 'undefined' ? window : globalThis);
