'use strict';
// The opening has its own camera. The remaining nine scenes use the original World.
window.OriginCover = class OriginCover {
 constructor(){
  this.expanded=false;this.amount=0;this.hover=0;this.suppressHover=false;this.aim={x:0,y:0};this.last=0;this.dirty=true;
  let seed=8291;const random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
  this.fragments=Array.from({length:48},(_,i)=>{
   const angle=i*2.399963,rad=.13+Math.pow(random(),.65)*.45;
   const corner=i<4;
   return {i,angle,x:corner?[-.48,.48,-.46,.47][i]:Math.cos(angle)*rad,
    y:corner?[-.49,-.24,.42,.47][i]:Math.sin(angle)*rad*.93,
    z:corner?440+i*12:70+Math.pow(random(),1.5)*335,
    size:corner?.28+random()*.12:.045+Math.pow(random(),2)*.20,
    origin:[(i%4-1.5)*.20,(Math.floor(i/4)%4-1.5)*.20,(Math.floor(i/16)-1)*.20],
    rotation:[(random()-.5)*1.8,(random()-.5)*2.1,(random()-.5)*1.5],
    plate:!corner&&i%7===0,tone:random(),phase:random()*6.28};
  });
 }
 bind(section,labels){
  this.labels=labels;this.section=section;this.toggle=section.querySelector('#cover-toggle');this.hit=section.querySelector('#cover-cube');
  const change=()=>{this.expanded=!this.expanded;if(!this.expanded){this.hover=0;this.suppressHover=true;}this.update();this.dirty=true;};
  this.toggle.onclick=change;this.hit.onclick=change;
  for(const button of [this.toggle,this.hit]){
   button.onkeydown=e=>{if(e.key===' '||e.code==='Space'||e.key==='Enter'){e.preventDefault();if(!e.repeat)change();}};
   button.onkeyup=e=>{if(e.key===' '||e.code==='Space'||e.key==='Enter')e.preventDefault();};
  }
  section.onpointermove=e=>{
   const box=section.getBoundingClientRect(),w=box.width,h=innerHeight;
   this.aim.x=(e.clientX/w-.5)*2;this.aim.y=(e.clientY/h-.5)*2;
   const proximity=Math.max(0,1-Math.hypot(e.clientX-w*.47,e.clientY-h*.47)/(Math.min(w,h)*.58));
   if(proximity<.04)this.suppressHover=false;
   this.hover=e.pointerType==='mouse'&&!this.suppressHover?proximity*.56:0;this.dirty=true;
  };
  section.onpointerleave=()=>{this.hover=0;this.suppressHover=false;this.aim={x:0,y:0};this.dirty=true;};
  this.update();
 }
 update(){
  if(!this.toggle)return;
  for(const button of [this.toggle,this.hit])button.setAttribute('aria-pressed',String(this.expanded));
  this.toggle.querySelector('span').textContent=this.expanded?this.labels.coverGather:this.labels.coverExpand;
  this.toggle.querySelector('i').textContent=this.expanded?'↙':'↗';
  this.hit.setAttribute('aria-label',this.expanded?this.labels.coverGather:this.labels.coverExpand);
  this.section.dataset.expanded=String(this.expanded);
  this.section.querySelector('#cover-status').textContent=this.expanded?this.labels.coverExpandedStatus:this.labels.coverClosedStatus;
 }
 rotate(point,angles){
  let [x,y,z]=point;const [ax,ay,az]=angles;
  [y,z]=[y*Math.cos(ax)-z*Math.sin(ax),y*Math.sin(ax)+z*Math.cos(ax)];
  [x,z]=[x*Math.cos(ay)+z*Math.sin(ay),-x*Math.sin(ay)+z*Math.cos(ay)];
  return [x*Math.cos(az)-y*Math.sin(az),x*Math.sin(az)+y*Math.cos(az),z];
 }
 cuboid(c,fragment,e,time,w,h,size,cx,cy,still){
  const f=720,p=fragment,depth=p.z*e,perspective=f/(f-depth);
  const drift=still?0:Math.sin(time*.26+p.phase)*3*e;
  const parallax=still?0:e*(.15+p.z/650);
  const x=(p.origin[0]*size*(1-e)+p.x*w*e/perspective)-this.aim.x*15*parallax;
  const y=(p.origin[1]*size*(1-e)+p.y*h*e/perspective)+drift-this.aim.y*10*parallax;
  const z=p.origin[2]*size*(1-e)+depth;
  const half=size*p.size*.5*(.38+e*.62),thickness=p.plate?half*.12:half;
  const angles=[-.28+p.rotation[0]*e,-.45+p.rotation[1]*e,p.rotation[2]*e];
  const vertices=[[-half,-half,-thickness],[half,-half,-thickness],[half,half,-thickness],[-half,half,-thickness],[-half,-half,thickness],[half,-half,thickness],[half,half,thickness],[-half,half,thickness]].map(v=>{
   const r=this.rotate(v,angles);const zz=r[2]+z,k=f/Math.max(110,f-zz);return {x:cx+(r[0]+x)*k,y:cy+(r[1]+y)*k,z:zz};
  });
  const faceIds=[[0,3,2,1],[4,5,6,7],[0,4,7,3],[1,2,6,5],[0,1,5,4],[3,7,6,2]];
  const normals=[[0,0,-1],[0,0,1],[-1,0,0],[1,0,0],[0,-1,0],[0,1,0]];
  const faces=faceIds.map((ids,i)=>({ids,n:this.rotate(normals[i],angles),z:ids.reduce((sum,j)=>sum+vertices[j].z/4,0)})).sort((a,b)=>a.z-b.z);
  c.save();
  const blur=p.i<4?e*(w<=600?1.2:2.5):Math.max(0,(z-320)/120)*e;
  if(blur>.2)c.filter=`blur(${blur.toFixed(1)}px)`;
  c.globalAlpha*=Math.min(1,e*3.4)*(p.i<4?.85:1);
  for(const face of faces){
   const light=Math.max(0,face.n[0]*-.48+face.n[1]*-.65+face.n[2]*.58);
   const bright=.13+light*.76;
   const pale=p.tone>.77,blue=p.tone<.14;
   const base=pale?[166,188,207]:blue?[14,87,171]:[32,54,79];
   c.beginPath();face.ids.forEach((id,i)=>{const v=vertices[id];i?c.lineTo(v.x,v.y):c.moveTo(v.x,v.y)});c.closePath();
   c.fillStyle=`rgb(${base.map(v=>Math.round(v*bright)).join(',')})`;c.fill();
   c.lineWidth=.7;c.strokeStyle=`rgba(167,196,215,${.12+light*.16})`;c.stroke();
  }
  c.restore();
 }
 draw(c,{width:w,height:h,opacity,time,still,drawCore}){
  if(opacity<=0){this.dirty=false;return;}
  const dt=this.last?Math.min(.08,Math.max(0,time-this.last)):.032;this.last=time;
  const target=this.expanded?1:still?0:this.hover;
  this.amount=still?target:this.amount+(target-this.amount)*(1-Math.exp(-dt*3.2));
  if(Math.abs(target-this.amount)<.001)this.amount=target;
  const e=this.amount*(2-this.amount),cx=w*.47,cy=h*.47,size=w<=600?Math.min(w*.35,h*.22):Math.min(w*.15,h*.26);
  c.save();c.globalAlpha=opacity;
  c.fillStyle='#030709';c.fillRect(0,0,w,h);
  const glow=c.createRadialGradient(cx,cy,0,cx,cy,Math.min(w*.5,h*.75));
  glow.addColorStop(0,'#0b2135');glow.addColorStop(.38,'#06111c');glow.addColorStop(1,'#030709');c.fillStyle=glow;c.fillRect(0,0,w,h);
  // A restrained remnant of the original floor binds the cover to the next scene.
  const floor=c.createLinearGradient(0,h*.74,0,h);floor.addColorStop(0,'#050b0c00');floor.addColorStop(1,'#07131b70');c.fillStyle=floor;c.fillRect(0,h*.74,w,h*.26);
  const near=this.fragments.filter(p=>p.z>260),far=this.fragments.filter(p=>p.z<=260);
  for(const p of far)this.cuboid(c,p,e,time,w,h,size,cx,cy,still);
  // At rest this is literally the original cube: same faces, texture and dimensions.
  c.save();drawCore(opacity);c.restore();
  for(const p of near)this.cuboid(c,p,e,time,w,h,size,cx,cy,still);
  c.restore();this.dirty=false;
 }
};
