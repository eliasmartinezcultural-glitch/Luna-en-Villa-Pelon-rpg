# LUNA EN VILLA PELÓN — QUALITY GATE

## Objetivo

Ninguna expansión importante del mundo entra mientras el núcleo web no supere esta puerta.

## Constitución multiplataforma

El juego es **web-first y multiplataforma**:

- [ ] Abrir enlace → cargar → jugar.
- [ ] Sin instalación obligatoria.
- [ ] Sin descarga obligatoria.
- [ ] Sin plugins externos.
- [ ] PC, notebook, tablet y celular forman parte del mismo producto.
- [ ] Pantalla táctil y teclado permiten completar el mismo ciclo de juego.
- [ ] La interfaz se adapta a portrait y landscape.
- [ ] Ninguna función crítica depende de hover, mouse o teclado exclusivamente.
- [ ] Los recursos gráficos deben seguir siendo livianos y preferentemente generados con primitivas o assets pequeños.
- [ ] No se agrega una librería pesada solo para resolver una función que el navegador puede hacer directamente.

## 1. ACCESO

- [ ] Abre desde una URL.
- [ ] No requiere instalación.
- [ ] No requiere descarga obligatoria.
- [ ] La primera pantalla es comprensible sin instrucciones externas.
- [ ] El primer objetivo queda claro sin que otra persona tenga que explicar el juego.

## 2. PC / NOTEBOOK

- [ ] Mouse funciona donde corresponde.
- [ ] Flechas y WASD mueven al jugador.
- [ ] E interactúa.
- [ ] Escape pausa y reanuda.
- [ ] I abre/cierra el diario.
- [ ] El canvas ocupa correctamente la pantalla.
- [ ] No hay scroll accidental.

## 3. MÓVIL / TABLET

- [ ] El canvas se adapta a tamaño y orientación.
- [ ] Los controles táctiles tienen tamaño suficiente.
- [ ] No quedan botones trabados después de levantar el dedo.
- [ ] Los textos y botones son legibles.
- [ ] Los diálogos no se salen de la pantalla.
- [ ] La pausa puede abrirse y cerrarse.
- [ ] El diario puede abrirse y cerrarse.
- [ ] El juego sigue siendo comprensible sin teclado.
- [ ] No hay interacción crítica basada solamente en hover.

## 4. MUNDO JUGABLE V1.3

- [ ] Las casas bloquean físicamente el paso.
- [ ] El río bloquea el paso fuera del puente.
- [ ] El puente permite cruzar.
- [ ] Los límites exteriores bloquean la salida.
- [ ] Los caminos son transitables.
- [ ] Los lugares tienen nombre y función.
- [ ] Luna tiene sprite con dirección y animación de caminata.
- [ ] Los NPC tienen dirección y movimiento autónomo acotado.
- [ ] Los animales se mueven sin salir del mundo.
- [ ] La cámara sigue a Luna sin mostrar coordenadas negativas.

## 5. CICLO DE JUEGO

- [ ] Inicio.
- [ ] Introducción.
- [ ] Guía inicial.
- [ ] Entrada al pueblo.
- [ ] Movimiento.
- [ ] Cámara.
- [ ] Interacción.
- [ ] Diálogo RPG pequeño con mundo visible.
- [ ] Misión 1.
- [ ] Dos pistas.
- [ ] Regreso a Don Mateo.
- [ ] Recompensa.
- [ ] Misión 2: descubrir lugares.
- [ ] Misión 3: zona de chacras.
- [ ] Guardado.
- [ ] Recarga de partida.

## 6. DIARIO / PROGRESO

- [ ] Objetivos visibles.
- [ ] Recuerdos persistentes.
- [ ] Mochila persistente.
- [ ] Lugares descubiertos persistentes.
- [ ] El progreso no depende de mantener abierta la pestaña.

## 7. RECUPERACIÓN

- [ ] Abrir diálogo no congela el loop.
- [ ] Cambiar de pestaña no deja movimiento trabado.
- [ ] Perder foco pausa el mundo.
- [ ] Reiniciar borra la partida correctamente.
- [ ] Un localStorage inválido no rompe el arranque.
- [ ] Si el almacenamiento está bloqueado, el juego continúa sin crashear.

## 8. RENDIMIENTO

- [ ] DPR limitado.
- [ ] No se renderiza una resolución innecesaria.
- [ ] No hay procesos permanentes sin función.
- [ ] Guardado periódico, no por frame.
- [ ] Recursos visuales livianos.
- [ ] La cantidad de entidades visibles debe poder crecer sin obligar a cargar imágenes pesadas.
- [ ] Animaciones simples y acotadas en dispositivos modestos.

## 9. REGLA DE EXPANSIÓN

Si falla una función central, se repara antes de agregar mapa, NPC, decoración, sonido o sistemas nuevos.

**AUDITAR → REPARAR → PROBAR → CONSOLIDAR → EXPANDIR**
