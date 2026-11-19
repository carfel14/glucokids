/* =========================================================
   Biblioteca de recursos (lecturas, cuento, actividad y fichas imprimibles).
   Redactado de forma general a partir de CDC "Managing Diabetes at School",
   CDC "Low Blood Sugar (Hypoglycemia)" y ADA "Diabetes Medical Management Plan".
   No contiene pautas de tratamiento: remite siempre al plan individual.
   ========================================================= */

export const SOURCES = {
  cdcSchool: { label: 'CDC · Managing Diabetes at School (2024)', url: 'https://www.cdc.gov/diabetes/caring/managing-diabetes-at-school.html' },
  cdcLow: { label: 'CDC · Low Blood Sugar (Hypoglycemia) (2024)', url: 'https://www.cdc.gov/diabetes/about/low-blood-sugar-hypoglycemia.html' },
  adaDmmp: { label: 'ADA · Diabetes Medical Management Plan', url: 'https://diabetes.org/advocacy/safe-at-school-state-laws/diabetes-medical-management-plan' },
};

export const AUDIENCES = { familias: 'Familias', docentes: 'Docentes', ninos: 'Niñas y niños' };
export const RES_TOPICS = {
  plan: 'Plan individual', escuela: 'Vida escolar', senales: 'Señales y actuación', actividad: 'Actividad física',
  comunicacion: 'Comunicación', emociones: 'Emociones', autocuidado: 'Autocuidado',
};
export const RES_TYPES = { lectura: 'Lectura', cuento: 'Cuento', actividad: 'Actividad', ficha: 'Ficha imprimible' };

export const RESOURCES = [
  {
    id: 'plan-compartido', title: '¿Qué es el Plan GlucoCompartido?', type: 'lectura', audience: ['familias', 'docentes'], topic: 'plan', minutes: 4, training: true,
    summary: 'Qué información reúne el plan individual, quién lo prepara y cómo se comparte con la escuela.',
    body: [
      { p: 'Cada estudiante con diabetes maneja su condición de forma distinta. Por eso, antes del año escolar, la familia se reúne con el equipo de salud para preparar un plan individual de cuidados. En otros países este documento se conoce como Diabetes Medical Management Plan (DMMP).' },
      { h: '¿Qué suele incluir un plan individual?' },
      { list: ['El rango meta de glucosa definido por el equipo de salud.', 'Si el estudiante necesita ayuda para medir su glucosa.', 'Las señales propias de glucosa baja o alta que suele presentar.', 'Cómo actuar ante esas situaciones, según lo indicado por el equipo de salud.', 'Los medicamentos que utiliza (por ejemplo, insulina u otros).', 'Los horarios de comidas y meriendas, también para eventos especiales.', 'Cómo participar en actividad física y deportes.'] },
      { h: '¿Qué hace GlucoKids con el plan?' },
      { p: 'GlucoKids organiza en un solo lugar la información que la familia comparte con la escuela: contactos, rutina escolar, meta registrada y la actuación indicada. La plataforma no genera indicaciones médicas ni calcula dosis: muestra lo que la familia registró a partir del plan de su equipo de salud.' },
      { h: 'Actualización' },
      { p: 'El plan debe revisarse cada año o cuando cambie el tratamiento, el nivel de autocuidado o la situación escolar. En GlucoKids cada actualización crea una nueva versión y el docente puede confirmar que leyó la versión vigente.' },
    ],
    sources: ['cdcSchool', 'adaDmmp'],
  },
  {
    id: 'preparar-anio', title: 'Preparar el año escolar: lista para familias', type: 'lectura', audience: ['familias'], topic: 'escuela', minutes: 5,
    summary: 'Pasos prácticos para coordinar con la escuela antes de que empiecen las clases.',
    body: [
      { p: 'Volver a la rutina escolar requiere un poco más de preparación para niñas y niños con diabetes. Estos pasos ayudan a que todas las personas responsables conozcan el plan.' },
      { h: 'Antes de iniciar clases' },
      { steps: ['Revisá con el equipo de salud el plan individual vigente.', 'Visitá la escuela y repasá el plan con la dirección y con cada docente.', 'Acordá las reglas del aula: ¿puede salir sin pedir permiso? ¿puede comer en clase si lo necesita?', 'Conversá con el docente de educación física sobre lo que tu hija o hijo necesita para participar.', 'Verificá que los contactos de emergencia estén actualizados.'] },
      { h: 'Lista para la mochila' },
      { p: 'Prepará con tu hija o hijo una lista diaria. Incluí lo que indique su plan, por ejemplo: los materiales para medir la glucosa, agua, su merienda y los alimentos de acción rápida que el equipo de salud haya indicado.' },
      { h: 'Ideas para el día a día' },
      { list: ['Que sepa a quién acudir en la escuela si se siente mal.', 'Que conozca dónde y cuándo medir su glucosa si necesita ayuda.', 'Usar una identificación médica si el equipo de salud lo recomienda.'] },
    ],
    sources: ['cdcSchool'],
  },
  {
    id: 'senales-aula', title: 'Señales de alerta en el aula', type: 'lectura', audience: ['docentes'], topic: 'senales', minutes: 5, training: true,
    summary: 'Cómo reconocer señales de glucosa baja o alta y cuándo pedir ayuda urgente.',
    body: [
      { note: 'Las señales varían en cada estudiante. Su Plan GlucoCompartido describe las que suele presentar y la actuación indicada por su equipo de salud.' },
      { h: 'Posibles señales de glucosa baja' },
      { list: ['Temblor o sudor.', 'Nerviosismo, ansiedad o irritabilidad.', 'Confusión o dificultad para concentrarse.', 'Mareo.', 'Hambre repentina.', 'Latidos rápidos.'] },
      { p: 'Algunas personas no presentan señales claras. Por eso conviene conocer al estudiante y prestar atención a cambios en su comportamiento: muchas veces el docente lo nota antes que el propio estudiante.' },
      { h: 'Posibles señales de glucosa alta' },
      { list: ['Mucha sed.', 'Ganas frecuentes de ir al baño.', 'Cansancio.', 'Visión borrosa o dolor de cabeza.'] },
      { h: 'Qué hacer en el aula' },
      { steps: ['No dejes solo al estudiante.', 'Seguí los pasos de su plan individual (consultalo en GlucoKids o en la copia entregada a la dirección).', 'Avisá a la persona designada en la escuela y a la familia.', 'Registrá lo ocurrido como incidente u observación para el seguimiento.'] },
      { h: 'Requiere ayuda urgente' },
      { danger: 'Si el estudiante no responde, se desmaya, tiene convulsiones o no puede tragar, pedí ayuda de emergencia de inmediato y avisá a la familia. Luego seguí lo que indique su plan.' },
    ],
    sources: ['cdcLow', 'cdcSchool'],
  },
  {
    id: 'inclusion-aula', title: 'Inclusión y participación en clase', type: 'lectura', audience: ['docentes'], topic: 'escuela', minutes: 4, training: true,
    summary: 'Acuerdos de aula que facilitan el autocuidado sin exponer al estudiante.',
    body: [
      { p: 'Cada estudiante es distinto y cada docente también. Conversar con la familia al inicio del año facilita el autocuidado y evita malentendidos.' },
      { h: 'Acuerdos útiles' },
      { list: ['Permitir salir del aula o comer una merienda cuando el plan lo indique.', 'Tener a mano agua y lo indicado en el plan durante evaluaciones y salidas.', 'Informar con anticipación sobre excursiones, actos o cambios de horario.', 'Coordinar con quien cubre el aula cuando el docente se ausenta.'] },
      { h: 'Hablar de diabetes en clase' },
      { p: 'Si la familia está de acuerdo, se puede explicar al grupo qué es la diabetes y qué se hace cada día, sin señalar a ningún estudiante. El cuento "Gluki y el recreo" puede servir como punto de partida.' },
    ],
    sources: ['cdcSchool'],
  },
  {
    id: 'educacion-fisica', title: 'Educación física con estudiantes con diabetes', type: 'lectura', audience: ['docentes', 'familias'], topic: 'actividad', minutes: 3, training: true,
    summary: 'Coordinación para que el estudiante participe de forma plena y segura.',
    body: [
      { p: 'Niñas y niños con diabetes necesitan moverse y jugar como cualquier estudiante. La actividad física influye en la glucosa, por eso el plan individual indica cómo prepararse.' },
      { h: 'Antes de la clase' },
      { list: ['Revisar en el plan si se indica medir la glucosa o comer algo antes.', 'Tener cerca agua y lo que indique el plan.', 'Saber a quién avisar si el estudiante se siente mal.'] },
      { h: 'Durante la clase' },
      { p: 'Observá señales de alerta y permití que el estudiante se detenga a avisar. Volvé a la actividad cuando la persona responsable lo indique según el plan.' },
    ],
    sources: ['cdcSchool'],
  },
  {
    id: 'comunicacion', title: 'Comunicación familia–escuela', type: 'lectura', audience: ['familias', 'docentes'], topic: 'comunicacion', minutes: 3, training: true,
    summary: 'Buenas prácticas para coordinar el día a día con mensajes claros.',
    body: [
      { p: 'Los mensajes de GlucoKids sirven para coordinar: confirmar una merienda, avisar un cambio de horario o compartir una observación. No reemplazan la comunicación inmediata en una emergencia ni la consulta con el equipo de salud.' },
      { h: 'Recomendaciones' },
      { list: ['Mensajes breves y concretos, con fecha y hora cuando corresponda.', 'Indicar si se actualizó el plan para que el docente lo revise.', 'Evitar consejos clínicos por mensaje: las indicaciones vienen del plan individual.', 'Agradecer y confirmar la lectura para cerrar cada conversación.'] },
    ],
  },
  {
    id: 'emociones', title: 'Hablar de las emociones', type: 'lectura', audience: ['familias'], topic: 'emociones', minutes: 3,
    summary: 'Acompañar lo que siente tu hija o hijo frente a la diabetes.',
    body: [
      { p: 'Es normal que niñas y niños sientan cansancio, enojo o preocupación por las rutinas de cuidado. Escuchar sin juzgar ayuda a que confíen y pidan ayuda a tiempo.' },
      { list: ['Preguntá cómo se sintió en la escuela, no solo por los registros.', 'Celebrá el esfuerzo y el aprendizaje, no los números.', 'Si notás tristeza o ansiedad persistente, comentalo con su equipo de salud.'] },
    ],
  },
  {
    id: 'ficha-contactos', title: 'Ficha imprimible: datos de contacto y plan', type: 'ficha', audience: ['familias', 'docentes'], topic: 'plan', minutes: 2,
    summary: 'Una hoja para completar a mano y dejar en la dirección o en el aula.',
    form: {
      intro: 'Completá esta ficha con la familia y guardala junto a la copia del plan individual firmado por el equipo de salud.',
      fields: ['Nombre del estudiante', 'Grado y sección', 'Docente guía', 'Persona responsable 1 y teléfono', 'Persona responsable 2 y teléfono', 'Centro de salud de referencia', 'Número de emergencias local', 'Dónde se guarda la copia del plan', 'Fecha de la última actualización del plan'],
    },
  },
  {
    id: 'ficha-observaciones', title: 'Ficha imprimible: registro de observaciones escolares', type: 'ficha', audience: ['docentes'], topic: 'escuela', minutes: 2,
    summary: 'Tabla para anotar observaciones cuando no hay un dispositivo disponible.',
    table: { intro: 'Usala si no tenés un dispositivo a mano. Luego podés pasar la información a GlucoKids.', head: ['Fecha', 'Hora', 'Observación', 'Acciones realizadas', 'Familia avisada (sí/no)'], rows: 8 },
  },
  {
    id: 'cuento-gluki', title: 'Cuento: Gluki y el recreo', type: 'cuento', audience: ['ninos', 'docentes', 'familias'], topic: 'autocuidado', minutes: 5,
    summary: 'Un cuento interactivo sobre avisar a un adulto cuando algo no se siente bien.', story: 'gluki-recreo',
  },
  {
    id: 'actividad-mochila', title: 'Actividad: Mi mochila lista', type: 'actividad', audience: ['ninos', 'familias'], topic: 'autocuidado', minutes: 3,
    summary: 'Elegí qué cosas van en la mochila para un día de escuela.',
    activity: {
      prompt: 'Tocá las cosas que deberían ir en tu mochila para un día de escuela.',
      items: [
        { label: 'Agua', ok: true, why: 'Tomar agua es importante durante el día.' },
        { label: 'La merienda que indica mi plan', ok: true, why: 'Tu merienda te da energía a la hora indicada.' },
        { label: 'Lo que indica mi plan para medir la glucosa', ok: true, why: 'Tu familia y tu docente saben qué materiales necesitás.' },
        { label: 'Tarjeta con los contactos de mi familia', ok: true, why: 'Así los adultos pueden avisar rápido.' },
        { label: 'Una consola de videojuegos', ok: false, why: 'Mejor dejarla en casa: no es necesaria para tu cuidado.' },
        { label: 'Muchos dulces para compartir', ok: false, why: 'Los alimentos de la mochila son los que indica tu plan.' },
      ],
    },
  },
];

export const resourceById = (id) => RESOURCES.find((r) => r.id === id);
export const trainingResources = () => RESOURCES.filter((r) => r.training);
