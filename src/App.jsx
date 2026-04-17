import { useState, useEffect, useRef, useCallback } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, onValue, update } from "firebase/database";

const firebaseConfig = {
  apiKey:            "AIzaSyAY0yNyYqSuYlQT1NKgWsJnXY4z5X_6s1Q",
  authDomain:        "blueswarm-efd39.firebaseapp.com",
  databaseURL:       "https://blueswarm-efd39-default-rtdb.europe-west1.firebasedatabase.app",
  projectId:         "blueswarm-efd39",
  storageBucket:     "blueswarm-efd39.firebasestorage.app",
  messagingSenderId: "487995747928",
  appId:             "1:487995747928:web:e32487428aefc7a4f3a42d",
};

const fbApp = initializeApp(firebaseConfig);
const db = getDatabase(fbApp);
const fbSet    = (path, val)  => set(ref(db, path), val);
const fbGet    = async (path) => { const s = await get(ref(db, path)); return s.exists() ? s.val() : null; };
const fbListen = (path, cb)   => { const r = ref(db, path); return onValue(r, s => cb(s.exists() ? s.val() : null)); };
const fbUpdate = (path, val)  => update(ref(db, path), val);
const sp       = (code)       => `swarm__${code}`;

const OC = { bg:"#010d1f",deep:"#020f24",card:"#041830",cardMid:"#061f3a",border:"#0c3358",borderGlow:"#1a5a8a",accent:"#00c8f5",accent2:"#00e5b0",text:"#b8dcff",textMid:"#4a80a8",textDim:"#173354" };

const DIMS = {
  O:{ color:"#00d4ff",label:"Openness",short:"Curiosity & new ideas",title:"Openness to Experience",tagline:"How much you seek novelty and embrace ambiguity",high:"Energised by new ideas · Pivots easily · Loves experiments",low:"Practical & grounded · Values what's proven · Consistent",teamHigh:"Sparks creative directions, challenges the status quo",teamLow:"Keeps the team focused and execution-oriented",tip:"High O: Validate ideas before optimising.\nLow O: Frame changes as improvements, not disruptions." },
  C:{ color:"#ff6b9d",label:"Conscientiousness",short:"Structure & reliability",title:"Conscientiousness",tagline:"How you approach planning, structure, and follow-through",high:"Plans ahead · Delivers reliably · Detail-oriented",low:"Flexible · Adapts on the fly · Values autonomy",teamHigh:"Anchors execution, catches gaps others miss",teamLow:"Enables agility when plans need to shift",tip:"High C: Be specific — what worked, what to improve.\nLow C: Focus on outcomes, not process." },
  E:{ color:"#ffd93d",label:"Extraversion",short:"Energy & social presence",title:"Extraversion",tagline:"Where you draw energy — from others or from solitude",high:"Takes initiative · Expressive · Energised by interaction",low:"Thoughtful · Measured · Recharges alone",teamHigh:"Drives momentum and keeps energy high in the room",teamLow:"Brings considered perspective, sees what others miss",tip:"High E: Give feedback in conversation, not in writing.\nLow E: Give space to process before expecting a response." },
  A:{ color:"#a855f7",label:"Agreeableness",short:"Cooperation & empathy",title:"Agreeableness",tagline:"How you balance harmony with honesty",high:"Empathetic · Cooperative · Builds trust naturally",low:"Direct · Challenge-oriented · Comfortable with tension",teamHigh:"Holds the team together, gives supportive feedback",teamLow:"Names what others avoid, drives honest conversations",tip:"High A: Be clear — they may not push back.\nLow A: Can handle directness — match their style." },
  N:{ color:"#00e5b0",label:"Neuroticism",short:"Stability under pressure",title:"Emotional Stability",tagline:"How you respond to pressure, setbacks, and uncertainty",high:"Deeply invested · Emotionally reactive · Highly sensitive",low:"Calm under fire · Resilient · Steady in uncertainty",teamHigh:"Brings intensity and care — needs psychological safety",teamLow:"Provides steadiness when things get difficult",tip:"High N: Start with what's working, be reassuring.\nLow N: Can handle blunt feedback — don't over-soften." },
};

const QUESTIONS = [
  { dim:"O", text:"Your team is tackling a project nobody has done before. Which approach appeals most?", opts:[{t:"Find a methodology another team used and follow it closely",s:1},{t:"Take a standard approach and adjust where needed",s:2},{t:"Mix elements from several methods into something tailored",s:3},{t:"Start from scratch and invent an approach for this specific situation",s:4}]},
  { dim:"O", text:"A colleague sends you an article on a topic totally outside your field. Your honest reaction:", opts:[{t:"I skim the first paragraph and move on",s:1},{t:"I save it for later if I have time",s:2},{t:"I read it because unexpected topics sometimes connect to my work",s:3},{t:"I read it right away and start thinking about what it might connect to",s:4}]},
  { dim:"O", text:"Your team has a free afternoon for professional development. You would most want to:", opts:[{t:"Sharpen a skill you already use daily",s:1},{t:"Take a deeper course on something adjacent to your role",s:2},{t:"Try a workshop in a completely different discipline",s:3},{t:"Explore something abstract or artistic with no obvious work use",s:4}]},
  { dim:"O", text:"When someone describes an idea as \"unconventional,\" you usually think:", opts:[{t:"Those are often the ideas that turn out to matter most",s:4},{t:"Worth hearing out before judging",s:3},{t:"Interesting, but I would want evidence it works",s:2},{t:"That usually means it has not been tested properly",s:1}]},
  { dim:"C", text:"It is Monday with a Friday deadline. Your natural approach:", opts:[{t:"Block out the week, assign each day a chunk, and follow the plan",s:4},{t:"Outline the steps and pace yourself across the week",s:3},{t:"Work on it when you have momentum; it will get done",s:2},{t:"Focus on other things and push hard at the end",s:1}]},
  { dim:"C", text:"Your desk or workspace on an average Wednesday looks:", opts:[{t:"Clean and organized, everything in its place",s:4},{t:"Mostly tidy with a few things out",s:3},{t:"Lived in but functional; I know where things are",s:2},{t:"Creative chaos; I find things when I need them",s:1}]},
  { dim:"C", text:"A teammate didn't deliver what they promised by the agreed time. Your instinct:", opts:[{t:"Not a big deal unless it blocks me",s:1},{t:"I give it some time; people get busy",s:2},{t:"I check in to see what happened and whether it will still land",s:3},{t:"I'm frustrated; commitments should be kept",s:4}]},
  { dim:"C", text:"A task has no strict deadline. You:", opts:[{t:"Set your own timeline and stick to it",s:4},{t:"Give it rough boundaries and move steadily",s:3},{t:"Chip away when other things are quiet",s:2},{t:"Do it when it becomes urgent or interesting",s:1}]},
  { dim:"E", text:"After a full day of back-to-back meetings, you feel:", opts:[{t:"Energized; I like that kind of day",s:4},{t:"Fine, depending on the people",s:3},{t:"A bit drained but okay",s:2},{t:"Exhausted and needing quiet time",s:1}]},
  { dim:"E", text:"In a brainstorming session, you tend to:", opts:[{t:"Think out loud and throw ideas around quickly",s:4},{t:"Contribute whenever something comes to you",s:3},{t:"Listen first, then offer a more considered thought",s:2},{t:"Prefer to think alone and share later in writing",s:1}]},
  { dim:"E", text:"A new team is forming and nobody has stepped into a coordinator role. You:", opts:[{t:"Stay focused on your part of the work",s:1},{t:"Support whoever takes it on",s:2},{t:"Volunteer if no one else does",s:3},{t:"Step up; someone has to",s:4}]},
  { dim:"E", text:"At a work social event, after two hours you are:", opts:[{t:"Looking for the next thing to go to",s:4},{t:"Enjoying yourself and happy to stay",s:3},{t:"Ready to wrap up soon",s:2},{t:"Already thinking about leaving",s:1}]},
  { dim:"A", text:"A colleague pushes back on an idea of yours in a meeting. Your first reaction:", opts:[{t:"I'm curious about their reasoning and want to understand it",s:4},{t:"I hear them out, then defend my view if it still holds",s:3},{t:"I push back firmly; that is how good ideas get tested",s:2},{t:"I don't back down easily; I came in with a reason",s:1}]},
  { dim:"A", text:"Someone on the team is clearly struggling with personal stuff and it is affecting their work. You:", opts:[{t:"Check in on them before thinking about work impact",s:4},{t:"Ask if they are okay and offer to cover something",s:3},{t:"Give them space, then raise it gently if it continues",s:2},{t:"The work still needs to get done; that comes first",s:1}]},
  { dim:"A", text:"When you disagree with a decision the group made, you:", opts:[{t:"Make it clear you disagree and act accordingly",s:1},{t:"Keep pushing if you think the group is wrong",s:2},{t:"Raise your concern once, then support the decision",s:3},{t:"Go along with it for the sake of the team",s:4}]},
  { dim:"A", text:"A new colleague tells you something about their previous job that seems almost too good to be true. You:", opts:[{t:"Take them at their word; no reason to doubt",s:4},{t:"Believe them but stay mildly curious",s:3},{t:"Wonder a bit but keep it to yourself",s:2},{t:"Stay skeptical until you see evidence",s:1}]},
  { dim:"N", text:"Right before a high-stakes presentation, you typically feel:", opts:[{t:"Pretty calm; I know my material",s:1},{t:"A bit nervous but in a useful way",s:2},{t:"Quite anxious; it takes effort to manage",s:3},{t:"Very tense; hard to stop the thoughts spinning",s:4}]},
  { dim:"N", text:"A project you cared about didn't go well. Two days later, you are:", opts:[{t:"Mostly moved on; other things to focus on",s:1},{t:"Still thinking about it, but functioning normally",s:2},{t:"Still bothered and replaying what went wrong",s:3},{t:"Still feeling it heavily; these things stick",s:4}]},
  { dim:"N", text:"Something unexpected changes your plan at the last minute. You usually:", opts:[{t:"Feel thrown off for a while afterward",s:4},{t:"Get visibly frustrated before adjusting",s:3},{t:"Regroup quickly, with a bit of friction",s:2},{t:"Roll with it; plans change",s:1}]},
  { dim:"N", text:"How often do small worries about work keep you up at night?", opts:[{t:"Almost never",s:1},{t:"Occasionally, when something big is on",s:2},{t:"Fairly often; I think about work a lot",s:3},{t:"Most nights, if I'm honest",s:4}]},
];

function calcScores(answers) {
  const scores = {};
  Object.keys(DIMS).forEach(dim => {
    const qs = QUESTIONS.filter(q => q.dim === dim);
    const total = qs.length * 4;
    const sum = qs.reduce((acc, q) => acc + (answers[QUESTIONS.indexOf(q)] || 0), 0);
    scores[dim] = Math.round((sum / total) * 100);
  });
  return scores;
}

function genCode() { return Math.random().toString(36).substr(2, 5).toUpperCase(); }
function genPid()  { return Math.random().toString(36).substr(2, 10); }

// Global CSS for transitions and microinteractions
const GLOBAL_CSS = `
@keyframes screenFadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes fishFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
@keyframes accordionOpen{from{max-height:0;opacity:0}to{max-height:600px;opacity:1}}
@keyframes pulse{0%,100%{opacity:0.2;transform:scale(0.8)}50%{opacity:1;transform:scale(1.2)}}
@keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes btnGlow{0%{box-shadow:0 0 20px rgba(0,200,245,0.2)}50%{box-shadow:0 0 35px rgba(0,200,245,0.45)}100%{box-shadow:0 0 20px rgba(0,200,245,0.2)}}
@keyframes cardFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
@keyframes ripple{0%{transform:scale(0);opacity:0.6}100%{transform:scale(4);opacity:0}}
@keyframes creatureSwim{0%{transform:translateX(-120px) translateY(0)}25%{transform:translateX(25vw) translateY(-8px)}50%{transform:translateX(50vw) translateY(4px)}75%{transform:translateX(75vw) translateY(-6px)}100%{transform:translateX(calc(100vw + 120px)) translateY(0)}}
@keyframes creatureFade{0%{opacity:0}5%{opacity:0.06}95%{opacity:0.06}100%{opacity:0}}
.screen-enter{animation:screenFadeIn 0.45s ease-out both}
.btn-ocean{transition:all 0.2s ease;position:relative;overflow:hidden}
.btn-ocean:active{transform:scale(0.97)}
.btn-ocean:hover{filter:brightness(1.08)}
.card-float{transition:all 0.3s ease;position:relative}
.card-float:hover{transform:translateY(-2px);box-shadow:0 8px 32px rgba(0,200,245,0.08)}
`;

// Rare ocean creature that swims across the background
function OceanCreature() {
  const [creature, setCreature] = useState(null);
  useEffect(() => {
    function spawn() {
      const types = [
        // Orca silhouette path
        { path: "M0,20 Q10,8 25,10 Q35,5 50,8 Q60,2 70,10 L75,6 L72,12 Q78,14 80,20 Q78,26 72,28 L75,34 L70,30 Q60,38 50,32 Q35,35 25,30 Q10,32 0,20Z", w:80, h:40 },
        // Squid silhouette
        { path: "M20,0 Q25,5 28,15 Q30,25 28,35 Q25,40 20,42 Q15,40 12,35 Q10,25 12,15 Q15,5 20,0Z M12,35 Q5,45 2,50 M15,38 Q10,48 8,52 M20,42 Q20,52 20,55 M25,38 Q30,48 32,52 M28,35 Q35,45 38,50", w:40, h:55 },
        // Manta ray
        { path: "M40,20 Q30,5 10,12 Q0,16 5,22 Q10,28 30,25 L40,30 L50,25 Q70,28 75,22 Q80,16 70,12 Q50,5 40,20Z M38,28 L36,40 M42,28 L44,40", w:80, h:42 },
      ];
      const t = types[Math.floor(Math.random()*types.length)];
      const y = 15 + Math.random()*60; // % from top
      const dur = 45 + Math.random()*30; // seconds
      setCreature({ ...t, y, dur, key: Date.now() });
      // Hide after animation
      setTimeout(() => setCreature(null), dur * 1000);
    }
    // First spawn after 20-60s, then every 40-90s
    const first = setTimeout(spawn, (20 + Math.random()*40) * 1000);
    const interval = setInterval(spawn, (40 + Math.random()*50) * 1000);
    return () => { clearTimeout(first); clearInterval(interval); };
  }, []);
  if (!creature) return null;
  return (
    <svg key={creature.key} viewBox={`0 0 ${creature.w} ${creature.h}`} style={{
      position:"fixed", top:`${creature.y}%`, left:0, width:creature.w*1.5, height:creature.h*1.5,
      pointerEvents:"none", zIndex:0, opacity:0,
      animation:`creatureSwim ${creature.dur}s linear both, creatureFade ${creature.dur}s ease both`,
    }}>
      <path d={creature.path} fill="none" stroke="rgba(0,200,245,0.12)" strokeWidth="1" />
    </svg>
  );
}

function BubblesBg() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width = window.innerWidth, H = canvas.height = window.innerHeight;

    const bubbles = Array.from({length:42}, () => ({
      x:Math.random()*W, y:H+Math.random()*H,
      r:1.2+Math.random()*6, speed:0.18+Math.random()*0.65,
      drift:(Math.random()-0.5)*0.35, wobble:Math.random()*Math.PI*2,
      wobbleSpeed:0.006+Math.random()*0.018, alpha:0.06+Math.random()*0.13,
      parallax:0.3+Math.random()*0.7 // depth layer
    }));

    const plankton = Array.from({length:120}, () => ({
      x:Math.random()*W, y:Math.random()*H,
      r:0.3+Math.random()*1.2, speed:0.03+Math.random()*0.14,
      drift:(Math.random()-0.5)*0.07,
      phase:Math.random()*Math.PI*2, phaseSpeed:0.01+Math.random()*0.035,
      type:Math.random()<0.5?0:Math.random()<0.6?1:2,
      parallax:0.2+Math.random()*0.8
    }));

    let t=0, raf;
    const PCOLS = ['rgba(0,210,245','rgba(0,220,175','rgba(155,100,255'];

    function draw() {
      t++;
      ctx.clearRect(0,0,W,H);

      // Deep-ocean depth vignette
      const dg=ctx.createLinearGradient(0,H*0.4,0,H);
      dg.addColorStop(0,'rgba(0,0,0,0)'); dg.addColorStop(1,'rgba(0,2,15,0.55)');
      ctx.fillStyle=dg; ctx.fillRect(0,0,W,H);

      // Animated caustic light patches with parallax
      for(let i=0;i<7;i++){
        const depth = 0.5+i*0.08;
        const cx=W*0.12+Math.cos(t*0.0003*depth+i*1.1)*W*0.42;
        const cy=-35+Math.sin(t*0.00025*depth+i*0.8)*60;
        const r=160+i*50+Math.sin(t*0.0008+i)*40;
        const intensity=0.012+Math.sin(t*0.0006+i*0.6)*0.007;
        const cg=ctx.createRadialGradient(cx,cy,0,cx,cy,r);
        cg.addColorStop(0,`rgba(0,188,230,${intensity})`);
        cg.addColorStop(0.4,`rgba(0,120,185,${intensity*0.3})`);
        cg.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=cg; ctx.fillRect(0,0,W,Math.min(H*0.55,r+cy+50));
      }

      // Plankton with parallax depth
      plankton.forEach(p=>{
        p.phase+=p.phaseSpeed; p.y-=p.speed*p.parallax; p.x+=p.drift*p.parallax;
        if(p.y<-4){p.y=H+4;p.x=Math.random()*W;}
        if(p.x<0)p.x=W; if(p.x>W)p.x=0;
        const pulse=0.3+Math.sin(p.phase)*0.7;
        const sz = p.r * (0.5 + p.parallax*0.5);
        ctx.beginPath(); ctx.arc(p.x,p.y,sz,0,Math.PI*2);
        ctx.fillStyle=`${PCOLS[p.type]},${(0.08+Math.random()*0.04)*pulse*p.parallax})`; ctx.fill();
      });

      // Bubbles with parallax and highlight gleam
      bubbles.forEach(b=>{
        b.wobble+=b.wobbleSpeed;
        b.x+=b.drift*b.parallax+Math.sin(b.wobble)*0.2; b.y-=b.speed*b.parallax;
        if(b.y<-b.r*2){b.y=H+b.r;b.x=Math.random()*W;}
        ctx.save();
        const sz = b.r * (0.6 + b.parallax*0.4);
        ctx.beginPath(); ctx.arc(b.x,b.y,sz,0,Math.PI*2);
        const bg=ctx.createRadialGradient(b.x-sz*0.28,b.y-sz*0.28,0,b.x,b.y,sz);
        bg.addColorStop(0,`rgba(175,232,255,${b.alpha*0.3*b.parallax})`); bg.addColorStop(1,'rgba(0,140,195,0)');
        ctx.fillStyle=bg; ctx.fill();
        ctx.strokeStyle=`rgba(120,210,255,${b.alpha*b.parallax})`; ctx.lineWidth=0.7; ctx.stroke();
        ctx.beginPath(); ctx.arc(b.x-sz*0.3,b.y-sz*0.32,sz*0.18,0,Math.PI*2);
        ctx.fillStyle=`rgba(255,255,255,${b.alpha*1.4*b.parallax})`; ctx.fill();
        ctx.restore();
      });

      raf=requestAnimationFrame(draw);
    }
    draw();
    return ()=>cancelAnimationFrame(raf);
  },[]);
  return <canvas ref={canvasRef} style={{position:"fixed",top:0,left:0,width:"100%",height:"100%",pointerEvents:"none",zIndex:0}} />;
}

function CausticLight() {
  const canvasRef = useRef(null);
  useEffect(()=>{
    const canvas=canvasRef.current; if(!canvas) return;
    const ctx=canvas.getContext("2d");
    const W=canvas.width=window.innerWidth; canvas.height=90;
    let t=0, raf;
    function draw(){
      t+=0.014;
      ctx.clearRect(0,0,W,90);
      for(let i=0;i<6;i++){
        ctx.beginPath();
        ctx.moveTo(0, 6+i*13);
        for(let x=0;x<=W;x+=4){
          const y=6+i*13+Math.sin(x*0.015+t+i*0.9)*4.2+Math.sin(x*0.04+t*1.3+i*0.5)*1.8;
          ctx.lineTo(x,y);
        }
        ctx.strokeStyle=`rgba(0,205,245,${0.05-i*0.007})`; ctx.lineWidth=1; ctx.stroke();
      }
      raf=requestAnimationFrame(draw);
    }
    draw();
    return()=>cancelAnimationFrame(raf);
  },[]);
  return <canvas ref={canvasRef} style={{position:"fixed",top:0,left:0,width:"100%",height:90,pointerEvents:"none",zIndex:1}} />;
}

function MiniSchool({ size=200 }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width=size*2; canvas.height=size*2; ctx.scale(2,2);
    const W=size,H=size,cx=W/2,cy=H/2;
    const dots = Array.from({length:14},(_,i) => { const a=(i/14)*Math.PI*2; return {x:cx+Math.cos(a)*40,y:cy+Math.sin(a)*40,vx:Math.cos(a+Math.PI/2)*1.0,vy:Math.sin(a+Math.PI/2)*1.0,col:Object.values(DIMS)[i%5].color,glow:Math.random()*Math.PI*2}; });
    let raf;
    function draw() {
      ctx.clearRect(0,0,W,H);
      // Glow effect for dots
      dots.forEach(d=>{
        d.glow+=0.03;
        const glowSize = 3.5 + Math.sin(d.glow)*0.8;
        ctx.beginPath();ctx.arc(d.x,d.y,glowSize+2,0,Math.PI*2);
        ctx.fillStyle=d.col+"15";ctx.fill();
        ctx.beginPath();ctx.arc(d.x,d.y,glowSize,0,Math.PI*2);
        ctx.fillStyle=d.col+"cc";ctx.fill();
      });
      dots.forEach((d,i)=>dots.forEach((d2,j)=>{if(j<=i)return;const dist=Math.hypot(d.x-d2.x,d.y-d2.y);if(dist<55){const a=Math.round((1-dist/55)*20).toString(16).padStart(2,"0");ctx.beginPath();ctx.strokeStyle=`#00c8f5${a}`;ctx.lineWidth=0.5;ctx.moveTo(d.x,d.y);ctx.lineTo(d2.x,d2.y);ctx.stroke();}}));
      dots.forEach(d=>{d.vx+=(cx-d.x)*0.0004+(Math.random()-0.5)*0.25;d.vy+=(cy-d.y)*0.0004+(Math.random()-0.5)*0.25;const spd=Math.sqrt(d.vx*d.vx+d.vy*d.vy)||0.001,c=Math.min(1.8,Math.max(0.5,spd));d.vx=d.vx/spd*c;d.vy=d.vy/spd*c;d.x+=d.vx;d.y+=d.vy;d.x=Math.max(8,Math.min(W-8,d.x));d.y=Math.max(8,Math.min(H-8,d.y));});
      raf=requestAnimationFrame(draw);
    }
    draw();
    return ()=>cancelAnimationFrame(raf);
  },[size]);
  return <canvas ref={canvasRef} style={{width:size,height:size,display:"block"}} />;
}

function FishSchool({ selectedDim, onFishClick, scores }) {
  const canvasRef = useRef(null);
  const selectedRef = useRef(selectedDim);
  const ripples = useRef([]);
  selectedRef.current = selectedDim;
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W=canvas.offsetWidth,H=canvas.offsetHeight;
    canvas.width=W*window.devicePixelRatio; canvas.height=H*window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio,window.devicePixelRatio);
    const cx=W/2,cy=H/2;
    const fishes=["O","C","E","A","N"].map((dim,i)=>{const angle=(i/5)*Math.PI*2;return{dim,x:cx+Math.cos(angle)*60,y:cy+Math.sin(angle)*60,vx:Math.cos(angle+Math.PI/2)*1.2,vy:Math.sin(angle+Math.PI/2)*1.2,wobble:Math.random()*Math.PI*2,size:24,speedVar:0.8+Math.random()*0.8,speedPhase:Math.random()*Math.PI*2,glowPhase:Math.random()*Math.PI*2};});
    
    function updateFish() {
      const SEP_R=65,VIEW_R=220,W_SEP=0.065,W_ALG=0.009,W_COH=0.0009,W_CTR=0.00012,MAX_SPD=2.4,MIN_SPD=0.6;
      fishes.forEach(f=>{
        if(selectedRef.current===f.dim)return;
        let sx=0,sy=0,ax=0,ay=0,px=0,py=0,cnt=0;
        fishes.forEach(o=>{if(o===f)return;const dx=f.x-o.x,dy=f.y-o.y,d=Math.sqrt(dx*dx+dy*dy)||0.001;if(d<SEP_R){sx+=dx/d;sy+=dy/d;}if(d<VIEW_R){ax+=o.vx;ay+=o.vy;px+=o.x;py+=o.y;cnt++;}});
        if(cnt>0){ax/=cnt;ay/=cnt;px=px/cnt-f.x;py=py/cnt-f.y;}
        // Speed variation over time
        f.speedPhase+=0.008;
        const spdMult = 0.85 + Math.sin(f.speedPhase)*0.3;
        f.vx+=sx*W_SEP+ax*W_ALG+px*W_COH+(cx-f.x)*W_CTR; f.vy+=sy*W_SEP+ay*W_ALG+py*W_COH+(cy-f.y)*W_CTR;
        const spd=Math.sqrt(f.vx*f.vx+f.vy*f.vy)||0.001,c=Math.min(MAX_SPD*spdMult,Math.max(MIN_SPD,spd));
        f.vx=f.vx/spd*c;f.vy=f.vy/spd*c;f.x+=f.vx;f.y+=f.vy;f.wobble+=0.07;
        const m=50;if(f.x<m)f.vx+=0.18;if(f.x>W-m)f.vx-=0.18;if(f.y<m)f.vy+=0.18;if(f.y>H-m)f.vy-=0.18;
      });
    }
    function drawFish(f) {
      const{x,y,vx,vy,size,dim}=f,angle=Math.atan2(vy,vx),col=DIMS[dim].color,sel=selectedRef.current===dim,wb=Math.sin(f.wobble)*0.07;
      f.glowPhase+=0.025;
      const glowPulse = sel ? 28 + Math.sin(f.glowPhase)*8 : 0;
      ctx.save();ctx.translate(x,y);ctx.rotate(angle+wb);
      if(sel){ctx.shadowColor=col;ctx.shadowBlur=glowPulse;}
      // Tail with swimming motion
      const tailWag = Math.sin(f.wobble*1.5)*0.12;
      const tx=-size*0.85;
      ctx.beginPath();ctx.moveTo(tx,0);ctx.lineTo(tx-size*0.55,-size*(0.42+tailWag));ctx.lineTo(tx-size*0.12,0);ctx.lineTo(tx-size*0.55,size*(0.42-tailWag));ctx.closePath();ctx.fillStyle=col+"88";ctx.fill();
      // Pectoral fin
      ctx.beginPath();ctx.moveTo(size*0.1,0);ctx.quadraticCurveTo(0,size*0.45,-size*0.3,size*0.28);ctx.quadraticCurveTo(-size*0.05,size*0.1,size*0.1,0);ctx.fillStyle=col+"55";ctx.fill();
      // Body
      ctx.beginPath();ctx.ellipse(0,0,size*0.72,size*0.3,0,0,Math.PI*2);ctx.fillStyle=col+(sel?"ff":"cc");ctx.fill();
      // Dorsal fin
      ctx.beginPath();ctx.moveTo(-size*0.15,-size*0.3);ctx.quadraticCurveTo(size*0.12,-size*0.58,size*0.42,-size*0.3);ctx.strokeStyle=col+"aa";ctx.lineWidth=1.5;ctx.stroke();
      // Eye
      ctx.beginPath();ctx.arc(size*0.44,-size*0.06,size*0.085,0,Math.PI*2);ctx.fillStyle="rgba(255,255,255,0.9)";ctx.fill();
      ctx.beginPath();ctx.arc(size*0.46,-size*0.06,size*0.042,0,Math.PI*2);ctx.fillStyle="#001530";ctx.fill();
      ctx.beginPath();ctx.arc(size*0.47,-size*0.085,size*0.018,0,Math.PI*2);ctx.fillStyle="rgba(255,255,255,0.85)";ctx.fill();
      // Score label
      if(scores?.[dim]!==undefined){ctx.rotate(-angle-wb);ctx.fillStyle=col;ctx.font=`bold ${size*0.38}px sans-serif`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(scores[dim]+"%",0,size*0.72);}
      ctx.restore();
      // Dimension label
      ctx.save();ctx.font=`${sel?"bold ":""}${size*0.42}px -apple-system,sans-serif`;ctx.textAlign="center";ctx.textBaseline="top";ctx.fillStyle=sel?col:col+"99";ctx.fillText(DIMS[dim].label,x,y+size*1.0);ctx.restore();
      // Selection ring
      if(sel){ctx.save();ctx.beginPath();ctx.arc(x,y,size*1.6,0,Math.PI*2);ctx.strokeStyle=col+"40";ctx.lineWidth=2;ctx.setLineDash([4,6]);ctx.stroke();ctx.restore();}
    }
    let raf;
    function loop(){
      ctx.clearRect(0,0,W,H);
      updateFish();
      // Connection lines
      fishes.forEach((f,i)=>fishes.forEach((f2,j)=>{if(j<=i)return;const d=Math.hypot(f.x-f2.x,f.y-f2.y);if(d<130){const a=Math.floor((1-d/130)*18).toString(16).padStart(2,"0");ctx.beginPath();ctx.strokeStyle=`#00c8f5${a}`;ctx.lineWidth=0.6;ctx.moveTo(f.x,f.y);ctx.lineTo(f2.x,f2.y);ctx.stroke();}}));
      // Tap ripples
      ripples.current = ripples.current.filter(r=>{r.age++;r.radius+=2.5;ctx.beginPath();ctx.arc(r.x,r.y,r.radius,0,Math.PI*2);ctx.strokeStyle=`rgba(0,200,245,${0.3*(1-r.age/30)})`;ctx.lineWidth=1.5;ctx.stroke();return r.age<30;});
      fishes.forEach(f=>drawFish(f));
      raf=requestAnimationFrame(loop);
    }
    loop();
    function handleClick(e){
      const rect=canvas.getBoundingClientRect(),mx=e.clientX-rect.left,my=e.clientY-rect.top;
      ripples.current.push({x:mx,y:my,radius:4,age:0});
      let hit=null,minD=Infinity;
      fishes.forEach(f=>{const d=Math.hypot(mx-f.x,my-f.y);if(d<f.size*1.8&&d<minD){minD=d;hit=f.dim;}});
      onFishClick(hit);
    }
    canvas.addEventListener("click",handleClick);
    return ()=>{cancelAnimationFrame(raf);canvas.removeEventListener("click",handleClick);};
  },[]);
  return <canvas ref={canvasRef} style={{width:"100%",height:"100%",display:"block",cursor:"pointer"}} />;
}

// Mini fish SVG for reference cards — behavior based on score
function CardFish({ color, score, size=40 }) {
  const speed = score > 60 ? "1.8s" : score > 35 ? "3s" : "4.5s";
  const amplitude = score > 60 ? 8 : score > 35 ? 4 : 2;
  return (
    <svg width={size} height={size*0.6} viewBox="0 0 50 30" style={{animation:`cardFishSwim ${speed} ease-in-out infinite`,display:"block"}}>
      <style>{`@keyframes cardFishSwim{0%,100%{transform:translateY(0) rotate(0deg)}25%{transform:translateY(-${amplitude}px) rotate(-2deg)}75%{transform:translateY(${amplitude}px) rotate(2deg)}}`}</style>
      <path d="M8,15 L2,10 L5,15 L2,20Z" fill={color+"88"} />
      <ellipse cx="22" cy="15" rx="14" ry="6" fill={color+"cc"} />
      <path d="M18,9 Q25,4 32,9" fill="none" stroke={color+"88"} strokeWidth="1.2" />
      <circle cx="32" cy="13.5" r="2" fill="rgba(255,255,255,0.9)" />
      <circle cx="32.5" cy="13.5" r="1" fill="#001530" />
    </svg>
  );
}

function RefCard({ dim, score, onClose }) {
  const d = DIMS[dim];
  return (
    <div className="card-float" style={{background:"linear-gradient(135deg,#041830 0%,#061c35 100%)",border:`1px solid ${d.color}44`,borderRadius:18,padding:"20px 22px",boxShadow:`0 0 40px ${d.color}18`,position:"relative",overflow:"hidden",animation:"slideUp 0.35s ease-out"}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${d.color},transparent)`}} />
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
        <div>
          <div style={{fontSize:10,color:d.color+"88",letterSpacing:3,textTransform:"uppercase",marginBottom:3}}>Reference Card</div>
          <div style={{fontSize:18,fontWeight:700,color:"#fff",lineHeight:1.2}}>{d.title}</div>
          <div style={{fontSize:12,color:OC.textMid,marginTop:3}}>{d.tagline}</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,flexShrink:0}}>
          <CardFish color={d.color} score={score ?? 50} size={44} />
          {score!==undefined&&<div style={{background:d.color+"22",border:`1px solid ${d.color}44`,borderRadius:10,padding:"4px 10px",textAlign:"center"}}><div style={{fontSize:18,fontWeight:800,color:d.color,lineHeight:1}}>{score}%</div><div style={{fontSize:8,color:d.color+"88",letterSpacing:2}}>YOUR SCORE</div></div>}
        </div>
      </div>
      <div style={{marginBottom:16}}>
        <div style={{height:5,background:"#0a2040",borderRadius:3,overflow:"hidden"}}>{score!==undefined&&<div style={{height:"100%",width:score+"%",background:`linear-gradient(90deg,${d.color}88,${d.color})`,borderRadius:3,transition:"width 1s ease"}} />}</div>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}><span style={{fontSize:9,color:OC.textDim}}>LOW</span><span style={{fontSize:9,color:OC.textDim}}>HIGH</span></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
        {[["Low",d.low],["High",d.high]].map(([lbl,txt])=>(<div key={lbl} style={{background:"#030f20",borderRadius:10,padding:"10px 12px",border:`1px solid ${OC.border}`}}><div style={{fontSize:9,color:d.color+"88",letterSpacing:2,textTransform:"uppercase",marginBottom:5}}>{lbl}</div><div style={{fontSize:11,color:OC.text,lineHeight:1.6}}>{txt}</div></div>))}
      </div>
      <div style={{background:"#030f20",borderRadius:10,padding:"10px 14px",marginBottom:12,border:`1px solid ${OC.border}`}}>
        <div style={{fontSize:9,color:"#4a80a8",letterSpacing:2,textTransform:"uppercase",marginBottom:5}}>In Your Team</div>
        <div style={{fontSize:11,color:OC.text,lineHeight:1.5,marginBottom:5}}><span style={{color:d.color+"aa"}}>↑ </span>{d.teamHigh}</div>
        <div style={{fontSize:11,color:OC.text,lineHeight:1.5}}><span style={{color:d.color+"aa"}}>↓ </span>{d.teamLow}</div>
      </div>
      <div style={{background:`${d.color}0d`,borderRadius:10,padding:"10px 14px",border:`1px solid ${d.color}22`}}>
        <div style={{fontSize:9,color:d.color+"88",letterSpacing:2,textTransform:"uppercase",marginBottom:5}}>Feedback Tip</div>
        {d.tip.split("\n").map((line,i)=><div key={i} style={{fontSize:11,color:OC.text,lineHeight:1.5}}>{line}</div>)}
      </div>
      <button onClick={onClose} className="btn-ocean" style={{marginTop:14,width:"100%",padding:"8px",borderRadius:8,background:"none",border:`1px solid ${OC.border}`,color:OC.textMid,fontSize:12,cursor:"pointer"}}>← Back to school</button>
    </div>
  );
}

function ScoreBars({ scores, compact=false }) {
  return (
    <div>
      {Object.keys(DIMS).map(dim => (
        <div key={dim} style={{marginBottom:compact?8:14}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:compact?2:5}}>
            <div>
              <span style={{fontSize:compact?11:13,fontWeight:600,color:OC.text}}>{DIMS[dim].label}</span>
              {!compact&&<span style={{fontSize:10,color:OC.textMid,marginLeft:8}}>{DIMS[dim].short}</span>}
            </div>
            <span style={{fontSize:compact?11:13,fontWeight:700,color:DIMS[dim].color}}>{scores[dim]}%</span>
          </div>
          <div style={{height:compact?4:6,background:OC.cardMid,borderRadius:3,overflow:"hidden"}}>
            <div style={{height:"100%",width:scores[dim]+"%",background:`linear-gradient(90deg,${DIMS[dim].color}88,${DIMS[dim].color})`,borderRadius:3,boxShadow:`0 0 10px ${DIMS[dim].color}60`,transition:"width 0.8s ease"}} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [screen, setScreen]             = useState("home");
  const [sessionCode, setSessionCode]   = useState("");
  const [joinCode, setJoinCode]         = useState("");
  const [answers, setAnswers]           = useState({});
  const [current, setCurrent]           = useState(0);
  const [myScores, setMyScores]         = useState(null);
  const [myPid, setMyPid]               = useState(null);
  const [participants, setParticipants] = useState([]);
  const [selectedFish, setSelectedFish] = useState(null);
  const [error, setError]               = useState("");
  const [feedbackIndex, setFeedbackIndex] = useState(0);
  const [annotations, setAnnotations]   = useState({});
  const [myAnnotation, setMyAnnotation] = useState(null);
  const [feedbackDone, setFeedbackDone] = useState(false);
  const [screenKey, setScreenKey]       = useState(0); // for transition re-trigger
  const unsubRef          = useRef(null);
  const unsubParticipantRef = useRef(null);
  const unsubFeedbackRef  = useRef(null);

  const goTo = useCallback((s) => { setScreenKey(k=>k+1); setScreen(s); }, []);

  async function createSession() {
    const code = genCode();
    try {
      await fbSet(`${sp(code)}/meta`, { created: Date.now(), feedbackDone: false });
      setSessionCode(code);
      goTo("hostLive");
      unsubRef.current = fbListen(`${sp(code)}/profiles`, (val) => {
        setParticipants(val ? Object.values(val) : []);
      });
    } catch (e) { setError("Firebase error: " + e.message); }
  }

  function stopSession() {
    if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
  }

  async function joinSession() {
    const code = joinCode.toUpperCase().trim();
    try {
      const meta = await fbGet(`${sp(code)}/meta`);
      if (!meta) { setError("No swarm found. Check the code."); return; }
      setSessionCode(code); goTo("assessment"); setError("");
    } catch (e) { setError("No swarm found."); }
  }

  async function submitResults(scores) {
    const pid = genPid();
    setMyPid(pid);
    localStorage.setItem("swarm-pid", pid);
    setMyScores(scores);
    goTo("signalSent");
    try {
      await fbSet(`${sp(sessionCode)}/profiles/${pid}`, { scores, ts: Date.now(), pid, annotation: "", ready: false });
      unsubParticipantRef.current = fbListen(`${sp(sessionCode)}/profiles/${pid}`, (profile) => {
        if (profile?.annotation !== undefined) setMyAnnotation(profile.annotation);
      });
      unsubFeedbackRef.current = fbListen(`${sp(sessionCode)}/meta/feedbackDone`, (val) => {
        if (val === true) setFeedbackDone(true);
      });
    } catch (e) {
      setError("Could not save to database: " + e.message);
    }
  }

  async function markReady() {
    const pid = myPid || localStorage.getItem("swarm-pid");
    try { await fbUpdate(`${sp(sessionCode)}/profiles/${pid}`, { ready: true }); } catch (_) {}
    goTo("waiting");
  }

  function startFeedback() { setFeedbackIndex(0); setAnnotations({}); goTo("feedbackReview"); }

  async function finishFeedback() {
    try {
      await Promise.all(participants.map((p, i) =>
        fbUpdate(`${sp(sessionCode)}/profiles/${p.pid}`, { annotation: annotations[i] || "" })
      ));
      await fbUpdate(`${sp(sessionCode)}/meta`, { feedbackDone: true });
    } catch (_) {}
    goTo("feedbackDone");
  }

  function answer(score) { setAnswers(prev => ({ ...prev, [current]: score })); }
  function next() { if (answers[current] === undefined) return; if (current === QUESTIONS.length - 1) submitResults(calcScores(answers)); else setCurrent(c => c + 1); }
  function prev() { if (current > 0) setCurrent(c => c - 1); }

  useEffect(() => { if (screen === "waiting" && feedbackDone) goTo("result"); }, [feedbackDone, screen, goTo]);
  useEffect(() => () => {
    stopSession();
    if (unsubParticipantRef.current) { unsubParticipantRef.current(); unsubParticipantRef.current = null; }
    if (unsubFeedbackRef.current) { unsubFeedbackRef.current(); unsubFeedbackRef.current = null; }
  }, []);

  const progress = Math.round((current / QUESTIONS.length) * 100);
  const readyCount = participants.filter(p => p.ready).length;

  // HOME
  if (screen === "home") return (
    <div key={screenKey} className="screen-enter" style={{minHeight:"100vh",background:"linear-gradient(180deg,#010d1f 0%,#020b18 100%)",display:"flex",alignItems:"center",justifyContent:"center",padding:24,flexDirection:"column",position:"relative"}}>
      <style>{GLOBAL_CSS}</style>
      <BubblesBg /><CausticLight /><OceanCreature />
      <div style={{position:"relative",zIndex:1,width:"100%",maxWidth:380,textAlign:"center"}}>
        <div style={{margin:"0 auto 4px",width:180,height:180}}><MiniSchool size={180} /></div>
        <div style={{fontSize:10,color:OC.textDim,letterSpacing:4,textTransform:"uppercase",marginBottom:10}}>Creativity & Reframing · HSG</div>
        <div style={{fontSize:40,fontWeight:800,color:"#fff",lineHeight:1.1,marginBottom:4}}>Swarm</div>
        <div style={{fontSize:40,fontWeight:800,lineHeight:1.1,marginBottom:6}}><span style={{background:OC.accent,color:"#010d1f",padding:"0 10px",borderRadius:6}}>Intelligence.</span></div>
        <div style={{fontSize:13,color:OC.textMid,marginBottom:36,fontStyle:"italic"}}>The swarm shows what individuals can't.</div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <button onClick={createSession} className="btn-ocean" style={{padding:15,borderRadius:12,border:"none",background:OC.accent,color:"#010d1f",fontSize:14,fontWeight:700,cursor:"pointer",boxShadow:`0 0 24px ${OC.accent}44`,animation:"btnGlow 3s ease-in-out infinite"}}>Host a swarm session</button>
          <button onClick={()=>goTo("join")} className="btn-ocean" style={{padding:15,borderRadius:12,border:`1px solid ${OC.border}`,background:"transparent",color:OC.textMid,fontSize:14,cursor:"pointer"}}>Join a swarm</button>
        </div>
        {error&&<div style={{color:"#ff6b6b",fontSize:12,marginTop:12}}>{error}</div>}
      </div>
    </div>
  );

  // JOIN
  if (screen === "join") return (
    <div key={screenKey} className="screen-enter" style={{minHeight:"100vh",background:"linear-gradient(180deg,#010d1f 0%,#020b18 100%)",display:"flex",alignItems:"center",justifyContent:"center",padding:24,position:"relative"}}>
      <style>{GLOBAL_CSS}</style>
      <BubblesBg /><OceanCreature />
      <div style={{position:"relative",zIndex:1,maxWidth:360,width:"100%",textAlign:"center"}}>
        <div style={{fontSize:20,fontWeight:700,color:"#fff",marginBottom:6}}>Enter swarm code</div>
        <div style={{fontSize:13,color:OC.textMid,marginBottom:28}}>Get the code from your host</div>
        <input value={joinCode} onChange={e=>setJoinCode(e.target.value.toUpperCase().slice(0,5))} placeholder="AB3X7"
          style={{width:"100%",padding:16,fontSize:30,fontWeight:700,textAlign:"center",letterSpacing:8,borderRadius:12,border:`1px solid ${OC.borderGlow}`,background:OC.card,color:OC.accent,marginBottom:14,fontFamily:"monospace",outline:"none",transition:"border-color 0.3s",boxSizing:"border-box"}}
          onFocus={e=>e.target.style.borderColor=OC.accent} onBlur={e=>e.target.style.borderColor=OC.borderGlow}
          onKeyDown={e=>e.key==="Enter"&&joinSession()} />
        {error&&<div style={{color:"#ff6b6b",fontSize:12,marginBottom:12}}>{error}</div>}
        <button onClick={joinSession} disabled={joinCode.length<4} className="btn-ocean" style={{width:"100%",padding:14,borderRadius:12,border:"none",background:joinCode.length>=4?OC.accent:OC.border,color:joinCode.length>=4?"#010d1f":"#333",fontSize:14,fontWeight:700,cursor:joinCode.length>=4?"pointer":"default"}}>Dive in</button>
        <button onClick={()=>{goTo("home");setError("");}} className="btn-ocean" style={{marginTop:12,background:"none",border:"none",color:OC.textDim,fontSize:12,cursor:"pointer"}}>← Back</button>
      </div>
    </div>
  );

  // HOST LIVE
  if (screen === "hostLive") return (
    <div key={screenKey} className="screen-enter" style={{minHeight:"100vh",background:"linear-gradient(180deg,#010d1f 0%,#020b18 100%)",padding:24,position:"relative"}}>
      <style>{GLOBAL_CSS}</style>
      <BubblesBg /><OceanCreature />
      <div style={{position:"relative",zIndex:1,maxWidth:680,margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24}}>
          <div>
            <button onClick={()=>{stopSession();goTo("home");setSessionCode("");setParticipants([]);}} className="btn-ocean" style={{background:"none",border:"none",color:OC.textMid,fontSize:12,cursor:"pointer",padding:"0 0 4px 0",display:"block"}}>← Back</button>
            <div style={{fontSize:18,fontWeight:700,color:"#fff"}}>Session active</div>
            <div style={{fontSize:12,color:OC.textMid}}>Waiting for signals to surface</div>
          </div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:10}}>
            <div style={{background:"#041a0f",border:"1px solid #0d3a1a",borderRadius:8,padding:"6px 14px",fontSize:12,color:OC.accent2}}>
              {participants.length} signal{participants.length!==1?"s":""} · {readyCount} ready ✓
            </div>
            {participants.length > 0 && (
              <button onClick={startFeedback} className="btn-ocean" style={{padding:"12px 20px",borderRadius:12,border:"none",background:`linear-gradient(135deg,${OC.accent},${OC.accent2})`,color:"#010d1f",fontSize:14,fontWeight:700,cursor:"pointer",boxShadow:`0 0 24px ${OC.accent}44`}}>
                Start swarm feedback →
              </button>
            )}
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:24}}>
          <div className="card-float" style={{background:OC.card,borderRadius:16,border:`1px solid ${OC.border}`,padding:24,textAlign:"center"}}>
            <div style={{width:100,height:100,margin:"0 auto 14px"}}><MiniSchool size={100} /></div>
            <div style={{fontSize:10,color:OC.textDim,letterSpacing:3,textTransform:"uppercase",marginBottom:6}}>Swarm code</div>
            <div style={{fontSize:32,fontWeight:800,letterSpacing:6,color:OC.accent,fontFamily:"monospace"}}>{sessionCode}</div>
            <div style={{fontSize:11,color:OC.textDim,marginTop:8}}>Share with participants</div>
          </div>
          <div className="card-float" style={{background:OC.card,borderRadius:16,border:`1px solid ${OC.border}`,padding:24}}>
            <div style={{fontSize:10,color:OC.textDim,letterSpacing:3,textTransform:"uppercase",marginBottom:14}}>How to join</div>
            {["Open this app","Tap 'Join a swarm'","Enter the code","Complete 20 questions","Your signal joins the swarm"].map((step,i)=>(
              <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:9}}>
                <div style={{width:20,height:20,borderRadius:"50%",background:OC.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"#010d1f",flexShrink:0}}>{i+1}</div>
                <div style={{fontSize:12,color:OC.textMid,paddingTop:2}}>{step}</div>
              </div>
            ))}
          </div>
        </div>
        {participants.length===0 ? (
          <div style={{textAlign:"center",padding:"48px 0"}}><div style={{fontSize:13,color:OC.textDim}}>Waiting for signals from the deep...</div></div>
        ) : (
          <div>
            <div style={{fontSize:13,fontWeight:600,color:"#fff",marginBottom:14}}>Anonymous signals — {participants.length} received</div>
            {participants.map((p,i)=>(
              <div key={i} className="card-float" style={{background:OC.card,border:`1px solid ${OC.border}`,borderRadius:14,padding:"16px 20px",marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{fontSize:10,color:OC.textDim,letterSpacing:3,textTransform:"uppercase"}}>Signal #{String(i+1).padStart(2,"0")}</div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    {p.ready&&<div style={{fontSize:10,color:OC.accent2,background:"#041a0f",border:"1px solid #0d3a1a",borderRadius:6,padding:"2px 8px"}}>Ready ✓</div>}
                    <div style={{fontSize:11,color:OC.textMid}}>Signal received</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // ASSESSMENT
  if (screen === "assessment") {
    const q = QUESTIONS[current];
    return (
      <div key={screenKey} className="screen-enter" style={{minHeight:"100vh",background:"linear-gradient(180deg,#010d1f 0%,#020b18 100%)",display:"flex",alignItems:"center",justifyContent:"center",padding:24,position:"relative"}}>
        <style>{GLOBAL_CSS}</style>
        <BubblesBg /><OceanCreature />
        <div style={{position:"relative",zIndex:1,maxWidth:520,width:"100%"}}>
          <div style={{marginBottom:36}}>
            <div style={{height:3,background:OC.cardMid,borderRadius:2,overflow:"hidden"}}>
              <div style={{height:"100%",width:progress+"%",background:`linear-gradient(90deg,${OC.accent},${OC.accent2})`,borderRadius:2,transition:"width 0.4s ease",boxShadow:`0 0 8px ${OC.accent}66`}} />
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}>
              <span style={{fontSize:10,color:OC.textDim}}>{current+1} of {QUESTIONS.length}</span>
              <span style={{fontSize:10,color:OC.textDim}}>{progress}% depth</span>
            </div>
          </div>
          <div style={{fontSize:17,fontWeight:600,color:"#d8f0ff",lineHeight:1.65,marginBottom:26}}>{q.text}</div>
          <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:28}}>
            {q.opts.map((opt,i)=>(
              <div key={i} onClick={()=>answer(opt.s)} className="card-float" style={{display:"flex",alignItems:"center",gap:14,padding:"14px 18px",borderRadius:12,cursor:"pointer",border:answers[current]===opt.s?`1px solid ${OC.accent}`:`1px solid ${OC.border}`,background:answers[current]===opt.s?`${OC.accent}12`:OC.card,transition:"all 0.2s ease",boxShadow:answers[current]===opt.s?`0 0 16px ${OC.accent}22`:"none"}}>
                <div style={{width:26,height:26,borderRadius:"50%",flexShrink:0,background:answers[current]===opt.s?OC.accent:OC.cardMid,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:600,color:answers[current]===opt.s?"#010d1f":OC.textDim,transition:"all 0.2s"}}>{["A","B","C","D"][i]}</div>
                <div style={{fontSize:14,color:answers[current]===opt.s?"#d8f0ff":OC.textMid,lineHeight:1.4}}>{opt.t}</div>
              </div>
            ))}
          </div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <button onClick={prev} disabled={current===0} className="btn-ocean" style={{padding:"10px 26px",borderRadius:8,border:"none",background:current>0?OC.accent:OC.cardMid,color:current>0?"#010d1f":"#333",fontSize:13,fontWeight:700,cursor:current>0?"pointer":"default",opacity:current===0?0.3:1}}>Back</button>
            <button onClick={next} disabled={answers[current]===undefined} className="btn-ocean" style={{padding:"10px 26px",borderRadius:8,border:"none",background:answers[current]!==undefined?OC.accent:OC.cardMid,color:answers[current]!==undefined?"#010d1f":"#333",fontSize:13,fontWeight:700,cursor:answers[current]!==undefined?"pointer":"default"}}>
              {current===QUESTIONS.length-1?"Surface →":"Next →"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // RESULT — shown after feedbackDone
  if (screen === "result" && myScores) return (
    <div key={screenKey} className="screen-enter" style={{minHeight:"100vh",background:"linear-gradient(180deg,#010d1f 0%,#020b18 100%)",padding:24,position:"relative"}}>
      <style>{GLOBAL_CSS}</style>
      <BubblesBg /><CausticLight /><OceanCreature />
      <div style={{position:"relative",zIndex:1,maxWidth:460,margin:"0 auto"}}>
        <div style={{width:90,height:90,margin:"0 auto 18px"}}><MiniSchool size={90} /></div>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{fontSize:22,fontWeight:700,color:"#fff",marginBottom:4}}>Your Pattern Revealed</div>
          <div style={{fontSize:13,color:OC.textMid}}>Here's your current across the five dimensions</div>
        </div>
        <ScoreBars scores={myScores} />
        {myAnnotation !== null && (
          <div className="card-float" style={{marginTop:20,padding:"16px 18px",background:`${OC.accent}0d`,borderRadius:12,border:`1px solid ${OC.accent}33`}}>
            <div style={{fontSize:10,color:OC.accent+"88",letterSpacing:3,textTransform:"uppercase",marginBottom:8}}>Host Notes</div>
            {myAnnotation ? (
              <div style={{fontSize:13,color:OC.text,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{myAnnotation}</div>
            ) : (
              <div style={{fontSize:13,color:OC.textMid,fontStyle:"italic"}}>No notes were added for this signal.</div>
            )}
          </div>
        )}
        <button onClick={()=>{goTo("home");setAnswers({});setCurrent(0);setMyScores(null);}} className="btn-ocean" style={{width:"100%",marginTop:24,padding:12,borderRadius:8,border:`1px solid ${OC.border}`,background:"transparent",color:OC.textDim,fontSize:13,cursor:"pointer"}}>Back to surface</button>
      </div>
    </div>
  );

  // SIGNAL SENT
  if (screen === "signalSent") return (
    <div key={screenKey} className="screen-enter" style={{minHeight:"100vh",background:"linear-gradient(180deg,#010d1f 0%,#020b18 100%)",display:"flex",alignItems:"center",justifyContent:"center",padding:24,position:"relative"}}>
      <style>{GLOBAL_CSS}</style>
      <BubblesBg /><CausticLight /><OceanCreature />
      <div style={{position:"relative",zIndex:1,maxWidth:400,width:"100%",textAlign:"center"}}>
        <div style={{width:100,height:100,margin:"0 auto 20px"}}><MiniSchool size={100} /></div>
        <div style={{fontSize:10,color:OC.accent2,letterSpacing:4,textTransform:"uppercase",marginBottom:10}}>Assessment complete</div>
        <div style={{fontSize:24,fontWeight:700,color:"#fff",marginBottom:8}}>Signal transmitted</div>
        <div style={{fontSize:13,color:OC.textMid,lineHeight:1.7,marginBottom:32}}>Your signal joined the swarm — anonymously. Before the swarm feedback, let's dive into the five dimensions of personality.</div>
        <button onClick={()=>goTo("guide")} className="btn-ocean" style={{width:"100%",padding:14,borderRadius:12,border:"none",background:OC.accent,color:"#010d1f",fontSize:14,fontWeight:700,cursor:"pointer",boxShadow:`0 0 24px ${OC.accent}44`,animation:"btnGlow 3s ease-in-out infinite"}}>Dive into your dimensions →</button>
      </div>
    </div>
  );

  // GUIDE — Interactive fish school explainer
  if (screen === "guide") return (
    <div key={screenKey} className="screen-enter" style={{minHeight:"100vh",background:"linear-gradient(180deg,#010d1f 0%,#020b18 100%)",padding:"28px 20px 40px",position:"relative",overflowY:"auto"}}>
      <style>{GLOBAL_CSS}</style>
      <BubblesBg /><CausticLight /><OceanCreature />
      <div style={{position:"relative",zIndex:1,maxWidth:500,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{width:120,height:120,margin:"0 auto 12px"}}><MiniSchool size={120} /></div>
          <div style={{fontSize:10,color:OC.textDim,letterSpacing:4,textTransform:"uppercase",marginBottom:8}}>Your personality in five dimensions</div>
          <div style={{fontSize:24,fontWeight:800,color:"#fff",marginBottom:8}}>Meet the Fish School</div>
          <div style={{fontSize:13,color:OC.textMid,lineHeight:1.7,maxWidth:380,margin:"0 auto"}}>
            Five fish, five dimensions. Each one captures a different side of how you think, work, and connect. Tap to explore.
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:28}}>
          {Object.entries(DIMS).map(([key, d]) => {
            const isOpen = selectedFish === key;
            return (
              <div key={key} onClick={()=>setSelectedFish(isOpen?null:key)} className="card-float" style={{background:isOpen?`linear-gradient(135deg,${OC.card} 0%,${d.color}08 100%)`:OC.card,border:`1px solid ${isOpen?d.color+"66":d.color+"22"}`,borderRadius:16,overflow:"hidden",cursor:"pointer",transition:"all 0.3s ease",boxShadow:isOpen?`0 0 30px ${d.color}15`:"none"}}>
                <div style={{position:"relative"}}>
                  <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${d.color}${isOpen?"":"66"},transparent)`,transition:"all 0.3s"}} />
                  <div style={{padding:"16px 18px",display:"flex",alignItems:"center",gap:14}}>
                    <div style={{width:44,height:44,borderRadius:12,background:`${d.color}${isOpen?"28":"15"}`,border:`1px solid ${d.color}${isOpen?"66":"33"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.3s",animation:isOpen?`fishFloat 2s ease-in-out infinite`:"none"}}>
                      <span style={{fontSize:18,fontWeight:800,color:d.color}}>{key}</span>
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:15,fontWeight:700,color:isOpen?"#fff":"#d8f0ff",transition:"color 0.3s"}}>{d.title}</div>
                      <div style={{fontSize:11,color:OC.textMid,lineHeight:1.4,marginTop:2}}>{d.short}</div>
                    </div>
                    <div style={{fontSize:18,color:isOpen?d.color:OC.textDim,transition:"transform 0.3s ease, color 0.3s",transform:isOpen?"rotate(180deg)":"rotate(0deg)",flexShrink:0}}>▾</div>
                  </div>
                </div>
                {isOpen && (
                  <div onClick={e=>e.stopPropagation()} style={{padding:"0 18px 18px",animation:"accordionOpen 0.35s ease forwards",overflow:"hidden",cursor:"default"}}>
                    <div style={{fontSize:12,color:OC.text,lineHeight:1.7,marginBottom:14,padding:"10px 14px",background:`${d.color}0a`,borderRadius:10,border:`1px solid ${d.color}18`}}>
                      {d.tagline}
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                      <div style={{background:"#030f20",borderRadius:10,padding:"10px 12px",border:`1px solid ${OC.border}`}}>
                        <div style={{fontSize:9,color:d.color,letterSpacing:2,textTransform:"uppercase",marginBottom:5,fontWeight:600}}>↓ Low</div>
                        <div style={{fontSize:11,color:OC.text,lineHeight:1.6}}>{d.low}</div>
                      </div>
                      <div style={{background:"#030f20",borderRadius:10,padding:"10px 12px",border:`1px solid ${OC.border}`}}>
                        <div style={{fontSize:9,color:d.color,letterSpacing:2,textTransform:"uppercase",marginBottom:5,fontWeight:600}}>↑ High</div>
                        <div style={{fontSize:11,color:OC.text,lineHeight:1.6}}>{d.high}</div>
                      </div>
                    </div>
                    <div style={{background:"#030f20",borderRadius:10,padding:"10px 14px",border:`1px solid ${OC.border}`,marginBottom:12}}>
                      <div style={{fontSize:9,color:"#4a80a8",letterSpacing:2,textTransform:"uppercase",marginBottom:5,fontWeight:600}}>In your team</div>
                      <div style={{fontSize:11,color:OC.text,lineHeight:1.6,marginBottom:4}}><span style={{color:d.color}}>↑ </span>{d.teamHigh}</div>
                      <div style={{fontSize:11,color:OC.text,lineHeight:1.6}}><span style={{color:d.color}}>↓ </span>{d.teamLow}</div>
                    </div>
                    <div style={{background:`${d.color}0d`,borderRadius:10,padding:"10px 14px",border:`1px solid ${d.color}22`}}>
                      <div style={{fontSize:9,color:d.color,letterSpacing:2,textTransform:"uppercase",marginBottom:5,fontWeight:600}}>💡 Feedback tip</div>
                      {d.tip.split("\n").map((line,i)=><div key={i} style={{fontSize:11,color:OC.text,lineHeight:1.6}}>{line}</div>)}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <button onClick={()=>goTo("intro")} className="btn-ocean" style={{width:"100%",padding:14,borderRadius:12,border:"none",background:`linear-gradient(135deg,${OC.accent},${OC.accent2})`,color:"#010d1f",fontSize:14,fontWeight:700,cursor:"pointer",boxShadow:`0 0 24px ${OC.accent}44`}}>
          Enter the swarm →
        </button>
      </div>
    </div>
  );

  // INTRO — fish swarm
  if (screen === "intro") return (
    <div key={screenKey} className="screen-enter" style={{minHeight:"100vh",background:"linear-gradient(180deg,#010d1f 0%,#020b18 60%,#010d1f 100%)",display:"flex",flexDirection:"column",position:"relative",overflow:"hidden"}}>
      <style>{GLOBAL_CSS}</style>
      <BubblesBg /><CausticLight />
      <div style={{position:"relative",zIndex:1,padding:"24px 24px 0",textAlign:"center"}}>
        <div style={{fontSize:10,color:OC.textDim,letterSpacing:4,textTransform:"uppercase",marginBottom:6}}>Before the swarm feedback</div>
        <div style={{fontSize:20,fontWeight:700,color:"#fff",marginBottom:4}}>Meet your five dimensions</div>
        <div style={{fontSize:12,color:OC.textMid,marginBottom:8}}>Tap a fish to learn what each dimension means</div>
        <div style={{display:"flex",justifyContent:"center",gap:6,flexWrap:"wrap",marginBottom:4}}>
          {Object.keys(DIMS).map(dim=>(
            <div key={dim} onClick={()=>setSelectedFish(selectedFish===dim?null:dim)} className="btn-ocean" style={{padding:"3px 10px",borderRadius:20,fontSize:10,cursor:"pointer",background:selectedFish===dim?DIMS[dim].color+"22":"transparent",border:`1px solid ${selectedFish===dim?DIMS[dim].color+"88":OC.border}`,color:selectedFish===dim?DIMS[dim].color:OC.textMid,transition:"all 0.2s"}}>{DIMS[dim].label}</div>
          ))}
        </div>
      </div>
      <div style={{position:"relative",zIndex:1,flex:selectedFish?"0 0 260px":"1 1 auto",minHeight:selectedFish?260:"calc(100vh - 240px)",transition:"flex 0.4s ease"}}>
        <FishSchool selectedDim={selectedFish} onFishClick={dim=>setSelectedFish(prev=>prev===dim?null:dim)} scores={myScores} />
      </div>
      {selectedFish&&(
        <div style={{position:"relative",zIndex:1,padding:"0 16px 16px",flex:"1 1 auto",overflowY:"auto"}}>
          <RefCard dim={selectedFish} score={myScores?myScores[selectedFish]:undefined} onClose={()=>setSelectedFish(null)} />
        </div>
      )}
      {!selectedFish&&<div style={{position:"relative",zIndex:1,textAlign:"center",padding:"0 24px 8px"}}><div style={{fontSize:11,color:OC.textDim}}>↑ Tap any fish to open its reference card</div></div>}
      <div style={{position:"relative",zIndex:1,padding:"12px 20px 28px"}}>
        <button onClick={markReady} className="btn-ocean" style={{width:"100%",padding:14,borderRadius:12,border:"none",background:`linear-gradient(135deg,${OC.accent},${OC.accent2})`,color:"#010d1f",fontSize:14,fontWeight:700,cursor:"pointer"}}>Ready for swarm feedback ✓</button>
      </div>
    </div>
  );

  // WAITING
  if (screen === "waiting") return (
    <div key={screenKey} className="screen-enter" style={{minHeight:"100vh",background:"linear-gradient(180deg,#010d1f 0%,#020b18 100%)",display:"flex",alignItems:"center",justifyContent:"center",padding:24,position:"relative"}}>
      <style>{GLOBAL_CSS}</style>
      <BubblesBg /><CausticLight /><OceanCreature />
      <div style={{position:"relative",zIndex:1,maxWidth:360,width:"100%",textAlign:"center"}}>
        <div style={{width:120,height:120,margin:"0 auto 24px"}}><MiniSchool size={120} /></div>
        <div style={{fontSize:22,fontWeight:700,color:"#fff",marginBottom:8}}>You're ready</div>
        <div style={{fontSize:13,color:OC.textMid,lineHeight:1.7,marginBottom:32}}>Waiting for the host to start the swarm feedback. Your signal is in the deep.</div>
        <div style={{display:"flex",justifyContent:"center",gap:8,marginBottom:32}}>
          {[0,1,2].map(i=>(
            <div key={i} style={{width:8,height:8,borderRadius:"50%",background:OC.accent,animation:`pulse 1.4s ease-in-out ${i*0.3}s infinite`}} />
          ))}
        </div>
        <button onClick={()=>goTo("result")} className="btn-ocean" style={{background:"none",border:"none",color:OC.textDim,fontSize:12,cursor:"pointer"}}>← View my pattern</button>
      </div>
    </div>
  );

  // FEEDBACK REVIEW (host)
  if (screen === "feedbackReview") {
    const profile = participants[feedbackIndex];
    const isLast = feedbackIndex === participants.length - 1;
    if (!profile) return null;
    return (
      <div key={screenKey} className="screen-enter" style={{minHeight:"100vh",background:"linear-gradient(180deg,#010d1f 0%,#020b18 100%)",padding:24,position:"relative"}}>
        <style>{GLOBAL_CSS}</style>
        <BubblesBg /><OceanCreature />
        <div style={{position:"relative",zIndex:1,maxWidth:520,margin:"0 auto"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:28}}>
            <button onClick={()=>goTo("hostLive")} className="btn-ocean" style={{background:"none",border:"none",color:OC.textMid,fontSize:12,cursor:"pointer"}}>← Back to session</button>
            <div style={{fontSize:12,color:OC.textMid}}>Signal <span style={{color:"#fff",fontWeight:700}}>{feedbackIndex+1}</span> / {participants.length}</div>
          </div>
          <div style={{display:"flex",justifyContent:"center",gap:6,marginBottom:28}}>
            {participants.map((_,i)=>(
              <div key={i} style={{width:i===feedbackIndex?24:8,height:8,borderRadius:4,background:i<feedbackIndex?OC.accent2:i===feedbackIndex?OC.accent:OC.border,transition:"all 0.3s"}} />
            ))}
          </div>
          <div style={{fontSize:10,color:OC.textDim,letterSpacing:3,textTransform:"uppercase",marginBottom:16}}>
            Anonymous Signal #{String(feedbackIndex+1).padStart(2,"0")}
            {profile.ready&&<span style={{marginLeft:10,color:OC.accent2}}>· Ready ✓</span>}
          </div>
          <div className="card-float" style={{background:OC.card,border:`1px solid ${OC.border}`,borderRadius:16,padding:"20px 22px",marginBottom:20}}>
            <ScoreBars scores={profile.scores} />
          </div>
          <div className="card-float" style={{background:OC.card,border:`1px solid ${OC.border}`,borderRadius:16,padding:"18px 20px",marginBottom:24}}>
            <div style={{fontSize:10,color:OC.textDim,letterSpacing:3,textTransform:"uppercase",marginBottom:10}}>Notes (optional)</div>
            <textarea
              value={annotations[feedbackIndex]||""}
              onChange={e=>setAnnotations(prev=>({...prev,[feedbackIndex]:e.target.value}))}
              placeholder="Add observations, patterns, or notes for this signal..."
              rows={4}
              style={{width:"100%",background:"#030f20",border:`1px solid ${OC.border}`,borderRadius:10,padding:"12px 14px",color:OC.text,fontSize:13,lineHeight:1.6,resize:"vertical",outline:"none",fontFamily:"inherit",boxSizing:"border-box",transition:"border-color 0.3s"}}
              onFocus={e=>e.target.style.borderColor=OC.accent} onBlur={e=>e.target.style.borderColor=OC.border}
            />
          </div>
          <div style={{display:"flex",gap:10}}>
            {feedbackIndex>0&&(
              <button onClick={()=>setFeedbackIndex(i=>i-1)} className="btn-ocean" style={{flex:1,padding:14,borderRadius:12,border:`1px solid ${OC.border}`,background:"transparent",color:OC.textMid,fontSize:14,cursor:"pointer"}}>← Back</button>
            )}
            {!isLast ? (
              <button onClick={()=>setFeedbackIndex(i=>i+1)} className="btn-ocean" style={{flex:2,padding:14,borderRadius:12,border:"none",background:OC.accent,color:"#010d1f",fontSize:14,fontWeight:700,cursor:"pointer",boxShadow:`0 0 20px ${OC.accent}44`}}>Next signal →</button>
            ) : (
              <button onClick={finishFeedback} className="btn-ocean" style={{flex:2,padding:14,borderRadius:12,border:"none",background:`linear-gradient(135deg,${OC.accent},${OC.accent2})`,color:"#010d1f",fontSize:14,fontWeight:700,cursor:"pointer"}}>Finish review ✓</button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // FEEDBACK DONE (host)
  if (screen === "feedbackDone") {
    const withNotes = Object.values(annotations).filter(a=>a&&a.trim()).length;
    return (
      <div key={screenKey} className="screen-enter" style={{minHeight:"100vh",background:"linear-gradient(180deg,#010d1f 0%,#020b18 100%)",display:"flex",alignItems:"center",justifyContent:"center",padding:24,position:"relative"}}>
        <style>{GLOBAL_CSS}</style>
        <BubblesBg /><CausticLight /><OceanCreature />
        <div style={{position:"relative",zIndex:1,maxWidth:460,width:"100%",textAlign:"center"}}>
          <div style={{width:100,height:100,margin:"0 auto 20px"}}><MiniSchool size={100} /></div>
          <div style={{fontSize:48,marginBottom:12}}>✓</div>
          <div style={{fontSize:24,fontWeight:700,color:"#fff",marginBottom:8}}>All signals reviewed</div>
          <div style={{fontSize:13,color:OC.textMid,marginBottom:32}}>{participants.length} signal{participants.length!==1?"s":""} reviewed · {withNotes} with notes</div>
          <div style={{textAlign:"left",marginBottom:24}}>
            {participants.map((p,i)=>(
              <div key={i} className="card-float" style={{background:OC.card,border:`1px solid ${annotations[i]?.trim()?OC.accent+"44":OC.border}`,borderRadius:14,padding:"14px 18px",marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:annotations[i]?.trim()?8:0}}>
                  <div style={{fontSize:11,color:OC.textDim,letterSpacing:2,textTransform:"uppercase"}}>Signal #{String(i+1).padStart(2,"0")}</div>
                  <div style={{display:"flex",gap:5}}>{Object.keys(DIMS).map(dim=><div key={dim} style={{width:6,height:6,borderRadius:"50%",background:DIMS[dim].color,opacity:p.scores[dim]/100}} />)}</div>
                </div>
                {annotations[i]?.trim()&&<div style={{fontSize:12,color:OC.textMid,lineHeight:1.5,fontStyle:"italic",borderTop:`1px solid ${OC.border}`,paddingTop:8}}>"{annotations[i]}"</div>}
              </div>
            ))}
          </div>
          <div className="card-float" style={{padding:"14px 18px",background:`${OC.accent2}0d`,border:`1px solid ${OC.accent2}33`,borderRadius:12,marginBottom:20}}>
            <div style={{fontSize:13,color:OC.accent2,lineHeight:1.6}}>Notes sent to participants. They can now view them alongside their pattern.</div>
          </div>
          <button onClick={()=>{goTo("home");setParticipants([]);setSessionCode("");setAnnotations({});setFeedbackIndex(0);stopSession();}} className="btn-ocean" style={{width:"100%",padding:14,borderRadius:12,border:`1px solid ${OC.border}`,background:"transparent",color:OC.textMid,fontSize:13,cursor:"pointer"}}>Back to surface</button>
        </div>
      </div>
    );
  }

  return null;
}
