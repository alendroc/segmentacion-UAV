(function(){
"use strict";
/* --------- utilidades --------- */
function rng(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
var R=rng(20260512), NS="http://www.w3.org/2000/svg";
var MPP=0.08;               // metros por unidad del viewBox

/* --------- datos simulados de copas --------- */
var crowns=[], id=0;
for(var gy=0; gy<9; gy++){
  for(var gx=0; gx<13; gx++){
    if(R()<0.09) continue;
    var cx=48+gx*94+(R()-0.5)*46, cy=45+gy*90+(R()-0.5)*44;
    var rad=24+R()*22;
    var conf=0.42+Math.pow(R(),0.55)*0.57;
    var pts=[], n=11+Math.floor(R()*4);
    for(var i=0;i<n;i++){
      var a=i/n*Math.PI*2, rr=rad*(0.78+R()*0.42);
      pts.push([+(cx+Math.cos(a)*rr).toFixed(1), +(cy+Math.sin(a)*rr*0.94).toFixed(1)]);
    }
    var area=Math.PI*rad*rad*0.86*MPP*MPP;
    crowns.push({
      id:"CP-"+String(++id).padStart(4,"0"),
      cx:cx, cy:cy, r:rad, pts:pts, conf:conf,
      area:area, diam:2*rad*MPP,
      state: conf<0.6 ? (R()<0.35?"no":"low") : "ok",
      hue: 92+R()*40, lum: 22+R()*26
    });
  }
}

/* --------- lienzo del mapa --------- */
var map=document.getElementById("map");
function el(t,at){var e=document.createElementNS(NS,t);for(var k in at)e.setAttribute(k,at[k]);return e;}

var defs=el("defs");
defs.innerHTML='<filter id="soft"><feGaussianBlur stdDeviation="7"/></filter>'+
               '<filter id="grain"><feTurbulence baseFrequency="0.9" numOctaves="2" result="n"/><feColorMatrix in="n" type="saturate" values="0"/><feComposite operator="in" in2="SourceGraphic"/></filter>';
map.appendChild(defs);

// fondo: suelo / sotobosque
map.appendChild(el("rect",{x:0,y:0,width:1200,height:800,fill:"#2A2A18"}));
var g0=el("g",{filter:"url(#soft)"});
for(var i=0;i<220;i++){
  g0.appendChild(el("circle",{cx:R()*1200,cy:R()*800,r:14+R()*40,
    fill:"hsl("+(60+R()*35)+",28%,"+(12+R()*12)+"%)",opacity:(0.4+R()*0.5).toFixed(2)}));
}
map.appendChild(g0);

// capa ortomosaico: masa de dosel
var gOrto=el("g",{id:"L-orto",filter:"url(#soft)"});
crowns.forEach(function(c){
  gOrto.appendChild(el("circle",{cx:c.cx,cy:c.cy,r:c.r*1.12,
    fill:"hsl("+c.hue+",34%,"+c.lum+"%)",opacity:.95}));
  for(var k=0;k<5;k++){
    var a=R()*6.28, d=R()*c.r*0.6;
    gOrto.appendChild(el("circle",{cx:c.cx+Math.cos(a)*d,cy:c.cy+Math.sin(a)*d,
      r:c.r*(0.3+R()*0.3),fill:"hsl("+(c.hue+R()*16-8)+",38%,"+(c.lum+R()*14-4)+"%)",opacity:.75}));
  }
});
map.appendChild(gOrto);

// parcelas de campo
var gPar=el("g",{id:"L-parcelas"});
[[70,60],[430,110],[820,70],[180,470],[560,520],[900,430]].forEach(function(p,ix){
  gPar.appendChild(el("rect",{x:p[0],y:p[1],width:250,height:250,fill:"rgba(124,108,255,.09)",
    stroke:"#7C6CFF","stroke-width":1.6,"stroke-dasharray":"7 5",rx:2}));
  var t=el("text",{x:p[0]+7,y:p[1]+17,fill:"#B7AEFF","font-family":"IBM Plex Mono","font-size":12});
  t.textContent="P-0"+(ix+1); gPar.appendChild(t);
});
map.appendChild(gPar);

// polígonos de copas
var gCop=el("g",{id:"L-copas"});
var COL={ok:"#00CFBB",low:"#F0A527",no:"#DB4A3C"};
crowns.forEach(function(c){
  var p=el("polygon",{points:c.pts.map(function(q){return q.join(",")}).join(" "),
    fill:"rgba(0,0,0,0)",stroke:COL[c.state],"stroke-width":1.7,
    "stroke-dasharray":c.state==="no"?"5 4":"none",class:"poly",tabindex:"0",
    style:"cursor:pointer"});
  p.setAttribute("data-id",c.id);
  c.node=p; gCop.appendChild(p);
});
map.appendChild(gCop);
var gSel=el("g",{id:"L-sel"}); map.appendChild(gSel);

/* --------- interacción --------- */
var sel=null;
function fmt(n,d){return n.toFixed(d===undefined?1:d)}
function visible(c){
  var conf=+document.getElementById("conf").value/100;
  var amin=+document.getElementById("amin").value/10;
  return c.conf>=conf && c.area>=amin;
}
function refresh(){
  var vis=crowns.filter(visible), ok=0,low=0,no=0,sumD=0;
  crowns.forEach(function(c){
    var v=visible(c);
    c.node.style.opacity=v?(document.getElementById("op").value/100):0;
    c.node.style.pointerEvents=v?"auto":"none";
  });
  vis.forEach(function(c){ if(c.state==="ok")ok++; else if(c.state==="low")low++; else no++; sumD+=c.diam; });
  var ha=12.4;
  document.getElementById("n-ok").textContent=ok;
  document.getElementById("n-low").textContent=low;
  document.getElementById("n-no").textContent=no;
  document.getElementById("f-n").textContent=vis.length;
  document.getElementById("f-dens").textContent=Math.round(vis.length/ha*8.9)+" árb/ha";
  document.getElementById("f-dm").textContent=fmt(vis.length?sumD/vis.length:0)+" m";
  document.getElementById("f-rev").textContent=Math.round(ok/(vis.length||1)*100)+" % confirmada";
  document.getElementById("confv").textContent=(+document.getElementById("conf").value/100).toFixed(2);
  document.getElementById("aminv").textContent=(+document.getElementById("amin").value/10).toFixed(1)+" m²";
}
function select(c){
  sel=c;
  while(gSel.firstChild) gSel.removeChild(gSel.firstChild);
  gSel.appendChild(el("polygon",{points:c.pts.map(function(q){return q.join(",")}).join(" "),
    fill:"rgba(255,255,255,.14)",stroke:"#fff","stroke-width":2.4}));
  c.pts.forEach(function(q){ gSel.appendChild(el("rect",{x:q[0]-3,y:q[1]-3,width:6,height:6,fill:"#fff",stroke:"#0B1310"})); });
  var B={ok:["Confirmada","b-ok"],low:["Revisar · confianza baja","b-low"],no:["Descartada","b-no"]}[c.state];
  document.getElementById("d-id").textContent=c.id;
  var bd=document.getElementById("d-badge"); bd.textContent=B[0]; bd.className="badge "+B[1];
  document.getElementById("d-conf").textContent=c.conf.toFixed(2);
  document.getElementById("d-area").textContent=fmt(c.area)+" m²";
  document.getElementById("d-diam").textContent=fmt(c.diam)+" m";
  document.getElementById("d-vert").textContent=c.pts.length;
  document.getElementById("d-cent").textContent=(487320+c.cx*0.08).toFixed(1)+" E · "+(1098640-c.cy*0.08).toFixed(1)+" N";
  // miniatura
  var t=document.getElementById("d-thumb");
  t.innerHTML='<svg viewBox="'+(c.cx-c.r*1.9)+' '+(c.cy-c.r*1.4)+' '+(c.r*3.8)+' '+(c.r*2.8)+'">'+
    '<rect x="'+(c.cx-c.r*2)+'" y="'+(c.cy-c.r*2)+'" width="'+(c.r*4)+'" height="'+(c.r*4)+'" fill="#25301F"/>'+
    '<circle cx="'+c.cx+'" cy="'+c.cy+'" r="'+(c.r*1.1)+'" fill="hsl('+c.hue+',34%,'+c.lum+'%)"/>'+
    '<polygon points="'+c.pts.map(function(q){return q.join(",")}).join(" ")+'" fill="none" stroke="'+COL[c.state]+'" stroke-width="1.6"/></svg>';
}
gCop.addEventListener("click",function(e){
  var t=e.target.getAttribute&&e.target.getAttribute("data-id");
  if(!t) return;
  var c=crowns.filter(function(x){return x.id===t})[0]; if(c) select(c);
});
gCop.addEventListener("keydown",function(e){
  if(e.key!=="Enter"&&e.key!==" ") return;
  var t=e.target.getAttribute&&e.target.getAttribute("data-id"); if(!t) return;
  e.preventDefault();
  var c=crowns.filter(function(x){return x.id===t})[0]; if(c) select(c);
});
["conf","amin","op"].forEach(function(k){ document.getElementById(k).addEventListener("input",refresh); });

document.querySelectorAll(".layer").forEach(function(l){
  l.addEventListener("click",function(){
    var on=l.getAttribute("data-on")==="1"?"0":"1";
    l.setAttribute("data-on",on);
    var m={orto:"L-orto",copas:"L-copas",parcelas:"L-parcelas"}[l.getAttribute("data-layer")];
    var node=document.getElementById(m);
    node.style.display=on==="1"?"":"none";
    node.style.opacity=on==="1"?1:0;
    if(m==="L-sel"||m==="L-copas") gSel.style.display=node.style.display;
  });
});

document.querySelector(".canvaswrap").addEventListener("mousemove",function(e){
  var r=this.getBoundingClientRect();
  var x=(e.clientX-r.left)/r.width, y=(e.clientY-r.top)/r.height;
  document.getElementById("coords").textContent=
    (9.9385+(0.5-y)*0.0009).toFixed(5)+"° N \u00A0 "+(84.0912+(x-0.5)*0.0011).toFixed(5)+"° O \u00A0|\u00A0 1:400";
});

/* --------- tarjetas de proyectos --------- */
function miniatura(seed){
  var r2=rng(seed), s='<svg viewBox="0 0 240 120"><rect width="240" height="120" fill="#2A2A18"/><g filter="url(#soft)">';
  for(var i=0;i<70;i++){
    s+='<circle cx="'+(r2()*240).toFixed(0)+'" cy="'+(r2()*120).toFixed(0)+'" r="'+(6+r2()*13).toFixed(0)+'" fill="hsl('+(92+r2()*40).toFixed(0)+',34%,'+(20+r2()*24).toFixed(0)+'%)"/>';
  }
  s+='</g><defs><filter id="soft"><feGaussianBlur stdDeviation="3"/></filter></defs></svg>';
  return s;
}
var PROY=[
  {n:"Lote Norte",f:"12 may 2026",a:"12.4 ha",t:"1 093 copas",s:"Revisado 78 %",c:"var(--signal)"},
  {n:"Quebrada Honda",f:"28 abr 2026",a:"8.1 ha",t:"642 copas",s:"Listo",c:"var(--signal)"},
  {n:"Plantación El Alto",f:"19 abr 2026",a:"21.7 ha",t:"2 410 copas",s:"Procesando 64 %",c:"var(--warn)"},
  {n:"Ribera Río Sucio",f:"02 abr 2026",a:"5.3 ha",t:"—",s:"Error de georreferencia",c:"var(--danger)"}
];
var pg=document.getElementById("projgrid");
PROY.forEach(function(p,ix){
  var d=document.createElement("article"); d.className="card";
  d.innerHTML='<div class="pic">'+miniatura(1000+ix*77)+'</div><div class="body">'+
    '<h4>'+p.n+'</h4><div class="m">'+p.f+' · '+p.a+' · '+p.t+'</div>'+
    '<div class="st"><span class="lbl" style="color:'+p.c+'">'+p.s+'</span><button class="btn" data-go="visor">Abrir</button></div></div>';
  pg.appendChild(d);
});
var nu=document.createElement("button"); nu.className="card new"; nu.setAttribute("data-go","procesar");
nu.innerHTML='<span><span style="font-size:22px;display:block;text-align:center">＋</span>Cargar nuevo vuelo</span>';
pg.appendChild(nu);

/* --------- histograma --------- */
var bins=[0,0,0,0,0,0,0,0];
crowns.forEach(function(c){var b=Math.min(7,Math.max(0,Math.floor((c.diam-2)/1.5)));bins[b]++;});
var mx=Math.max.apply(null,bins), h=document.getElementById("hist");
bins.forEach(function(v,i){
  var bh=v/mx*96, x=34+i*34.5;
  h.appendChild(el("rect",{x:x,y:122-bh,width:27,height:bh,fill:"#1B2620",rx:1}));
  var t=el("text",{x:x+13.5,y:118-bh,"text-anchor":"middle","font-family":"IBM Plex Mono","font-size":9,fill:"#6C7C71"});
  t.textContent=v; h.appendChild(t);
});

/* --------- navegación entre pantallas --------- */
function go(name){
  document.querySelectorAll(".screen").forEach(function(s){s.classList.toggle("on",s.id==="s-"+name)});
  document.querySelectorAll(".mockbar nav button").forEach(function(b){
    b.setAttribute("aria-current", b.getAttribute("data-go")===name ? "true":"false");
  });
  window.scrollTo(0,0);
}
document.addEventListener("click",function(e){
  var t=e.target.closest("[data-go]"); if(t) go(t.getAttribute("data-go"));
});

refresh();
select(crowns[Math.floor(crowns.length*0.42)]);
})();
