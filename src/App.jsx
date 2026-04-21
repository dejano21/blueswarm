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
  N:{ color:"#00e5b0",label:"Neuroticism",short:"Stability under pressure",title:"Neuroticism",tagline:"How you respond to pressure, setbacks, and uncertainty",high:"Deeply invested · Emotionally reactive · Highly sensitive",low:"Calm under fire · Resilient · Steady in uncertainty",teamHigh:"Brings intensity and care — needs psychological safety",teamLow:"Provides steadiness when things get difficult",tip:"High N: Start with what's working, be reassuring.\nLow N: Can handle blunt feedback — don't over-soften." },
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

function calcScores(answers, activeQuestions) {
  const scores = {};
  Object.keys(DIMS).forEach(dim => {
    const qs = activeQuestions.filter(q => q.dim === dim);
    const n = qs.length;
    if (n === 0) {
      scores[dim] = 50; // default if no questions for this dimension
      return;
    }
    const sum = qs.reduce((acc, q) => {
      const qIndex = activeQuestions.indexOf(q);
      return acc + (answers[qIndex] || 0);
    }, 0);
    // min possible = n*1, max possible = n*4 → normalize to 0–100
    scores[dim] = Math.round(((sum - n) / (n * 3)) * 100);
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
#underwater-bg-container canvas{display:block;position:fixed;z-index:-1;top:0;}
.content-overlay{background:rgba(1,13,31,0.85);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1px solid rgba(12,51,88,0.3)}
`;

// Koi fish component with customizable colors - full color version
function KoiFish({ color = "#ff6b00", delay = 0, duration = 20000, reverse = false }) {
  // Create lighter shade for accents
  const lighterColor = color + 'cc'; // Add transparency for lighter effect
  
  const koiStyle = {
    position: 'absolute',
    top: '-35%',
    left: 0,
    width: '100%',
    height: '100%',
    filter: `drop-shadow(${reverse ? '-' : ''}56px 4.67px 5px rgba(0, 0, 0, 0.3))`,
    transform: reverse ? 'scale(-1, 1)' : 'none',
    transformOrigin: 'top center'
  };

  const coilBaseStyle = {
    position: 'absolute',
    width: '14px',
    height: '14px',
    backgroundColor: color,
    borderRadius: '50%',
    top: '50%',
    left: '50%',
    marginLeft: '-7px',
    marginTop: '-7px',
    filter: 'contrast(200%)',
    offsetPath: 'path("M11.7692 229.5C14.552 200.052 7.51901 171.858 -42.8757 170.644C-105.869 169.128 -131.294 76.612 -101.695 51.5872C-72.0955 26.5625 -24.6607 -50.7867 70.5883 51.5872C165.837 153.961 27.7073 131.211 33.0199 183.157C38.3326 235.102 90.3211 195.669 139.274 223.727C188.226 251.785 207.959 299.56 139.274 316.243C70.5883 332.926 41.3685 398.9 81.9726 419.754C122.577 440.608 222 478.524 222 419.754C222 372.738 222 242.432 222 183.157C219.091 129.948 175.78 30.8091 25.8099 59.9288C-161.652 96.3284 -30.3529 119.837 25.8099 141.07C81.9726 162.303 171.529 204.769 126.751 260.506C81.9726 316.243 101.326 362.501 139.274 373.496C177.222 384.492 170.012 464.495 70.5883 462.979C-28.835 461.462 -42.8757 393.015 -42.8757 373.496C-42.8757 238.288 11.7692 293 11.7692 240.506C11.7692 208.05 11.7692 237.336 11.7692 229.5Z")',
    animation: `koiSwim ${duration}ms linear ${delay}ms infinite`,
    boxShadow: `-7px -1.4px 0 ${lighterColor} inset`
  };

  const scales = [1, 1.2, 1.35, 1.55, 1.75, 1.9, 2, 2, 2, 1.9, 1.75, 1.55, 1.35, 1.2, 1];
  const delays = scales.map((_, i) => i * 40);

  return (
    <>
      <style>{`
        @keyframes koiSwim {
          0% { offset-distance: 0%; }
          100% { offset-distance: 100%; }
        }
        @keyframes koiTailFlip {
          0% { transform: rotate(45deg); }
          100% { transform: rotate(-45deg); }
        }
        @keyframes koiFinFlip {
          0% { transform: scale(1, 1) translateY(0) rotate(80deg); }
          100% { transform: scale(1, 1) translateY(0) rotate(20deg); }
        }
        @keyframes koiFinFlipBottom {
          0% { transform: scale(1, -1) translateY(-14px) rotate(80deg); }
          100% { transform: scale(1, -1) translateY(-14px) rotate(20deg); }
        }
      `}</style>
      <div style={koiStyle}>
        {scales.map((scale, i) => {
          const isHead = i === 14;
          const isTail = i === 0;
          const hasFins = i === 3;
          
          return (
            <div
              key={i}
              style={{
                ...coilBaseStyle,
                transform: `scale(${scale}, ${scale})`,
                animationDelay: `${delays[i]}ms`,
                backgroundColor: color
              }}
            >
              {isHead && (
                <div style={{
                  content: '":"',
                  position: 'absolute',
                  color: 'rgba(0,0,0,0.6)',
                  fontWeight: 800,
                  textAlign: 'center',
                  lineHeight: '60%',
                  fontSize: '16.8px',
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>:</div>
              )}
              {isTail && (
                <div style={{
                  position: 'absolute',
                  width: '100%',
                  height: '50%',
                  top: '25%',
                  left: '-100%',
                  borderRadius: '14px',
                  backgroundColor: lighterColor,
                  transformOrigin: 'center right',
                  animation: 'koiTailFlip 200ms ease-in-out alternate infinite'
                }} />
              )}
              {hasFins && (
                <>
                  <div style={{
                    position: 'absolute',
                    width: '100%',
                    height: '20%',
                    top: '-10%',
                    left: '-100%',
                    borderRadius: '14px',
                    backgroundColor: lighterColor,
                    transformOrigin: 'center right',
                    animation: 'koiFinFlip 500ms ease-in-out alternate infinite'
                  }} />
                  <div style={{
                    position: 'absolute',
                    width: '100%',
                    height: '20%',
                    top: '-10%',
                    left: '-100%',
                    borderRadius: '14px',
                    backgroundColor: lighterColor,
                    transformOrigin: 'center right',
                    animation: 'koiFinFlipBottom 500ms ease-in-out alternate infinite'
                  }} />
                </>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

// Underwater background component with Three.js fishes (no koi here)
function UnderwaterBg() {
  const containerRef = useRef(null);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Dynamically load Three.js toys
    const script = document.createElement('script');
    script.type = 'module';
    script.textContent = `
      import { fishesBackground } from 'https://unpkg.com/threejs-toys@0.0.8/build/threejs-toys.module.cdn.min.js';
      
      const bg = fishesBackground({
        el: document.getElementById('underwater-bg-container'),
        eventsEl: document.getElementById('underwater-bg-container'),
        gpgpuSize: 96,
        background: 0x031F48,
        fogDensity: 0.025,
        texture: 'https://assets.codepen.io/33787/fishes.png',
        textureCount: 8,
        material: 'phong',
        materialParams: {
          transparent: true,
          alphaTest: 0.5
        },
        fishScale: [1, 1, 1],
        fishWidthSegments: 8,
        fishSpeed: 1.5,
        noiseCoordScale: 0.01,
        noiseTimeCoef: 0.0005,
        noiseIntensity: 0.0005,
        attractionRadius1: 50,
        attractionRadius2: 150,
        maxVelocity: 0.1
      });
    `;
    document.body.appendChild(script);
    
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);
  
  return (
    <div 
      id="underwater-bg-container" 
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none'
      }}
    />
  );
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
  return (
    <div style={{position: 'relative', width: '100%', height: '100%', overflow: 'hidden', zIndex: 10}}>
      {/* Add colorful koi fish for each dimension - swimming slowly and randomly */}
      <div style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10, pointerEvents: 'none'}}>
        <KoiFish color={DIMS.O.color} delay={0} duration={45000} />
        <KoiFish color={DIMS.C.color} delay={9000} duration={52000} reverse={true} />
        <KoiFish color={DIMS.E.color} delay={18000} duration={48000} />
        <KoiFish color={DIMS.A.color} delay={27000} duration={50000} reverse={true} />
        <KoiFish color={DIMS.N.color} delay={36000} duration={46000} />
      </div>
      
      {/* Interactive overlay for clicking dimensions */}
      <div style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, flexWrap: 'wrap', padding: 20, zIndex: 20}}>
        {Object.keys(DIMS).map(dim => (
          <div
            key={dim}
            onClick={() => onFishClick(dim)}
            style={{
              cursor: 'pointer',
              padding: '12px 20px',
              borderRadius: 12,
              background: selectedDim === dim ? DIMS[dim].color + '33' : 'rgba(1,13,31,0.7)',
              border: `2px solid ${selectedDim === dim ? DIMS[dim].color : DIMS[dim].color + '44'}`,
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease',
              boxShadow: selectedDim === dim ? `0 0 20px ${DIMS[dim].color}66` : 'none'
            }}
          >
            <div style={{fontSize: 14, fontWeight: 700, color: DIMS[dim].color, marginBottom: 4}}>{DIMS[dim].label}</div>
            {scores?.[dim] !== undefined && (
              <div style={{fontSize: 18, fontWeight: 800, color: '#fff'}}>{scores[dim]}%</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
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

// Swarm visualization showing all participants as fish near coral reefs
function ParticipantSwarm({ participants, onFishClick, selectedFish }) {
  const canvasRef = useRef(null);
  const selectedRef = useRef(selectedFish);
  const ripples = useRef([]);
  selectedRef.current = selectedFish;
  
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W=canvas.offsetWidth,H=canvas.offsetHeight;
    canvas.width=W*window.devicePixelRatio; canvas.height=H*window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio,window.devicePixelRatio);
    
    // Calculate average scores for each dimension
    const avgScores = {};
    Object.keys(DIMS).forEach(dim => {
      const sum = participants.reduce((acc, p) => acc + p.scores[dim], 0);
      avgScores[dim] = Math.round(sum / participants.length);
    });
    
    // Position coral reefs horizontally from left to right
    // Order: Openness (blue), Conscientiousness (red), Extraversion (yellow), Agreeableness (purple), Neuroticism (green)
    const dimsOrder = ['O', 'C', 'E', 'A', 'N'];
    const reefs = dimsOrder.map((dim, idx) => {
      const spacing = W / (dimsOrder.length + 1);
      return {
        dim,
        x: spacing * (idx + 1),
        y: H * 0.75, // Position in lower part of canvas
        color: DIMS[dim].color,
        avgScore: avgScores[dim]
      };
    });
    
    // Create fish for each participant based on their strongest dimension
    const fishes = participants.map((p,idx)=>{
      const dims = Object.keys(DIMS);
      let strongestDim = dims[0];
      let maxScore = p.scores[dims[0]];
      dims.forEach(dim => {
        if (p.scores[dim] > maxScore) {
          maxScore = p.scores[dim];
          strongestDim = dim;
        }
      });
      
      // Find the reef for this dimension
      const targetReef = reefs.find(r => r.dim === strongestDim);
      
      // Position fish near their reef with some randomness
      const offsetAngle = Math.random() * Math.PI * 2;
      const offsetDist = 30 + Math.random() * 50;
      
      return {
        idx,
        dim: strongestDim,
        score: maxScore,
        x: targetReef.x + Math.cos(offsetAngle) * offsetDist,
        y: targetReef.y + Math.sin(offsetAngle) * offsetDist - 80, // Position above reef
        targetX: targetReef.x,
        targetY: targetReef.y - 80,
        vx: (Math.random()-0.5)*0.5,
        vy: (Math.random()-0.5)*0.5,
        wobble: Math.random()*Math.PI*2,
        size: 18 + (maxScore/100)*10,
        speedPhase: Math.random()*Math.PI*2,
        glowPhase: Math.random()*Math.PI*2
      };
    });
    
    function drawReef(reef) {
      const {x, y, color, dim, avgScore} = reef;
      ctx.save();
      
      // Base size influenced by score
      const baseSize = 40 + (avgScore/100) * 30;
      const coralHeight = 50 + (avgScore/100) * 40;
      
      // Sandy/rocky base with texture
      const baseGrad = ctx.createRadialGradient(x, y + 5, 0, x, y + 5, baseSize);
      baseGrad.addColorStop(0, "#4a5568");
      baseGrad.addColorStop(0.5, "#2d3748");
      baseGrad.addColorStop(1, "#1a202c");
      ctx.fillStyle = baseGrad;
      ctx.beginPath();
      ctx.ellipse(x, y + 5, baseSize * 0.9, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Add sand texture
      for (let i = 0; i < 20; i++) {
        const sx = x + (Math.random() - 0.5) * baseSize * 1.5;
        const sy = y + 5 + (Math.random() - 0.5) * 10;
        ctx.fillStyle = `rgba(139, 116, 85, ${0.2 + Math.random() * 0.3})`;
        ctx.beginPath();
        ctx.arc(sx, sy, 0.5 + Math.random(), 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Bubble coral clusters (rounded, colorful)
      const bubbleCount = 8 + Math.floor(avgScore / 15);
      for (let i = 0; i < bubbleCount; i++) {
        const angle = (i / bubbleCount) * Math.PI * 2;
        const layer = Math.floor(i / 4);
        const radius = baseSize * (0.6 - layer * 0.15);
        const bx = x + Math.cos(angle) * radius;
        const by = y - layer * 12;
        const bubbleSize = 8 + Math.random() * 6 + (avgScore / 100) * 4;
        
        // 3D bubble effect with highlight
        const bubbleGrad = ctx.createRadialGradient(
          bx - bubbleSize * 0.3, by - bubbleSize * 0.3, 0,
          bx, by, bubbleSize
        );
        bubbleGrad.addColorStop(0, color + "ff");
        bubbleGrad.addColorStop(0.4, color + "ee");
        bubbleGrad.addColorStop(0.7, color + "aa");
        bubbleGrad.addColorStop(1, color + "66");
        
        ctx.fillStyle = bubbleGrad;
        ctx.beginPath();
        ctx.arc(bx, by, bubbleSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Highlight spot for 3D effect
        ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
        ctx.beginPath();
        ctx.arc(bx - bubbleSize * 0.35, by - bubbleSize * 0.35, bubbleSize * 0.25, 0, Math.PI * 2);
        ctx.fill();
        
        // Small dots on surface
        for (let d = 0; d < 3; d++) {
          const dx = bx + (Math.random() - 0.5) * bubbleSize * 0.6;
          const dy = by + (Math.random() - 0.5) * bubbleSize * 0.6;
          ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
          ctx.beginPath();
          ctx.arc(dx, dy, 0.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      
      // Branching coral (staghorn style) in center
      for (let i = 0; i < 3; i++) {
        const offsetX = (i - 1) * 12;
        const branchHeight = coralHeight * (0.8 + Math.random() * 0.2);
        const branchWidth = 6 + Math.random() * 3;
        
        // Branch gradient with 3D shading
        const branchGrad = ctx.createLinearGradient(
          x + offsetX - branchWidth, y,
          x + offsetX + branchWidth, y - branchHeight
        );
        branchGrad.addColorStop(0, color + "88");
        branchGrad.addColorStop(0.3, color + "cc");
        branchGrad.addColorStop(0.6, color + "ff");
        branchGrad.addColorStop(1, color + "aa");
        
        ctx.fillStyle = branchGrad;
        ctx.beginPath();
        ctx.moveTo(x + offsetX - branchWidth/2, y);
        
        // Organic wavy edges
        for (let h = 0; h <= branchHeight; h += 4) {
          const wave = Math.sin(h * 0.4 + offsetX) * 1.5;
          const taper = 1 - (h / branchHeight) * 0.7;
          ctx.lineTo(x + offsetX - (branchWidth/2) * taper + wave, y - h);
        }
        
        for (let h = branchHeight; h >= 0; h -= 4) {
          const wave = Math.sin(h * 0.4 + offsetX) * 1.5;
          const taper = 1 - (h / branchHeight) * 0.7;
          ctx.lineTo(x + offsetX + (branchWidth/2) * taper + wave, y - h);
        }
        
        ctx.closePath();
        ctx.fill();
        
        // Highlight edge for 3D effect
        ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + offsetX + branchWidth/2, y);
        for (let h = 0; h <= branchHeight; h += 4) {
          const wave = Math.sin(h * 0.4 + offsetX) * 1.5;
          const taper = 1 - (h / branchHeight) * 0.7;
          ctx.lineTo(x + offsetX + (branchWidth/2) * taper + wave, y - h);
        }
        ctx.stroke();
      }
      
      // Plate coral (flat, layered)
      for (let side = -1; side <= 1; side += 2) {
        const plateX = x + side * 22;
        const plateY = y - 15;
        const plateWidth = 18;
        const plateHeight = 8;
        
        // Plate with 3D shading
        const plateGrad = ctx.createLinearGradient(plateX, plateY - plateHeight, plateX, plateY);
        plateGrad.addColorStop(0, color + "ff");
        plateGrad.addColorStop(0.5, color + "cc");
        plateGrad.addColorStop(1, color + "66");
        
        ctx.fillStyle = plateGrad;
        ctx.beginPath();
        ctx.ellipse(plateX, plateY, plateWidth, plateHeight, side * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Plate edge highlight
        ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(plateX, plateY - 2, plateWidth * 0.9, plateHeight * 0.7, side * 0.3, Math.PI, Math.PI * 2);
        ctx.stroke();
        
        // Texture lines on plate
        ctx.strokeStyle = color + "44";
        ctx.lineWidth = 0.5;
        for (let l = 0; l < 5; l++) {
          ctx.beginPath();
          const lx = plateX + (l - 2) * 3 * side;
          ctx.moveTo(lx, plateY - plateHeight);
          ctx.lineTo(lx, plateY + plateHeight);
          ctx.stroke();
        }
      }
      
      // Soft coral (wavy, flowing)
      for (let i = 0; i < 2; i++) {
        const waveX = x + (i - 0.5) * 25;
        const waveHeight = coralHeight * 0.5;
        const waveWidth = 8;
        
        const waveGrad = ctx.createLinearGradient(waveX, y, waveX, y - waveHeight);
        waveGrad.addColorStop(0, color + "99");
        waveGrad.addColorStop(0.5, color + "cc");
        waveGrad.addColorStop(1, color + "66");
        
        ctx.fillStyle = waveGrad;
        ctx.beginPath();
        ctx.moveTo(waveX, y);
        
        // Flowing, organic shape
        for (let h = 0; h <= waveHeight; h += 3) {
          const sway = Math.sin(h * 0.2 + Date.now() * 0.001 + i) * 3;
          const width = waveWidth * (1 - h / waveHeight * 0.5);
          ctx.lineTo(waveX + sway - width/2, y - h);
        }
        
        for (let h = waveHeight; h >= 0; h -= 3) {
          const sway = Math.sin(h * 0.2 + Date.now() * 0.001 + i) * 3;
          const width = waveWidth * (1 - h / waveHeight * 0.5);
          ctx.lineTo(waveX + sway + width/2, y - h);
        }
        
        ctx.closePath();
        ctx.fill();
      }
      
      // Ambient glow
      ctx.shadowColor = color;
      ctx.shadowBlur = 30;
      ctx.strokeStyle = color + "33";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(x, y - coralHeight/2, baseSize * 1.3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
      
      // Floating particles
      for (let i = 0; i < 8; i++) {
        const particleAngle = (Date.now() * 0.0004 + i * 0.8) % (Math.PI * 2);
        const particleDist = 30 + Math.sin(Date.now() * 0.0015 + i) * 10;
        const px = x + Math.cos(particleAngle) * particleDist;
        const py = y - coralHeight/2 + Math.sin(particleAngle) * particleDist * 0.7;
        
        ctx.fillStyle = color + "88";
        ctx.beginPath();
        ctx.arc(px, py, 1.5 + Math.sin(Date.now() * 0.002 + i) * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Label with better background
      ctx.fillStyle = "rgba(1, 13, 31, 0.9)";
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.roundRect(x - 40, y + 10, 80, 42, 10);
      ctx.fill();
      ctx.shadowBlur = 0;
      
      ctx.font = "bold 12px -apple-system,sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillStyle = color;
      ctx.fillText(DIMS[dim].label, x, y + 16);
      
      // Average score
      ctx.font = "bold 18px -apple-system,sans-serif";
      ctx.fillStyle = "#fff";
      ctx.fillText(avgScore + "%", x, y + 30);
      
      ctx.restore();
    }
    
    function updateFish() {
      const SEP_R=45,VIEW_R=140,W_SEP=0.045,W_ALG=0.006,W_COH=0.0006,W_TARGET=0.0015,MAX_SPD=1.8,MIN_SPD=0.4;
      fishes.forEach(f=>{
        if(selectedRef.current===f.idx)return;
        let sx=0,sy=0,ax=0,ay=0,px=0,py=0,cnt=0;
        
        // Flock with nearby fish of same dimension
        fishes.forEach(o=>{
          if(o===f || o.dim !== f.dim)return;
          const dx=f.x-o.x,dy=f.y-o.y,d=Math.sqrt(dx*dx+dy*dy)||0.001;
          if(d<SEP_R){sx+=dx/d;sy+=dy/d;}
          if(d<VIEW_R){ax+=o.vx;ay+=o.vy;px+=o.x;py+=o.y;cnt++;}
        });
        
        if(cnt>0){ax/=cnt;ay/=cnt;px=px/cnt-f.x;py=py/cnt-f.y;}
        
        f.speedPhase+=0.006;
        const spdMult = 0.75 + Math.sin(f.speedPhase)*0.2;
        
        // Attraction to target reef
        const toTargetX = f.targetX - f.x;
        const toTargetY = f.targetY - f.y;
        
        f.vx+=sx*W_SEP+ax*W_ALG+px*W_COH+toTargetX*W_TARGET;
        f.vy+=sy*W_SEP+ay*W_ALG+py*W_COH+toTargetY*W_TARGET;
        
        const spd=Math.sqrt(f.vx*f.vx+f.vy*f.vy)||0.001,c=Math.min(MAX_SPD*spdMult,Math.max(MIN_SPD,spd));
        f.vx=f.vx/spd*c;f.vy=f.vy/spd*c;f.x+=f.vx;f.y+=f.vy;f.wobble+=0.055;
        
        const m=35;if(f.x<m)f.vx+=0.12;if(f.x>W-m)f.vx-=0.12;if(f.y<m)f.vy+=0.12;if(f.y>H-m)f.vy-=0.12;
      });
    }
    
    function drawFish(f) {
      const{x,y,vx,vy,size,dim,idx}=f,angle=Math.atan2(vy,vx),col=DIMS[dim].color,sel=selectedRef.current===idx,wb=Math.sin(f.wobble)*0.055;
      f.glowPhase+=0.02;
      const glowPulse = sel ? 20 + Math.sin(f.glowPhase)*5 : 0;
      ctx.save();ctx.translate(x,y);ctx.rotate(angle+wb);
      if(sel){ctx.shadowColor=col;ctx.shadowBlur=glowPulse;}
      // Tail
      const tailWag = Math.sin(f.wobble*1.3)*0.1;
      const tx=-size*0.75;
      ctx.beginPath();ctx.moveTo(tx,0);ctx.lineTo(tx-size*0.45,-size*(0.35+tailWag));ctx.lineTo(tx-size*0.08,0);ctx.lineTo(tx-size*0.45,size*(0.35-tailWag));ctx.closePath();ctx.fillStyle=col+"88";ctx.fill();
      // Pectoral fin
      ctx.beginPath();ctx.moveTo(size*0.06,0);ctx.quadraticCurveTo(0,size*0.35,-size*0.22,size*0.22);ctx.quadraticCurveTo(-size*0.03,size*0.06,size*0.06,0);ctx.fillStyle=col+"55";ctx.fill();
      // Body
      ctx.beginPath();ctx.ellipse(0,0,size*0.65,size*0.26,0,0,Math.PI*2);ctx.fillStyle=col+(sel?"ff":"cc");ctx.fill();
      // Dorsal fin
      ctx.beginPath();ctx.moveTo(-size*0.1,-size*0.26);ctx.quadraticCurveTo(size*0.08,-size*0.48,size*0.35,-size*0.26);ctx.strokeStyle=col+"aa";ctx.lineWidth=1.2;ctx.stroke();
      // Eye
      ctx.beginPath();ctx.arc(size*0.38,-size*0.04,size*0.075,0,Math.PI*2);ctx.fillStyle="rgba(255,255,255,0.9)";ctx.fill();
      ctx.beginPath();ctx.arc(size*0.4,-size*0.04,size*0.037,0,Math.PI*2);ctx.fillStyle="#001530";ctx.fill();
      ctx.beginPath();ctx.arc(size*0.41,-size*0.06,size*0.015,0,Math.PI*2);ctx.fillStyle="rgba(255,255,255,0.85)";ctx.fill();
      ctx.restore();
      // Label
      ctx.save();ctx.font=`${sel?"bold ":""}${size*0.32}px -apple-system,sans-serif`;ctx.textAlign="center";ctx.textBaseline="top";ctx.fillStyle=sel?col:col+"99";ctx.fillText(`#${idx+1}`,x,y+size*0.8);ctx.restore();
      // Selection ring
      if(sel){ctx.save();ctx.beginPath();ctx.arc(x,y,size*1.4,0,Math.PI*2);ctx.strokeStyle=col+"40";ctx.lineWidth=2;ctx.setLineDash([3,5]);ctx.stroke();ctx.restore();}
    }
    
    let raf;
    function loop(){
      ctx.clearRect(0,0,W,H);
      updateFish();
      
      // Draw reefs first
      reefs.forEach(reef => drawReef(reef));
      
      // Connection lines between fish of same dimension
      fishes.forEach((f,i)=>fishes.forEach((f2,j)=>{
        if(j<=i || f.dim !== f2.dim)return;
        const d=Math.hypot(f.x-f2.x,f.y-f2.y);
        if(d<100){
          const a=Math.floor((1-d/100)*14).toString(16).padStart(2,"0");
          ctx.beginPath();
          ctx.strokeStyle=`${DIMS[f.dim].color}${a}`;
          ctx.lineWidth=0.4;
          ctx.moveTo(f.x,f.y);
          ctx.lineTo(f2.x,f2.y);
          ctx.stroke();
        }
      }));
      
      // Ripples
      ripples.current = ripples.current.filter(r=>{r.age++;r.radius+=2;ctx.beginPath();ctx.arc(r.x,r.y,r.radius,0,Math.PI*2);ctx.strokeStyle=`rgba(0,200,245,${0.25*(1-r.age/25)})`;ctx.lineWidth=1.2;ctx.stroke();return r.age<25;});
      
      fishes.forEach(f=>drawFish(f));
      raf=requestAnimationFrame(loop);
    }
    loop();
    
    function handleClick(e){
      const rect=canvas.getBoundingClientRect(),mx=e.clientX-rect.left,my=e.clientY-rect.top;
      ripples.current.push({x:mx,y:my,radius:3,age:0});
      let hit=null,minD=Infinity;
      fishes.forEach(f=>{const d=Math.hypot(mx-f.x,my-f.y);if(d<f.size*1.5&&d<minD){minD=d;hit=f.idx;}});
      onFishClick(hit);
    }
    canvas.addEventListener("click",handleClick);
    return ()=>{cancelAnimationFrame(raf);canvas.removeEventListener("click",handleClick);};
  },[participants]);
  
  return <canvas ref={canvasRef} style={{width:"100%",height:"100%",display:"block",cursor:"pointer",background:"transparent"}} />;
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
  const [questionCount, setQuestionCount] = useState(20); // 10, 20, or 40
  const [activeQuestions, setActiveQuestions] = useState(QUESTIONS.slice(0, 20));
  const [participantNotes, setParticipantNotes] = useState({}); // notes from participant to other profiles
  const [feedbackStarted, setFeedbackStarted] = useState(false);
  const [currentFeedbackIndex, setCurrentFeedbackIndex] = useState(0); // Track which profile participant is reviewing
  const unsubRef          = useRef(null);
  const unsubParticipantRef = useRef(null);
  const unsubFeedbackRef  = useRef(null);
  const unsubMetaRef = useRef(null);

  const goTo = useCallback((s) => { setScreenKey(k=>k+1); setScreen(s); }, []);

  async function createSession() {
    const code = genCode();
    try {
      await fbSet(`${sp(code)}/meta`, { created: Date.now(), feedbackDone: false, feedbackStarted: false, questionCount });
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
      const qCount = meta.questionCount || 20;
      setQuestionCount(qCount);
      setActiveQuestions(QUESTIONS.slice(0, qCount));
      setSessionCode(code); 
      
      // Listen to all profiles so participant can see them during feedback
      unsubRef.current = fbListen(`${sp(code)}/profiles`, (val) => {
        setParticipants(val ? Object.values(val) : []);
      });
      
      goTo("assessment"); 
      setError("");
    } catch (e) { setError("No swarm found."); }
  }

  async function submitResults(scores) {
    const pid = genPid();
    setMyPid(pid);
    localStorage.setItem("swarm-pid", pid);
    setMyScores(scores);
    goTo("signalSent");
    try {
      await fbSet(`${sp(sessionCode)}/profiles/${pid}`, { scores, ts: Date.now(), pid, annotation: "", ready: false, myNote: "" });
      unsubParticipantRef.current = fbListen(`${sp(sessionCode)}/profiles/${pid}`, (profile) => {
        if (profile?.annotation !== undefined) setMyAnnotation(profile.annotation);
      });
      unsubFeedbackRef.current = fbListen(`${sp(sessionCode)}/meta/feedbackDone`, (val) => {
        if (val === true) setFeedbackDone(true);
      });
      unsubMetaRef.current = fbListen(`${sp(sessionCode)}/meta/feedbackStarted`, (val) => {
        if (val === true) setFeedbackStarted(true);
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

  function startFeedback() { 
    fbUpdate(`${sp(sessionCode)}/meta`, { feedbackStarted: true });
    setFeedbackIndex(0); 
    setAnnotations({}); 
    goTo("feedbackReview"); 
  }

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
  function next() { if (answers[current] === undefined) return; if (current === activeQuestions.length - 1) submitResults(calcScores(answers, activeQuestions)); else setCurrent(c => c + 1); }
  function prev() { if (current > 0) setCurrent(c => c - 1); }

  useEffect(() => { 
    if (screen === "waiting" && feedbackDone) goTo("result");
    if (screen === "waiting" && feedbackStarted) {
      setCurrentFeedbackIndex(0); // Reset to first profile
      goTo("participantFeedback");
    }
  }, [feedbackDone, feedbackStarted, screen, goTo]);
  useEffect(() => () => {
    stopSession();
    if (unsubParticipantRef.current) { unsubParticipantRef.current(); unsubParticipantRef.current = null; }
    if (unsubFeedbackRef.current) { unsubFeedbackRef.current(); unsubFeedbackRef.current = null; }
    if (unsubMetaRef.current) { unsubMetaRef.current(); unsubMetaRef.current = null; }
  }, []);

  const progress = Math.round((current / activeQuestions.length) * 100);
  const readyCount = participants.filter(p => p.ready).length;

  // HOST SETUP
  if (screen === "hostSetup") return (
    <div key={screenKey} className="screen-enter" style={{minHeight:"100vh",background:"linear-gradient(180deg,#010d1f 0%,#020b18 100%)",display:"flex",alignItems:"center",justifyContent:"center",padding:24,flexDirection:"column",position:"relative"}}>
      <style>{GLOBAL_CSS}</style>
      <UnderwaterBg />
      <div style={{position:"relative",zIndex:1,width:"100%",maxWidth:420,textAlign:"center"}}>
        <div style={{fontSize:20,fontWeight:700,color:"#fff",marginBottom:6}}>Setup your swarm session</div>
        <div style={{fontSize:13,color:OC.textMid,marginBottom:32}}>Choose how deep you want to dive</div>
        <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:28}}>
          {[
            {count:10,label:"Quick Round",desc:"Fast personality snapshot",time:"~10 min"},
            {count:20,label:"Recommended",desc:"Balanced depth & speed",time:"~20 min"},
            {count:40,label:"Deep Dive",desc:"Comprehensive assessment",time:"~40 min"}
          ].map(opt=>(
            <div key={opt.count} onClick={()=>setQuestionCount(opt.count)} className="card-float" style={{display:"flex",alignItems:"center",gap:16,padding:"18px 20px",borderRadius:14,cursor:"pointer",border:questionCount===opt.count?`2px solid ${OC.accent}`:`1px solid ${OC.border}`,background:questionCount===opt.count?`${OC.accent}12`:OC.card,transition:"all 0.2s ease",boxShadow:questionCount===opt.count?`0 0 20px ${OC.accent}22`:"none"}}>
              <div style={{width:32,height:32,borderRadius:"50%",flexShrink:0,background:questionCount===opt.count?OC.accent:OC.cardMid,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:questionCount===opt.count?"#010d1f":OC.textDim,transition:"all 0.2s"}}>{opt.count}</div>
              <div style={{flex:1,textAlign:"left"}}>
                <div style={{fontSize:15,fontWeight:700,color:questionCount===opt.count?"#fff":"#d8f0ff",marginBottom:2}}>{opt.label}</div>
                <div style={{fontSize:11,color:OC.textMid}}>{opt.desc} · {opt.time}</div>
              </div>
              {questionCount===opt.count&&<div style={{fontSize:18,color:OC.accent}}>✓</div>}
            </div>
          ))}
        </div>
        <button onClick={()=>{setActiveQuestions(QUESTIONS.slice(0,questionCount));createSession();}} className="btn-ocean" style={{width:"100%",padding:15,borderRadius:12,border:"none",background:OC.accent,color:"#010d1f",fontSize:14,fontWeight:700,cursor:"pointer",boxShadow:`0 0 24px ${OC.accent}44`,animation:"btnGlow 3s ease-in-out infinite"}}>Create swarm session →</button>
        <button onClick={()=>goTo("home")} className="btn-ocean" style={{marginTop:12,background:"none",border:"none",color:OC.textDim,fontSize:12,cursor:"pointer"}}>← Back</button>
      </div>
    </div>
  );

  // HOME
  if (screen === "home") return (
    <div key={screenKey} className="screen-enter" style={{minHeight:"100vh",background:"linear-gradient(180deg,#010d1f 0%,#020b18 100%)",display:"flex",alignItems:"center",justifyContent:"center",padding:24,flexDirection:"column",position:"relative"}}>
      <style>{GLOBAL_CSS}</style>
      <UnderwaterBg />
      <div className="content-overlay" style={{position:"relative",zIndex:1,width:"100%",maxWidth:380,textAlign:"center",padding:32,borderRadius:20}}>
        <div style={{margin:"0 auto 4px",width:180,height:180}}><MiniSchool size={180} /></div>
        <div style={{fontSize:10,color:OC.textDim,letterSpacing:4,textTransform:"uppercase",marginBottom:10}}>Creativity & Reframing · HSG</div>
        <div style={{fontSize:40,fontWeight:800,color:"#fff",lineHeight:1.1,marginBottom:4}}>Swarm</div>
        <div style={{fontSize:40,fontWeight:800,lineHeight:1.1,marginBottom:6}}><span style={{background:OC.accent,color:"#010d1f",padding:"0 10px",borderRadius:6}}>Intelligence.</span></div>
        <div style={{fontSize:13,color:OC.textMid,marginBottom:36,fontStyle:"italic"}}>The swarm shows what individuals can't.</div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <button onClick={()=>goTo("hostSetup")} className="btn-ocean" style={{padding:15,borderRadius:12,border:"none",background:OC.accent,color:"#010d1f",fontSize:14,fontWeight:700,cursor:"pointer",boxShadow:`0 0 24px ${OC.accent}44`,animation:"btnGlow 3s ease-in-out infinite"}}>Host a swarm session</button>
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
      <UnderwaterBg />
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
      <UnderwaterBg />
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
            <div style={{background:OC.card,border:`1px solid ${OC.border}`,borderRadius:8,padding:"6px 14px",fontSize:11,color:OC.textMid}}>
              {questionCount} questions
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
    const q = activeQuestions[current];
    return (
      <div key={screenKey} className="screen-enter" style={{minHeight:"100vh",background:"linear-gradient(180deg,#010d1f 0%,#020b18 100%)",display:"flex",alignItems:"center",justifyContent:"center",padding:24,position:"relative"}}>
        <style>{GLOBAL_CSS}</style>
        <UnderwaterBg />
        <div className="content-overlay" style={{position:"relative",zIndex:1,maxWidth:520,width:"100%",padding:28,borderRadius:20}}>
          <div style={{marginBottom:36}}>
            <div style={{height:3,background:OC.cardMid,borderRadius:2,overflow:"hidden"}}>
              <div style={{height:"100%",width:progress+"%",background:`linear-gradient(90deg,${OC.accent},${OC.accent2})`,borderRadius:2,transition:"width 0.4s ease",boxShadow:`0 0 8px ${OC.accent}66`}} />
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}>
              <span style={{fontSize:10,color:OC.textDim}}>{current+1} of {activeQuestions.length}</span>
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
              {current===activeQuestions.length-1?"Surface →":"Next →"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // PARTICIPANT FEEDBACK - Participants add notes to profiles ONE AT A TIME
  if (screen === "participantFeedback") {
    // Show all participants except self
    const otherParticipants = participants.filter(p => p.pid !== myPid);
    
    if (otherParticipants.length === 0) {
      return (
        <div key={screenKey} className="screen-enter" style={{minHeight:"100vh",background:"linear-gradient(180deg,#010d1f 0%,#020b18 100%)",display:"flex",alignItems:"center",justifyContent:"center",padding:24,position:"relative"}}>
          <style>{GLOBAL_CSS}</style>
          <UnderwaterBg />
          <div style={{position:"relative",zIndex:1,maxWidth:400,width:"100%",textAlign:"center"}}>
            <div style={{fontSize:20,fontWeight:700,color:"#fff",marginBottom:8}}>Waiting for other signals...</div>
            <div style={{fontSize:13,color:OC.textMid,marginBottom:24}}>The feedback round will begin once other participants join.</div>
            <button onClick={()=>goTo("waiting")} className="btn-ocean" style={{padding:12,borderRadius:12,border:`1px solid ${OC.border}`,background:"transparent",color:OC.textMid,fontSize:13,cursor:"pointer"}}>← Back</button>
          </div>
        </div>
      );
    }
    
    const currentProfile = otherParticipants[currentFeedbackIndex];
    const isLast = currentFeedbackIndex === otherParticipants.length - 1;
    
    // Find strongest dimension for current profile
    const dims = Object.keys(DIMS);
    let strongestDim = dims[0];
    let maxScore = currentProfile.scores[dims[0]];
    dims.forEach(dim => {
      if (currentProfile.scores[dim] > maxScore) {
        maxScore = currentProfile.scores[dim];
        strongestDim = dim;
      }
    });
    
    return (
      <div key={screenKey} className="screen-enter" style={{minHeight:"100vh",background:"linear-gradient(180deg,#010d1f 0%,#020b18 100%)",padding:24,position:"relative"}}>
        <style>{GLOBAL_CSS}</style>
        <UnderwaterBg />
        <div style={{position:"relative",zIndex:1,maxWidth:520,margin:"0 auto"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:28}}>
            <button onClick={()=>goTo("waiting")} className="btn-ocean" style={{background:"none",border:"none",color:OC.textMid,fontSize:12,cursor:"pointer"}}>← Back</button>
            <div style={{fontSize:12,color:OC.textMid}}>Profile <span style={{color:"#fff",fontWeight:700}}>{currentFeedbackIndex+1}</span> / {otherParticipants.length}</div>
          </div>
          
          <div style={{display:"flex",justifyContent:"center",gap:6,marginBottom:28}}>
            {otherParticipants.map((_,i)=>(
              <div key={i} style={{width:i===currentFeedbackIndex?24:8,height:8,borderRadius:4,background:i<currentFeedbackIndex?OC.accent2:i===currentFeedbackIndex?OC.accent:OC.border,transition:"all 0.3s"}} />
            ))}
          </div>
          
          <div style={{textAlign:"center",marginBottom:24}}>
            <div style={{fontSize:10,color:OC.textDim,letterSpacing:4,textTransform:"uppercase",marginBottom:6}}>Anonymous Signal #{String(currentFeedbackIndex+1).padStart(2,"0")}</div>
            <div style={{fontSize:20,fontWeight:700,color:"#fff",marginBottom:6}}>Add Your Observations</div>
            <div style={{fontSize:13,color:OC.textMid,lineHeight:1.7}}>Review this profile and share your insights.</div>
          </div>
          
          <div className="card-float" style={{background:OC.card,border:`1px solid ${DIMS[strongestDim].color+"44"}`,borderRadius:16,padding:"20px 22px",marginBottom:20}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div style={{fontSize:10,color:OC.textDim,letterSpacing:3,textTransform:"uppercase"}}>Profile Overview</div>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <div style={{width:24,height:24,borderRadius:"50%",background:DIMS[strongestDim].color+"33",border:`2px solid ${DIMS[strongestDim].color}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:DIMS[strongestDim].color}}>{strongestDim}</div>
                <span style={{fontSize:12,color:DIMS[strongestDim].color,fontWeight:600}}>{maxScore}%</span>
              </div>
            </div>
            <ScoreBars scores={currentProfile.scores} />
          </div>
          
          <div className="card-float" style={{background:OC.card,border:`1px solid ${OC.border}`,borderRadius:16,padding:"18px 20px",marginBottom:24}}>
            <div style={{fontSize:10,color:OC.textDim,letterSpacing:3,textTransform:"uppercase",marginBottom:10}}>Your Note (optional)</div>
            <textarea
              value={participantNotes[currentProfile.pid]||""}
              onChange={e=>setParticipantNotes(prev=>({...prev,[currentProfile.pid]:e.target.value}))}
              placeholder="Share observations, patterns, or insights..."
              rows={5}
              style={{width:"100%",background:"#030f20",border:`1px solid ${OC.border}`,borderRadius:10,padding:"12px 14px",color:OC.text,fontSize:13,lineHeight:1.6,resize:"vertical",outline:"none",fontFamily:"inherit",boxSizing:"border-box",transition:"border-color 0.3s"}}
              onFocus={e=>e.target.style.borderColor=DIMS[strongestDim].color} 
              onBlur={e=>e.target.style.borderColor=OC.border}
            />
          </div>
          
          <div style={{display:"flex",gap:10}}>
            {currentFeedbackIndex > 0 && (
              <button onClick={()=>setCurrentFeedbackIndex(i=>i-1)} className="btn-ocean" style={{flex:1,padding:14,borderRadius:12,border:`1px solid ${OC.border}`,background:"transparent",color:OC.textMid,fontSize:14,cursor:"pointer"}}>← Back</button>
            )}
            {!isLast ? (
              <button onClick={()=>setCurrentFeedbackIndex(i=>i+1)} className="btn-ocean" style={{flex:2,padding:14,borderRadius:12,border:"none",background:OC.accent,color:"#010d1f",fontSize:14,fontWeight:700,cursor:"pointer",boxShadow:`0 0 20px ${OC.accent}44`}}>Next profile →</button>
            ) : (
              <button onClick={async ()=>{
                const pid = myPid || localStorage.getItem("swarm-pid");
                try {
                  const notesArray = otherParticipants.map(p => ({pid: p.pid, note: participantNotes[p.pid] || ""}));
                  await fbUpdate(`${sp(sessionCode)}/profiles/${pid}`, { participantNotes: notesArray, feedbackComplete: true });
                  goTo("waiting");
                } catch (e) {
                  console.error("Error saving notes:", e);
                  alert("Error saving feedback. Please try again.");
                }
              }} className="btn-ocean" style={{flex:2,padding:14,borderRadius:12,border:"none",background:`linear-gradient(135deg,${OC.accent},${OC.accent2})`,color:"#010d1f",fontSize:14,fontWeight:700,cursor:"pointer"}}>Submit all feedback ✓</button>
            )}
          </div>
        </div>
      </div>
    );
  }
  // RESULT — shown after feedbackDone
  if (screen === "result" && myScores) {
    // Calculate group averages
    const groupAvg = {};
    Object.keys(DIMS).forEach(dim => {
      const sum = participants.reduce((acc, p) => acc + p.scores[dim], 0);
      groupAvg[dim] = Math.round(sum / participants.length);
    });
    
    // Collect all notes from other participants about me
    const pid = myPid || localStorage.getItem("swarm-pid");
    const participantNotesAboutMe = [];
    participants.forEach(p => {
      if (p.pid !== pid && p.participantNotes) {
        const noteAboutMe = p.participantNotes.find(n => n.pid === pid);
        if (noteAboutMe && noteAboutMe.note && noteAboutMe.note.trim()) {
          participantNotesAboutMe.push(noteAboutMe.note);
        }
      }
    });
    
    return (
      <div key={screenKey} className="screen-enter" style={{minHeight:"100vh",background:"linear-gradient(180deg,#010d1f 0%,#020b18 100%)",padding:24,position:"relative",overflowY:"auto"}}>
        <style>{GLOBAL_CSS}</style>
        <UnderwaterBg />
        <div style={{position:"relative",zIndex:1,maxWidth:520,margin:"0 auto",paddingBottom:40}}>
          <div style={{width:90,height:90,margin:"0 auto 18px"}}><MiniSchool size={90} /></div>
          
          {/* Your Results */}
          <div style={{textAlign:"center",marginBottom:24}}>
            <div style={{fontSize:22,fontWeight:700,color:"#fff",marginBottom:4}}>Your Pattern Revealed</div>
            <div style={{fontSize:13,color:OC.textMid}}>Here's your current across the five dimensions</div>
          </div>
          
          <div className="card-float" style={{background:OC.card,border:`1px solid ${OC.border}`,borderRadius:16,padding:"20px 22px",marginBottom:20}}>
            <div style={{fontSize:10,color:OC.textDim,letterSpacing:3,textTransform:"uppercase",marginBottom:14}}>Your Scores</div>
            <ScoreBars scores={myScores} />
          </div>
          
          {myAnnotation !== null && (
            <div className="card-float" style={{marginBottom:20,padding:"16px 18px",background:`${OC.accent}0d`,borderRadius:12,border:`1px solid ${OC.accent}33`}}>
              <div style={{fontSize:10,color:OC.accent+"88",letterSpacing:3,textTransform:"uppercase",marginBottom:8}}>Host Notes</div>
              {myAnnotation ? (
                <div style={{fontSize:13,color:OC.text,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{myAnnotation}</div>
              ) : (
                <div style={{fontSize:13,color:OC.textMid,fontStyle:"italic"}}>No notes were added for this signal.</div>
              )}
            </div>
          )}
          
          {/* Participant Notes */}
          {participantNotesAboutMe.length > 0 && (
            <div className="card-float" style={{marginBottom:20,padding:"16px 18px",background:`${OC.accent2}0d`,borderRadius:12,border:`1px solid ${OC.accent2}33`}}>
              <div style={{fontSize:10,color:OC.accent2+"88",letterSpacing:3,textTransform:"uppercase",marginBottom:12}}>Swarm Feedback ({participantNotesAboutMe.length})</div>
              {participantNotesAboutMe.map((note, i) => (
                <div key={i} style={{fontSize:12,color:OC.text,lineHeight:1.6,marginBottom:i < participantNotesAboutMe.length - 1 ? 12 : 0,paddingBottom:i < participantNotesAboutMe.length - 1 ? 12 : 0,borderBottom:i < participantNotesAboutMe.length - 1 ? `1px solid ${OC.border}` : "none"}}>
                  "{ note}"
                </div>
              ))}
            </div>
          )}
          
          {/* Group Results */}
          <div style={{textAlign:"center",marginTop:40,marginBottom:24}}>
            <div style={{fontSize:20,fontWeight:700,color:"#fff",marginBottom:4}}>Group Results</div>
            <div style={{fontSize:13,color:OC.textMid}}>Average scores across all {participants.length} participants</div>
          </div>
          
          <div className="card-float" style={{background:OC.card,border:`1px solid ${OC.accent2}44`,borderRadius:16,padding:"20px 22px",marginBottom:20}}>
            <div style={{fontSize:10,color:OC.accent2+"88",letterSpacing:3,textTransform:"uppercase",marginBottom:14}}>Swarm Average</div>
            <ScoreBars scores={groupAvg} />
          </div>
          
          {/* Comparison */}
          <div className="card-float" style={{background:OC.card,border:`1px solid ${OC.border}`,borderRadius:16,padding:"18px 20px",marginBottom:20}}>
            <div style={{fontSize:10,color:OC.textDim,letterSpacing:3,textTransform:"uppercase",marginBottom:14}}>You vs. Group</div>
            {Object.keys(DIMS).map(dim => {
              const diff = myScores[dim] - groupAvg[dim];
              const absDiff = Math.abs(diff);
              return (
                <div key={dim} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,padding:"8px 12px",background:absDiff>15?DIMS[dim].color+"0d":"transparent",borderRadius:8}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:8,height:8,borderRadius:"50%",background:DIMS[dim].color}} />
                    <span style={{fontSize:12,fontWeight:600,color:OC.text}}>{DIMS[dim].label}</span>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:11,color:OC.textMid}}>You: {myScores[dim]}%</span>
                    <span style={{fontSize:11,color:OC.textDim}}>·</span>
                    <span style={{fontSize:11,color:OC.textMid}}>Group: {groupAvg[dim]}%</span>
                    {absDiff > 5 && (
                      <span style={{fontSize:11,fontWeight:600,color:diff>0?OC.accent2:OC.accent}}>
                        {diff>0?"+":""}{diff}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          <button onClick={()=>{goTo("home");setAnswers({});setCurrent(0);setMyScores(null);}} className="btn-ocean" style={{width:"100%",marginTop:24,padding:12,borderRadius:8,border:`1px solid ${OC.border}`,background:"transparent",color:OC.textDim,fontSize:13,cursor:"pointer"}}>Back to surface</button>
        </div>
      </div>
    );
  }

  // SIGNAL SENT
  if (screen === "signalSent") return (
    <div key={screenKey} className="screen-enter" style={{minHeight:"100vh",background:"linear-gradient(180deg,#010d1f 0%,#020b18 100%)",display:"flex",alignItems:"center",justifyContent:"center",padding:24,position:"relative"}}>
      <style>{GLOBAL_CSS}</style>
      <UnderwaterBg />
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
      <UnderwaterBg />
      <div style={{position:"relative",zIndex:1,maxWidth:500,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{width:120,height:120,margin:"0 auto 12px"}}><MiniSchool size={120} /></div>
          <div style={{fontSize:10,color:OC.textDim,letterSpacing:4,textTransform:"uppercase",marginBottom:8}}>Your personality in five dimensions</div>
          <div style={{fontSize:24,fontWeight:800,color:"#fff",marginBottom:8}}>Explore Your Dimensions</div>
          <div style={{fontSize:13,color:OC.textMid,lineHeight:1.7,maxWidth:380,margin:"0 auto"}}>
            Five dimensions that shape how you think, work, and connect. Each reveals a different aspect of your personality. Tap to explore.
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
      <UnderwaterBg />
      <div className="content-overlay" style={{position:"relative",zIndex:1,padding:"20px 24px 16px",textAlign:"center",margin:"24px 20px 0",borderRadius:16}}>
        <div style={{fontSize:10,color:OC.textDim,letterSpacing:4,textTransform:"uppercase",marginBottom:6}}>Before the swarm feedback</div>
        <div style={{fontSize:20,fontWeight:700,color:"#fff",marginBottom:4}}>Explore your five dimensions</div>
        <div style={{fontSize:12,color:OC.textMid,marginBottom:12}}>Tap a dimension to learn what it means for you</div>
        <div style={{display:"flex",justifyContent:"center",gap:6,flexWrap:"wrap"}}>
          {Object.keys(DIMS).map(dim=>(
            <div key={dim} onClick={()=>setSelectedFish(selectedFish===dim?null:dim)} className="btn-ocean" style={{padding:"3px 10px",borderRadius:20,fontSize:10,cursor:"pointer",background:selectedFish===dim?DIMS[dim].color+"22":"transparent",border:`1px solid ${selectedFish===dim?DIMS[dim].color+"88":OC.border}`,color:selectedFish===dim?DIMS[dim].color:OC.textMid,transition:"all 0.2s"}}>{DIMS[dim].label}</div>
          ))}
        </div>
      </div>
      <div style={{position:"relative",zIndex:1,flex:selectedFish?"0 0 260px":"1 1 auto",minHeight:selectedFish?260:"calc(100vh - 320px)",transition:"flex 0.4s ease"}}>
        <FishSchool selectedDim={selectedFish} onFishClick={dim=>setSelectedFish(prev=>prev===dim?null:dim)} scores={myScores} />
      </div>
      {selectedFish&&(
        <div style={{position:"relative",zIndex:1,padding:"0 16px 16px",flex:"1 1 auto",overflowY:"auto"}}>
          <RefCard dim={selectedFish} score={myScores?myScores[selectedFish]:undefined} onClose={()=>setSelectedFish(null)} />
        </div>
      )}
      {!selectedFish&&<div className="content-overlay" style={{position:"relative",zIndex:1,textAlign:"center",padding:"8px 24px",margin:"0 20px 8px",borderRadius:12}}><div style={{fontSize:11,color:OC.textDim}}>↑ Tap any dimension to open its reference card</div></div>}
      <div style={{position:"relative",zIndex:1,padding:"12px 20px 28px"}}>
        <button onClick={markReady} className="btn-ocean" style={{width:"100%",padding:14,borderRadius:12,border:"none",background:`linear-gradient(135deg,${OC.accent},${OC.accent2})`,color:"#010d1f",fontSize:14,fontWeight:700,cursor:"pointer"}}>Ready for swarm feedback ✓</button>
      </div>
    </div>
  );

  // WAITING
  if (screen === "waiting") return (
    <div key={screenKey} className="screen-enter" style={{minHeight:"100vh",background:"linear-gradient(180deg,#010d1f 0%,#020b18 100%)",display:"flex",alignItems:"center",justifyContent:"center",padding:24,position:"relative"}}>
      <style>{GLOBAL_CSS}</style>
      <UnderwaterBg />
      <div className="content-overlay" style={{position:"relative",zIndex:1,maxWidth:360,width:"100%",textAlign:"center",padding:32,borderRadius:20}}>
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
        <UnderwaterBg />
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
        <UnderwaterBg />
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
          <button onClick={()=>goTo("swarmView")} className="btn-ocean" style={{width:"100%",padding:14,borderRadius:12,border:"none",background:`linear-gradient(135deg,${OC.accent},${OC.accent2})`,color:"#010d1f",fontSize:14,fontWeight:700,cursor:"pointer",marginBottom:10}}>View swarm visualization →</button>
          <button onClick={()=>{goTo("home");setParticipants([]);setSessionCode("");setAnnotations({});setFeedbackIndex(0);stopSession();}} className="btn-ocean" style={{width:"100%",padding:14,borderRadius:12,border:`1px solid ${OC.border}`,background:"transparent",color:OC.textMid,fontSize:13,cursor:"pointer"}}>Back to surface</button>
        </div>
      </div>
    );
  }

  // SWARM VIEW - Visualization of all participants as fish
  if (screen === "swarmView") {
    return (
      <div key={screenKey} className="screen-enter" style={{minHeight:"100vh",background:"#031F48",display:"flex",flexDirection:"column",position:"relative",overflow:"hidden"}}>
        <style>{GLOBAL_CSS}</style>
        {/* Coral reef background image */}
        <div style={{position:"fixed",top:0,left:0,width:"100%",height:"100%",zIndex:0,backgroundImage:"url('/coral-reef-bg.jpg')",backgroundSize:"cover",backgroundPosition:"center",opacity:0.8}} />
        <div style={{position:"relative",zIndex:1,padding:"24px 24px 0",textAlign:"center"}}>
          <div style={{fontSize:10,color:OC.textDim,letterSpacing:4,textTransform:"uppercase",marginBottom:6}}>Swarm Visualization</div>
          <div style={{fontSize:20,fontWeight:700,color:"#fff",marginBottom:4}}>The Complete Swarm</div>
          <div style={{fontSize:12,color:OC.textMid,marginBottom:16}}>Each fish swims near the coral reef of their strongest dimension. Reef heights show group averages.</div>
        </div>
        <div style={{position:"relative",zIndex:1,flex:"1 1 auto",minHeight:"calc(100vh - 280px)",padding:"0 20px"}}>
          <ParticipantSwarm participants={participants} onFishClick={(idx)=>setSelectedFish(idx)} selectedFish={selectedFish} />
        </div>
        {selectedFish !== null && participants[selectedFish] && (
          <div style={{position:"relative",zIndex:1,padding:"0 16px 16px",maxHeight:"40vh",overflowY:"auto"}}>
            <div className="card-float" style={{background:"linear-gradient(135deg,#041830 0%,#061c35 100%)",border:`1px solid ${OC.accent}44`,borderRadius:18,padding:"18px 20px",boxShadow:`0 0 40px ${OC.accent}18`,position:"relative",overflow:"hidden",animation:"slideUp 0.35s ease-out"}}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${OC.accent},transparent)`}} />
              <div style={{fontSize:10,color:OC.textDim,letterSpacing:3,textTransform:"uppercase",marginBottom:10}}>Signal #{String(selectedFish+1).padStart(2,"0")}</div>
              <ScoreBars scores={participants[selectedFish].scores} compact={true} />
              {annotations[selectedFish]?.trim() && (
                <div style={{marginTop:14,padding:"10px 14px",background:`${OC.accent}0d`,borderRadius:10,border:`1px solid ${OC.accent}22`}}>
                  <div style={{fontSize:9,color:OC.accent+"88",letterSpacing:2,textTransform:"uppercase",marginBottom:5}}>Notes</div>
                  <div style={{fontSize:11,color:OC.text,lineHeight:1.6,whiteSpace:"pre-wrap"}}>{annotations[selectedFish]}</div>
                </div>
              )}
              <button onClick={()=>setSelectedFish(null)} className="btn-ocean" style={{marginTop:12,width:"100%",padding:"8px",borderRadius:8,background:"none",border:`1px solid ${OC.border}`,color:OC.textMid,fontSize:12,cursor:"pointer"}}>Close</button>
            </div>
          </div>
        )}
        <div style={{position:"relative",zIndex:1,padding:"12px 20px 28px"}}>
          <button onClick={()=>goTo("feedbackDone")} className="btn-ocean" style={{width:"100%",padding:12,borderRadius:12,border:`1px solid ${OC.border}`,background:"transparent",color:OC.textDim,fontSize:13,cursor:"pointer"}}>← Back</button>
        </div>
      </div>
    );
  }

  return null;
}
