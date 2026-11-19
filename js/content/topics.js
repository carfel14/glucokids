/* =========================================================
   GlucoAprende · Temas, lecciones y cuestionarios
   Contenido educativo general. No sustituye las indicaciones del equipo de salud.
   Regla para completar un tema: acertar al menos 2 de 3 preguntas.
   ========================================================= */

export const PASS_SCORE = 2;

export const TOPICS = [
  {
    id: 'alimentos',
    title: 'Alimentos y carbohidratos',
    short: 'Alimentos y carbohidratos',
    tone: 'familia',
    icon: 'apple',
    goal: 'Reconocer alimentos y comprender que la alimentación forma parte del cuidado.',
    sections: [
      { h: 'La comida nos da energía', p: 'Los alimentos le dan a tu cuerpo la energía que necesita para jugar, aprender y crecer. Por eso comer a tiempo es importante.' },
      { h: '¿Qué son los carbohidratos?', p: 'Son una parte de los alimentos que el cuerpo convierte en glucosa, un tipo de azúcar que da energía. Hay carbohidratos en el arroz, el pan, las tortillas, las frutas, la leche y los dulces.' },
      { h: 'Comer también es cuidarte', p: 'Las personas con diabetes pueden disfrutar muchos alimentos. Tu familia y tu equipo de salud te ayudan a saber qué comer, cuánto y a qué hora, según tu plan.' },
      { h: 'En la escuela', p: 'Si tu plan dice que tenés merienda a cierta hora y todavía no comiste, avisale a tu maestra o maestro. ¡Ellos te van a ayudar!' },
    ],
    key: 'La comida da energía y forma parte de tu cuidado. Tu plan te ayuda a saber qué y cuándo comer.',
    quiz: [
      { q: '¿Para qué nos sirven los alimentos?', options: ['Para tener energía para jugar y aprender', 'Solo para pasar el rato', 'Para dormir más tiempo'], answer: 0, explain: 'Los alimentos le dan energía a tu cuerpo para todo lo que hacés en el día.' },
      { q: '¿Cuál de estos tiene carbohidratos?', options: ['El agua', 'El arroz', 'El aire'], answer: 1, explain: 'El arroz tiene carbohidratos. El agua no tiene, ¡pero es muy importante tomarla!' },
      { q: '¿Quién te ayuda a saber qué y cuándo comer?', options: ['Un compañero de clase', 'Nadie, lo decido solo', 'Mi familia y mi equipo de salud, según mi plan'], answer: 2, explain: 'Tu familia y tu equipo de salud preparan tu plan para que comas lo que tu cuerpo necesita.' },
    ],
  },
  {
    id: 'insulina',
    title: 'Mi insulina',
    short: 'Mi insulina',
    tone: 'escuela',
    icon: 'syringe',
    goal: 'Comprender de forma general su función y la importancia de seguir las indicaciones del equipo de salud.',
    sections: [
      { h: 'Una llave para la energía', p: 'La insulina funciona como una llave: ayuda a que la glucosa entre a las células del cuerpo y se convierta en energía.' },
      { h: '¿Por qué algunas personas la necesitan?', p: 'En la diabetes tipo 1 el cuerpo ya no produce insulina, por eso hay que recibirla. En la diabetes tipo 2 el cuerpo no la usa bien; algunas personas usan otros medicamentos y otras también usan insulina.' },
      { h: 'Siempre según las indicaciones', p: 'La cantidad y el momento los decide tu equipo de salud. Nunca cambies tu insulina por tu cuenta. Si tenés dudas, preguntale a un adulto de confianza.' },
      { h: 'No es un castigo', p: 'Recibir insulina es una forma de cuidar tu cuerpo, igual que cepillarte los dientes o dormir bien. ¡Muchos niños lo hacen todos los días!' },
    ],
    key: 'La insulina ayuda a que el cuerpo use la glucosa. Las indicaciones las da el equipo de salud.',
    quiz: [
      { q: '¿Qué hace la insulina?', options: ['Ayuda a que la glucosa se use como energía', 'Hace que crezca el pelo', 'Quita la sed'], answer: 0, explain: 'La insulina es como una llave que deja entrar la glucosa a las células para dar energía.' },
      { q: '¿Quién decide cuánta insulina se usa?', options: ['Yo, cuando quiero', 'Mi equipo de salud, y mi familia sigue esas indicaciones', 'Un compañero de clase'], answer: 1, explain: 'Las indicaciones las da tu equipo de salud. Tu familia y vos las siguen juntos.' },
      { q: 'Si tenés dudas sobre tu insulina, ¿qué hacés?', options: ['Me quedo callado', 'La cambio yo solo', 'Le pregunto a un adulto de confianza'], answer: 2, explain: 'Preguntar está muy bien. Los adultos de confianza te ayudan a resolver tus dudas.' },
    ],
  },
  {
    id: 'glucosa',
    title: 'Conocer mi glucosa',
    short: '¿Cómo es mi glucosa?',
    tone: 'aprende',
    icon: 'droplet',
    goal: 'Entender qué representa una medición y cuándo pedir ayuda.',
    sections: [
      { h: '¿Qué es la glucosa?', p: 'Es el azúcar que viaja por la sangre y le da energía a tu cuerpo. A lo largo del día sube y baja.' },
      { h: '¿Qué es una medición?', p: 'Con un medidor o un sensor se ve cuánta glucosa hay en tu sangre en ese momento. El número es un dato que ayuda a los adultos a seguir tu plan. ¡No es una nota de examen!' },
      { h: 'Tu meta es personal', p: 'Tu equipo de salud define un rango meta solo para vos. Cada niño tiene su propio plan, por eso no hace falta compararse.' },
      { h: '¿Cuándo pedir ayuda?', p: 'Si te sentís raro, con temblor, sudor, mareo, mucha hambre, mucha sed o cansancio, avisale enseguida a un adulto.' },
    ],
    key: 'Medir la glucosa da información para seguir tu plan. Si te sentís mal, avisá a un adulto.',
    quiz: [
      { q: '¿Qué es la glucosa?', options: ['Un juego de mesa', 'El azúcar que da energía al cuerpo', 'Un tipo de zapato'], answer: 1, explain: 'La glucosa es el azúcar que viaja en tu sangre y te da energía.' },
      { q: 'El número de una medición es...', options: ['Un dato para que los adultos sigan tu plan', 'Una nota de examen', 'Una señal de que te portaste mal'], answer: 0, explain: 'El número solo es información. Nunca es un premio ni un castigo.' },
      { q: 'Si te sentís mareado o con temblor, ¿qué hacés?', options: ['Sigo jugando sin decir nada', 'Me escondo', 'Le aviso a un adulto enseguida'], answer: 2, explain: '¡Muy bien! Avisar a tiempo ayuda a que los adultos sigan tu plan.' },
    ],
  },
  {
    id: 'actividad',
    title: 'Actividad física y diabetes',
    short: 'Actividad física y diabetes',
    tone: 'lilac',
    icon: 'run',
    goal: 'Aprender sobre participación, preparación y acompañamiento.',
    sections: [
      { h: '¡A moverse!', p: 'Jugar, correr, bailar y hacer deporte es bueno para todos los niños, también para quienes tienen diabetes.' },
      { h: 'Prepararse', p: 'Antes de educación física, tu plan puede indicar medir la glucosa o comer algo. Tu familia y tu docente conocen lo que dice tu plan.' },
      { h: 'Llevá lo necesario', p: 'Agua, tu merienda y lo que indique tu plan deben estar cerca cuando hacés actividad física.' },
      { h: 'Escuchá a tu cuerpo', p: 'Si mientras jugás te sentís raro, pará y avisale a un adulto. Volvés a jugar cuando un adulto te diga que está bien.' },
    ],
    key: 'Podés jugar y hacer deporte. Prepararte según tu plan y avisar si te sentís raro te mantiene seguro.',
    quiz: [
      { q: '¿Pueden los niños con diabetes hacer deporte?', options: ['No, nunca', 'Sí, con la preparación que indica su plan', 'Solo los fines de semana'], answer: 1, explain: '¡Claro que sí! Con la preparación de su plan, pueden participar como todos.' },
      { q: 'Si te sentís raro mientras jugás, ¿qué hacés?', options: ['Paro y le aviso a un adulto', 'Corro más rápido', 'No le digo a nadie'], answer: 0, explain: 'Parar y avisar es lo correcto. Un adulto te va a ayudar.' },
      { q: '¿Qué es bueno tener cerca al hacer actividad física?', options: ['Un juguete nuevo', 'Nada', 'Agua y lo que indique mi plan'], answer: 2, explain: 'Tener agua y lo que indica tu plan cerca te ayuda a estar preparado.' },
    ],
  },
  {
    id: 'habitos',
    title: 'Hábitos saludables',
    short: 'Hábitos saludables',
    tone: 'red',
    icon: 'moon',
    goal: 'Rutinas, descanso y cuidado cotidiano.',
    sections: [
      { h: 'Rutinas que ayudan', p: 'Tener horarios para comer, jugar, estudiar y dormir ayuda a tu cuerpo a organizarse mejor.' },
      { h: 'Dormir bien', p: 'Descansar te da energía para el día siguiente. Antes de dormir, seguí la rutina que acordaste con tu familia.' },
      { h: 'Manos limpias', p: 'Lavate las manos con agua y jabón antes de comer y después de ir al baño. Así evitás enfermarte.' },
      { h: 'Agua y emociones', p: 'Tomar agua y hablar de cómo te sentís también es parte del cuidado. Está bien sentirse cansado o preocupado a veces.' },
    ],
    key: 'Rutinas, buen descanso, manos limpias y hablar de tus emociones te ayudan todos los días.',
    quiz: [
      { q: '¿Por qué ayudan las rutinas?', options: ['Porque el cuerpo se organiza mejor con horarios', 'Porque son aburridas', 'No ayudan'], answer: 0, explain: 'Los horarios ayudan a tu cuerpo a saber qué esperar durante el día.' },
      { q: '¿Cuándo es importante lavarse las manos?', options: ['Nunca', 'Solo los domingos', 'Antes de comer'], answer: 2, explain: 'Lavarte las manos antes de comer evita que los microbios entren a tu cuerpo.' },
      { q: 'Si te sentís triste o preocupado, ¿qué podés hacer?', options: ['Guardármelo siempre', 'Hablar con alguien de confianza', 'Enojarme con todos'], answer: 1, explain: 'Hablar con alguien de confianza ayuda. Tus emociones son importantes.' },
    ],
  },
  {
    id: 'ayuda',
    title: 'Pedir ayuda',
    short: '¿Qué hacer si me siento mal?',
    tone: 'escuela',
    icon: 'hand',
    goal: 'Reconocer que debe avisar a un adulto cuando se siente mal.',
    sections: [
      { h: 'Pedir ayuda es de valientes', p: 'Cuando algo no está bien, decirlo a tiempo es lo más valiente e inteligente que podés hacer.' },
      { h: 'Señales para avisar', p: 'Temblor, sudor, mareo, mucha hambre, dolor de cabeza, mucha sed, mucho cansancio o simplemente sentirte "raro".' },
      { h: '¿A quién le aviso?', p: 'A tu maestra o maestro, a otro adulto de la escuela o a tu familia. Conocé quiénes son tus adultos de confianza en cada lugar.' },
      { h: 'Decilo claro', p: 'Podés decir: "Me siento mal, tengo diabetes y necesito ayuda". Los adultos van a seguir lo que dice tu plan.' },
    ],
    key: 'Si te sentís mal, avisá enseguida a un adulto de confianza. Pedir ayuda es de valientes.',
    quiz: [
      { q: 'Pedir ayuda es...', options: ['De valientes', 'De miedosos', 'Prohibido'], answer: 0, explain: '¡Exacto! Pedir ayuda a tiempo es de valientes.' },
      { q: '¿A quién podés avisar en la escuela?', options: ['A nadie', 'A mi maestra, maestro u otro adulto de la escuela', 'Solo a un compañero más pequeño'], answer: 1, explain: 'Los adultos de la escuela pueden ayudarte y seguir tu plan.' },
      { q: '¿Qué podés decir si te sentís mal?', options: ['"Estoy bien", aunque me sienta mal', 'Nada', '"Me siento mal, tengo diabetes y necesito ayuda"'], answer: 2, explain: 'Decirlo claro ayuda a que te atiendan rápido.' },
    ],
  },
];

export const topicById = (id) => TOPICS.find((t) => t.id === id);
