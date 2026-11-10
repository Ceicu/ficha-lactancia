/* Preguntas de la ficha de lactancia.
   Para editar una pregunta: cambiá el texto entre comillas. No cambies los "id".
   Tipos: corta, texto, numero, fecha, tel, una (una opción), varias (varias opciones),
          escala (0 a 10), pesos (tabla de pesos), fotos, audio, consentimiento. */
(function (global) {
  const o = (v, t, extra) => Object.assign({ v, t }, extra || {});
  const SI_NO = [o('si', 'Sí'), o('no', 'No')];
  const SI_NO_NS = [o('si', 'Sí'), o('no', 'No'), o('no_se', 'No sé')];
  const nacio = r => r.nacio === 'si';
  const prenatal = r => r.nacio === 'no';
  const tiene = (r, id, v) => Array.isArray(r[id]) ? r[id].includes(v) : r[id] === v;
  const usaPecho = r => nacio(r) && tiene(r, 'alim', 'pecho');
  const otraLeche = r => nacio(r) && (tiene(r, 'alim', 'formula') || tiene(r, 'alim', 'extraida'));

  const SECCIONES = [
    {
      id: 'ustedes', emo: '🤍', titulo: 'Sobre ustedes',
      intro: 'Empecemos por lo básico.',
      preguntas: [
        { id: 'quien_nombre', tipo: 'corta', t: 'Tu nombre', req: true },
        { id: 'quien_vinculo', tipo: 'una', t: '¿Quién completa la ficha?', opciones: [
          o('amamanta', 'Quien amamanta o va a amamantar'),
          o('familia', 'Pareja o familia de quien amamanta'),
          o('otra', 'Otra persona')] },
        { id: 'whatsapp', tipo: 'tel', t: 'Tu WhatsApp', req: true, ayuda: 'Para coordinar y mandarte la devolución.' },
        { id: 'zona', tipo: 'corta', t: 'Ciudad y barrio', ayuda: 'Me sirve si la consulta es a domicilio.' },
        { id: 'modalidad', tipo: 'una', t: '¿Dónde te gustaría la consulta?', opciones: [
          o('consultorio', 'En consultorio'), o('domicilio', 'A domicilio'), o('online', 'Online'), o('no_se', 'Lo que me recomiendes')] },
        { id: 'como_llego', tipo: 'una', t: '¿Cómo llegaste a mí?', opciones: [
          o('instagram', 'Instagram'), o('recomendacion', 'Me recomendó alguien'), o('profesional', 'Me derivó un/a profesional'), o('otro', 'Otro')] },
        { id: 'factura', tipo: 'una', t: '¿Necesitás factura?', opciones: SI_NO, chips: 'siono' },
        { id: 'factura_nombre', tipo: 'corta', t: 'A nombre de quién (nombre o razón social)', req: true, si: r => r.factura === 'si' },
        { id: 'factura_ruc', tipo: 'corta', t: 'RUC', req: true, si: r => r.factura === 'si', ayuda: 'Por ejemplo: 1234567-8' },
        { id: 'factura_mail', tipo: 'corta', t: 'Mail para enviarte la factura', req: true, si: r => r.factura === 'si' },
        { id: 'nacio', tipo: 'una', t: '¿Tu bebé ya nació?', req: true, opciones: [
          o('si', 'Sí, ya nació'), o('no', 'Todavía no, estamos en el embarazo')] },
        { id: 'bebe_nombre', tipo: 'corta', t: 'Nombre del bebé', req: true, si: nacio },
        { id: 'bebe_nac', tipo: 'fecha', t: 'Fecha de nacimiento', req: true, si: nacio },
      ]
    },
    {
      id: 'motivo', emo: '💬', titulo: 'Motivo de consulta',
      intro: 'Contame qué te trae. Si preferís, tocá el 🎤 y respondeme por audio.',
      preguntas: [
        { id: 'motivo_chips', tipo: 'varias', t: '¿Qué te preocupa?', ayuda: 'Podés elegir más de una.', si: nacio, opciones: [
          o('dolor', 'Dolor o grietas'), o('agarre', 'El agarre'), o('peso', 'Sube poco de peso'),
          o('produccion', 'Siento que tengo poca leche'), o('exceso', 'Tengo demasiada leche'),
          o('tomas', 'Tomas muy largas o muy seguidas'), o('llanto', 'Llora mucho, gases o cólicos'),
          o('mamadera_pecho', 'Pasar de mamadera a pecho'), o('extraccion', 'Extracción o vuelta al trabajo'),
          o('frenillo', 'Frenillo'), o('destete', 'Destete'), o('otro', 'Otra cosa')] },
        { id: 'motivo_txt', tipo: 'texto', t: 'Contame con tus palabras qué te preocupa', req: true },
        { id: 'desde', tipo: 'una', t: '¿Desde cuándo?', si: nacio, opciones: [
          o('nacimiento', 'Desde que nació'), o('dias', 'Hace unos días'), o('semanas', 'Hace semanas'), o('meses', 'Hace meses')] },
        { id: 'que_dijeron', tipo: 'texto', t: '¿Qué te dijeron hasta ahora y quién?', ayuda: 'Pediatra, sanatorio, otra asesora, familia…' },
        { id: 'que_probaste', tipo: 'texto', t: '¿Qué probaste hasta ahora?', si: nacio },
        { id: 'espera', tipo: 'texto', t: '¿Qué te gustaría lograr con la asesoría?' },
      ]
    },
    {
      id: 'emb_actual', emo: '🤰', titulo: 'Tu embarazo', si: prenatal,
      preguntas: [
        { id: 'sem_actual', tipo: 'numero', t: '¿De cuántas semanas estás?', unidad: 'semanas' },
        { id: 'fpp', tipo: 'fecha', t: 'Fecha probable de parto' },
        { id: 'lugar_parto', tipo: 'corta', t: '¿Dónde piensan tener al bebé?' },
        { id: 'equipo_prenatal', tipo: 'corta', t: 'Ginecólogo/a u obstetra y partera/o' },
        { id: 'pediatra_elegido', tipo: 'corta', t: '¿Ya eligieron pediatra? ¿Quién?' },
        { id: 'plan_alim', tipo: 'una', t: '¿Cómo te imaginás la alimentación de tu bebé?', ayuda: 'Toda decisión es válida. Me sirve para acompañarte.', opciones: [
          o('pecho', 'Solo pecho'), o('mixta', 'Pecho y fórmula'), o('extraida', 'Leche extraída'), o('formula', 'Fórmula'), o('no_se', 'Todavía no sé')] },
      ]
    },
    {
      id: 'embarazo', emo: '🌱', titulo: 'Embarazo',
      preguntas: [
        { id: 'gesta', tipo: 'numero', t: '¿Qué número de embarazo es este?', ayuda: 'Contando todos, también los que no llegaron a término. Si es el primero, poné 1.', min: 1, max: 20 },
        { id: 'perdidas', tipo: 'una', t: '¿Tuviste alguna pérdida de embarazo?', ayuda: 'Si es un tema sensible, podés pasar de largo.', opciones: [o('no', 'No'), o('si', 'Sí'), o('nr', 'Prefiero no decir')] },
        { id: 'perdidas_n', tipo: 'numero', t: '¿Cuántas?', si: r => r.perdidas === 'si', min: 1, max: 20 },
        { id: 'partos_prev', tipo: 'varias', t: 'Partos anteriores', si: r => Number(r.gesta) > 1, opciones: [
          o('ninguno', 'Ninguno', { solo: true }), o('vaginal', 'Vaginal'), o('cesarea', 'Cesárea'), o('prematuro', 'Algún bebé prematuro')] },
        { id: 'controles', tipo: 'una', t: '¿Hiciste controles durante el embarazo?', opciones: SI_NO, chips: 'siono' },
        { id: 'emb_compl', tipo: 'varias', t: 'Durante el embarazo hubo…', opciones: [
          o('ninguna', 'Ninguna complicación', { solo: true }), o('dg', 'Diabetes gestacional'), o('hta', 'Presión alta o preeclampsia'),
          o('app', 'Amenaza de parto prematuro'), o('tiroides', 'Algo de tiroides'), o('anemia', 'Anemia'),
          o('sangrado', 'Sangrados'), o('reposo', 'Reposo indicado'), o('infeccion', 'Infecciones'), o('otra', 'Otra')] },
        { id: 'emb_meds', tipo: 'texto', t: '¿Tomaste alguna medicación en el embarazo?' },
        { id: 'fertilidad', tipo: 'una', t: '¿El embarazo fue con tratamiento de fertilidad?', opciones: [o('si', 'Sí'), o('no', 'No'), o('nr', 'Prefiero no decir')] },
        { id: 'pechos_cambios', tipo: 'una', t: 'Durante el embarazo, ¿notaste cambios en tus pechos?', ayuda: 'Por ejemplo, que crecieron o se pusieron más sensibles.', opciones: [
          o('si', 'Sí, bastantes'), o('pocos', 'Pocos'), o('no', 'No noté cambios'), o('no_se', 'No sé')] },
        { id: 'cirugia_mamaria', tipo: 'varias', t: '¿Tuviste alguna cirugía en los pechos?', opciones: [
          o('ninguna', 'Ninguna', { solo: true }), o('aumento', 'Implantes o aumento'), o('reduccion', 'Reducción'),
          o('pexia', 'Levantamiento'), o('biopsia', 'Biopsia o quiste'), o('otra', 'Otra')] },
        { id: 'prep', tipo: 'una', t: '¿Hiciste preparación en lactancia?', opciones: SI_NO, chips: 'siono' },
      ]
    },
    {
      id: 'parto', emo: '👶', titulo: 'Parto y primeros días', si: nacio,
      preguntas: [
        { id: 'sem_gest', tipo: 'numero', t: 'Semanas de gestación al nacer', unidad: 'semanas', min: 22, max: 44 },
        { id: 'tipo_parto', tipo: 'una', t: 'Tipo de parto', opciones: [
          o('vaginal', 'Vaginal'), o('instrumental', 'Vaginal con fórceps o ventosa'),
          o('ces_prog', 'Cesárea programada'), o('ces_urg', 'Cesárea de urgencia')] },
        { id: 'induccion', tipo: 'una', t: '¿Fue inducido o te pusieron oxitocina?', opciones: SI_NO_NS },
        { id: 'anestesia', tipo: 'una', t: 'Anestesia', opciones: [
          o('ninguna', 'Ninguna'), o('peridural', 'Peridural o raquídea'), o('general', 'General'), o('no_se', 'No sé')] },
        { id: 'hemorragia', tipo: 'una', t: '¿Hubo hemorragia o necesitaste transfusión?', opciones: SI_NO_NS },
        { id: 'parto_algo', tipo: 'texto', t: '¿Pasó algo en el parto que quieras contarme?' },
        { id: 'sanatorio', tipo: 'corta', t: 'Sanatorio u hospital' },
        { id: 'equipo', tipo: 'corta', t: 'Equipo que te atendió', ayuda: 'Ginecólogo/a u obstetra, neonatólogo/a, partera/o.' },
        { id: 'peso_nac', tipo: 'numero', t: 'Peso al nacer', unidad: 'gramos', min: 400, max: 6500 },
        { id: 'talla_nac', tipo: 'numero', t: 'Talla al nacer', unidad: 'cm' },
        { id: 'pc_nac', tipo: 'numero', t: 'Perímetro cefálico al nacer', unidad: 'cm', ayuda: 'Si figura en la libreta.' },
        { id: 'apgar', tipo: 'corta', t: 'Apgar (si lo sabés)', ayuda: 'Por ejemplo: 8/9' },
        { id: 'piel', tipo: 'una', t: '¿Hicieron piel con piel al nacer?', opciones: [
          o('enseguida', 'Sí, enseguida'), o('tarde', 'Sí, más tarde'), o('no', 'No'), o('no_se', 'No sé')] },
        { id: 'primera_hora', tipo: 'una', t: '¿Se prendió al pecho en la primera hora?', opciones: SI_NO_NS },
        { id: 'primeros_dias', tipo: 'varias', t: 'En los primeros días…', opciones: [
          o('alojamiento', 'Estuvo conmigo en la habitación'), o('formula_sanat', 'Recibió fórmula en el sanatorio'),
          o('ictericia', 'Tuvo ictericia o luminoterapia'), o('neo', 'Estuvo en neo'),
          o('hipogluc', 'Tuvo el azúcar baja'), o('perdida', 'Bajó mucho de peso'), o('ninguna', 'Nada de esto', { solo: true })] },
        { id: 'neo_dias', tipo: 'numero', t: '¿Cuántos días estuvo en neo?', unidad: 'días', si: r => tiene(r, 'primeros_dias', 'neo') },
        { id: 'bajada', tipo: 'una', t: '¿Cuándo sentiste que «bajó» la leche?', opciones: [
          o('antes3', 'Antes del día 3'), o('d3_4', 'Día 3 o 4'), o('d5', 'Día 5 o después'),
          o('no_senti', 'Todavía no lo sentí'), o('no_se', 'No sé')] },
      ]
    },
    {
      id: 'salud_bebe', emo: '📒', titulo: 'Salud y libreta pediátrica', si: nacio,
      intro: 'Si tenés la libreta a mano, mejor. Lo que no sepas, saltalo o pasá de largo.',
      preguntas: [
        { id: 'pediatra', tipo: 'corta', t: 'Pediatra actual' },
        { id: 'controles_ped', tipo: 'una', t: '¿Está yendo a sus controles?', opciones: SI_NO, chips: 'siono' },
        { id: 'vacunas', tipo: 'una', t: '¿Vacunas al día?', opciones: SI_NO_NS },
        { id: 'pesos', tipo: 'pesos', t: 'Historial de peso', ayuda: 'Copiá de la libreta los pesos que tengas, con su fecha. Si preferís, abajo podés sacarle una foto.' },
        { id: 'foto_libreta', tipo: 'fotos', t: 'Foto de la libreta (opcional)', max: 3, ayuda: 'La página de pesos o la de controles.' },
        { id: 'bebe_diag', tipo: 'varias', t: '¿Le diagnosticaron algo?', opciones: [
          o('ninguno', 'Nada', { solo: true }), o('reflujo', 'Reflujo'), o('aplv', 'Alergia a la proteína de leche de vaca'),
          o('ictericia', 'Ictericia que sigue'), o('cardio', 'Algo del corazón'), o('neuro', 'Algo neurológico o del tono'),
          o('genetico', 'Síndrome genético'), o('respiratorio', 'Algo respiratorio'), o('otro', 'Otro')] },
        { id: 'bebe_meds', tipo: 'texto', t: 'Medicación o suplementos del bebé' },
        { id: 'frenillo', tipo: 'una', t: '¿Te dijeron algo del frenillo de la lengua?', opciones: [
          o('nada', 'No me dijeron nada'), o('bien', 'Que está bien'), o('tiene', 'Que tiene frenillo'), o('cortado', 'Ya se lo cortaron')] },
        { id: 'frenillo_det', tipo: 'corta', t: '¿Quién lo vio y cuándo?', si: r => ['tiene', 'cortado'].includes(r.frenillo) },
        { id: 'otros_estudios', tipo: 'texto', t: '¿Algo más de la libreta o de estudios que le hayan hecho?' },
      ]
    },
    {
      id: 'salud', emo: '🌷', titulo: 'Tu salud',
      intro: 'Ahora sobre quien amamanta. Si completa otra persona, respondé lo que sepas.',
      preguntas: [
        { id: 'edad', tipo: 'numero', t: 'Edad', unidad: 'años' },
        { id: 'salud_diag', tipo: 'varias', t: '¿Tenés o tuviste algo de esto?', opciones: [
          o('ninguna', 'Nada de esto', { solo: true }), o('tiroides', 'Hipotiroidismo u otro de tiroides'), o('sop', 'Ovario poliquístico (SOP)'),
          o('diabetes', 'Diabetes'), o('hta', 'Presión alta'), o('anemia', 'Anemia'), o('obesidad', 'Sobrepeso u obesidad'),
          o('bariatrica', 'Cirugía bariátrica'), o('animo', 'Depresión o ansiedad'), o('otra', 'Otra')] },
        { id: 'familia_ant', tipo: 'varias', t: 'En la familia (de cualquiera de los dos lados), ¿hay…?', opciones: [
          o('ninguno', 'Nada de esto', { solo: true }), o('frenillo', 'Frenillo corto o cortado'), o('lactancia', 'Dificultades con la lactancia'),
          o('alergias', 'Alergias o asma'), o('tiroides', 'Problemas de tiroides'), o('diabetes', 'Diabetes'),
          o('fisura', 'Labio o paladar fisurado'), o('habla', 'Dificultades del habla o la alimentación'),
          o('genetico', 'Síndromes o enfermedades genéticas'), o('animo', 'Depresión o ansiedad'), o('otro', 'Otro')] },
        { id: 'familia_txt', tipo: 'corta', t: '¿Quién y qué?', si: r => Array.isArray(r.familia_ant) && r.familia_ant.some(x => x !== 'ninguno') },
        { id: 'meds_actual', tipo: 'texto', t: '¿Tomás alguna medicación o suplemento ahora?' },
        { id: 'anticonc', tipo: 'una', t: '¿Usás algún anticonceptivo?', si: nacio, opciones: [
          o('no', 'No'), o('progestageno', 'Solo progestágeno (minipíldora, implante, inyección)'),
          o('combinado', 'Combinado (con estrógeno)'), o('diu', 'DIU'), o('no_se', 'Sí, no sé cuál')] },
        { id: 'fuma', tipo: 'una', t: '¿Alguien fuma en casa?', opciones: SI_NO, chips: 'siono' },
        { id: 'pezon_forma', tipo: 'una', t: 'Tus pezones son…', opciones: [
          o('salidos', 'Salidos'), o('planos', 'Planos'), o('invertidos', 'Hacia adentro'),
          o('distintos', 'Uno distinto del otro'), o('no_se', 'No sé')] },
      ]
    },
    {
      id: 'dolor', emo: '💛', titulo: 'Dolor y pechos', si: nacio,
      preguntas: [
        { id: 'dolor', tipo: 'escala', t: '¿Cuánto te duele al amamantar?', ayuda: '0 es nada de dolor y 10 es el peor dolor.' },
        { id: 'dolor_cuando', tipo: 'varias', t: '¿Cuándo duele?', si: r => Number(r.dolor) > 0, opciones: [
          o('prenderse', 'Al prenderse'), o('toda', 'Toda la toma'), o('despues', 'Después de la toma'), o('entre', 'Entre tomas')] },
        { id: 'pecho_signos', tipo: 'varias', t: '¿Notás algo de esto?', opciones: [
          o('grietas', 'Grietas o heridas'), o('sangrado', 'Sangrado'), o('blanco', 'Pezón blanco o morado después de la toma'),
          o('ardor', 'Ardor o pinchazos'), o('aplastado', 'Pezón aplastado o en punta al soltar'), o('duro', 'Pecho duro o muy lleno'),
          o('rojo', 'Zona roja, caliente o dolorida'), o('bulto', 'Un bulto que no se va'), o('fiebre', 'Fiebre o escalofríos'),
          o('nada', 'Nada de esto', { solo: true })] },
        { id: 'dolor_txt', tipo: 'texto', t: 'Contame tu dolor con tus palabras', si: r => Number(r.dolor) > 0 },
      ]
    },
    {
      id: 'come', emo: '🍼', titulo: 'Cómo come hoy', si: nacio,
      preguntas: [
        { id: 'alim', tipo: 'varias', t: 'Hoy se alimenta con…', req: true, opciones: [
          o('pecho', 'Pecho directo'), o('extraida', 'Leche extraída'), o('formula', 'Fórmula')] },
        { id: 'objetivo', tipo: 'una', t: '¿Cómo te gustaría que siga su alimentación?', ayuda: 'No hay respuestas correctas. Respeto lo que elijan.', opciones: [
          o('pecho', 'Solo pecho'), o('mixta', 'Pecho y fórmula'), o('extraida', 'Leche extraída'), o('destete', 'Ir dejando el pecho'), o('no_se', 'Todavía no sé')] },
        { id: 'pecho_ofrece', tipo: 'una', t: '¿Qué pecho ofrecés?', si: usaPecho, opciones: [
          o('ambos', 'Los dos en cada toma'), o('alterna', 'Uno por toma, alternando'),
          o('der', 'Casi siempre el derecho'), o('izq', 'Casi siempre el izquierdo')] },
        { id: 'tomas_dia', tipo: 'una', t: '¿Cuántas veces come en 24 horas?', opciones: [
          o('m6', 'Menos de 6'), o('6_7', '6 o 7'), o('8_12', '8 a 12'), o('m12', 'Más de 12'), o('no_se', 'No sé')] },
        { id: 'duracion', tipo: 'una', t: '¿Cuánto dura cada toma al pecho?', si: usaPecho, opciones: [
          o('m10', 'Menos de 10 min'), o('10_20', '10 a 20 min'), o('20_40', '20 a 40 min'), o('m40', 'Más de 40 min'), o('variable', 'Muy variable')] },
        { id: 'ritmo', tipo: 'una', t: '¿Cómo se organizan las tomas?', opciones: [
          o('demanda', 'Cuando lo pide'), o('horario', 'Por horario'), o('despertar', 'Hay que despertarle para comer')] },
        { id: 'intervalo', tipo: 'una', t: 'El rato más largo que pasa sin comer', opciones: [
          o('m3', 'Menos de 3 h'), o('3_4', '3 a 4 h'), o('5_6', '5 a 6 h'), o('m6', 'Más de 6 h')] },
        { id: 'toma_nota', tipo: 'varias', t: 'Durante la toma notás…', opciones: [
          o('chasquidos', 'Chasquidos'), o('pierde', 'Pierde leche por los costados'), o('atraganta', 'Se atraganta o tose'),
          o('duerme', 'Se duerme enseguida'), o('cansa', 'Se cansa'), o('suelta', 'Se suelta y se vuelve a prender'),
          o('muerde', 'Muerde o aprieta'), o('gases', 'Muchos gases'), o('regurgita', 'Regurgita'), o('nada', 'Nada de esto', { solo: true })] },
        { id: 'traga', tipo: 'una', t: '¿Escuchás o ves que traga?', opciones: [o('si', 'Sí'), o('aveces', 'A veces'), o('no', 'No'), o('no_se', 'No sé')] },
        { id: 'pechos_despues', tipo: 'una', t: '¿Tus pechos quedan más blandos después de la toma?', si: usaPecho, opciones: [
          o('si', 'Sí'), o('no', 'No'), o('no_noto', 'No noto diferencia')] },
        { id: 'despues_toma', tipo: 'una', t: 'Después de comer, en general…', opciones: [
          o('calma', 'Queda en calma y se suelta'), o('pide', 'Pide de nuevo enseguida'), o('llora', 'Llora o se inquieta')] },
        { id: 'hambre', tipo: 'una', t: '¿Reconocés cuándo tiene hambre?', opciones: [o('si', 'Sí'), o('aveces', 'A veces'), o('dudas', 'Tengo dudas')] },
        { id: 'historia_alim', tipo: 'texto', t: '¿Cómo se alimentó desde que nació hasta hoy?', ayuda: 'Por ejemplo: «los primeros días con fórmula en el sanatorio y después solo pecho».' },
      ]
    },
    {
      id: 'herramientas', emo: '🧸', titulo: 'Mamadera, chupete y extracción', si: nacio,
      intro: 'La mamadera, el chupete y la fórmula son herramientas. Te pregunto para entender cómo acompañarte, no para juzgar.',
      preguntas: [
        { id: 'con_que', tipo: 'varias', t: 'La leche que no toma directo del pecho se la dan con…', si: otraLeche, opciones: [
          o('mamadera', 'Mamadera'), o('vasito', 'Vasito'), o('jeringa', 'Jeringa o sonda al dedo'),
          o('relactador', 'Relactador al pecho'), o('cuchara', 'Cuchara')] },
        { id: 'mam_marca', tipo: 'corta', t: 'Marca y modelo de mamadera', si: r => tiene(r, 'con_que', 'mamadera') },
        { id: 'tetina_flujo', tipo: 'una', t: 'Flujo de la tetina', si: r => tiene(r, 'con_que', 'mamadera'), opciones: [
          o('lento', 'Lento (0 o recién nacido)'), o('medio', 'Medio (1)'), o('rapido', 'Rápido (2 o más)'), o('variable', 'Variable'), o('no_se', 'No sé')] },
        { id: 'tetina_forma', tipo: 'una', t: 'Forma de la tetina', si: r => tiene(r, 'con_que', 'mamadera'), opciones: [
          o('anatomica', 'Anatómica (aplanada)'), o('redonda', 'Redonda clásica'), o('base_ancha', 'Base ancha'), o('no_se', 'No sé')] },
        { id: 'mam_veces', tipo: 'numero', t: '¿Cuántas mamaderas por día?', si: r => tiene(r, 'con_que', 'mamadera') },
        { id: 'mam_ml', tipo: 'numero', t: '¿Cuánto toma en cada una?', unidad: 'ml', si: r => tiene(r, 'con_que', 'mamadera') },
        { id: 'mam_tiempo', tipo: 'una', t: '¿Cuánto tarda en tomarla?', si: r => tiene(r, 'con_que', 'mamadera'), opciones: [
          o('m5', 'Menos de 5 min'), o('5_10', '5 a 10 min'), o('10_20', '10 a 20 min'), o('m20', 'Más de 20 min')] },
        { id: 'mam_como', tipo: 'una', t: '¿Cómo se la dan?', si: r => tiene(r, 'con_que', 'mamadera'), opciones: [
          o('pausada', 'Más vertical, con pausas'), o('acostado', 'Más horizontal, de corrido'), o('no_se', 'No sé')] },
        { id: 'formula_tipo', tipo: 'una', t: 'Tipo de fórmula', si: r => nacio(r) && tiene(r, 'alim', 'formula'), opciones: [
          o('inicio', 'De inicio'), o('ha', 'HA (hipoalergénica)'), o('sin_lactosa', 'Sin lactosa'), o('ar', 'AR (antirreflujo)'),
          o('hidrolizada', 'Extensamente hidrolizada'), o('aminoacidos', 'De aminoácidos'), o('prematuros', 'Para prematuros'), o('otra', 'Otra o no sé')] },
        { id: 'formula_marca', tipo: 'corta', t: 'Marca de la fórmula', si: r => nacio(r) && tiene(r, 'alim', 'formula') },
        { id: 'formula_ml', tipo: 'numero', t: 'Fórmula en total por día', unidad: 'ml', si: r => nacio(r) && tiene(r, 'alim', 'formula') },
        { id: 'formula_quien', tipo: 'corta', t: '¿Quién la indicó?', si: r => nacio(r) && tiene(r, 'alim', 'formula') },
        { id: 'chupete', tipo: 'una', t: '¿Usa chupete?', opciones: [
          o('no', 'No'), o('dormir', 'Sí, para dormir'), o('calmar', 'Sí, para calmarse'), o('mucho', 'Sí, gran parte del día')] },
        { id: 'chupete_tipo', tipo: 'corta', t: 'Marca o tipo de chupete', si: r => r.chupete && r.chupete !== 'no' },
        { id: 'pezonera', tipo: 'una', t: '¿Usás pezonera?', opciones: [o('no', 'No'), o('si', 'Sí'), o('antes', 'La usé y la dejé')] },
        { id: 'pezonera_det', tipo: 'corta', t: '¿Quién la indicó, qué tamaño y desde cuándo?', si: r => ['si', 'antes'].includes(r.pezonera) },
        { id: 'extrae', tipo: 'una', t: '¿Te extraés leche?', opciones: [
          o('no', 'No'), o('electrico', 'Sí, con sacaleches eléctrico'), o('manual', 'Sí, con sacaleches manual'), o('mano', 'Sí, a mano')] },
        { id: 'extrae_veces', tipo: 'numero', t: '¿Cuántas veces por día?', si: r => r.extrae && r.extrae !== 'no' },
        { id: 'extrae_ml', tipo: 'numero', t: '¿Cuánto sacás en total cada vez?', unidad: 'ml', si: r => r.extrae && r.extrae !== 'no' },
        { id: 'extrae_motivo', tipo: 'varias', t: '¿Para qué te extraés?', si: r => r.extrae && r.extrae !== 'no', opciones: [
          o('suplementar', 'Para darle más leche'), o('trabajo', 'Por el trabajo'), o('alivio', 'Para aliviar el pecho'), o('reserva', 'Para guardar'), o('otro', 'Otro')] },
        { id: 'embudo', tipo: 'corta', t: 'Tamaño de embudo (si sabés)', si: r => ['electrico', 'manual'].includes(r.extrae) },
        { id: 'sabe_mano', tipo: 'una', t: '¿Sabés extraerte a mano?', opciones: [o('si', 'Sí'), o('masomenos', 'Más o menos'), o('no', 'No')] },
        { id: 'extrae_dolor', tipo: 'una', t: '¿Te duele al extraerte?', si: r => r.extrae && r.extrae !== 'no', opciones: SI_NO, chips: 'siono' },
      ]
    },
    {
      id: 'cuerpito', emo: '🌙', titulo: 'Pañales, sueño y cuerpito', si: nacio,
      preguntas: [
        { id: 'pis', tipo: 'una', t: 'Pañales mojados en 24 horas', opciones: [
          o('m4', 'Menos de 4'), o('4_5', '4 o 5'), o('m6', '6 o más'), o('no_se', 'No sé')] },
        { id: 'caca', tipo: 'una', t: 'Pañales con caca en 24 horas', opciones: [
          o('ninguno', 'Ninguno'), o('1_2', '1 o 2'), o('m3', '3 o más'), o('no_se', 'No sé')] },
        { id: 'caca_color', tipo: 'una', t: 'Color de la caca', opciones: [
          o('negra', 'Negra o verde muy oscura'), o('verde', 'Verde'), o('amarilla', 'Amarilla o mostaza'), o('otra', 'Otra')] },
        { id: 'uratos', tipo: 'una', t: '¿Viste manchitas naranjas o rojizas en el pañal, como polvo de ladrillo?', opciones: SI_NO_NS },
        { id: 'amarillo', tipo: 'una', t: '¿Ves la piel o los ojitos amarillos?', opciones: [o('no', 'No'), o('poco', 'Un poco'), o('si', 'Sí')] },
        { id: 'llanto', tipo: 'una', t: '¿Llora mucho?', opciones: [o('no', 'No'), o('aveces', 'A veces'), o('mucho', 'Mucho, cuesta calmarle')] },
        { id: 'regurg', tipo: 'una', t: '¿Regurgita o vomita?', opciones: [
          o('no', 'No'), o('poco', 'Un poco'), o('mucho', 'Mucho, casi siempre'), o('chorro', 'Vómitos con fuerza, en chorro')] },
        { id: 'boca_abierta', tipo: 'una', t: 'En reposo o durmiendo, ¿tiene la boquita abierta?', opciones: [o('no', 'No'), o('aveces', 'A veces'), o('si', 'Sí')] },
        { id: 'ronca', tipo: 'una', t: '¿Ronca o respira con ruido?', opciones: [o('no', 'No'), o('aveces', 'A veces'), o('si', 'Sí')] },
        { id: 'cabeza_lado', tipo: 'una', t: '¿Gira o inclina la cabeza más hacia un lado?', ayuda: 'Por ejemplo, mira siempre para el mismo lado o prefiere un solo pecho.', opciones: SI_NO_NS },
      ]
    },
    {
      id: 'sueno_sec', emo: '😴', titulo: 'Sueño', si: nacio,
      preguntas: [
        { id: 'sueno', tipo: 'una', t: 'En general, ¿cómo duerme?', opciones: [
          o('mucho', 'Duerme mucho y hay que despertarle'), o('bien', 'Duerme bien entre tomas'),
          o('poco', 'Duerme poco y con mucha inquietud'), o('variable', 'Muy variable')] },
        { id: 'donde_duerme', tipo: 'una', t: '¿Dónde duerme de noche?', opciones: [
          o('cuna_hab', 'En su cuna, en nuestra habitación'), o('sidecar', 'En una cuna pegada a la cama'),
          o('cama', 'En nuestra cama'), o('habitacion', 'En su propia habitación'), o('variable', 'Depende de la noche')] },
        { id: 'posicion_dormir', tipo: 'una', t: '¿En qué posición duerme?', opciones: [
          o('espalda', 'Boca arriba'), o('costado', 'De costado'), o('panza', 'Boca abajo'), o('variable', 'Varía')] },
        { id: 'como_duerme', tipo: 'varias', t: '¿Cómo se duerme?', ayuda: 'Podés elegir más de una.', opciones: [
          o('pecho', 'Al pecho'), o('brazos', 'En brazos'), o('meciendo', 'Meciendo o paseando'), o('porteo', 'En fular o mochila'),
          o('chupete', 'Con chupete'), o('mamadera', 'Con mamadera'), o('cuna', 'Sin ayuda, en la cuna')] },
        { id: 'despertares', tipo: 'una', t: '¿Cuántas veces se despierta de noche?', opciones: [
          o('0_1', '0 o 1'), o('2_3', '2 o 3'), o('4_5', '4 o 5'), o('m6', '6 o más'), o('no_se', 'No sé')] },
        { id: 'come_noche', tipo: 'una', t: '¿Come de noche?', opciones: [o('si', 'Sí, cada vez que se despierta'), o('aveces', 'A veces'), o('no', 'No')] },
        { id: 'siestas', tipo: 'una', t: 'Siestas de día', opciones: [
          o('largas', 'Largas (más de 1 h)'), o('cortas', 'Cortitas (menos de 40 min)'), o('mezcla', 'De todo un poco'), o('casi_no', 'Casi no duerme de día')] },
        { id: 'sueno_txt', tipo: 'texto', t: 'Contame cómo son sus noches' },
      ]
    },
    {
      id: 'vinculo_sec', emo: '🤱', titulo: 'Vínculo y apego', si: nacio,
      intro: 'No hay respuestas correctas: cada familia encuentra su manera.',
      preguntas: [
        { id: 'vinculo', tipo: 'una', t: '¿Cómo sentís el vínculo con tu bebé?', opciones: [
          o('conexion', 'Siento mucha conexión'), o('conociendo', 'Todavía nos estamos conociendo'),
          o('cuesta', 'Me está costando conectar'), o('no_se', 'No sé cómo describirlo')] },
        { id: 'piel_casa', tipo: 'una', t: '¿Hacen piel con piel en casa?', opciones: [o('seguido', 'Sí, seguido'), o('aveces', 'A veces'), o('no', 'No')] },
        { id: 'porteo', tipo: 'una', t: '¿Usan porteo (fular o mochila)?', opciones: [o('seguido', 'Sí, seguido'), o('aveces', 'A veces'), o('no', 'No')] },
        { id: 'brazos', tipo: 'una', t: '¿Pide mucho los brazos?', opciones: [o('mucho', 'Sí, todo el tiempo'), o('normal', 'Lo normal'), o('poco', 'Poco')] },
        { id: 'calma', tipo: 'varias', t: '¿Qué le calma?', opciones: [
          o('pecho', 'El pecho'), o('brazos', 'Brazos'), o('voz', 'Tu voz o cantarle'), o('mecer', 'Mecerle'), o('porteo', 'Porteo'),
          o('chupete', 'Chupete'), o('ruido', 'Ruido blanco o música'), o('bano', 'El baño'), o('cuesta', 'Cuesta mucho calmarle')] },
        { id: 'cuidadores', tipo: 'corta', t: '¿Quiénes le cuidan en el día a día?' },
        { id: 'separaciones', tipo: 'una', t: '¿Hay ratos de separación entre el bebé y quien amamanta?', opciones: [
          o('no', 'Casi nunca'), o('ratos', 'Algunas horas'), o('jornada', 'Una jornada de trabajo'), o('noches', 'Algunas noches')] },
        { id: 'vinculo_txt', tipo: 'texto', t: '¿Algo más sobre cómo se están conociendo?' },
      ]
    },
    {
      id: 'animo', emo: '🫶', titulo: 'Cómo estás vos',
      intro: 'Esto es tan importante como lo demás.',
      preguntas: [
        { id: 'sentir', tipo: 'varias', t: '¿Cómo te sentís con la lactancia hoy?', si: nacio, opciones: [
          o('confianza', 'Con confianza'), o('dudas', 'Con dudas'), o('cansancio', 'Con mucho cansancio'),
          o('frustracion', 'Con frustración'), o('culpa', 'Con culpa'), o('limite', 'Al límite')] },
        { id: 'whooley1', tipo: 'una', t: 'En el último mes, ¿te sentiste muchas veces triste, sin esperanza o con el ánimo por el piso?', opciones: SI_NO, chips: 'siono' },
        { id: 'whooley2', tipo: 'una', t: 'En el último mes, ¿tuviste muchas veces pocas ganas o poco interés en hacer las cosas?', opciones: SI_NO, chips: 'siono' },
        { id: 'apoyo', tipo: 'una', t: '¿Contás con apoyo en casa?', opciones: [o('mucho', 'Sí, mucho'), o('algo', 'Algo'), o('poco', 'Poco o nada')] },
        { id: 'trabajo', tipo: 'una', t: '¿Volvés a trabajar o estudiar?', opciones: [
          o('no', 'No por ahora'), o('pronto', 'Sí, en menos de un mes'), o('despues', 'Sí, más adelante'), o('ya', 'Ya volví')] },
        { id: 'hermanos', tipo: 'corta', t: '¿Tiene hermanos o hermanas? ¿De qué edades?' },
        { id: 'lact_previa', tipo: 'una', t: 'Lactancias anteriores', opciones: [
          o('primera', 'Es mi primera vez'), o('bien', 'Fueron bien'), o('dificil', 'Con dificultades'),
          o('no_pude', 'No pude amamantar como quería'), o('no_amamante', 'No amamanté')] },
        { id: 'lact_previa_txt', tipo: 'texto', t: 'Contame un poco de esas lactancias', si: r => r.lact_previa && r.lact_previa !== 'primera' },
        { id: 'asesoria_prev', tipo: 'una', t: '¿Tuviste asesoría de lactancia antes?', opciones: SI_NO, chips: 'siono' },
        { id: 'va_bien', tipo: 'texto', t: '¿Qué sentís que va bien?', si: nacio },
        { id: 'miedos', tipo: 'texto', t: 'Miedos o preocupaciones' },
      ]
    },
    {
      id: 'final', emo: '📷', titulo: 'Fotos, audio y envío',
      preguntas: [
        { id: 'fotos', tipo: 'fotos', t: 'Fotos o videos que quieras mostrarme', max: 8, video: true, si: nacio,
          sugerencias: ['Su boquita bien abierta, llorando, que se vea la lengua', 'De perfil mientras toma el pecho',
            'Tu pezón justo cuando suelta el pecho', 'La mamadera o el chupete que usan', 'Un video corto (30 s) de la toma'] },
        { id: 'audio_general', tipo: 'audio', t: '¿Preferís contarme todo en un audio?', ayuda: 'Tocá el micrófono, hablá tranquila o tranquilo, y tocá de nuevo para terminar.' },
        { id: 'algo_mas', tipo: 'texto', t: '¿Algo más que quieras contarme?' },
        { id: 'uso_educativo', tipo: 'una', t: '¿Me autorizás a usar las fotos y videos con fines educativos y científicos?', si: nacio,
          ayuda: 'Por ejemplo, en clases, congresos o publicaciones. Siempre sin nombres ni datos que les identifiquen. Podés cambiar de opinión cuando quieras escribiéndome.',
          opciones: [o('si', 'Sí, autorizo'), o('no', 'No autorizo')] },
        { id: 'tapar_ojos', tipo: 'una', t: 'Si se usan, ¿querés que se tapen los ojos?', si: r => r.uso_educativo === 'si',
          opciones: [o('si', 'Sí, tapar los ojos'), o('no', 'No hace falta')] },
        { id: 'consent', tipo: 'consentimiento', req: true,
          t: 'Acepto que Ceci use esta información, los audios y las fotos para acompañarnos en la asesoría. Es confidencial: solo se usa para otros fines si lo autorizo arriba.' },
      ]
    },
  ];

  global.FICHA = { SECCIONES, tiene };
})(typeof window !== 'undefined' ? window : globalThis);
