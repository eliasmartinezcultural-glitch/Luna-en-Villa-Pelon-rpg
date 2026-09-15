# AUDITORÍA QUIRÚRGICA — V1.0.0

## Resultado de la consolidación

**V1.0.0 — BASE CONSOLIDADA / CONGELADA.**

La auditoría encontró problemas reales de integración y geometría que fueron corregidos antes de cerrar esta línea.

## Correcciones aplicadas

### 1. Núcleo y guardado

- Se consolidó `app.js` como motor base único de la versión.
- Se elevó el esquema interno de guardado a `SAVE_VERSION = 4` para incorporar inventario, capítulos y misiones sin romper partidas anteriores.
- Se validan coordenadas numéricas al recuperar una partida.
- `worldTime` dejó de reiniciarse cada 1440 minutos; ahora acumula tiempo para que día, estación y clima puedan avanzar.
- Reiniciar partida elimina también la marca de onboarding para producir un reinicio realmente limpio.
- El loop sigue teniendo un único `requestAnimationFrame` activo por vez.

### 2. Geometría y colisiones

Se detectaron edificios que atravesaban visualmente calles en la geometría anterior. Se corrigió la red espacial de V1.0.0.

Reglas consolidadas:

- las casas y edificios ocupan parcelas propias;
- las calles no atraviesan edificios;
- el río mantiene su cauce separado;
- el puente es el paso definido sobre el río;
- la red de caminos mantiene conexión entre centro, ruralidad y zona del puente;
- las colisiones de edificios y río pertenecen a `rpg-v2.js`, mientras que `app.js` conserva únicamente los límites exteriores;
- no se agregan nuevos sólidos duplicados desde el motor base.

### 3. Capas JavaScript

Orden actual y deliberado:

1. `app.js` — estado, guardado, loop, controles y límites.
2. `experience.js` — onboarding y tracker.
3. `rpg-v2.js` — mundo, colisiones, personajes, NPCs, lugares, animales y misión ampliada.
4. `world-life.js` — capa ambiental final.

El último archivo de cada capa que necesita reemplazar una función global queda explícitamente después del anterior. No se deben introducir nuevos wrappers fuera de este orden.

### 4. Interfaz web

- La versión `V1.0.0` queda visible en inicio, introducción, HUD y pausa.
- El canvas conserva escalado responsive con DPR limitado a 2.
- Los controles táctiles siguen siendo grandes y separados.
- El overlay ambiental usa `pointer-events:none` para no bloquear interacción.

## Hallazgos que NO se deben confundir con funciones terminadas

- vehículos funcionales: fuera de alcance;
- peces interactivos: fuera de alcance;
- estaciones con cambios profundos de terreno: fuera de alcance;
- clima con lluvia/efectos completos: fuera de alcance;
- Picada 21 plenamente construida: fuera de alcance;
- pruebas automatizadas de navegador: no certificadas desde GitHub;
- validación en dispositivos físicos reales: pendiente.

## Checklist de cierre

### Corregido a nivel de código

- [x] Estado de guardado coherente y tolerante a datos inválidos.
- [x] Tiempo de mundo acumulativo.
- [x] Reinicio limpio.
- [x] Límites del mundo separados de sólidos del mapa.
- [x] Calles y edificios sin superposición geométrica intencional.
- [x] Río bloqueado salvo por el puente.
- [x] Orden de scripts documentado.
- [x] Versión visible y registrada.

### Requiere prueba de navegador real antes de llamarlo certificado

- [ ] Inicio → intro → guía → mundo.
- [ ] Continuar partida después de recarga.
- [ ] Misión completa de punta a punta.
- [ ] Pausa y reanudación.
- [ ] Reinicio limpio.
- [ ] PC con teclado.
- [ ] Celular vertical.
- [ ] Celular horizontal.
- [ ] Tablet.
- [ ] Consola sin errores rojos.
- [ ] Ausencia de doble loop/listener durante navegación repetida.

## Regla de bloqueo

**NO EXPANDIR.**

Mientras esta versión siga siendo la referencia, no se agregan nuevas misiones, vehículos, estaciones, clima avanzado, Picada 21 ni nuevas capas de simulación.

Toda modificación futura deberá partir de `V1.0.0`, declarar el problema que corrige, incrementar la versión y pasar nuevamente por auditoría.
