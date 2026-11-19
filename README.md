# GlucoKids · Prototipo funcional de alta fidelidad

Plataforma de educación, acompañamiento y coordinación del cuidado de niñas, niños y adolescentes con diabetes tipo 1 y tipo 2, orientada a familias y centros educativos de Managua, Nicaragua.

> **Demostración con datos ficticios.** No hay servidor, autenticación real, cobros, correos, SMS, WhatsApp, llamadas ni conexión con dispositivos médicos. El contenido de salud es general y remite siempre al plan individual indicado por el equipo de salud.

---

**Versión publicada:** https://carfel14.github.io/glucokids/ (GitHub Pages, rama `main`, carpeta raíz).

## 1. Cómo ejecutarlo

La app necesita un servidor estático (no funciona como PWA al abrir `index.html` con doble clic).

```bash
cd glucokids-prototipo
```

```bash
python -m http.server 5500
```

Luego abrí **http://localhost:5500** en Chrome o Edge.

Alternativa: abrir la carpeta `glucokids-prototipo` en VS Code y usar **Live Server**.

No requiere instalación de dependencias, compilación ni frameworks.

## 2. Cuentas demo

| Perfil | Correo | Contraseña |
|---|---|---|
| Familia (María López, mamá de Juan y Lucía) | `familia@glucokids.demo` | cualquiera (demostrativa) |
| Docente (Laura Martínez, 3.er grado A y 4.º grado B) | `docente@glucokids.demo` | cualquiera (demostrativa) |
| Otras familias ficticias | `rosa.ruiz@glucokids.demo`, `pedro.pineda@glucokids.demo` | cualquiera |

También podés usar los botones **"Entrar como familia demo"** y **"Entrar como docente demo"** en la pantalla de inicio de sesión, o **"Explorar demostración"** en la portada.

Para cambiar de perfil en cualquier momento usá el distintivo **"Demostración · datos ficticios" → Cuentas demo** (abajo a la izquierda). Los cambios compartidos se conservan.

**Modo infantil:** se abre desde una sesión adulta (GlucoAprende → "Abrir modo infantil"). Para salir, hay que resolver una suma sencilla (puerta para adultos).

## 3. Recorrido sugerido para presentar (≈ 10 minutos)

1. **Portada** (`#/inicio`): mensaje principal, tres módulos, planes. Botón "Explorar demostración".
2. **CU-01 · Acceso familiar:** entrar como familia → panel con Juan; el selector superior permite cambiar a Lucía. La familia no ve a Mateo ni a Sofía (probá `#/plan/s_mateo` → "Acceso no disponible").
3. **CU-02 · Registro de glucosa:** "Registrar glucosa" → valor, contexto, fecha y hora → se actualizan historial, gráfica, panel y contador de notificaciones. Si el valor queda fuera de la meta del plan, se genera una notificación para consultar el plan (sin diagnóstico).
4. **CU-03 · Compartir el plan:** Plan de Lucía → "Generar código" → cambiar a docente → GlucoEscuela → "Vincular estudiante" con el código → volver a familia → Configuración › Permisos → "Autorizar". Lucía aparece en el listado docente.
5. **CU-04 · Revocar:** familia revoca → como docente, Lucía desaparece y `#/escuela/estudiante/s_lucia` muestra "Acceso no disponible".
6. **CU-05 · Incidente:** docente → "Registrar incidente" (con acceso inmediato al plan y contactos) → cambiar a familia → la campana muestra la notificación → detalle → "Confirmar que lo vi" → documentar seguimiento.
7. **CU-06 · Mensajes:** familia escribe → docente abre la conversación (se marca "Leído") y responde.
8. **CU-07 · GlucoAprende:** abrir un tema → lección → cuestionario (aprobar con 2 de 3) → progreso y logros sin duplicar recompensas. Probar el cuento "Gluki y el recreo" y el modo infantil.
9. **CU-08 · Suscripción:** "Crear cuenta" → "Cargar perfil de ejemplo" → prueba de 30 días → Suscripción → "Activar Plan Familiar" → "Usar datos de prueba" → elegir activar al terminar la prueba (C$0 hoy) o ahora (C$149 simulado) → probar también "Simular pago rechazado".
10. **CU-09 · Recordatorio:** Calendario → "Nuevo recordatorio" → marcarlo completado → se refleja en el panel con opción "Deshacer".
11. **CU-10 · Persistencia:** recargar la página: los datos siguen.
12. **CU-11 · Reporte:** Reportes → estudiante y periodo → "Exportar CSV".
13. **CU-12 · Reinicio:** Configuración › Demostración → "Reiniciar datos demo" (con confirmación).

Tip: abrí dos pestañas (una como familia y otra como docente). Cada pestaña mantiene su propia sesión y los cambios se sincronizan entre ellas.

## 4. Estructura

| Archivo o carpeta | Responsabilidad |
|---|---|
| `index.html` | Documento principal y contenedor `#app`. |
| `css/tokens.css` | Paleta, tipografía Nunito local, espaciados, radios, sombras y movimiento. |
| `css/layout.css` | Estructuras (sitio público, área interna, modo infantil, impresión) y responsive. |
| `css/components.css` | Botones, tarjetas, formularios, modales, tablas, avisos, notificaciones, gráficas. |
| `css/pages.css` | Estilos particulares de cada vista. |
| `js/app.js` | Arranque, tabla de rutas, avisos internos de recordatorios, service worker. |
| `js/router.js` | Rutas con hash y comprobaciones de acceso por perfil (también al escribir la URL). |
| `js/store.js` | Estado común y persistencia (`localStorage` / `sessionStorage`, modo en memoria). |
| `js/seed.js` | Datos ficticios iniciales, relativos a la fecha de inicialización. |
| `js/data.js` | Consultas y reglas de acceso (selectores). |
| `js/actions.js` | Mutaciones: registros, vinculaciones, mensajes, incidentes, progreso, suscripción. |
| `js/components/` | Shell, modal accesible, toasts, gráfica SVG, formularios, recordatorios, instalación PWA. |
| `js/pages/` | Pantallas (público, acceso, panel, GlucoFamilia, glucosa, plan, GlucoEscuela, incidentes, mensajes, GlucoAprende, calendario, recursos, reportes, configuración, suscripción). |
| `js/content/` | Temas y cuestionarios, cuento interactivo, logros y biblioteca de recursos. |
| `assets/` | Logotipo con fondo transparente, ilustración, íconos PWA y fuente Nunito (OFL). |
| `manifest.webmanifest`, `sw.js` | Configuración PWA y caché versionada de recursos estáticos. |
| `DECISIONES.md` | Todas las decisiones tomadas y su justificación. |

## 5. Datos y almacenamiento

- Datos: `localStorage` con la clave versionada **`glucokids.demo.v1`**. Si está vacía se inicializa; si contiene datos válidos se respetan.
- Sesión de demostración: `sessionStorage` (`glucokids.session.v1`), por pestaña.
- Si el almacenamiento no está disponible, la app sigue funcionando en memoria y muestra un aviso.
- **Reiniciar:** Configuración › Demostración › "Reiniciar datos demo". Borra solo las claves que empiezan por `glucokids.` (nunca usa `localStorage.clear()`).
- Fechas en español, zona horaria **America/Managua** (UTC−6, sin horario de verano) y moneda **C$**.

## 6. PWA y funcionamiento sin conexión

- Probá desde `http://localhost:5500` (la instalación depende del navegador).
- El botón "Instalar aplicación" usa el evento `beforeinstallprompt`. Si el navegador no lo ofrece, se muestran instrucciones; nunca se finge la instalación.
- Tras una primera carga correcta, el service worker guarda los recursos en la caché `glucokids-static-v1` y la app abre sin conexión. Al actualizar la versión de caché solo se eliminan versiones antiguas de GlucoKids.
- Estrategia: red primero con respaldo en caché, para que la demo siempre muestre la versión más reciente cuando hay servidor.
- No hay sincronización entre dispositivos: los datos son locales a cada navegador.

## 7. Controles de acceso (importante)

Las reglas por perfil (familia, docente, modo infantil, vinculaciones activas, revocación) se comprueban en el enrutador y en las acciones, incluso al escribir una ruta directamente. **Son controles de navegación de un prototipo**, porque todo el estado vive en el navegador: no constituyen una autorización segura de producción. En una versión real deben validarse en un servidor.

## 8. Contenido de salud

- GlucoKids organiza información y educación: **no diagnostica, no calcula dosis, no recomienda cambios de medicamentos** y no presenta el registro manual como monitoreo continuo.
- Los datos clínicos de demostración están identificados como ficticios y son de solo lectura.
- Redacción general basada en: CDC "Managing Diabetes at School" (2024), CDC "Low Blood Sugar (Hypoglycemia)" (2024) y ADA "Diabetes Medical Management Plan". No se copiaron los protocolos simplificados de las imágenes de referencia ni cantidades o tiempos de tratamiento. No hay validación profesional ni aval institucional.
- No se muestra ningún número de emergencias real: cada plan tiene un campo "Número de emergencias local" configurable y las llamadas son simulaciones.

## 9. Créditos de recursos

- Logotipo e ilustración: extraídos del documento del proyecto (`Emprendedores (1).pdf`); solo se eliminó el fondo blanco, sin recolorear ni deformar.
- Fuente: Nunito (Google Fonts), licencia SIL Open Font License 1.1 (`assets/fonts/OFL.txt`).
- Mascota Gluki, escenas del cuento, ilustraciones de temas e iconos: SVG propios creados para este prototipo.

## 10. Limitaciones conocidas

Ver la sección final de `DECISIONES.md`.
