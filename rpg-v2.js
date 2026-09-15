/* LUNA EN VILLA PELÓN — RPG V1.2 VISUAL + DIALOGUE LAYER
 * Keeps the stable engine and replaces only presentation/interaction layers.
 * World rule: every future object is drawn as a lightweight pixel primitive first.
 */
(function(){
  const TILE = 32;
  const palette = { grass:'#71875b', grass2:'#667c52', dirt:'#b7a36f', road:'#a58f65', roadEdge:'#806e4f', water:'#6687a0', water2:'#55758d', house:'#8b6248', roof:'#5b4032', wall:'#b48a62', wood:'#76543f', leaf:'#476448', leaf2:'#5c7750', skin:'#d7ad8b', skin2:'#bd8d70', shirt:'#6e8aa0', pants:'#3f4d58', hair:'#46362d', face:'#f0c7a1' };
  const bubble = { lines:[], index:0, after:'' };

  function pixelRect(x,y,w,h,c){ ctx.fillStyle=c; ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h)); }
  function drawRoad(x,y,w,h){
    pixelRect(x,y,w,h,palette.road); pixelRect(x,y, w, 8,palette.roadEdge); pixelRect(x,y+h-8,w,8,palette.roadEdge);
    if(w>h){ for(let px=x+24;px<x+w-12;px+=64) pixelRect(px,y+h/2-2,32,4,'#d0b982'); }
    else { for(let py=y+24;py<y+h-12;py+=64) pixelRect(x+w/2-2,py,4,32,'#d0b982'); }
  }
  function drawHouse(x,y,w,h,accent){
    pixelRect(x+5,y+8,w-10,h-8,palette.wall); pixelRect(x,y,w,12,palette.roof);
    pixelRect(x+8,y,w-16,7,accent||palette.roof); pixelRect(x+w*.42,y+h-38,28,38,palette.wood);
    pixelRect(x+16,y+24,28,22,'#7893a0'); pixelRect(x+w-44,y+24,28,22,'#7893a0');
    pixelRect(x+18,y+27,24,3,'#b9d0d0'); pixelRect(x+w-42,y+27,24,3,'#b9d0d0');
  }
  function drawTree(x,y,s=1){
    pixelRect(x-5*s,y+12*s,10*s,24*s,palette.wood);
    pixelRect(x-24*s,y-14*s,48*s,30*s,palette.leaf); pixelRect(x-16*s,y-28*s,32*s,20*s,palette.leaf2);
    pixelRect(x-8*s,y-36*s,16*s,14*s,palette.leaf);
    pixelRect(x-18*s,y+2*s,12*s,8*s,'#38543b');
  }
  function drawFence(x,y,w,vertical=false){
    const step=28;
    if(vertical){ for(let p=y;p<=y+w;p+=step) pixelRect(x,p,6,22,palette.wood); pixelRect(x-3,y+5,12,w, palette.wood); }
    else { for(let p=x;p<=x+w;p+=step) pixelRect(p,y,6,22,palette.wood); pixelRect(x+3,y+5,w,6,palette.wood); }
  }
  function drawField(x,y,w,h,variant=0){
    pixelRect(x,y,w,h,variant?'#9b9a55':'#a99b5d');
    for(let yy=y+12;yy<y+h-8;yy+=18){
      for(let xx=x+10;xx<x+w-8;xx+=22){ pixelRect(xx,yy,2,10,variant?'#687b46':'#7b7c46'); pixelRect(xx+4,yy+5,5,2,'#c4ad69'); }
    }
  }
  function drawPerson(n, isPlayer=false){
    const x=n.x,y=n.y;
    // shadow
    pixelRect(x-11,y+16,22,5,'#3b4630');
    // legs + feet
    const pants=isPlayer?'#46536a':palette.pants;
    pixelRect(x-8,y+7,7,14,pants); pixelRect(x+1,y+7,7,14,pants);
    pixelRect(x-10,y+19,9,5,'#332b28'); pixelRect(x+1,y+19,9,5,'#332b28');
    // torso + arms/hands
    const shirt=isPlayer?'#b15d5d':(n.shirt||palette.shirt);
    pixelRect(x-11,y-8,22,18,shirt);
    pixelRect(x-16,y-5,5,14,shirt); pixelRect(x+11,y-5,5,14,shirt);
    pixelRect(x-17,y+8,6,6,palette.skin); pixelRect(x+11,y+8,6,6,palette.skin);
    // neck, head, ears, face
    pixelRect(x-4,y-12,8,6,palette.skin2); pixelRect(x-11,y-31,22,21,palette.face);
    pixelRect(x-14,y-27,3,9,palette.skin2); pixelRect(x+11,y-27,3,9,palette.skin2);
    pixelRect(x-12,y-34,24,7,n.hair||palette.hair); pixelRect(x-12,y-29,5,6,n.hair||palette.hair);
    // face pixels
    pixelRect(x-6,y-23,3,3,'#352b27'); pixelRect(x+3,y-23,3,3,'#352b27'); pixelRect(x-3,y-16,7,3,'#9c665a');
    if(isPlayer) pixelRect(x+10,y-24,3,3,'#f1df4f');
  }
  function worldLayout(){
    // main settlement spine + rural connectors
    drawRoad(90,560,2920,170); drawRoad(1320,160,150,1650); drawRoad(430,930,1760,120); drawRoad(1880,1410,1160,120);
    // water and bridge
    pixelRect(3040,80,430,2240,palette.water); for(let y=100;y<2300;y+=42) pixelRect(3040,y,430,4,palette.water2);
    pixelRect(2910,1030,260,170,palette.wood); pixelRect(2920,1040,240,12,'#b58b61');
    for(let x=2930;x<3160;x+=28) pixelRect(x,1030,8,170,'#634936');
    // central village
    drawHouse(350,210,250,130,'#664532'); drawHouse(980,230,270,150,'#6a4a37'); drawHouse(1450,700,300,160,'#634432'); drawHouse(1750,250,250,120,'#694835');
    drawHouse(600,780,180,240,'#76503b'); drawHouse(1280,980,260,130,'#674634'); drawHouse(2250,900,360,180,'#654532'); drawHouse(2850,430,300,150,'#60412f'); drawHouse(3050,1500,260,220,'#6b4934'); drawHouse(1950,1800,420,170,'#62412f');
    // rural parcels
    drawField(120,830,300,310); drawField(470,1230,420,360,1); drawField(950,1260,300,300); drawField(1560,1240,250,330,1); drawField(2460,1240,450,300); drawField(1480,1710,380,330,1); drawField(250,1700,520,360);
    drawFence(120,820,300); drawFence(120,820,300,true); drawFence(890,1230,360); drawFence(2460,1230,450);
    // trees and rural vegetation
    const trees=[[170,260,1],[280,420,.8],[870,170,1.2],[1320,420,.9],[1540,360,.8],[2120,520,1.1],[2720,270,1.3],[3400,360,1],[3320,780,.9],[3420,1440,1.2],[2750,1780,1.1],[2350,2110,.9],[1050,2050,1.1],[520,2050,1.2],[170,1450,.8]];
    trees.forEach(t=>drawTree(...t));
    // signposts / places
    pixelRect(260,500,8,50,palette.wood); pixelRect(240,480,50,22,'#d0b982');
    pixelRect(2010,1330,8,50,palette.wood); pixelRect(1990,1310,60,22,'#d0b982');
  }
  function draw(){
    const viewW=viewport.w,viewH=viewport.h;
    camera.x=Math.max(0,Math.min(world.w-viewW,player.x-viewW/2)); camera.y=Math.max(0,Math.min(world.h-viewH,player.y-viewH/2));
    ctx.setTransform(viewport.dpr,0,0,viewport.dpr,0,0); ctx.clearRect(0,0,viewW,viewH); ctx.fillStyle=palette.grass; ctx.fillRect(0,0,viewW,viewH);
    ctx.save(); ctx.translate(-camera.x,-camera.y);
    worldLayout();
    // NPCs and Luna use the same anatomical pixel construction.
    for(const n of npcs) drawPerson(n,false);
    drawPerson({x:player.x,y:player.y,hair:'#513a30'},true);
    // names and interaction marker
    ctx.textAlign='center'; ctx.font='bold 14px system-ui';
    for(const n of npcs){ ctx.fillStyle='#f5ecd8'; ctx.fillText(n.name,n.x,n.y-42); }
    const near=nearNPC(); if(near){
      ctx.fillStyle='#e6d2a4'; ctx.fillRect(near.x-3,near.y-56,6,6);
      $('prompt').classList.remove('hidden');
    } else $('prompt').classList.add('hidden');
    ctx.restore();
  }
  window.draw=draw;

  function openBubble(lines,after){
    bubble.lines=lines; bubble.index=0; bubble.after=after||''; keys=Object.create(null); stopLoop();
    const box=document.getElementById('dialogue'); box.classList.add('active'); box.classList.add('rpg-dialogue');
    renderBubble();
  }
  function renderBubble(){
    const l=bubble.lines[bubble.index]; if(!l)return;
    document.getElementById('speaker').textContent=l.speaker;
    document.getElementById('dialogueText').textContent=l.text;
    document.getElementById('nextDialogue').textContent=bubble.index<bubble.lines.length-1?'Continuar':'Cerrar';
  }
  function closeBubble(){
    document.getElementById('dialogue').classList.remove('active'); document.getElementById('dialogue').classList.remove('rpg-dialogue');
    if(bubble.after==='mission'){ updateMission(); document.getElementById('mission').classList.add('active'); screen='mission'; return; }
    show('world');
  }
  function advanceBubble(){ if(bubble.index<bubble.lines.length-1){bubble.index++;renderBubble();}else closeBubble(); }
  document.getElementById('nextDialogue').onclick=advanceBubble;

  function interactRpg(){
    if(screen!=='world'||paused)return; const n=nearNPC(); if(!n)return;
    if(n.id==='mateo'&&!state.mission){
      openBubble([{speaker:'Don Mateo',text:'Llegaste justo cuando estaba buscando un recuerdo que guardé hace muchos años.'},{speaker:'Don Mateo',text:'No necesito que encuentres todo. Necesito que aprendas a mirar el pueblo.'},{speaker:'Don Mateo',text:'Hablá con Rosa y Tomás. Ellos conocen dos partes que faltan.'}],'mission');
    } else if(n.id==='rosa'&&state.mission&&!state.rosa){state.rosa=true;addMemory('rosa-pista');save();updateMission();openBubble([{speaker:'Rosa',text:'Las historias también viven en los caminos y en el trabajo cotidiano.'},{speaker:'Rosa',text:'Mirá qué cosas hacen reconocible a un lugar para quienes lo habitan.'}]);}
    else if(n.id==='tomas'&&state.mission&&!state.tomas){state.tomas=true;addMemory('tomas-pista');save();updateMission();openBubble([{speaker:'Tomás',text:'El territorio cambia con el tiempo: hay cosas que estuvieron, otras que siguen y otras que construimos.'},{speaker:'Tomás',text:'Llevá esas dos ideas a Don Mateo.'}]);}
    else if(n.id==='mateo'&&state.mission&&state.rosa&&state.tomas&&!state.reward){state.reward=true;addMemory('primer-recuerdo');save();document.getElementById('objective').textContent='Misión completada';show('reward');}
    else if(n.id==='rosa'||n.id==='tomas') openBubble([{speaker:n.name,text:'Ya te di mi pista. Seguí recorriendo Villa Pelón.'}]);
  }
  window.interact=interactRpg;

  // Make the old DOM handler resolve the current interaction function.
  const ib=document.getElementById('interactBtn'); if(ib){ib.onclick=()=>window.interact();}
})();
