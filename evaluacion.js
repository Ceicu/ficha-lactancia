/* Evaluación clínica (pestaña de Ceci): tests con puntaje automático y protocolo de fotos. */
(function (global) {
  const o = (v, t, p) => ({ v, t, p });
  const p012 = (a, b, c) => [o('0', a, 0), o('1', b, 1), o('2', c, 2)];

  const TESTS = [
    {
      id: 'datos', titulo: 'Datos de la consulta', emo: '📅', items: [
        { id: 'fecha', tipo: 'fecha', t: 'Fecha' },
        { id: 'modalidad', tipo: 'una', t: 'Modalidad', opciones: [o('consultorio', 'Consultorio'), o('domicilio', 'Domicilio'), o('online', 'Online')] },
        { id: 'peso_hoy', tipo: 'numero', t: 'Peso de hoy', unidad: 'g' },
        { id: 'pre', tipo: 'numero', t: 'Pesada antes de la toma', unidad: 'g' },
        { id: 'post', tipo: 'numero', t: 'Pesada después de la toma', unidad: 'g' },
        { id: 'notas', tipo: 'texto', t: 'Notas' },
      ]
    },
    {
      id: 'obs', titulo: 'Observación de la toma (OMS/UNICEF)', emo: '👀', ayuda: 'Marcá lo que SÍ observaste.', items: [
        { id: 'postura', tipo: 'checks', t: 'Postura', opciones: [o('alineado', 'Cabeza y cuerpo alineados'), o('pegado', 'Pegado al cuerpo, panza con panza'), o('sostenido', 'Todo el cuerpo sostenido'), o('nariz', 'Llega con la nariz frente al pezón'), o('relajada', 'Quien amamanta, cómoda y relajada')] },
        { id: 'agarre', tipo: 'checks', t: 'Agarre', opciones: [o('boca', 'Boca bien abierta'), o('labio', 'Labio inferior evertido'), o('menton', 'Mentón toca el pecho'), o('areola', 'Más areola visible arriba que abajo')] },
        { id: 'succion', tipo: 'checks', t: 'Succión y deglución', opciones: [o('lentas', 'Succiones lentas y profundas, con pausas'), o('mejillas', 'Mejillas redondeadas'), o('deglucion', 'Deglución audible'), o('suelta', 'Suelta solo al terminar')] },
        { id: 'pecho', tipo: 'checks', t: 'Pecho', opciones: [o('sano', 'Pecho y piel sanos'), o('sin_dolor', 'Sin dolor durante la toma'), o('dedos', 'Dedos lejos del pezón'), o('redondo', 'Pezón redondeado al soltar'), o('blando', 'Pecho más blando después')] },
        { id: 'notas', tipo: 'texto', t: 'Notas de la toma' },
      ]
    },
    {
      id: 'latch', titulo: 'LATCH', emo: '🤱', puntaje: true, max: 10,
      interpreta: s => s >= 9 ? 'Buena técnica' : s >= 7 ? 'Aceptable, con aspectos a mejorar' : 'Necesita apoyo en la técnica',
      items: [
        { id: 'L', tipo: 'puntos', t: 'L · Agarre', opciones: p012('Muy somnoliento o no se prende', 'Intentos repetidos, hay que estimular', 'Se prende, lengua abajo, labios evertidos, succión rítmica') },
        { id: 'A', tipo: 'puntos', t: 'A · Deglución audible', opciones: p012('Ninguna', 'Poca, con estimulación', 'Espontánea y frecuente') },
        { id: 'T', tipo: 'puntos', t: 'T · Tipo de pezón', opciones: p012('Invertido', 'Plano', 'Evertido (tras estimulación)') },
        { id: 'C', tipo: 'puntos', t: 'C · Comodidad (pecho y pezón)', opciones: p012('Ingurgitado, grietas con sangrado, dolor intenso', 'Lleno, enrojecido, grietas pequeñas, dolor leve a moderado', 'Blando, sin dolor') },
        { id: 'H', tipo: 'puntos', t: 'H · Ayuda para posicionar', opciones: p012('Ayuda total', 'Ayuda mínima; se enseña un lado', 'Sin ayuda') },
      ]
    },
    {
      id: 'bbat', titulo: 'BBAT · Bristol Breastfeeding Assessment Tool', emo: '🍼', puntaje: true, max: 8,
      interpreta: s => s >= 7 ? 'Técnica eficaz' : s >= 5 ? 'Algunos aspectos a mejorar' : 'Técnica poco eficaz: priorizar apoyo',
      items: [
        { id: 'posicion', tipo: 'puntos', t: 'Posición', opciones: p012('Pocos o ningún elemento: hay que explicar la posición', 'Algunos elementos: necesita algún consejo', 'Todos los elementos: no necesita consejo') },
        { id: 'agarre', tipo: 'puntos', t: 'Agarre', opciones: p012('No se prende o agarre pobre: hay que explicar', 'Algunos elementos: necesita algún consejo', 'Agarre profundo que se mantiene toda la toma') },
        { id: 'succion', tipo: 'puntos', t: 'Succión', opciones: p012('Ineficaz, sin patrón coherente', 'Algo eficaz, patrón no satisfactorio; se suelta y se prende', 'Patrón eficaz en los dos pechos y termina la toma') },
        { id: 'deglucion', tipo: 'puntos', t: 'Deglución', opciones: p012('No se oye deglución o hay chasquidos', 'Ocasional, o ruidosa / con chasquidos', 'Audible, regular y tranquila') },
      ]
    },
    {
      id: 'btat', titulo: 'BTAT · Bristol Tongue Assessment Tool', emo: '👅', puntaje: true, max: 8,
      interpreta: s => s >= 6 ? 'Función lingual dentro de lo esperado (6–8)' : s >= 4 ? 'Reducción moderada de la función lingual (4–5)' : 'Reducción importante de la función lingual (0–3)',
      items: [
        { id: 'punta', tipo: 'puntos', t: 'Aspecto de la punta', opciones: p012('Forma de corazón', 'Leve hendidura o muesca', 'Redondeada') },
        { id: 'fijacion', tipo: 'puntos', t: 'Inserción del frenillo en la encía inferior', opciones: p012('En el borde de la encía', 'En la cara interna de la encía', 'En el piso de la boca') },
        { id: 'elevacion', tipo: 'puntos', t: 'Elevación con la boca bien abierta (llanto)', opciones: p012('Elevación mínima', 'Solo los bordes, hasta media boca', 'Elevación completa hasta media boca') },
        { id: 'protrusion', tipo: 'puntos', t: 'Protrusión', opciones: p012('La punta queda detrás de la encía', 'La punta llega sobre la encía', 'La punta sale sobre el labio inferior') },
      ]
    },
    {
      id: 'martinelli', titulo: 'Protocolo de frenillo lingual (Martinelli)', emo: '🔎', martinelli: true,
      ayuda: 'Historia clínica (máx. 8), anatomofuncional ítems 1–4 (máx. 12) y succión (máx. 5).',
      items: [
        { id: 'h_fam', grupo: 'historia', tipo: 'puntos', t: 'Antecedentes familiares de frenillo', opciones: [o('0', 'No', 0), o('1', 'Sí', 1)] },
        { id: 'h_intervalo', grupo: 'historia', tipo: 'puntos', t: 'Tiempo entre tomas', opciones: [o('0', '2 h o más', 0), o('2', '1 h o menos', 2)] },
        { id: 'h_cansancio', grupo: 'historia', tipo: 'puntos', t: 'Cansancio al mamar', opciones: [o('0', 'No', 0), o('1', 'Sí', 1)] },
        { id: 'h_duerme', grupo: 'historia', tipo: 'puntos', t: 'Mama un poco y se duerme', opciones: [o('0', 'No', 0), o('1', 'Sí', 1)] },
        { id: 'h_suelta', grupo: 'historia', tipo: 'puntos', t: 'Va soltando el pezón', opciones: [o('0', 'No', 0), o('1', 'Sí', 1)] },
        { id: 'h_muerde', grupo: 'historia', tipo: 'puntos', t: 'Muerde el pezón', opciones: [o('0', 'No', 0), o('2', 'Sí', 2)] },
        { id: 'a1', grupo: 'anato', tipo: 'puntos', t: '1. Postura de labios en reposo', opciones: [o('0', 'Cerrados', 0), o('1a', 'Entreabiertos', 1), o('1b', 'Abiertos', 1)] },
        { id: 'a2', grupo: 'anato', tipo: 'puntos', t: '2. Tendencia de la lengua durante el llanto', opciones: [o('0a', 'En la línea media', 0), o('0b', 'Elevada', 0), o('2a', 'Línea media con bordes elevados', 2), o('2b', 'Baja', 2)] },
        { id: 'a3', grupo: 'anato', tipo: 'puntos', t: '3. Forma de la punta al elevarla (llanto)', opciones: [o('0', 'Redondeada', 0), o('2', 'Ligera hendidura en el ápice', 2), o('3', 'Forma de corazón', 3)] },
        { id: 'a4', grupo: 'info', tipo: 'una', t: '4. Frenillo', opciones: [o('visible', 'Se visualiza'), o('maniobra', 'Visible con maniobra'), o('no', 'No se visualiza (pasar a succión)')] },
        { id: 'a41', grupo: 'frenillo', tipo: 'puntos', t: '4.1 Espesor', opciones: [o('0', 'Delgado', 0), o('2', 'Grueso', 2)] },
        { id: 'a42', grupo: 'frenillo', tipo: 'puntos', t: '4.2 Fijación en la cara inferior de la lengua', opciones: [o('0', 'Tercio medio', 0), o('2', 'Entre tercio medio y ápice', 2), o('3', 'En el ápice', 3)] },
        { id: 'a43', grupo: 'frenillo', tipo: 'puntos', t: '4.3 Fijación en el piso de la boca', opciones: [o('0', 'Visible desde las carúnculas sublinguales', 0), o('1', 'Visible desde la cresta alveolar inferior', 1)] },
        { id: 's1', grupo: 'succion', tipo: 'puntos', t: 'Succión no nutritiva: movimiento de lengua', opciones: [o('0', 'Adecuado', 0), o('1', 'Inadecuado', 1)] },
        { id: 's21', grupo: 'succion', tipo: 'puntos', t: 'Succión nutritiva: ritmo', opciones: [o('0', 'Varias succiones seguidas, pausas cortas', 0), o('1', 'Pocas succiones, pausas largas', 1)] },
        { id: 's22', grupo: 'succion', tipo: 'puntos', t: 'Coordinación succión-deglución-respiración', opciones: [o('0', 'Adecuada', 0), o('1', 'Inadecuada (tos, atragantos, hipo, ruidos)', 1)] },
        { id: 's23', grupo: 'succion', tipo: 'puntos', t: 'Muerde el pezón', opciones: [o('0', 'No', 0), o('1', 'Sí', 1)] },
        { id: 's24', grupo: 'succion', tipo: 'puntos', t: 'Chasquidos durante la succión', opciones: [o('0', 'No', 0), o('1', 'Sí', 1)] },
        { id: 'notas', tipo: 'texto', t: 'Notas del frenillo' },
      ]
    },
    {
      id: 'mof', titulo: 'Motricidad orofacial', emo: '👄', items: [
        { id: 'busqueda', tipo: 'una', t: 'Reflejo de búsqueda', opciones: REF() },
        { id: 'succion_ref', tipo: 'una', t: 'Reflejo de succión', opciones: REF() },
        { id: 'mordida', tipo: 'una', t: 'Reflejo de mordida fásica', opciones: REF() },
        { id: 'nausea', tipo: 'una', t: 'Reflejo nauseoso', opciones: [o('normal', 'Normal'), o('anteriorizado', 'Anteriorizado'), o('posteriorizado', 'Posteriorizado'), o('ausente', 'Ausente')] },
        { id: 'snn', tipo: 'checks', t: 'Succión no nutritiva (dedo enguantado)', opciones: [o('ritmica', 'Rítmica'), o('fuerza', 'Buena fuerza / presión'), o('acanala', 'Lengua acanalada'), o('anterior', 'Lengua por delante de la encía'), o('ondulatorio', 'Movimiento ondulatorio anteroposterior'), o('sellado', 'Buen sellado labial')] },
        { id: 'labios', tipo: 'una', t: 'Labios', opciones: [o('normales', 'Normales'), o('retraido', 'Superior retraído'), o('hipotonico', 'Hipotónicos'), o('tensos', 'Tensos')] },
        { id: 'kotlow', tipo: 'una', t: 'Frenillo labial superior (Kotlow)', opciones: [o('1', 'Clase I'), o('2', 'Clase II'), o('3', 'Clase III'), o('4', 'Clase IV')] },
        { id: 'paladar', tipo: 'una', t: 'Paladar', opciones: [o('normal', 'Normal'), o('alto', 'Alto u ojival'), o('estrecho', 'Estrecho'), o('fisura', 'Fisura (incluye submucosa)')] },
        { id: 'mandibula', tipo: 'una', t: 'Mandíbula', opciones: [o('normal', 'Normal'), o('retro', 'Retrognatia'), o('asimetria', 'Asimetría')] },
        { id: 'tono', tipo: 'una', t: 'Tono global', opciones: [o('normal', 'Normal'), o('hipo', 'Hipotonía'), o('hiper', 'Hipertonía'), o('fluctuante', 'Fluctuante')] },
        { id: 'lengua_reposo', tipo: 'una', t: 'Lengua en reposo', opciones: [o('paladar', 'Contra el paladar'), o('piso', 'En el piso de la boca'), o('interpuesta', 'Interpuesta entre encías')] },
        { id: 'respiracion', tipo: 'una', t: 'Respiración', opciones: [o('nasal', 'Nasal'), o('oral', 'Oral'), o('mixta', 'Mixta')] },
        { id: 'cuello', tipo: 'una', t: 'Cuello y postura', opciones: [o('simetrico', 'Simétrico, rota bien a ambos lados'), o('preferencia', 'Preferencia de lado'), o('limitacion', 'Limitación de rotación o inclinación')] },
        { id: 'notas', tipo: 'texto', t: 'Notas de motricidad orofacial' },
      ]
    },
    {
      id: 'pechos', titulo: 'Pecho y pezón', emo: '🌸', items: [
        { id: 'pezon_d', tipo: 'una', t: 'Pezón derecho', opciones: PEZON() },
        { id: 'pezon_i', tipo: 'una', t: 'Pezón izquierdo', opciones: PEZON() },
        { id: 'piel', tipo: 'checks', t: 'Piel del pezón', opciones: [o('sana', 'Sana'), o('grieta', 'Grieta'), o('ampolla', 'Ampolla'), o('sangrado', 'Sangrado'), o('blanqueo', 'Blanqueo (vasoespasmo)')] },
        { id: 'al_soltar', tipo: 'una', t: 'Pezón al soltar', opciones: [o('redondo', 'Redondo'), o('aplastado', 'Aplastado'), o('labial', 'En forma de lápiz labial'), o('blanqueado', 'Blanqueado')] },
        { id: 'mama', tipo: 'una', t: 'Pecho', opciones: [o('blando', 'Blando'), o('lleno', 'Lleno'), o('ingurgitado', 'Ingurgitado'), o('obstruccion', 'Zona dura o inflamada'), o('mastitis', 'Signos de mastitis')] },
        { id: 'notas', tipo: 'texto', t: 'Notas' },
      ]
    },
    {
      id: 'mamadera', titulo: 'Mamadera observada', emo: '🍼', items: [
        { id: 'postura', tipo: 'una', t: 'Postura', opciones: [o('vertical', 'Más vertical'), o('horizontal', 'Más horizontal')] },
        { id: 'ritmo', tipo: 'una', t: 'Ritmo', opciones: [o('pausado', 'Con pausas'), o('corrido', 'De corrido')] },
        { id: 'signos', tipo: 'checks', t: 'Se observa', opciones: [o('pierde', 'Pierde leche por las comisuras'), o('tos', 'Tos o atragantos'), o('estres', 'Signos de estrés (cejas, dedos, se aparta)'), o('chasquidos', 'Chasquidos'), o('sellado', 'Buen sellado labial')] },
        { id: 'tiempo', tipo: 'numero', t: 'Tiempo de la toma', unidad: 'min' },
        { id: 'notas', tipo: 'texto', t: 'Notas' },
      ]
    },
    {
      id: 'cierre', titulo: 'Conclusión y plan', emo: '📝', items: [
        { id: 'impresion', tipo: 'texto', t: 'Impresión / hipótesis' },
        { id: 'indicaciones', tipo: 'checks', t: 'Indicaciones', opciones: [
          o('demanda', 'Ofrecer el pecho a demanda, entre 8 y 12 veces en 24 horas.'),
          o('ambos', 'Ofrecer los dos pechos en cada toma.'),
          o('despertar', 'De día, si pasan más de 3 horas, despertarle con suavidad para comer.'),
          o('compresiones', 'Hacer compresiones del pecho cuando la succión se enlentece.'),
          o('reclinada', 'Probar la posición semirreclinada (crianza biológica).'),
          o('asimetrico', 'Agarre asimétrico: nariz frente al pezón y esperar la boca bien abierta.'),
          o('suplemento', 'Complementar después de la toma con la cantidad acordada.'),
          o('pausada', 'Mamadera a ritmo: más vertical y con pausas, para que conviva mejor con el pecho.'),
          o('extraccion', 'Extraerse leche después de algunas tomas para sostener la producción.'),
          o('mano', 'Practicar la extracción a mano.'),
          o('pezon', 'Cuidar el pezón: aire, leche materna y evitar roces.'),
          o('ejercicios', 'Hacer los ejercicios de motricidad oral que practicamos.'),
          o('control_peso', 'Control de peso en pocos días.'),
        ] },
        { id: 'indicaciones_txt', tipo: 'texto', t: 'Otras indicaciones o detalles (cantidades, horarios)' },
        { id: 'derivaciones', tipo: 'checks', t: 'Derivaciones o interconsultas', opciones: [
          o('pediatra', 'Pediatra'), o('frenotomia', 'Odontopediatra o cirujano/a para evaluar frenotomía'), o('kinesio', 'Kinesiología (cuello y postura)'),
          o('orl', 'Otorrinolaringología'), o('salud_mental', 'Psicología o psiquiatría perinatal'), o('medico_lact', 'Médico/a de lactancia o ginecología'), o('osteo', 'Terapia manual')] },
        { id: 'proximo', tipo: 'corta', t: 'Próximo control' },
      ]
    },
  ];
  function REF() { return [o('presente', 'Presente'), o('debil', 'Débil'), o('ausente', 'Ausente'), o('exacerbado', 'Exacerbado')]; }
  function PEZON() { return [o('evertido', 'Evertido'), o('plano', 'Plano'), o('invertido', 'Invertido'), o('pseudo', 'Pseudoinvertido')]; }

  function puntos(test, ev) {
    const e = ev[test.id] || {};
    let s = 0, n = 0;
    test.items.filter(i => i.tipo === 'puntos').forEach(i => {
      const op = i.opciones.find(x => x.v === e[i.id]);
      if (op) { s += op.p; n++; }
    });
    return { s, n, total: test.items.filter(i => i.tipo === 'puntos').length };
  }

  function martinelli(ev) {
    const t = TESTS.find(x => x.id === 'martinelli');
    const e = ev.martinelli || {};
    const suma = g => {
      let s = 0, n = 0;
      t.items.filter(i => i.grupo === g).forEach(i => { const op = i.opciones.find(x => x.v === e[i.id]); if (op) { s += op.p; n++; } });
      return { s, n };
    };
    const h = suma('historia'), a = suma('anato'), f = suma('frenillo'), su = suma('succion');
    const anat = a.s + (e.a4 === 'no' ? 0 : f.s);
    const examen = anat + su.s;
    const lineas = [];
    if (h.n) lineas.push(`Historia clínica: ${h.s}/8 ${h.s >= 4 ? '→ sugiere interferencia' : ''}`);
    if (a.n) lineas.push(`Ítems 1–3: ${a.s}/6 ${a.s >= 4 ? '→ alterado' : ''}`);
    if (f.n && e.a4 !== 'no') lineas.push(`Ítem 4 (frenillo): ${f.s}/6 ${f.s >= 3 ? '→ alterado' : ''}`);
    if (a.n || f.n) lineas.push(`Anatomofuncional (1–4): ${anat}/12 ${anat >= 7 ? '→ interferencia del frenillo (≥7)' : ''}`);
    if (su.n) lineas.push(`Succión: ${su.s}/5 ${su.s >= 2 ? '→ alterada (≥2)' : ''}`);
    if ((a.n || f.n) && su.n) lineas.push(`Examen clínico: ${examen}/17 ${examen >= 9 ? '→ interferencia (≥9)' : ''}`);
    if (h.n && (a.n || f.n) && su.n) lineas.push(`Total: ${h.s + examen}/25 ${h.s + examen >= 13 ? '→ interferencia (≥13)' : ''}`);
    return { historia: h.s, anat, succion: su.s, examen, total: h.s + examen, lineas, interfiere: anat >= 7 || examen >= 9 || (h.n && h.s + examen >= 13) };
  }

  // Sugerencias para la historia de Martinelli a partir de la ficha
  function prefillMartinelli(r) {
    const t = (id, v) => Array.isArray(r[id]) ? r[id].includes(v) : r[id] === v;
    const sug = {};
    if (r.familia_ant && r.familia_ant.length) sug.h_fam = t('familia_ant', 'frenillo') ? '1' : '0';
    if (r.tomas_dia === 'm12') sug.h_intervalo = '2';
    else if (['6_7', 'm6', '8_12'].includes(r.tomas_dia)) sug.h_intervalo = '0';
    sug.h_cansancio = t('toma_nota', 'cansa') ? '1' : (r.toma_nota ? '0' : undefined);
    sug.h_duerme = t('toma_nota', 'duerme') ? '1' : (r.toma_nota ? '0' : undefined);
    sug.h_suelta = t('toma_nota', 'suelta') ? '1' : (r.toma_nota ? '0' : undefined);
    sug.h_muerde = t('toma_nota', 'muerde') ? '2' : (r.toma_nota ? '0' : undefined);
    Object.keys(sug).forEach(k => sug[k] === undefined && delete sug[k]);
    return sug;
  }

  // Protocolo de fotos estandarizadas
  const FOTOS = {
    general: [
      'Luz natural de frente (mirando a una ventana), sin flash y sin contraluz.',
      'Fondo liso y claro: una sábana o toalla blanca sirve.',
      'Celular a la altura de la boca del bebé, derecho (sin inclinar), a unos 30–40 cm. Sin zoom: acercate vos.',
      'Siempre la misma distancia y el mismo encuadre en cada control, para poder comparar.',
      'Bebé tranquilo/a, sin chupete, con la cara limpia. Guantes para las maniobras intraorales.',
      'Varias tomas seguidas (ráfaga) y elegís la mejor.',
    ],
    tomas: [
      { id: 'frente_reposo', t: 'Rostro de frente en reposo', como: 'Boca arriba, cabeza en la línea media. Encuadre de la frente al mentón. Se ve postura de labios en reposo y simetría facial.' },
      { id: 'perfil_der', t: 'Perfil derecho en reposo', como: 'Celular a 90°, a la altura de la oreja. Encuadre de la frente al cuello. Se ve relación maxilomandibular y postura de labios.' },
      { id: 'perfil_izq', t: 'Perfil izquierdo en reposo', como: 'Igual que el derecho, del otro lado.' },
      { id: 'llanto', t: 'Boca abierta en llanto', como: 'De frente, ligeramente desde abajo. Esperá el llanto con la boca bien abierta. Se ve posición de la lengua, forma de la punta y elevación (BTAT ítem 3, Martinelli ítems 2 y 3).' },
      { id: 'maniobra', t: 'Frenillo lingual con maniobra de elevación', como: 'Índices enguantados en los márgenes inferiores laterales de la lengua, elevar y llevar hacia atrás. Luz de linterna de otro celular desde arriba. Se ven espesor y fijaciones (Martinelli 4.1–4.3).' },
      { id: 'protrusion', t: 'Protrusión de lengua', como: 'De frente cuando saca la lengua (podés estimular tocando el labio inferior). Se ve hasta dónde llega (BTAT ítem 4).' },
      { id: 'labial', t: 'Frenillo labial superior', como: 'Levantar suavemente el labio superior hacia la nariz. De frente, bien cerca. Clasificación de Kotlow.' },
      { id: 'paladar', t: 'Paladar', como: 'Boca abierta en llanto, celular por debajo apuntando hacia arriba, con linterna. Se ve forma y altura del paladar.' },
      { id: 'agarre_perfil', t: 'Agarre de perfil (lado del bebé)', como: 'Celular a la altura de la boca del bebé, del lado de la cara que no toca el pecho. Se ven ángulo de apertura, labios evertidos, mentón y mejillas.' },
      { id: 'agarre_arriba', t: 'Agarre desde arriba', como: 'Desde el punto de vista de quien amamanta. Se ven alineación cabeza-cuerpo y cuánta areola queda visible.' },
      { id: 'pezon_frente', t: 'Pezón al soltar, de frente', como: 'Apenas suelta el pecho, antes de que recupere la forma. Se ve la forma (redondo, aplastado o lápiz labial) y la piel.' },
      { id: 'pezon_perfil', t: 'Pezón al soltar, de perfil', como: 'Inmediatamente después del de frente. Se ve compresión o deformación.' },
      { id: 'postura', t: 'Postura global desde arriba', como: 'Boca arriba sobre superficie plana, celular paralelo al cuerpo, de cuerpo entero. Se ven asimetrías y preferencia de lado (tortícolis).' },
      { id: 'video_toma', t: 'Video de la toma (30 s)', como: 'Perfil, desde el inicio del agarre. Se ven ritmo de succión, pausas y deglución.', video: true },
    ]
  };

  global.EVAL = { TESTS, puntos, martinelli, prefillMartinelli, FOTOS };
})(window);
