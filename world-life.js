/* LUNA EN VILLA PELÓN — MUNDO VIVO V1 / V1.0.0 CONSOLIDADO
   Capa liviana: ciclo horario, estación, clima y reglas ambientales.
   No crea entidades masivas ni reemplaza el núcleo jugable. */
(function(){
  'use strict';
  const root=document.getElementById('world');
  if(!root) return;
  const overlay=document.createElement('div');
  overlay.id='worldAtmosphere';
  overlay.setAttribute('aria-hidden','true');
  root.appendChild(overlay);

  const seasonNames=['Verano','Otoño','Invierno','Primavera'];
  const weatherNames=['Despejado','Nublado','Lluvia suave','Viento'];
  let lastMinute=-1;

  function getTime(){
    if(typeof state==='undefined') return 8*60;
    return Number.isFinite(state.worldTime)?state.worldTime:8*60;
  }

  function syncObjective(){
    const objective=document.getElementById('objective');
    if(!objective || typeof state==='undefined') return;
    if(!state.mission) objective.textContent='Objetivo: conocé a Don Mateo';
    else if(!state.rosa || !state.tomas) objective.textContent='Objetivo: encontrá las dos pistas';
    else if(!state.reward) objective.textContent='Objetivo: volvé con Don Mateo';
    else if(!state.mission2) objective.textContent='Objetivo: conocé el pueblo';
    else if(!state.mission2Done) objective.textContent='Objetivo: explorá almacén, escuela y puente';
    else if(!state.mission3) objective.textContent='Objetivo: conocé la zona de chacras';
    else if(!state.mission3Done) objective.textContent='Objetivo: explorá el territorio rural';
    else objective.textContent='Objetivo: explorá Villa Pelón';
  }

  function update(){
    const minute=getTime();
    const day=Math.floor(minute/1440);
    const within=((minute%1440)+1440)%1440;
    const hour=within/60;
    const season=Math.floor(day/7)%4;
    const weather=(Math.floor(day/2)+season)%weatherNames.length;
    let darkness=0;
    if(hour<6) darkness=.48;
    else if(hour<8) darkness=.48-(hour-6)*.24;
    else if(hour<18) darkness=0;
    else if(hour<21) darkness=(hour-18)*.16;
    else darkness=.48;
    overlay.style.setProperty('--night-opacity',String(Math.max(0,Math.min(.48,darkness))));
    overlay.dataset.season=seasonNames[season];
    overlay.dataset.weather=weatherNames[weather];
    overlay.dataset.period=hour<6?'Noche':hour<12?'Mañana':hour<18?'Tarde':hour<21?'Atardecer':'Noche';
    syncObjective();
    if(lastMinute!==Math.floor(minute)){
      root.dataset.season=seasonNames[season];
      root.dataset.weather=weatherNames[weather];
      root.dataset.period=overlay.dataset.period;
      lastMinute=Math.floor(minute);
    }
  }

  const style=document.createElement('style');
  style.textContent='#worldAtmosphere{position:absolute;inset:0;z-index:4;pointer-events:none;background:rgba(16,25,55,var(--night-opacity,0));transition:background .8s linear}';
  document.head.appendChild(style);

  const oldDraw=window.draw;
  if(typeof oldDraw==='function'){
    window.draw=function(){oldDraw();update();};
  }
  update();
})();
