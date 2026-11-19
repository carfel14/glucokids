# Registro de decisiones · GlucoKids

Pediste que no se supusiera nada sin comentarlo. Este documento separa las decisiones que **confirmaste** de las que **tomé yo** al implementar, con su motivo. Cualquiera se puede cambiar.

## A. Decisiones confirmadas por vos (18 nov 2026)

| # | Tema | Decisión |
|---|---|---|
| A1 | Logotipo | Se usó la versión sobre fondo claro del PDF y se quitó solo el fondo blanco (exterior y huecos de las letras "o" y "d"). Íconos PWA: la ilustración circular sobre cuadrado blanco. |
| A2 | Tipografía | Se descargó Nunito desde Google Fonts (OFL) a `assets/fonts`, sin dependencia externa. |
| A3 | Emergencias | No se muestra ningún número real. Campo "Número de emergencias local" configurable en el plan; contactos enmascarados; llamadas simuladas. |
| A4 | Datos demo | Familia con dos hijos: Juan (vinculado al docente) y Lucía (sin vincular, para CU-03). El docente ve a Juan, Mateo y Sofía. |
| A5 | Pago durante la prueba | El resumen da a elegir: "Al terminar la prueba" (total de hoy C$0) o "Ahora" (C$149 simulado; la prueba termina). |
| A6 | Meta de glucosa | La familia puede transcribir el rango indicado por su equipo de salud (con confirmación). Las demás secciones clínicas son de solo lectura; el docente nunca las edita. |
| A7 | Modo infantil | Lo pueden abrir la familia y el docente (para estudiantes vinculados). El progreso se guarda en el estudiante elegido. |

## B. Decisiones tomadas durante la implementación

### Idioma, formato y datos
1. **Español con voseo** (como en tu especificación y en Nicaragua): "Registrá", "Elegí".
2. **Horas en formato 24 h** ("12:30 h"), como en las referencias.
3. **Zona horaria America/Managua fija en UTC−6** (Nicaragua no aplica horario de verano).
4. **Nombres ficticios:** María López (familia demo, inspirada en la buyer persona del documento), Laura Martínez (docente), Rosa Ruiz (mamá de Mateo), Pedro Pineda (papá de Sofía), Carlos Pérez (papá de Juan), "Centro Escolar Los Girasoles". Perfil de ejemplo del registro: Ana Martínez y Diego Martínez, "Escuela Los Laureles".
5. **La docente atiende 3.er grado A y 4.º grado B**, para que el filtro por grado tenga sentido.
6. **Estados iniciales pensados para la presentación:** el plan de Juan está en versión 3 y la docente leyó la 2 (para mostrar "He leído esta versión"); la familia de Sofía no comparte el historial de glucosa (para mostrar permisos); la familia demo está en el día 12 de su prueba.
7. **Correos `@glucokids.demo`:** dominio inexistente, para no usar direcciones reales.
8. **Referencias copiadas** a `Proyecto_emprendedores/referencias/` (las originales estaban en una carpeta temporal). No se modificaron.

### Identidad visual
9. **Iconos SVG propios** de trazo uniforme; no se usan emojis.
10. **Sin logotipos de marcas externas** (Google, Apple, Microsoft, Visa, PayPal, Mercado Pago): se muestran como texto para no reproducir marcas registradas.
11. **Mascota "Gluki"** (dinosaurio verde en SVG propio) y la maestra "Tere" en el cuento.
12. **Ilustración principal** de portada e inicio: recorte de la ilustración del propio logotipo.
13. **El pie de página no menciona la universidad**, para no sugerir un aval institucional.

### Reglas funcionales
14. **Validación de glucosa:** enteros entre 20 y 600 mg/dL (rango de lectura habitual de un medidor), sin mediciones futuras. Observaciones hasta 280 caracteres.
15. **Meta transcrita:** enteros entre 40 y 400; el mínimo debe ser menor que el máximo.
16. **Código de invitación** `GK-XXXXXX`: un solo uso, vence a los 7 días; generar uno nuevo reemplaza al anterior.
17. **Permisos por vinculación:** "Ver historial de glucosa" y "Ver recordatorios". El plan y los contactos siempre se comparten con docentes autorizados (es el propósito de la vinculación).
18. **Docente sin permiso de historial:** puede registrar mediciones y solo ve las que registró él/ella; la familia las ve todas.
19. **Docente:** consulta el plan, confirma lectura, registra mediciones, observaciones e incidentes y envía mensajes. No edita datos del estudiante ni del plan.
20. **Incidentes:** la familia confirma explícitamente "Visto por familiar"; cualquiera de los dos documenta el seguimiento (estado "Seguimiento documentado"). Abrir la notificación no cambia el estado.
21. **Mensajes:** Enter envía y Shift+Enter hace salto de línea. Las respuestas rápidas se insertan en el cuadro de texto (no se envían solas) para poder editarlas.
22. **Notificaciones internas** por: mensaje nuevo, incidente, seguimiento, glucosa fuera de la meta, plan actualizado, plan leído, solicitud/autorización/revocación de acceso, observación escolar y recordatorio.
23. **Recordatorios:** repetición "No se repite", "Todos los días" o "Días de semana". El completado es por fecha. Avisos internos cada 30 s solo para la familia y si la preferencia está activa. El calendario docente es de solo lectura.
24. **Cuestionarios:** 3 preguntas por tema; se completa con 2 aciertos. Cada visita al cuestionario inicia un intento nuevo; se guarda el mejor resultado.
25. **Logros (8):** Primer paso, Explorador de la salud, Alimentación saludable, Súper activo, Mitad del camino, Súper aprendiz, Amigo de los cuentos y Sigo intentando. Ninguno depende de valores de glucosa.
26. **Puerta para adultos** del modo infantil: una suma sencilla.
27. **Pago simulado:** tarjeta de prueba `4242 4242 4242 4242` en campos de solo lectura; nada se guarda (tampoco el CVV). PayPal y Mercado Pago son opciones visuales. El resultado lo elige el control de demostración; procesamiento de 1,4 s. Tras un rechazo se vuelven a pedir los datos de prueba.
28. **Sin bloqueos comerciales:** si la prueba vence, solo aparece un aviso; plan, contactos y protocolos siguen accesibles.
29. **Planes institucionales:** "Precio por definir", sin botón de contacto.
30. **CSV con separador ";" y BOM UTF-8** para que Excel en español lo abra con acentos y columnas correctas.
31. **La vista imprimible enmascara los teléfonos**, igual que el resto de la demo.
32. **Registro:** la contraseña solo existe en memoria durante el registro; si se recarga a mitad del proceso se vuelve a pedir. "Cargar perfil de ejemplo" rellena el formulario; "Cargar datos de ejemplo" es una casilla aparte, desmarcada por defecto, para que una cuenta nueva muestre estados vacíos.
33. **El selector de estudiante se sincroniza con la ruta** (por ejemplo, al abrir `#/plan/s_lucia`).
34. **Búsqueda:** página de resultados al presionar Enter (sin autocompletado), limitada a lo que el perfil puede ver.
35. **Sincronización entre pestañas** con el evento `storage`: cada pestaña tiene su sesión y ve los cambios de la otra.
36. **Service worker con red primero** y respaldo en caché, para no mostrar archivos desactualizados durante la presentación.

## C. Limitaciones conocidas

- **Sin backend:** las reglas de acceso son controles de navegación del prototipo, no seguridad real.
- **Sin comunicación entre dispositivos:** familia y docente solo se "comunican" dentro del mismo navegador (mismo perfil o dos pestañas).
- **Recordatorios** solo mientras la app está abierta; no hay notificaciones push.
- **Pagos, llamadas, recuperación de contraseña e inicio con Google/Apple/Microsoft** son simulaciones identificadas.
- **Campos de fecha y hora nativos:** su formato visual depende del idioma del navegador (por ejemplo, un navegador en inglés muestra 11/18/2026); los datos se guardan y muestran en español dentro de la app.
- **Contenido de salud general**, redactado a partir de CDC y ADA; no tiene validación profesional ni aval institucional.
- **Pruebas realizadas** en el navegador Chromium integrado (escritorio 1280 y 1440 px, tablet 768 px y móvil 390 y 360 px). No se probó en Safari, Firefox ni con lectores de pantalla reales.
- **La instalación PWA** depende del navegador; en iOS se instala desde "Compartir › Agregar a inicio".
