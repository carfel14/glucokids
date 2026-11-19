/* =========================================================
   Datos ficticios iniciales. Todas las fechas son relativas al momento
   de inicializar la demostración y nunca se generan registros futuros.
   ========================================================= */
import { localParts, addDays, isoFromLocal, fromLocal, addMonths, prng, dayOfWeek } from './utils.js';

export const SCHEMA_VERSION = 1;
export const DEMO_FAMILY_ID = 'u_fam_maria';
export const DEMO_TEACHER_ID = 'u_doc_laura';

export function emptyState() {
  return {
    version: SCHEMA_VERSION,
    seededAt: new Date().toISOString(),
    users: [], students: [], links: [], invites: [], plans: [], glucose: [], reminders: [],
    messages: [], incidents: [], observations: [], notifications: [], progress: {}, subscriptions: {},
    resourcesRead: {}, prefs: {},
  };
}

/** Plan vacío (cuenta nueva sin datos de ejemplo) */
export function blankPlan(studentId, by, at = new Date().toISOString()) {
  return {
    id: `plan_${studentId}`, studentId, status: 'borrador', version: 1, updatedAt: at, updatedBy: by,
    target: null,
    coordination: { responsables: [], contacts: [], emergencyNumber: '', routine: [], food: '', activity: '', supplies: '', notes: '' },
    clinical: null,
    readBy: [], history: [{ version: 1, at, by, summary: 'Plan creado' }],
  };
}

/** Contenido clínico ficticio de ejemplo (solo lectura en la app) */
export function exampleClinical(firstName) {
  return {
    source: 'Transcrito por la familia desde el plan del equipo de salud (contenido ficticio de demostración).',
    healthTeam: 'Endocrinología pediátrica · profesional ficticio',
    indications: [
      `Mediciones en horario escolar: antes de la merienda y cuando ${firstName} presente señales de alerta (indicación ficticia).`,
      'La insulina se administra en casa según el esquema del equipo de salud; en la escuela no se administran dosis (dato ficticio de ejemplo).',
    ],
    signs: [
      `Glucosa baja: temblor, sudor, palidez, irritabilidad o hambre repentina (señales observadas en ${firstName}).`,
      'Glucosa alta: mucha sed, ganas frecuentes de ir al baño o cansancio.',
    ],
    actions: [
      'Ante señales de glucosa baja o alta: no dejar solo al estudiante, seguir los pasos del plan escrito entregado a la dirección y avisar a la familia.',
      'Si no responde, se desmaya, tiene convulsiones o no puede tragar: pedir ayuda de emergencia de inmediato y avisar a la familia.',
      'Registrar lo ocurrido en GlucoKids como incidente u observación.',
    ],
  };
}

export function buildSeed(now = new Date()) {
  const s = emptyState();
  const today = localParts(now).date;
  const at = (d, t) => isoFromLocal(addDays(today, d), t);
  const past = (d, t) => fromLocal(addDays(today, d), t) <= now;
  const isWeekday = (d) => { const w = dayOfWeek(addDays(today, d)); return w >= 1 && w <= 5; };

  /* ---------- Usuarios ---------- */
  s.users = [
    { id: DEMO_FAMILY_ID, role: 'familia', name: 'María López', email: 'familia@glucokids.demo', phone: '+505 8000 0101', relation: 'Madre', demo: true, createdAt: at(-40, '09:00') },
    { id: DEMO_TEACHER_ID, role: 'docente', name: 'Laura Martínez', email: 'docente@glucokids.demo', phone: '+505 8000 0201', school: 'Centro Escolar Los Girasoles', grade: '3.er grado A y 4.º grado B', subject: 'Docente guía y Ciencias Naturales', demo: true, createdAt: at(-60, '09:00') },
    { id: 'u_fam_rosa', role: 'familia', name: 'Rosa Ruiz', email: 'rosa.ruiz@glucokids.demo', phone: '+505 8000 0301', relation: 'Madre', demo: false, createdAt: at(-50, '09:00') },
    { id: 'u_fam_pedro', role: 'familia', name: 'Pedro Pineda', email: 'pedro.pineda@glucokids.demo', phone: '+505 8000 0401', relation: 'Padre', demo: false, createdAt: at(-45, '09:00') },
  ];

  /* ---------- Estudiantes ---------- */
  const school = 'Centro Escolar Los Girasoles';
  s.students = [
    { id: 's_juan', name: 'Juan Pérez López', age: 8, grade: '3.er grado A', school, diabetesType: 'Tipo 1', familyId: DEMO_FAMILY_ID, avatar: { hair: 'short', skin: '#F4C29C', hairColor: '#5A3A2A', bg: '#D9EEFB', shirt: '#2F7FD1' }, createdAt: at(-40, '09:10') },
    { id: 's_lucia', name: 'Lucía Pérez López', age: 11, grade: '6.º grado A', school, diabetesType: 'Tipo 1', familyId: DEMO_FAMILY_ID, avatar: { hair: 'long', skin: '#F4C29C', hairColor: '#3B2418', bg: '#FFE3E7', shirt: '#F16C7A' }, createdAt: at(-40, '09:12') },
    { id: 's_mateo', name: 'Mateo Ruiz', age: 8, grade: '3.er grado A', school, diabetesType: 'Tipo 1', familyId: 'u_fam_rosa', avatar: { hair: 'curly', skin: '#C98E64', hairColor: '#2A1A12', bg: '#E5F7ED', shirt: '#21864B' }, createdAt: at(-50, '09:10') },
    { id: 's_sofia', name: 'Sofía Pineda', age: 9, grade: '4.º grado B', school, diabetesType: 'Tipo 2', familyId: 'u_fam_pedro', avatar: { hair: 'pony', skin: '#E9B48C', hairColor: '#4A2C1C', bg: '#FFF4CC', shirt: '#7C6BD6' }, createdAt: at(-45, '09:10') },
  ];

  /* ---------- Vinculaciones docente ↔ estudiante ---------- */
  const link = (id, studentId, d, extra = {}) => ({ id, studentId, teacherId: DEMO_TEACHER_ID, familyId: s.students.find((x) => x.id === studentId).familyId, status: 'activo', code: null, requestedAt: at(d, '08:00'), approvedAt: at(d, '18:00'), revokedAt: null, permissions: { glucose: true, calendar: true }, ...extra });
  s.links = [
    link('l_juan', 's_juan', -30),
    link('l_mateo', 's_mateo', -35),
    link('l_sofia', 's_sofia', -32, { permissions: { glucose: false, calendar: true } }),
  ];

  /* ---------- Planes GlucoCompartido ---------- */
  const planFor = (student, opts) => {
    const fn = student.name.split(' ')[0];
    return {
      id: `plan_${student.id}`, studentId: student.id, status: 'vigente', version: opts.version, updatedAt: opts.updatedAt, updatedBy: student.familyId,
      target: opts.target,
      coordination: opts.coordination,
      clinical: exampleClinical(fn),
      readBy: opts.readBy || [],
      history: opts.history,
    };
  };
  s.plans = [
    planFor(s.students[0], {
      version: 3, updatedAt: at(-5, '19:30'), target: { min: 80, max: 180 },
      coordination: {
        responsables: [{ name: 'María López', relation: 'Madre' }, { name: 'Carlos Pérez', relation: 'Padre' }],
        contacts: [
          { name: 'María López', relation: 'Madre', phone: '+505 8000 0101' },
          { name: 'Carlos Pérez', relation: 'Padre', phone: '+505 8000 0102' },
          { name: 'Centro de salud de referencia (ficticio)', relation: 'Centro de salud', phone: '+505 2200 0103' },
          { name: 'Pediatra tratante (ficticio)', relation: 'Pediatra', phone: '+505 8000 0104' },
        ],
        emergencyNumber: '',
        routine: ['07:00 · Entrada a clases', '09:30 · Merienda de media mañana', '10:00 · Educación física (martes y jueves)', '12:00 · Salida'],
        food: 'Juan lleva la merienda desde casa en su lonchera azul. Puede comerla en el aula si lo necesita, según su plan.',
        activity: 'Participa en todas las actividades. Antes de educación física sigue lo indicado en su plan.',
        supplies: 'En la mochila: materiales indicados por su plan, agua y merienda. Copia del plan firmado en la dirección.',
        notes: 'Juan suele avisar cuando se siente mal. Si está muy callado o irritable, conviene preguntarle cómo se siente.',
      },
      readBy: [{ teacherId: DEMO_TEACHER_ID, version: 2, at: at(-20, '07:40') }],
      history: [
        { version: 1, at: at(-40, '09:20'), by: DEMO_FAMILY_ID, summary: 'Plan creado' },
        { version: 2, at: at(-25, '20:00'), by: DEMO_FAMILY_ID, summary: 'Contactos actualizados' },
        { version: 3, at: at(-5, '19:30'), by: DEMO_FAMILY_ID, summary: 'Rutina escolar: horario de educación física' },
      ],
    }),
    planFor(s.students[1], {
      version: 1, updatedAt: at(-38, '20:00'), target: { min: 90, max: 180 },
      coordination: {
        responsables: [{ name: 'María López', relation: 'Madre' }],
        contacts: [{ name: 'María López', relation: 'Madre', phone: '+505 8000 0101' }, { name: 'Carlos Pérez', relation: 'Padre', phone: '+505 8000 0102' }],
        emergencyNumber: '',
        routine: ['07:00 · Entrada a clases', '10:00 · Merienda', '12:30 · Salida'],
        food: 'Lucía lleva su merienda desde casa.',
        activity: 'Participa en el equipo de voleibol los viernes.',
        supplies: 'Materiales indicados por su plan y agua.',
        notes: 'Lucía mide su glucosa con supervisión de un adulto.',
      },
      history: [{ version: 1, at: at(-38, '20:00'), by: DEMO_FAMILY_ID, summary: 'Plan creado' }],
    }),
    planFor(s.students[2], {
      version: 1, updatedAt: at(-36, '18:00'), target: { min: 80, max: 180 },
      coordination: {
        responsables: [{ name: 'Rosa Ruiz', relation: 'Madre' }],
        contacts: [{ name: 'Rosa Ruiz', relation: 'Madre', phone: '+505 8000 0301' }, { name: 'Centro de salud de referencia (ficticio)', relation: 'Centro de salud', phone: '+505 2200 0303' }],
        emergencyNumber: '',
        routine: ['07:00 · Entrada a clases', '09:30 · Merienda', '12:00 · Salida'],
        food: 'Merienda desde casa.', activity: 'Participa en educación física con su plan.', supplies: 'Materiales indicados por su plan.', notes: '',
      },
      readBy: [{ teacherId: DEMO_TEACHER_ID, version: 1, at: at(-34, '07:30') }],
      history: [{ version: 1, at: at(-36, '18:00'), by: 'u_fam_rosa', summary: 'Plan creado' }],
    }),
    planFor(s.students[3], {
      version: 2, updatedAt: at(-15, '18:00'), target: { min: 80, max: 160 },
      coordination: {
        responsables: [{ name: 'Pedro Pineda', relation: 'Padre' }],
        contacts: [{ name: 'Pedro Pineda', relation: 'Padre', phone: '+505 8000 0401' }, { name: 'Ana Pineda', relation: 'Abuela', phone: '+505 8000 0402' }],
        emergencyNumber: '',
        routine: ['07:00 · Entrada a clases', '09:45 · Merienda', '12:00 · Salida'],
        food: 'Merienda indicada por su nutricionista (dato ficticio).', activity: 'Participa en todas las actividades.', supplies: 'Agua y merienda.', notes: 'Toma medicamento oral en casa según su plan (dato ficticio).',
      },
      readBy: [{ teacherId: DEMO_TEACHER_ID, version: 2, at: at(-14, '07:30') }],
      history: [{ version: 1, at: at(-45, '18:00'), by: 'u_fam_pedro', summary: 'Plan creado' }, { version: 2, at: at(-15, '18:00'), by: 'u_fam_pedro', summary: 'Merienda actualizada' }],
    }),
  ];

  /* ---------- Registros de glucosa (últimos 7 días, sin futuros) ---------- */
  let gid = 0;
  const addG = (studentId, d, time, value, context, by, role, notes = '') => {
    if (!past(d, time)) return;
    s.glucose.push({ id: `g_seed_${++gid}`, studentId, value, at: at(d, time), context, notes, createdBy: by, createdRole: role, createdAt: at(d, time) });
  };
  const rnd = prng(20261118);
  const lowDay = [-2, -3, -4, -5].find((d) => isWeekday(d)); // un valor bajo de ejemplo en un día escolar
  const val = (base, spread) => Math.round(base + (rnd() - .5) * 2 * spread);
  for (let d = -6; d <= 0; d++) {
    const school = isWeekday(d);
    // Juan
    addG('s_juan', d, '06:50', val(128, 22), 'antes_comer', DEMO_FAMILY_ID, 'familia');
    if (school) addG('s_juan', d, '09:25', d === lowDay ? 76 : val(118, 18), 'antes_comer', DEMO_TEACHER_ID, 'docente', d === lowDay ? 'Antes de la merienda. Se avisó a la familia.' : 'Antes de la merienda');
    addG('s_juan', d, '15:30', d === -1 ? 196 : val(150, 20), 'despues_comer', DEMO_FAMILY_ID, 'familia', d === -1 ? 'Después de una fiesta de cumpleaños' : '');
    if (!school) addG('s_juan', d, '11:00', val(132, 20), 'actividad', DEMO_FAMILY_ID, 'familia', 'Después de jugar en el parque');
    addG('s_juan', d, '19:10', val(138, 24), 'antes_comer', DEMO_FAMILY_ID, 'familia');
    // Lucía
    addG('s_lucia', d, '06:40', val(124, 20), 'antes_comer', DEMO_FAMILY_ID, 'familia');
    addG('s_lucia', d, '18:30', val(145, 30), 'antes_comer', DEMO_FAMILY_ID, 'familia');
    // Mateo
    addG('s_mateo', d, '07:00', val(130, 20), 'antes_comer', 'u_fam_rosa', 'familia');
    if (school) addG('s_mateo', d, '09:20', val(120, 25), 'antes_comer', DEMO_TEACHER_ID, 'docente', 'Antes de la merienda');
    addG('s_mateo', d, '19:00', val(140, 25), 'antes_comer', 'u_fam_rosa', 'familia');
    // Sofía
    addG('s_sofia', d, '07:10', val(125, 15), 'antes_comer', 'u_fam_pedro', 'familia');
    addG('s_sofia', d, '19:30', val(140, 18), 'despues_comer', 'u_fam_pedro', 'familia');
  }

  /* ---------- Recordatorios ---------- */
  const rem = (id, studentId, title, category, date, time, recurrence, notes = '', createdBy = DEMO_FAMILY_ID) =>
    ({ id, studentId, title, category, date, time, recurrence, notes, createdBy, completions: {}, createdAt: at(-14, '08:00') });
  const r = [
    rem('r_juan_merienda', 's_juan', 'Merienda de media mañana', 'alimentacion', addDays(today, -14), '09:30', 'weekdays', 'Según el horario del plan.'),
    rem('r_juan_medicion', 's_juan', 'Medición antes del almuerzo', 'medicion', addDays(today, -14), '12:15', 'daily'),
    rem('r_juan_rutina', 's_juan', 'Rutina indicada en el plan: revisión de la noche', 'rutina', addDays(today, -14), '20:00', 'daily', 'Seguir las indicaciones del equipo de salud.'),
    rem('r_juan_ef', 's_juan', 'Educación física: llevar agua y merienda', 'actividad', addDays(today, 1), '07:00', 'none'),
    rem('r_juan_consulta', 's_juan', 'Consulta de control con endocrinología pediátrica', 'consulta', addDays(today, 6), '10:00', 'none', 'Llevar el registro de la semana (cita ficticia).'),
    rem('r_lucia_merienda', 's_lucia', 'Merienda', 'alimentacion', addDays(today, -14), '10:00', 'weekdays'),
    rem('r_lucia_medicion', 's_lucia', 'Medición antes de cenar', 'medicion', addDays(today, -14), '18:30', 'daily'),
    rem('r_mateo_merienda', 's_mateo', 'Merienda de media mañana', 'alimentacion', addDays(today, -14), '09:30', 'weekdays', '', 'u_fam_rosa'),
    rem('r_sofia_merienda', 's_sofia', 'Merienda', 'alimentacion', addDays(today, -14), '09:45', 'weekdays', '', 'u_fam_pedro'),
  ];
  // Completados en días anteriores; hoy solo los que ya pasaron hace más de una hora (excepto uno pendiente)
  r.forEach((x) => {
    for (let d = -6; d <= 0; d++) {
      const date = addDays(today, d);
      if (x.recurrence === 'weekdays' && !isWeekday(d)) continue;
      if (x.recurrence === 'none') continue;
      if (d < 0 && !(x.id === 'r_juan_rutina' && d === -2)) x.completions[date] = at(d, x.time);
      if (d === 0 && x.id !== 'r_juan_medicion' && fromLocal(date, x.time) <= new Date(now.getTime() - 3600000)) x.completions[date] = at(0, x.time);
    }
  });
  s.reminders = r;

  /* ---------- Mensajes ---------- */
  const conv = (sid) => `${sid}.${DEMO_TEACHER_ID}`;
  const msg = (id, sid, from, to, iso, text, read = true) => ({ id, convId: conv(sid), studentId: sid, fromId: from, toId: to, text, at: iso, readAt: read ? iso : null });
  const recentIso = past(0, '08:30') ? at(0, '08:30') : at(-1, '16:00');
  s.messages = [
    msg('m1', 's_juan', DEMO_FAMILY_ID, DEMO_TEACHER_ID, at(-1, '07:10'), 'Buenos días, profe. Hoy Juan lleva su merienda en la lonchera azul. Cualquier cosa me avisa por aquí.'),
    msg('m2', 's_juan', DEMO_TEACHER_ID, DEMO_FAMILY_ID, at(-1, '10:05'), 'Buenos días, María. Recibido. Juan tomó su merienda a la hora indicada y participó muy bien en clase.'),
    msg('m3', 's_juan', DEMO_FAMILY_ID, DEMO_TEACHER_ID, at(-1, '13:20'), 'Gracias por la actualización.'),
    msg('m4', 's_juan', DEMO_TEACHER_ID, DEMO_FAMILY_ID, recentIso, 'Esta semana tenemos educación física el martes y el jueves a las 10:00. ¿Hay alguna indicación nueva en el plan que deba revisar?', false),
    msg('m5', 's_mateo', DEMO_TEACHER_ID, 'u_fam_rosa', at(-2, '11:00'), 'Mateo participó muy bien en la feria de ciencias.'),
    msg('m6', 's_mateo', 'u_fam_rosa', DEMO_TEACHER_ID, at(-1, '18:00'), 'Gracias, profe. Mañana Mateo tiene control médico y llegará a las 9:00.', false),
    msg('m7', 's_sofia', 'u_fam_pedro', DEMO_TEACHER_ID, at(-3, '17:00'), 'Profe, actualicé la merienda de Sofía en el plan.'),
    msg('m8', 's_sofia', DEMO_TEACHER_ID, 'u_fam_pedro', at(-3, '18:10'), 'He revisado el plan. Gracias.'),
  ];

  /* ---------- Incidentes ---------- */
  s.incidents = [
    {
      id: 'inc_juan_1', studentId: 's_juan', teacherId: DEMO_TEACHER_ID, category: 'malestar', at: at(-2, '10:20'),
      notes: 'Juan dijo sentirse mareado y con hambre después del recreo.',
      actions: 'Se le acompañó en todo momento, se consultó su Plan GlucoCompartido y se siguieron sus indicaciones. Se avisó a la familia (llamada simulada).',
      status: 'registrado', seenAt: null, followUps: [], createdAt: at(-2, '10:35'),
    },
    {
      id: 'inc_mateo_1', studentId: 's_mateo', teacherId: DEMO_TEACHER_ID, category: 'actividad', at: at(-5, '10:15'),
      notes: 'Durante educación física Mateo pidió detenerse porque se sentía cansado.',
      actions: 'Se detuvo la actividad, se siguió su plan individual y se avisó a la familia.',
      status: 'seguimiento', seenAt: at(-5, '12:00'),
      followUps: [{ id: 'f1', by: 'u_fam_rosa', at: at(-5, '18:00'), text: 'Gracias por avisar. Lo comentamos con su equipo de salud en el control.' }],
      createdAt: at(-5, '10:30'),
    },
  ];

  /* ---------- Observaciones escolares ---------- */
  s.observations = [
    { id: 'obs1', studentId: 's_juan', authorId: DEMO_TEACHER_ID, at: at(-1, '11:30'), text: 'Participó con entusiasmo en la clase de ciencias. Tomó su merienda a la hora indicada.' },
    { id: 'obs2', studentId: 's_mateo', authorId: DEMO_TEACHER_ID, at: at(-3, '11:00'), text: 'Presentó su proyecto en la feria de ciencias.' },
  ];

  /* ---------- Notificaciones ---------- */
  s.notifications = [
    { id: 'n1', userId: DEMO_FAMILY_ID, type: 'incidente', title: 'Incidente escolar registrado', body: 'Juan · Malestar durante la jornada. Revisá el detalle.', route: '/incidentes/inc_juan_1', at: at(-2, '10:35'), read: false, ref: 'inc_juan_1' },
    { id: 'n2', userId: DEMO_FAMILY_ID, type: 'mensaje', title: 'Nuevo mensaje de Laura Martínez', body: 'Esta semana tenemos educación física el martes y el jueves…', route: `/mensajes/${conv('s_juan')}`, at: recentIso, read: false, ref: 'm4' },
    { id: 'n3', userId: DEMO_FAMILY_ID, type: 'glucosa', title: 'Registro por encima de la meta del plan', body: 'Juan · 196 mg/dL. Consultá el Plan GlucoCompartido.', route: '/glucosa', at: at(-1, '15:30'), read: true },
    { id: 'n4', userId: DEMO_TEACHER_ID, type: 'mensaje', title: 'Nuevo mensaje de Rosa Ruiz', body: 'Gracias, profe. Mañana Mateo tiene control médico…', route: `/mensajes/${conv('s_mateo')}`, at: at(-1, '18:00'), read: false, ref: 'm6' },
    { id: 'n5', userId: DEMO_TEACHER_ID, type: 'plan', title: 'Plan de Juan actualizado (versión 3)', body: 'Revisá la nueva versión y confirmá la lectura.', route: '/plan/s_juan', at: at(-5, '19:30'), read: false },
  ].filter((n) => new Date(n.at) <= now);

  /* ---------- Progreso educativo ---------- */
  const done = (d, best = 3, attempts = 1) => ({ best, attempts, completed: true, completedAt: at(d, '17:00'), lastAt: at(d, '17:00') });
  s.progress = {
    s_juan: {
      topics: { alimentos: done(-20), insulina: done(-15, 2), glucosa: done(-9), actividad: done(-4, 3) },
      lessonsOpened: { alimentos: at(-20, '16:50'), insulina: at(-15, '16:50'), glucosa: at(-9, '16:50'), actividad: at(-4, '16:50') },
      stories: {},
      achievements: { 'primer-paso': at(-20, '16:50'), explorador: at(-20, '17:00'), alimentacion: at(-20, '17:00'), mitad: at(-9, '17:00'), 'super-activo': at(-4, '17:00') },
    },
    s_lucia: {
      topics: { glucosa: done(-12) },
      lessonsOpened: { glucosa: at(-12, '16:50') },
      stories: {},
      achievements: { 'primer-paso': at(-12, '16:50'), explorador: at(-12, '17:00') },
    },
    s_mateo: {
      topics: { alimentos: done(-10), ayuda: done(-6) },
      lessonsOpened: { alimentos: at(-10, '16:50'), ayuda: at(-6, '16:50') },
      stories: { 'gluki-recreo': at(-7, '10:00') },
      achievements: { 'primer-paso': at(-10, '16:50'), explorador: at(-10, '17:00'), alimentacion: at(-10, '17:00'), cuentacuentos: at(-7, '10:00') },
    },
    s_sofia: {
      topics: { alimentos: done(-14), habitos: done(-8), ayuda: done(-3) },
      lessonsOpened: { alimentos: at(-14, '16:50'), habitos: at(-8, '16:50'), ayuda: at(-3, '16:50') },
      stories: {},
      achievements: { 'primer-paso': at(-14, '16:50'), explorador: at(-14, '17:00'), alimentacion: at(-14, '17:00'), mitad: at(-3, '17:00') },
    },
  };

  /* ---------- Suscripciones ---------- */
  const trialStart = at(-12, '09:00');
  s.subscriptions = {
    [DEMO_FAMILY_ID]: { status: 'prueba', trialStart, trialEnd: addMonthsDays(trialStart, 30), activation: null, renews: true, history: [] },
    u_fam_rosa: { status: 'activo', trialStart: at(-80, '09:00'), trialEnd: addMonthsDays(at(-80, '09:00'), 30), activation: { at: at(-50, '09:00'), mode: 'fin_prueba', billingStart: addMonthsDays(at(-80, '09:00'), 30), nextBilling: addMonths(addMonthsDays(at(-80, '09:00'), 30), 2) }, renews: true, history: [] },
    u_fam_pedro: { status: 'prueba', trialStart: at(-20, '09:00'), trialEnd: addMonthsDays(at(-20, '09:00'), 30), activation: null, renews: true, history: [] },
  };

  /* ---------- Lecturas de formación y preferencias ---------- */
  s.resourcesRead = { [DEMO_TEACHER_ID]: { 'plan-compartido': at(-25, '15:00'), 'senales-aula': at(-24, '15:00') } };
  s.prefs = { [DEMO_FAMILY_ID]: { reminderAlerts: true, reduceMotion: false }, [DEMO_TEACHER_ID]: { reminderAlerts: false, reduceMotion: false } };
  return s;
}

function addMonthsDays(iso, days) { return new Date(new Date(iso).getTime() + days * 86400000).toISOString(); }
export { addMonthsDays as addDaysIso };
