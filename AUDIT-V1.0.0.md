# AUDITORÍA QUIRÚRGICA — V1.0.0

## Resultado honesto

La base queda congelada como **V1.0.0**, pero esta etiqueta significa **baseline consolidada**, no certificación de que todas las funciones estén verificadas en navegador real.

## Hallazgos críticos a vigilar

- La aplicación utiliza varios archivos JavaScript clásicos que sobrescriben funciones globales (`draw`, `interact`, `updateMission`). El orden de carga es determinante.
- El sistema de guardado conserva compatibilidad básica, pero la versión de datos y la migración futura deben tratarse como una tarea específica.
- La geometría original de colisiones y la geometría dibujada del mundo no deben considerarse equivalentes automáticamente: cualquier expansión del mapa exige una única fuente de verdad.
- La capa de día/noche, estación y clima es inicial; no debe presentarse como simulación completa.
- El rendimiento, la navegación táctil, la pausa, el reinicio y la recuperación tras recarga necesitan prueba real en navegador y en móvil.

## Checklist de salida de la versión

### Núcleo

- [ ] Inicio abre sin pantalla negra.
- [ ] Inicio → intro → guía → mundo funciona en una sesión nueva.
- [ ] Continuar partida funciona con guardado existente.
- [ ] Entrar al pueblo inicia el loop una sola vez.
- [ ] Pausa detiene movimiento y loop.
- [ ] Reinicio elimina únicamente el progreso previsto y vuelve a un estado coherente.

### Misión

- [ ] Don Mateo puede iniciar la misión.
- [ ] Rosa y Tomás entregan sus pistas una sola vez.
- [ ] El tracker coincide con el estado real.
- [ ] Don Mateo entrega la recompensa solo cuando corresponde.
- [ ] La recompensa no se duplica tras recargar.

### Mundo

- [ ] Luna no atraviesa límites ni sólidos.
- [ ] Las colisiones coinciden con lo que se ve.
- [ ] No existen casas sobre calles, cauce o puentes.
- [ ] El río y el puente no bloquean de forma contradictoria el recorrido.
- [ ] La cámara no muestra áreas inválidas.

### Responsive y rendimiento

- [ ] PC con teclado.
- [ ] Celular vertical.
- [ ] Celular horizontal.
- [ ] Tablet.
- [ ] Controles táctiles accesibles.
- [ ] Overlay ambiental no bloquea botones ni diálogo.
- [ ] Sin scroll horizontal ni descarga obligatoria.
- [ ] El loop se detiene fuera del mundo y durante la pausa.

### Integridad técnica

- [ ] No hay errores rojos en consola.
- [ ] No hay funciones globales indefinidas.
- [ ] No hay doble listener o doble `requestAnimationFrame`.
- [ ] No hay referencias a elementos inexistentes.
- [ ] La carga de scripts conserva el orden documentado.
- [ ] El guardado tolera `localStorage` bloqueado.

## Regla de consolidación

Hasta que esta checklist sea comprobada, no se agregan nuevas capas de contenido. El siguiente trabajo válido es **AUDITAR → REPARAR → PROBAR → CONSOLIDAR**, no expandir el mundo.
