/* =========================================================
   Cuento interactivo: "Gluki y el recreo"
   Mensaje central: avisar a un adulto a tiempo. No describe tratamientos.
   ========================================================= */

export const STORIES = [
  {
    id: 'gluki-recreo',
    title: 'Gluki y el recreo',
    summary: 'Un cuento interactivo sobre avisar a tiempo cuando algo no se siente bien.',
    pages: [
      { scene: 1, text: 'Es día de escuela. Gluki, el dinosaurio verde, llega con su mochila. Adentro lleva su merienda, agua y lo que indica su plan.' },
      {
        scene: 2,
        text: 'En el recreo, Gluki juega a la pelota con sus amigos. De repente se siente raro: le tiemblan las patas y tiene mucha hambre.',
        question: '¿Qué debería hacer Gluki?',
        choices: [
          { label: 'Seguir jugando sin decir nada', ok: false, feedback: 'Gluki intenta seguir, pero se siente peor. Avisar a tiempo es importante. ¡Probemos otra opción!' },
          { label: 'Avisarle a la maestra Tere', ok: true, feedback: '¡Buena decisión! Avisar a un adulto es lo más valiente.' },
        ],
      },
      { scene: 3, text: 'Gluki le dice a la maestra Tere: "Me siento mal, tengo diabetes". La maestra no lo deja solo y revisa su plan, como acordaron con su familia.' },
      {
        scene: 4,
        text: 'Siguiendo el plan, la maestra avisa a la familia de Gluki. Gluki descansa un momento junto a un adulto.',
        question: '¿Qué hizo bien Gluki?',
        choices: [
          { label: 'Esconderse para que nadie lo viera', ok: false, feedback: 'Esconderse no ayuda. ¡Pensalo otra vez!' },
          { label: 'Pedir ayuda a tiempo', ok: true, feedback: '¡Exacto! Pedir ayuda a tiempo permitió que los adultos siguieran su plan.' },
        ],
      },
      { scene: 5, text: 'Al rato, Gluki se siente mejor. Su amiga Lía le pregunta qué pasó y Gluki le explica qué es la diabetes. ¡Ahora Lía también sabe que hay que avisar a un adulto!' },
    ],
  },
];

export const storyById = (id) => STORIES.find((s) => s.id === id);
