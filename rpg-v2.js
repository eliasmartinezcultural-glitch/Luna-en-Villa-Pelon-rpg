/* LUNA EN VILLA PELÓN — JUGABILIDAD V1.3 / V1.0.0 CONSOLIDADA
 * Mobile-first, web-first. No external assets required.
 * Esta versión corrige la geometría para que calles, edificios, río y puente
 * respeten una única lógica espacial y de colisión.
 */
(function(){
  const TILE=32;
  const P={
    grass:'#71875b',grass2:'#667c52',dirt:'#b7a36f',road:'#a58f65',roadEdge:'#806e4f',water:'#6687a0',water2:'#55758d',
    wall:'#b48a62',roof:'#5b4032',wood:'#76543f',window:'#7893a0',leaf:'#476448',leaf2:'#5c7750',
    skin:'#d7ad8b',skin2:'#bd8d70',face:'#f0c7a1',hair:'#46362d',pants:'#3f4d58',ink:'#29231e',gold:'#e6d2a4'
  };
  const npcHomes={mateo:{x:530,y:330},rosa:{x:780,y:510},tomas:{x:1120,y:410}};
  const npcMotion={};
  const anim={player:{dir:'down',frame:0,t:0},npcs:{}};
  let lastPlayer={x:player.x,y:player.y};
  let journalOpen=false;

  /* ---------- WORLD GEOMETRY: SINGLE SPATIAL CONTRACT ---------- */
  const roads=[
    {x:90,y:560,w:2920,h:90},
    {x:2700,y:160,w:120,h:1680},
    {x:430,y:1120,w:2600,h:80},
    {x:1880,y:1410,w:1160,h:120},
    {x:2750,y:1840,w:330,h:110}
  ];
  const river={x:3040,y:80,w:430,h:2240};
  const bridge={x:2910,y:1030,w:260,h:170};
  const buildings=[
    {id:'casa-mateo',name:'Casa de Don Mateo',x:350,y:210,w:250,h:130},
    {id:'casa-rosa',name:'Casa de Rosa',x:980,y:230,w:270,h:150},
    {id:'casa-tomas',name:'Casa de Tomás',x:1450,y:700,w:300,h:160},
    {id:'casa-4',name:'Casa del barrio',x:1750,y:250,w:250,h:120},
    {id:'almacen',name:'Almacén del pueblo',x:600,y:780,w:180,h:120},
    {id:'galpon',name:'Galpón comunitario',x:1280,y:980,w:260,h:130},
    {id:'escuela',name:'Escuela',x:2250,y:900,w:360,h:180},
    {id:'puesto',name:'Puesto rural',x:2850,y:390,w:300,h:150},
    {id:'taller',name:'Taller',x:3050,y:1500,w:260,h:220},
    {id:'galpon-sur',name:'Galpón del sur',x:1950,y:1800,w:420,h:170}
  ];
  const fields=[
    {x:120,y:830,w:300,h:310},{x:470,y:1230,w:420,h:360,v:1},{x:950,y:1260,w:300,h:300},{x:1560,y:1240,w:250,h:330,v:1},
    {x:2460,y:1240,w:450,h:300},{x:1480,y:1710,w:380,h:330,v:1},{x:250,y:1700,w:520,h:360}
  ];
  const staticSolids=[
    {x:0,y:0,w:3600,h:80},{x:0,y:2320,w:3600,h:80},{x:0,y:0,w:80,h:2400},{x:3520,y:0,w:80,h:2400},
    ...buildings,
    {x:3040,y:80,w:430,h:950},{x:3040,y:1200,w:430,h:1120}
  ];
  const trees=[[170,260,1],[280,420,.8],[870,170,1.2],[1320,420,.9],[1540,360,.8],[2120,520,1.1],[2720,270,1.3],[3400,360,1],[3320,780,.9],[3420,1440,1.2],[2750,1780,1.1],[2350,2110,.9],[1050,2050,1.1],[520,2050,1.2],[170,1450,.8]];

  function rectHit(x,y,r,o){const nx=Math.max(o.x,Math.min(x,o.x+o.w)),ny=Math.max(o.y,Math.min(y,o.y+o.h));return (x-nx)**2+(y-ny)**2<r*r;}
  function blocked(x,y,r=13){
    if(x<95||y<95||x>world.w-95||y>world.h-95)return true;
    return staticSolids.some(o=>rectHit(x,y,r,o));
  }
  function nearPoint(x,y,range=70){
    let best=null,d=Infinity;for(const n of npcs){const q=Math.hypot(n.x-x,n.y-y);if(q<d){d=q;best=n;}}
    return d<=range?best:null;
  }

  function r(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
  function road(a){r(a.x,a.y,a.w,a.h,P.road);r(a.x,a.y,a.w,7,P.roadEdge);r(a.x,a.y+a.h-7,a.w,7,P.roadEdge);if(a.w>a.h){for(let x=a.x+24;x<a.x+a.w-20;x+=64)r(x,a.y+a.h/2-2,32,4,P.gold);}else{for(let y=a.y+24;y<a.y+a.h-20;y+=64)r(a.x+a.w/2-2,y,4,32,P.gold);}}
  function house(b){r(b.x+5,b.y+8,b.w-10,b.h-8,P.wall);r(b.x,b.y,b.w,12,P.roof);r(b.x+8,b.y,b.w-16,7,'#6a4a37');r(b.x+b.w*.42,b.y+b.h-38,28,38,P.wood);r(b.x+16,b.y+24,28,22,P.window);r(b.x+b.w-44,b.y+24,28,22,P.window);r(b.x+18,b.y+27,24,3,'#b9d0d0');r(b.x+b.w-42,b.y+27,24,3,'#b9d0d0');}
  function tree(x,y,s=1){r(x-5*s,y+12*s,10*s,24*s,P.wood);r(x-24*s,y-14*s,48*s,30*s,P.leaf);r(x-16*s,y-28*s,32*s,20*s,P.leaf2);r(x-8*s,y-36*s,16*s,14*s,P.leaf);}
  function field(f){r(f.x,f.y,f.w,f.h,f.v?'#9b9a55':'#a99b5d');for(let y=f.y+12;y<f.y+f.h-8;y+=18)for(let x=f.x+10;x<f.x+f.w-8;x+=22){r(x,y,2,10,f.v?'#687b46':'#7b7c46');r(x+4,y+5,5,2,'#c4ad69');}}
  function fence(x,y,w,v=false){if(v){for(let p=y;p<=y+w;p+=28)r(x,p,6,22,P.wood);r(x-3,y+5,12,w,P.wood);}else{for(let p=x;p<=x+w;p+=28)r(p,y,6,22,P.wood);r(x+3,y+5,w,6,P.wood);}}

  function drawPerson(n,isPlayer=false){
    const x=n.x,y=n.y, st=isPlayer?anim.player:(anim.npcs[n.id]||{dir:'down',frame:0});
    const moving=st.moving;const bob=moving&&st.frame%2?1:0;const leg=moving&&st.frame%2?2:0;
    const skin=n.skin||P.face, hair=n.hair||P.hair, shirt=isPlayer?'#b15d5d':(n.shirt||'#6e8aa0');
    r(x-11,y+16,22,5,'#3b4630');
    if(st.dir==='up'){
      r(x-8,y+7+leg,7,14,P.pants);r(x+1,y+7-leg,7,14,P.pants);r(x-10,y+19,9,5,P.ink);r(x+1,y+19,9,5,P.ink);
      r(x-11,y-8+bob,22,18,shirt);r(x-16,y-5,5,14,shirt);r(x+11,y-5,5,14,shirt);r(x-4,y-12,8,6,P.skin2);r(x-11,y-31,22,21,P.skin2);r(x-12,y-34,24,9,hair);
    }else if(st.dir==='left'||st.dir==='right'){
      const flip=st.dir==='left'?-1:1;r(x-8,y+7+leg,7,14,P.pants);r(x+1,y+7-leg,7,14,P.pants);r(x-10,y+19,9,5,P.ink);r(x+1,y+19,9,5,P.ink);
      r(x-10,y-8+bob,20,18,shirt);r(x+flip*9,y-4,7,14,shirt);r(x+flip*13,y+8,6,6,P.skin);r(x-4,y-12,8,6,P.skin2);r(x-9,y-30,18,20,P.face);r(x+flip*4,y-24,4,3,P.ink);r(x-10,y-33,20,7,hair);
    }else{
      r(x-8,y+7+leg,7,14,P.pants);r(x+1,y+7-leg,7,14,P.pants);r(x-10,y+19,9,5,P.ink);r(x+1,y+19,9,5,P.ink);
      r(x-11,y-8+bob,22,18,shirt);r(x-16,y-5,5,14,shirt);r(x+11,y-5,5,14,shirt);r(x-17,y+8,6,6,P.skin);r(x+11,y+8,6,6,P.skin);
      r(x-4,y-12,8,6,P.skin2);r(x-11,y-31,22,21,P.face);r(x-14,y-27,3,9,P.skin2);r(x+11,y-27,3,9,P.skin2);r(x-12,y-34,24,7,hair);r(x-12,y-29,5,6,hair);r(x-6,y-23,3,3,P.ink);r(x+3,y-23,3,3,P.ink);r(x-3,y-16,7,3,'#9c665a');
    }
  }

  function updateCharacterAnimation(dt){
    const dx=player.x-lastPlayer.x,dy=player.y-lastPlayer.y,m=Math.hypot(dx,dy)>0.2;
    if(m){if(Math.abs(dx)>Math.abs(dy))anim.player.dir=dx>0?'right':'left';else anim.player.dir=dy>0?'down':'up';anim.player.t+=dt;if(anim.player.t>.14){anim.player.frame=(anim.player.frame+1)%4;anim.player.t=0;}}
    else anim.player.frame=0;
    anim.player.moving=m;lastPlayer.x=player.x;lastPlayer.y=player.y;
    for(const n of npcs){const a=anim.npcs[n.id]|| (anim.npcs[n.id]={dir:'down',frame:0,t:0,moving:false});a.moving=!!npcMotion[n.id]?.moving;if(a.moving){a.t+=dt;if(a.t>.18){a.frame=(a.frame+1)%4;a.t=0;}const vx=npcMotion[n.id].vx,vy=npcMotion[n.id].vy;if(Math.abs(vx)>Math.abs(vy))a.dir=vx>0?'right':'left';else a.dir=vy>0?'down':'up';}}
  }

  function updateNPCs(dt){
    for(const n of npcs){
      const home=npcHomes[n.id], m=npcMotion[n.id]||(npcMotion[n.id]={vx:0,vy:0,t:Math.random()*2.5,next:1+Math.random()*2.5,moving:false});
      m.t+=dt;
      if(m.t>=m.next){m.t=0;m.next=1.8+Math.random()*3.5;const a=Math.random()*Math.PI*2,s=.25+Math.random()*.55;m.vx=Math.cos(a)*s;m.vy=Math.sin(a)*s;m.moving=true;}
      if(!m.moving)continue;
      const nx=n.x+m.vx*dt*32,ny=n.y+m.vy*dt*32;
      if(Math.hypot(nx-home.x,ny-home.y)>95||blocked(nx,ny,12)){m.vx*=-1;m.vy*=-1;m.moving=false;continue;}
      n.x=nx;n.y=ny;
    }
  }

  const places=[
    {id:'almacen',name:'Almacén del pueblo',x:690,y:1040,desc:'Un punto cotidiano de encuentro e intercambio.'},
    {id:'escuela',name:'Escuela',x:2430,y:1080,desc:'Un lugar pensado para aprender y guardar historias.'},
    {id:'puente',name:'Puente del río',x:3040,y:1115,desc:'La conexión entre el pueblo y el borde del río.'},
    {id:'chacras',name:'Zona de chacras',x:700,y:1400,desc:'Parcelas rurales que muestran el trabajo del territorio.'}
  ];
  function nearestPlace(){let best=null,d=Infinity;for(const p of places){const q=Math.hypot(p.x-player.x,p.y-player.y);if(q<d){d=q;best=p;}}return d<95?best:null;}
  function ensureState(){
    if(!Array.isArray(state.memories))state.memories=[];
    if(!Array.isArray(state.explored))state.explored=[];
    if(!Array.isArray(state.inventory))state.inventory=[];
    if(typeof state.chapter!=='number')state.chapter=1;
    if(typeof state.mission2!=='boolean')state.mission2=false;
    if(typeof state.mission3!=='boolean')state.mission3=false;
    if(typeof state.mission2Done!=='boolean')state.mission2Done=false;
    if(typeof state.mission3Done!=='boolean')state.mission3Done=false;
  }
  ensureState();
  function item(id,label){if(!state.inventory.includes(id))state.inventory.push(id);}
  function memory(id){if(!state.memories.includes(id))state.memories.push(id);}
  function explored(id){if(!state.explored.includes(id))state.explored.push(id);}
  function updateJournal(){
    const t=document.getElementById('qtTitle'),h=document.getElementById('qtHint');if(!t||!h)return;
    if(!state.mission){t.textContent='Conocé a Don Mateo';h.textContent='Buscá la persona marcada y acercate para hablar.';}
    else if(!state.rosa||!state.tomas){t.textContent=`Encontrá las dos pistas (${Number(!!state.rosa)+Number(!!state.tomas)}/2)`;h.textContent='Visitá a Rosa y a Tomás.';}
    else if(!state.reward){t.textContent='Volvé con Don Mateo';h.textContent='Ya reuniste las dos pistas.';}
    else if(!state.mission2){t.textContent='Nueva misión: conocer el pueblo';h.textContent='Recorré un lugar importante y abrí tu diario.';}
    else if(!state.mission2Done){t.textContent='Misión 2: explorá';h.textContent='Descubrí el almacén, la escuela y el puente.';}
    else if(!state.mission3){t.textContent='Nueva misión: mirar el territorio';h.textContent='Visitá la zona de chacras.';}
    else if(!state.mission3Done){t.textContent='Misión 3: territorio';h.textContent='Aprendé qué cambia cuando mirás más allá del centro.';}
    else {t.textContent='Villa Pelón sigue abierta';h.textContent='Explorá, descubrí lugares y guardá recuerdos.';}
  }
  function createJournal(){
    if(document.getElementById('journalPanel'))return;
    const panel=document.createElement('aside');panel.id='journalPanel';panel.className='journal-panel hidden';
    panel.innerHTML='<div class="jp-head"><b>DIARIO DE LUNA</b><button id="closeJournal" aria-label="Cerrar diario">×</button></div><div class="jp-tabs"><button data-tab="objetivos">Objetivos</button><button data-tab="recuerdos">Recuerdos</button><button data-tab="mochila">Mochila</button></div><div id="jpContent"></div>';
    document.getElementById('world').appendChild(panel);
    panel.querySelector('#closeJournal').onclick=()=>toggleJournal(false);
    panel.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>renderJournal(b.dataset.tab));
    renderJournal('objetivos');
  }
  function renderJournal(tab='objetivos'){
    const c=document.getElementById('jpContent');if(!c)return;
    const objectives=state.mission3Done?'Explorá Villa Pelón libremente.':state.mission3?'Visitá y comprendé la zona de chacras.':state.mission2Done?'Conocé nuevos lugares.':state.mission2?'Descubrí el almacén, la escuela y el puente.':state.reward?'Conocé el pueblo y seguí descubriendo.':'Conocé a Don Mateo.';
    if(tab==='objetivos')c.innerHTML=`<h3>Ahora</h3><p>${objectives}</p><h3>Progreso</h3><p>${state.explored.length} lugares descubiertos · ${state.memories.length} recuerdos · ${state.inventory.length} objetos</p>`;
    if(tab==='recuerdos')c.innerHTML='<h3>Recuerdos</h3>'+ (state.memories.length?state.memories.map(m=>`<div class="jp-item">✦ ${memoryLabel(m)}</div>`).join(''):'<p>Todavía no guardaste recuerdos.</p>');
    if(tab==='mochila')c.innerHTML='<h3>Mochila</h3>'+ (state.inventory.length?state.inventory.map(i=>`<div class="jp-item">▣ ${itemLabel(i)}</div>`).join(''):'<p>Está vacía. Las misiones irán agregando objetos.</p>');
  }
  function memoryLabel(id){return ({'rosa-pista':'La pista de Rosa','tomas-pista':'La pista de Tomás','primer-recuerdo':'El primer recuerdo','almacen-recuerdo':'La vida cotidiana','escuela-recuerdo':'Aprender también es territorio','puente-recuerdo':'El río conecta el paisaje','chacras-recuerdo':'El trabajo de la tierra'})[id]||id;}
  function itemLabel(id){return ({'llave-almacen':'Llave del almacén','cuaderno-luna':'Cuaderno de Luna','semilla':'Semilla de chacra'})[id]||id;}
  function toggleJournal(force){createJournal();journalOpen=typeof force==='boolean'?force:!journalOpen;document.getElementById('journalPanel').classList.toggle('hidden',!journalOpen);if(journalOpen){renderJournal('objetivos');stopLoop();keys=Object.create(null);}else if(screen==='world')startLoop();}

  const bubble={lines:[],index:0,after:''};
  function openBubble(lines,after=''){bubble.lines=lines;bubble.index=0;bubble.after=after;keys=Object.create(null);stopLoop();const box=document.getElementById('dialogue');box.classList.add('active','rpg-dialogue');renderBubble();}
  function renderBubble(){const l=bubble.lines[bubble.index];if(!l)return;document.getElementById('speaker').textContent=l.speaker;document.getElementById('dialogueText').textContent=l.text;document.getElementById('nextDialogue').textContent=bubble.index<bubble.lines.length-1?'Continuar':'Cerrar';}
  function closeBubble(){document.getElementById('dialogue').classList.remove('active','rpg-dialogue');if(bubble.after==='mission'){updateMission();document.getElementById('mission').classList.add('active');screen='mission';}else show('world');}
  function advanceBubble(){if(bubble.index<bubble.lines.length-1){bubble.index++;renderBubble();}else closeBubble();}
  document.getElementById('nextDialogue').onclick=advanceBubble;

  function interactRpg(){
    if(screen!=='world'||paused||journalOpen)return;
    const n=nearPoint(player.x,player.y,72),p=nearestPlace();
    if(n){
      if(n.id==='mateo'&&!state.mission){openBubble([{speaker:'Don Mateo',text:'Llegaste justo cuando estaba buscando un recuerdo que guardé hace muchos años.'},{speaker:'Don Mateo',text:'No necesito que encuentres todo. Necesito que aprendas a mirar el pueblo.'},{speaker:'Don Mateo',text:'Hablá con Rosa y Tomás. Ellos conocen dos partes que faltan.'}],'mission');return;}
      if(n.id==='rosa'&&state.mission&&!state.rosa){state.rosa=true;memory('rosa-pista');save();updateJournal();openBubble([{speaker:'Rosa',text:'Las historias también viven en los caminos y en el trabajo cotidiano.'},{speaker:'Rosa',text:'Mirá qué cosas hacen reconocible a un lugar para quienes lo habitan.'}]);return;}
      if(n.id==='tomas'&&state.mission&&!state.tomas){state.tomas=true;memory('tomas-pista');save();updateJournal();openBubble([{speaker:'Tomás',text:'El territorio cambia con el tiempo: hay cosas que estuvieron, otras que siguen y otras que construimos.'},{speaker:'Tomás',text:'Llevá esas dos ideas a Don Mateo.'}]);return;}
      if(n.id==='mateo'&&state.mission&&state.rosa&&state.tomas&&!state.reward){state.reward=true;memory('primer-recuerdo');save();document.getElementById('objective').textContent='Misión completada';show('reward');return;}
      if(n.id==='mateo'&&state.reward&&!state.mission2){state.mission2=true;state.chapter=2;save();updateJournal();openBubble([{speaker:'Don Mateo',text:'Ya encontraste un recuerdo. Ahora quiero que conozcas el pueblo con tus propios pasos.'},{speaker:'Don Mateo',text:'Visitá el almacén, la escuela y el puente. Abrí tu diario cuando quieras revisar lo aprendido.'}]);return;}
      if(n.id==='mateo'&&state.mission2Done&&!state.mission3){state.mission3=true;state.chapter=3;save();updateJournal();openBubble([{speaker:'Don Mateo',text:'Ahora salí del centro y mirá cómo el pueblo se une con el trabajo rural.'},{speaker:'Don Mateo',text:'Visitá la zona de chacras. Después podremos seguir hacia lugares más lejanos.'}]);return;}
      if(n.id==='rosa'||n.id==='tomas'){openBubble([{speaker:n.name,text:'Ya te di mi pista. Seguí recorriendo Villa Pelón.'}]);return;}
    }
    if(p){discoverPlace(p);return;}
  }
  function discoverPlace(p){
    explored(p.id);memory(p.id+'-recuerdo');
    if(p.id==='almacen')item('llave-almacen');
    if(p.id==='escuela')item('cuaderno-luna');
    if(p.id==='puente'&&state.mission2&&!state.mission2Done){state.mission2Done=true;save();updateJournal();openBubble([{speaker:'Luna',text:'El puente no es solo un camino: conecta el pueblo con otra parte del territorio.'},{speaker:'Luna',text:'Ya conocí tres lugares importantes. Quiero seguir mirando.'}]);return;}
    if(p.id==='chacras'&&state.mission3&&!state.mission3Done){state.mission3Done=true;item('semilla');memory('chacras-recuerdo');save();updateJournal();openBubble([{speaker:'Luna',text:'Las chacras muestran otra forma de vivir el territorio: tierra, trabajo, agua y tiempo.'},{speaker:'Luna',text:'Encontré una semilla. La voy a guardar en mi mochila.'}]);return;}
    save();updateJournal();openBubble([{speaker:p.name,text:p.desc}]);
  }

  const animals=[{x:430,y:150,type:'chicken',vx:.25,vy:.1},{x:870,y:1180,type:'chicken',vx:-.2,vy:.15},{x:1180,y:1600,type:'dog',vx:.15,vy:-.18},{x:1800,y:1580,type:'cow',vx:.08,vy:.12},{x:2320,y:1650,type:'cow',vx:-.06,vy:.08}];
  function drawAnimal(a){const x=a.x,y=a.y;r(x-9,y+7,18,4,'#3b4630');if(a.type==='chicken'){r(x-5,y-4,10,8,'#eee7d4');r(x+5,y-2,5,5,'#d7ad8b');r(x+8,y-1,4,2,'#d89d4d');}else if(a.type==='dog'){r(x-10,y-4,20,10,'#8b674f');r(x+7,y-8,8,9,'#74533e');r(x+10,y-10,3,4,P.ink);}else{r(x-18,y-8,36,17,'#b9aa91');r(x+12,y-13,11,14,'#a89578');r(x-12,y+7,5,8,P.ink);r(x+8,y+7,5,8,P.ink);}}
  function updateAnimals(dt){for(const a of animals){a.x+=a.vx*dt*20;a.y+=a.vy*dt*20;if(a.x<100||a.x>2920)a.vx*=-1;if(a.y<100||a.y>2200)a.vy*=-1;}}

  function worldLayout(){
    r(0,0,world.w,world.h,P.grass);
    roads.forEach(road);
    r(river.x,river.y,river.w,river.h,P.water);
    for(let y=100;y<2300;y+=42)r(river.x,y,river.w,4,P.water2);
    r(bridge.x,bridge.y,bridge.w,bridge.h,P.wood);
    r(bridge.x+10,bridge.y+10,bridge.w-20,12,'#b58b61');
    for(let x=bridge.x+20;x<bridge.x+bridge.w-10;x+=28)r(x,bridge.y,8,bridge.h,'#634936');
    fields.forEach(field);buildings.forEach(house);fence(120,820,300);fence(120,820,300,true);fence(890,1230,360);fence(2460,1230,450);trees.forEach(t=>tree(...t));
    r(250,500,8,50,P.wood);r(230,480,70,22,P.gold);r(1990,1310,60,22,P.gold);r(2010,1330,8,50,P.wood);
  }
  function drawMarker(){
    let target=null;if(state.reward&&!state.mission2)target=npcs.find(n=>n.id==='mateo');else if(!state.mission)target=npcs.find(n=>n.id==='mateo');else if(!state.rosa)target=npcs.find(n=>n.id==='rosa');else if(!state.tomas)target=npcs.find(n=>n.id==='tomas');else if(!state.reward)target=npcs.find(n=>n.id==='mateo');else if(state.mission2&&!state.mission2Done)target=places.find(p=>!state.explored.includes(p.id));else if(state.mission3&&!state.mission3Done)target=places.find(p=>p.id==='chacras');
    if(!target)return;const sx=target.x-camera.x,sy=target.y-camera.y;if(sx<-50||sy<-70||sx>viewport.w+50||sy>viewport.h+70)return;const pulse=3+Math.sin(performance.now()/180)*2;ctx.strokeStyle=P.gold;ctx.lineWidth=3;ctx.beginPath();ctx.arc(sx,sy-45,13+pulse,0,Math.PI*2);ctx.stroke();r(sx-3,sy-23,6,6,P.gold);
  }
  function draw(){
    camera.x=Math.max(0,Math.min(world.w-viewport.w,player.x-viewport.w/2));camera.y=Math.max(0,Math.min(world.h-viewport.h,player.y-viewport.h/2));
    ctx.setTransform(viewport.dpr,0,0,viewport.dpr,0,0);ctx.clearRect(0,0,viewport.w,viewport.h);ctx.save();ctx.translate(-camera.x,-camera.y);worldLayout();animals.forEach(drawAnimal);for(const n of npcs)drawPerson(n);drawPerson({x:player.x,y:player.y,hair:'#513a30'},true);
    drawMarker();ctx.textAlign='center';ctx.font='bold 14px system-ui';for(const n of npcs){ctx.fillStyle='#f5ecd8';ctx.fillText(n.name,n.x,n.y-43);}const near=nearPoint(player.x,player.y,72),place=nearestPlace();if(near||place){ctx.fillStyle=P.gold;ctx.fillRect((near||place).x-3,(near||place).y-58,6,6);document.getElementById('prompt').textContent=near?'E — Hablar':'E — Investigar';document.getElementById('prompt').classList.remove('hidden');}else document.getElementById('prompt').classList.add('hidden');ctx.restore();
  }

  const baseMove=window.move;
  window.move=function(dt){if(typeof baseMove==='function')baseMove(dt);updateNPCs(dt);updateAnimals(dt);updateCharacterAnimation(dt);};
  window.draw=draw;
  window.interact=interactRpg;
  const ib=document.getElementById('interactBtn');if(ib)ib.onclick=()=>window.interact();
  const pause=document.getElementById('pauseBtn');if(pause)pause.onclick=()=>togglePause();
  document.addEventListener('keydown',e=>{if(e.key==='i'||e.key==='I'){if(screen==='world')toggleJournal();}});
  createJournal();updateJournal();
  const closeReward=document.getElementById('closeReward');if(closeReward)closeReward.onclick=()=>{show('world');updateJournal();save();};
  const accept=document.getElementById('acceptMission');if(accept)accept.onclick=()=>{state.mission=true;save();updateMission();updateJournal();show('world');};
})();