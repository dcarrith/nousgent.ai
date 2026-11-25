import{B as $,F as z,C as F,a as B,b as Q,V as t,T as rt,S as tt,W as pt,O as ft,c as wt,d as at,N as Mt,e as bt,f as yt,g as ut,A as dt,D as gt}from"./three-vendor-DMI8IjtB.js";const it={working:0,procedural:1,semantic:2,episodic:3,alignment:4},st=["working","procedural","semantic","episodic","alignment"],mt={working:{hex:"#38bdf8",accent:"#7dd3fc",brodmann:"BA 9/10/46",clinicalName:"Dorsolateral Prefrontal Cortex",oscBand:"γ 42.4 Hz",shortLabel:"Working"},procedural:{hex:"#c084fc",accent:"#e9d5ff",brodmann:"BA 4/6/7",clinicalName:"Sensorimotor & Superior Parietal Lobule",oscBand:"β 21.6 Hz",shortLabel:"Procedural"},semantic:{hex:"#22d3ee",accent:"#99f6e4",brodmann:"BA 21/22/38",clinicalName:"Lateral & Anterior Temporal Neocortex",oscBand:"γ 38.9 Hz",shortLabel:"Semantic"},episodic:{hex:"#f472b6",accent:"#fbcfe8",brodmann:"BA 17/18/19",clinicalName:"Occipital-Hippocampal Trace Cortex",oscBand:"θ 6.8 Hz",shortLabel:"Episodic"},alignment:{hex:"#34d399",accent:"#a7f3d0",brodmann:"Cerebellar Crus I/II",clinicalName:"Cerebellar Arbor Vitae & Autonomic Core",oscBand:"α 11.2 Hz",shortLabel:"Alignment"}},xt=["trn","lgn","md","vavl","cm","massa"],ot={trn:0,lgn:1,md:2,vavl:3,cm:4,massa:5},_t={trn:{id:"trn",code:"TRN",glyph:"🛡",clinicalName:"Thalamic Reticular Nucleus (Inhibitory GABAergic Shell)",dthalamusSubsystem:"7-Detector Poisoning Shield, Specialization Ceiling & Child Leases",cliCommand:"dthalamus quarantine",biologicalMetaphor:"Outer GABAergic lattice enveloping the thalamus; drops Plane-14, hidden-DOM, SSRF & prompt-injection payloads in < 0.8 ms, gates DTHALAMUS-LEASE-v0.1 allowedSpecializations (-32043), and attenuates depth <= 3 child sub-harness leases (SUBHARNESS_TIER2_DENIED).",hex:"#34d399",rimHex:"#6ee7b7",alertHex:"#f43f5e",targetLobe:"alignment",mniMm:[14.6,-15.8,11.3],worldAnchor:[-.138,.014,-.02],sisterUrl:"https://dthalamus.to/shield",kpiBadge:"QRN-* / LEASE-SUB*"},lgn:{id:"lgn",code:"LGN",glyph:"🪣",clinicalName:"Lateral Geniculate & Pulvinar Sensory Relay",dthalamusSubsystem:"Observation Spill Store & Zero-VM dthalamus_map_spill",cliCommand:"dthalamus spills",biologicalMetaphor:"First-order sensory filter at the posterior thalamic pole; compresses 16k+ stdout into <= 1,500-token SPL-* spills and partitions spills into <= 2,000-token LID chunks for zero-VM dthalamus_map_spill reduction.",hex:"#f59e0b",rimHex:"#fde68a",alertHex:"#fb923c",targetLobe:"episodic",mniMm:[11.2,-23.2,8.3],worldAnchor:[-.106,-.018,-.105],sisterUrl:"https://dthalamus.to/cache-costs",kpiBadge:"SPL-* / map_spill"},md:{id:"md",code:"MD",glyph:"⚡",clinicalName:"Mediodorsal Prefrontal Executive & Cache Nucleus",dthalamusSubsystem:"6.02x Thalamic Tax, 4-Layer Cache & Prefix-Safe LID Tail Folding",cliCommand:"dthalamus costs",biologicalMetaphor:"Medial thalamic division projecting to prefrontal Working cortex; folds uncached volatile turns strictly past rollingHistoryMarkerIndex into <= 250-token SPL-* checkpoints (prefixMutated: false) alongside Stage-0 32+32 bitmask routing.",hex:"#22d3ee",rimHex:"#a5f3fc",alertHex:"#38bdf8",targetLobe:"working",mniMm:[5.9,-10.3,13],worldAnchor:[-.056,.032,.042],sisterUrl:"https://dthalamus.to/cache-costs",kpiBadge:"6.02x / LID fold"},vavl:{id:"vavl",code:"VA/VL",glyph:"🔒",clinicalName:"Ventral Anterior / Ventral Lateral Motor Nucleus",dthalamusSubsystem:"OS Sandbox, [contract] Gate & GUARD Checklist Lock",cliCommand:"dthalamus run",biologicalMetaphor:"Motor relay to Procedural cortex; confines bash/HTTP/MCP actions inside Seatbelt/bwrap/Docker, locks pre-mutation atomic checklists (CHK-RCPT-*), enforces [contract] write globs, and swaps DTHALAMUS_PHANTOM_* handles.",hex:"#c084fc",rimHex:"#f3e8ff",alertHex:"#e879f9",targetLobe:"procedural",mniMm:[11.9,-11.9,12.4],worldAnchor:[.112,.026,.024],sisterUrl:"https://dthalamus.to/sandbox",kpiBadge:"CHK-RCPT-* / [contract]"},cm:{id:"cm",code:"CM",glyph:"🩺",clinicalName:"Centromedian / Intralaminar Sleep-Spindle Core",dthalamusSubsystem:"Antithetic ES, Cohort DAN-v1.1, Soft-HURT & Clear-Signed Doctor",cliCommand:"dthalamus doctor",biologicalMetaphor:"Intralaminar pacemaker driving 10–14 Hz sleep spindles; runs N = 30 antithetic SHAKE256 ES passes, normalizes DTHALAMUS-DAN-v1.1 cohort/Welford Z-scores, evaluates Soft-HURT [iff] repair, and synthesizes Clear-Signed dthalamus.toml patches.",hex:"#fbbf24",rimHex:"#fef08a",alertHex:"#00e676",targetLobe:"semantic",mniMm:[7.8,-17,10.4],worldAnchor:[.074,.004,-.034],sisterUrl:"https://dthalamus.to/self-repair",kpiBadge:"ES N=30 / DAN-v1.1"},massa:{id:"massa",code:"MASSA",glyph:"⛓",clinicalName:"Massa Intermedia (Interthalamic Chia L1 Commissure)",dthalamusSubsystem:"CHIP-0035 DataLayer Singleton & WOTS+-SHA256 Bridge",cliCommand:"dthalamus verify",biologicalMetaphor:"Midline commissural bridge uniting L-THAL & R-THAL at MNI [0, -14, +8] mm around the Chia L1 Singleton root & 52s TX-block finality anchor.",hex:"#38bdf8",rimHex:"#bae6fd",alertHex:"#6ee7b7",targetLobe:"alignment",mniMm:[0,-14,8],worldAnchor:[0,.012,-.022],sisterUrl:"https://dthalamus.to",kpiBadge:"MNI [0,-14,+8] L1"}},St=["orn","glom","lot","pir","amyg","vno"],J={orn:0,glom:1,lot:2,pir:3,amyg:4,vno:5};function et(e,a=.6){return 1-Math.pow(Math.abs(Math.sin(e)),a)}function U(e,a,l){const c=Math.max(0,Math.min(1,(l-e)/(a-e||1e-6)));return c*c*(3-2*c)}function At(e,a,l,c){if(c)return"semantic";const h=-.04+(.68-a)*.19;return l>h+.14?"working":l<-.42?"episodic":a>.14?"procedural":"semantic"}function Pt(e,a,l,c,h){const i=c===1?0:.42,p=e+.055*Math.sin(l*6.4+a*4.8+i)+.026*Math.cos(a*11.2-l*8.1),w=a+.052*Math.cos(l*5.8-e*5.2-i)+.024*Math.sin(e*10.6+l*9.4),n=l+.058*Math.sin(a*6.2+e*4.9+i*.7)+.025*Math.cos(e*9.8-a*10.4),s=et(w*11.8+Math.sin(n*5.2+i)*1.45,.58),r=et(n*10.6+Math.cos(w*5.8-i)*1.35+p*3.4,.6),d=et(p*9.2+w*8.4-n*6.5+Math.sin(n*8)*.85,.64),f=et(p*21-w*18.5+n*19.2+i,.72);let m=s*.38+r*.34+d*.2+f*.08;const g=l-(-.04+(.72-a)*.21+Math.sin(a*9.5)*.022),y=(1-h*.75)*U(-.02,.22,a),M=Math.exp(-Math.pow(g/.036,2))*y*.72,b=Math.exp(-Math.pow((g-.135)/.033,2))*y*.52,P=Math.exp(-Math.pow((g+.13)/.033,2))*y*.52,T=l-(-.48+(a-.15)*.22),C=Math.exp(-Math.pow(T/.038,2))*U(0,.35,a)*.58,A=(1-h)*(1-U(-.02,.16,a))*U(-.45,-.15,l),u=a-(-.11-.18*(l+.15)),S=a-(-.23-.17*(l+.15)),G=(Math.exp(-Math.pow(u/.028,2))*.62+Math.exp(-Math.pow(S/.028,2))*.5)*A,Y=Math.abs(Math.hypot((a-.12)*1.35,(l-.02)*.85)-.34),R=Math.exp(-Math.pow(Y/.032,2))*h*.62,Z=Math.max(M,b,P,C,G,R);m=Math.max(.02,Math.min(1,m*(1-Z*.82)-Z*.28));const X=Math.max(0,Math.min(1,Math.pow(1-m,1.35)));return{gyralHeight:m,sulcusDepth:X}}function ct(e,a,l){const c=a+1,i=(e+1)*c,p=new Float32Array(i*3),w=new Float32Array(i*2),n=new Float32Array(i),s=new Float32Array(i),r=new Float32Array(i),d=new Float32Array(i);let f=0;for(let M=0;M<=e;M++){const b=M/e,P=.5-.5*Math.cos(b*Math.PI);for(let T=0;T<=a;T++){const C=T%a/a,A=l(P,C);p[f*3]=A.x,p[f*3+1]=A.y,p[f*3+2]=A.z,w[f*2]=P,w[f*2+1]=T/a,n[f]=A.sulcusDepth,s[f]=A.gyralHeight,r[f]=A.lobeIndex,d[f]=A.phase,f++}}const m=[];for(let M=0;M<e;M++)for(let b=0;b<a;b++){const P=M*c+b,T=(M+1)*c+b,C=(M+1)*c+(b+1),A=M*c+(b+1);m.push(P,T,A),m.push(T,C,A)}const g=new $;g.setAttribute("position",new B(p,3)),g.setAttribute("uv",new B(w,2)),g.setAttribute("aSulcusDepth",new B(n,1)),g.setAttribute("aGyralHeight",new B(s,1)),g.setAttribute("aLobeIndex",new B(r,1)),g.setAttribute("aCorticalPhase",new B(d,1)),g.setIndex(m),g.computeVertexNormals();const y=g.getAttribute("normal");for(let M=0;M<=e;M++){const b=M*c,P=M*c+a,T=y.getX(b)+y.getX(P),C=y.getY(b)+y.getY(P),A=y.getZ(b)+y.getZ(P),u=Math.hypot(T,C,A)||1;y.setXYZ(b,T/u,C/u,A/u),y.setXYZ(P,T/u,C/u,A/u)}return y.needsUpdate=!0,g}function V(e){let a=0,l=0;const c=Object.keys(e[0].attributes);for(const n of e)a+=n.getAttribute("position").count,l+=n.index?n.index.count:n.getAttribute("position").count;const h=new $;for(const n of c){const s=e[0].getAttribute(n).itemSize,r=new Float32Array(a*s);let d=0;for(const f of e){const m=f.getAttribute(n);r.set(m.array,d),d+=m.count*s}h.setAttribute(n,new B(r,s))}const i=a>65535?new Uint32Array(l):new Uint16Array(l);let p=0,w=0;for(const n of e){const s=n.getAttribute("position").count;if(n.index){const r=n.index.array;for(let d=0;d<r.length;d++)i[p++]=r[d]+w}else for(let r=0;r<s;r++)i[p++]=r+w;w+=s,n.dispose()}return h.setIndex(new B(i,1)),h}function ht(e){return ct(96,72,(c,h)=>{const i=h*Math.PI*2,p=Math.sin(c*Math.PI),w=Math.pow(Math.max(0,p),.56),n=-.98+c*1.98,s=-.06+.8*Math.pow(Math.max(0,p),.54)*(1+.08*Math.sin((c-.18)*Math.PI)),r=U(.24,.4,c)*(1-U(.64,.77,c)),d=-.13+.09*U(.04,.28,c),f=-.14+.08*U(.76,.98,c),m=c<.5?d:f,g=Math.sin(i),y=Math.cos(i),M=Math.max(0,g),b=Math.max(0,-g),P=.58*w*(1+.1*Math.exp(-Math.pow((c-.42)/.22,2))-.08*U(.68,.98,c)),T=-.25*r*Math.pow(M,.65),C=Math.PI*(.58-(c-.35)*.26),A=Math.atan2(Math.sin(i-C),Math.cos(i-C)),u=r*M*Math.exp(-Math.pow(A/.14,2)),S=.022+.018*(1-w);let G;if(g>=0){const lt=Math.pow(g,.78);G=S+P*lt*(1-.26*u);const vt=r*U(0,.35,i-C)*M;G+=.055*vt}else{const lt=U(.28,.4,c)*(1-U(.64,.76,c))*U(-.35,.25,-Math.abs(y-.05));G=S+.014*(1-Math.pow(b,.5))+.045*lt*b}const Y=.5*(s+m+T),R=Math.max(.018,.5*(s-(m+T))),Z=Math.sign(y)*Math.pow(Math.abs(y),.84),X=Y+R*Z-.028*u;let x=n;const o=r>.25&&g>.15&&i>C&&i<Math.PI*.96;o&&(x+=.045*r*Math.sin((i-C)/(Math.PI-C)*Math.PI));const v=Pt(e*G,X,x,e,b),k=Math.min(1,Math.max(v.sulcusDepth,u*.95)),I=Math.max(0,v.gyralHeight*(1-u*.78)),N=(.034*w+.006)*(1-b*.55),_=(I-.42)*N,O=g>=0?g:-.15*b,D=y,L=(c-.5)*.35,H=Math.hypot(O,D,L)||1,E=e*Math.max(.016,G+_*(O/H)),W=X+_*(D/H),q=x+_*(L/H)*.55,K=At(E,W,q,o),nt=(Math.sin(E*37.3+W*51.7+q*29.1)*43758.5453%1+1)%1;return{x:E,y:W,z:q,sulcusDepth:k,gyralHeight:I,lobeIndex:it[K],phase:nt*Math.PI*2}})}function Ct(){const e=[];for(const a of[-1,1])e.push(ct(48,44,(l,c)=>{const h=c*Math.PI*2,i=Math.sin(l*Math.PI),p=Math.pow(Math.max(0,i),.62),w=-.85+l*.57,n=Math.sin(h),s=Math.cos(h),r=.4*p*(1+.14*Math.sin(l*Math.PI)),d=.185*p,f=n>=0?.012+r*Math.pow(n,.8):.012+.03*(1-Math.pow(-n,.6)),m=-.32+.045*Math.sin(l*Math.PI)-.03*Math.max(0,n),g=m+d*Math.sign(s)*Math.pow(Math.abs(s),.85),y=et(g*54+w*8.5+Math.sin(f*9)*.65,.54),M=Math.exp(-Math.pow((g-m)/.022,2))*Math.max(0,n)*.65,b=Math.max(.04,y*(1-M*.7)),P=1-b,T=(b-.45)*.016*p;return{x:a*(f+T*Math.max(0,n)),y:g+T*s*.6,z:w+T*(l-.5)*.4,sulcusDepth:P,gyralHeight:b,lobeIndex:it.alignment,phase:(l*7.3+c*5.1)%1*Math.PI*2}}));return V(e)}function It(){return ct(44,36,(e,a)=>{const l=a*Math.PI*2,c=U(0,.06,e)*(1-U(.93,1,e)),h=-.84+e*.79,i=Math.exp(-Math.pow((e-.66)/.16,2)),p=Math.exp(-Math.pow((e-.36)/.11,2)),w=-.25+e*.21+i*.045,n=(.078+.048*e+.058*i+.014*p)*c,s=(.072+.036*e+.068*i+.012*p)*c,r=Math.sin(l),d=Math.cos(l),f=Math.exp(-Math.pow(r/.16,2))*Math.max(0,d)*.14,m=i*et(h*58+Math.cos(r*3)*.8,.65),g=(1-i)*et(l*6,.65),y=.35+.45*(m+g*.7)*(1-f*2.5),M=n*(1-f*.35)+(y-.5)*.006,b=s*(1+(d>0?i*.22:-i*.12)-f);return{x:r*M,y:h,z:w+d*b,sulcusDepth:Math.max(0,Math.min(1,1-y)),gyralHeight:Math.max(0,Math.min(1,y)),lobeIndex:it.alignment,phase:a*Math.PI*2}})}function Tt(){return ct(40,24,(e,a)=>{const l=a*Math.PI*2,c=Math.pow(Math.sin(e*Math.PI),.42),h=(1-e)*Math.PI*1.08-.04,i=Math.cos(h)*.365+.015,p=.03+Math.sin(h)*.175,w=1+.45*Math.pow(Math.cos(e*Math.PI),4),n=.165*c*(1+.22*Math.sin(e*Math.PI)),s=.032*c*w,r=Math.sin(l)*n,d=Math.cos(l)*s;return{x:r,y:p+d*Math.sin(h),z:i+d*Math.cos(h),sulcusDepth:.2,gyralHeight:.8,lobeIndex:it.working,phase:e*Math.PI*2}})}function Lt(){const e=[];for(const a of[-1,1]){const l=[new t(a*.065,.08,.29),new t(a*.085,.135,.08),new t(a*.135,.09,-.18),new t(a*.175,-.04,-.26),new t(a*.225,-.145,-.02),new t(a*.205,-.165,.13)],c=new Q(l),h=new rt(c,44,.028,12,!1),i=h.getAttribute("position").count,p=h.getAttribute("position");for(let w=0;w<i;w++){const n=Math.floor(w/13)/44,s=Math.sin(Math.max(.06,Math.min(.94,n))*Math.PI),r=c.getPoint(Math.min(1,n)),d=p.getX(w)-r.x,f=p.getY(w)-r.y,m=p.getZ(w)-r.z,g=1+.55*Math.exp(-Math.pow((n-.45)/.14,2)),y=(.35+.65*s)*g;p.setXYZ(w,r.x+d*y,r.y+f*y,r.z+m*y)}h.computeVertexNormals(),h.setAttribute("aSulcusDepth",new B(new Float32Array(i).fill(.15),1)),h.setAttribute("aGyralHeight",new B(new Float32Array(i).fill(.85),1)),h.setAttribute("aLobeIndex",new B(new Float32Array(i).fill(2),1)),h.setAttribute("aCorticalPhase",new B(new Float32Array(i).fill(0),1)),e.push(h)}return V(e)}function j(e,a,l){const c=e.getAttribute("position").count;return e.setAttribute("aSulcusDepth",new B(new Float32Array(c).fill(.1),1)),e.setAttribute("aGyralHeight",new B(new Float32Array(c).fill(.9),1)),e.setAttribute("aLobeIndex",new B(new Float32Array(c).fill(a),1)),e.setAttribute("aCorticalPhase",new B(new Float32Array(c).fill(l),1)),e}function Gt(){const e=[];for(const a of[-1,1]){const l=new tt(1,24,18);l.scale(.072,.064,.118),l.rotateY(a*-.14),l.translate(a*.088,.012,-.025),e.push(j(l,4,1.2))}return V(e)}function Nt(){const e=[];for(const x of[-1,1]){const o=new tt(1,24,18,x>0?-Math.PI*.42:Math.PI*.58,Math.PI*.84,Math.PI*.14,Math.PI*.72);o.scale(.088,.078,.138),o.rotateY(x*-.14),o.translate(x*.092,.012,-.025),o.computeVertexNormals(),e.push(j(o,4,.4))}const a=V(e),l=new pt(a),c=[];for(const x of[-1,1]){const o=new tt(1,20,16);o.scale(.036,.032,.048),o.rotateY(x*-.18),o.translate(x*.106,-.018,-.105),c.push(j(o,3,1.1))}const h=V(c),i=[];for(const x of[-1,1]){const o=new tt(1,20,16);o.scale(.033,.038,.056),o.rotateY(x*-.08),o.translate(x*.056,.032,.042),i.push(j(o,0,1.9))}const p=V(i),w=[];for(const x of[-1,1]){const o=new tt(1,20,16);o.scale(.034,.038,.054),o.rotateY(x*-.16),o.translate(x*.112,.026,.024),w.push(j(o,1,2.7))}const n=V(w),s=[];for(const x of[-1,1]){const o=new ft(.028,2);o.scale(.95,.88,1.25),o.translate(x*.078,.004,-.034),s.push(j(o,2,3.5))}const r=V(s),d=new Q([new t(-.058,.01,-.022),new t(-.024,.017,-.018),new t(0,.019,-.016),new t(.024,.017,-.018),new t(.058,.01,-.022)]),f=new rt(d,20,.015,12,!1),m=j(f,4,4.2),g=[],y=[],M=[],b=[],P=[];let T=9021042;const C=()=>(T=T*1664525+1013904223>>>0,T/4294967296),A=(x,o,v,k)=>{const I=new Q(x),N=28,_=I.getPoints(N),O=new F(o),D=new F(v),L=new F,H=C();for(let E=0;E<N;E++){const W=E/N,q=(E+1)/N,K=_[E],nt=_[E+1];g.push(K.x,K.y,K.z,nt.x,nt.y,nt.z),L.copy(O).lerp(D,W),y.push(L.r,L.g,L.b),L.copy(O).lerp(D,q),y.push(L.r,L.g,L.b),M.push(W,q),b.push(H,H),P.push(k,k)}};for(const x of[-1,1]){for(let o=0;o<5;o++){const v=(o/4-.5)*.14;A([new t(x*.056,.032,.042),new t(x*(.11+v*.25),.12+v*.3,.24),new t(x*(.2+v*.45),.24+v*.5,.52+v*.2)],"#22d3ee","#38bdf8",ot.md)}for(let o=0;o<5;o++){const v=(o/4-.5)*.16;A([new t(x*.112,.026,.024),new t(x*(.19+v*.3),.24,.02+v*.5),new t(x*(.28+v*.4),.46+v*.2,-.04+v*.7)],"#c084fc","#e9d5ff",ot.vavl)}for(let o=0;o<5;o++){const v=(o/4-.5)*.16,k=o%2===1;A(k?[new t(x*.106,-.018,-.105),new t(x*.24,-.09+v*.25,-.06+v*.3),new t(x*.38,-.15+v*.35,.08+v*.4)]:[new t(x*.106,-.018,-.105),new t(x*(.17+v*.3),.02+v*.3,-.32),new t(x*(.22+v*.45),.09+v*.4,-.58)],"#f59e0b",k?"#22d3ee":"#f472b6",ot.lgn)}for(let o=0;o<3;o++){const v=(o/2-.5)*.14;A([new t(x*.078,.004,-.034),new t(x*.14,-.14,-.22+v*.3),new t(x*(.2+v*.4),-.28,-.44+v*.3)],"#fbbf24","#34d399",ot.cm)}for(let o=0;o<3;o++){const v=(o/2-.5)*.14;A([new t(x*.145,-.02+v*.3,-.11+v*.8),new t(x*.165,.04+v*.25,0+v*.7),new t(x*.125,.06,.09+v*.4)],"#34d399","#6ee7b7",ot.trn)}}for(let x=0;x<3;x++){const o=(x-1)*.025;A([new t(-.088,.012,-.022+o),new t(0,.022,-.016+o*.5),new t(.088,.012,-.022+o)],"#38bdf8","#6ee7b7",ot.massa)}const u=new $;u.setAttribute("position",new z(g,3)),u.setAttribute("color",new z(y,3)),u.setAttribute("aTractProgress",new z(M,1)),u.setAttribute("aTractSeed",new z(b,1)),u.setAttribute("aNucleusIndex",new z(P,1));const S=[],G=[],Y=[],R=[],Z=[];for(const x of[-1,1]){const o=[{start:[x*.34,-.52,.22],colA:"#38bdf8",colB:"#34d399",nuc:0},{start:[x*.38,-.56,-.04],colA:"#f59e0b",colB:"#34d399",nuc:1},{start:[x*.32,-.58,-.28],colA:"#f43f5e",colB:"#fb7185",nuc:0}];for(const v of o){const k=new Q([new t(v.start[0],v.start[1],v.start[2]),new t(v.start[0]*.68,-.24,v.start[2]*.55),new t(x*.152,.008,v.start[2]*.25-.02)]),I=22,N=k.getPoints(I),_=new F(v.colA),O=new F(v.colB),D=new F,L=C();for(let H=0;H<I;H++){const E=H/I,W=(H+1)/I;S.push(N[H].x,N[H].y,N[H].z,N[H+1].x,N[H+1].y,N[H+1].z),D.copy(_).lerp(O,E),G.push(D.r,D.g,D.b),D.copy(_).lerp(O,W),G.push(D.r,D.g,D.b),Y.push(E,W),R.push(L,L),Z.push(v.nuc,v.nuc)}}}const X=new $;return X.setAttribute("position",new z(S,3)),X.setAttribute("color",new z(G,3)),X.setAttribute("aTractProgress",new z(Y,1)),X.setAttribute("aTractSeed",new z(R,1)),X.setAttribute("aNucleusIndex",new z(Z,1)),{nucleiGeometries:{trn:a,lgn:h,md:p,vavl:n,cm:r,massa:m},trnLatticeGeometry:l,thalamocorticalRadiationGeometry:u,peripheralAfferentGeometry:X}}function Dt(){const e=[];for(const u of[-1,1]){const S=new wt(.036,.042,.012,16,2);S.scale(.85,1,1.45),S.translate(u*.056,-.328,.625),S.computeVertexNormals(),e.push(j(S,0,.3))}const a=V(e),l=new pt(a),c=[];for(const u of[-1,1]){const S=new tt(1,20,16);S.scale(.032,.024,.058),S.rotateY(u*.06),S.translate(u*.068,-.277,.591),c.push(j(S,0,1))}const h=V(c),i=[];for(const u of[-1,1]){const S=new Q([new t(u*.072,-.274,.545),new t(u*.135,-.245,.415),new t(u*.205,-.218,.265)]),G=new rt(S,22,.011,10,!1);i.push(j(G,2,1.8))}const p=V(i),w=[];for(const u of[-1,1]){const S=new Q([new t(u*.205,-.214,.255),new t(u*.236,-.202,.195),new t(u*.248,-.196,.132)]),G=new rt(S,18,.022,12,!1);w.push(j(G,2,2.5))}const n=V(w),s=[];for(const u of[-1,1]){const S=new tt(1,18,14);S.scale(.032,.028,.038),S.rotateY(u*-.22),S.translate(u*.204,-.222,.068),s.push(j(S,4,3.3))}const r=V(s),d=[];for(const u of[-1,1]){const S=new ft(.019,1);S.scale(.9,.85,1.3),S.translate(u*.042,-.295,.545),d.push(j(S,1,4))}const f=V(d),m=[],g=[],y=[],M=[],b=[];let P=3141592;const T=()=>(P=P*1664525+1013904223>>>0,P/4294967296),C=(u,S,G,Y)=>{const R=new Q(u),Z=24,X=R.getPoints(Z),x=new F(S),o=new F(G),v=new F,k=T();for(let I=0;I<Z;I++){const N=I/Z,_=(I+1)/Z,O=X[I],D=X[I+1];m.push(O.x,O.y,O.z,D.x,D.y,D.z),v.copy(x).lerp(o,N),g.push(v.r,v.g,v.b),v.copy(x).lerp(o,_),g.push(v.r,v.g,v.b),y.push(N,_),M.push(k,k),b.push(Y,Y)}};for(const u of[-1,1]){for(let S=0;S<3;S++){const G=(S-1)*.016;C([new t(u*(.056+G),-.44,.68),new t(u*(.056+G),-.328,.625),new t(u*(.068+G*.5),-.277,.591)],"#10b981","#2dd4bf",J.orn)}for(let S=0;S<4;S++){const G=(S/3-.5)*.03;C([new t(u*.068,-.277+G*.3,.591),new t(u*(.138+G),-.245+G*.3,.415),new t(u*(.232+G),-.205,.195)],S%2===0?"#2dd4bf":"#38bdf8","#a855f7",S<2?J.glom:J.lot)}C([new t(u*.232,-.205,.195),new t(u*.31,-.14,.15),new t(u*.36,-.06,.1)],"#a855f7","#22d3ee",J.pir),C([new t(u*.232,-.205,.195),new t(u*.142,-.092,.118),new t(u*.056,.032,.042)],"#a855f7","#22d3ee",J.pir),C([new t(u*.205,-.218,.255),new t(u*.214,-.22,.155),new t(u*.204,-.222,.068)],"#38bdf8","#f43f5e",J.amyg),C([new t(u*.204,-.222,.068),new t(u*.125,-.252,.34),new t(u*.068,-.277,.591)],"#f43f5e","#2dd4bf",J.amyg),C([new t(u*.042,-.4,.6),new t(u*.042,-.295,.545),new t(u*.122,-.262,.31),new t(u*.196,-.225,.078)],"#f59e0b","#f43f5e",J.vno)}const A=new $;return A.setAttribute("position",new z(m,3)),A.setAttribute("color",new z(g,3)),A.setAttribute("aTractProgress",new z(y,1)),A.setAttribute("aTractSeed",new z(M,1)),A.setAttribute("aNucleusIndex",new z(b,1)),{subregionGeometries:{orn:a,glom:h,lot:p,pir:n,amyg:r,vno:f},cribriformLatticeGeometry:l,olfactoryTractGeometry:A}}function Ht(){const e=[];for(const a of[-1,1]){const l=[new t(a*.18,-.175,.16),new t(a*.225,-.185,.04),new t(a*.21,-.13,-.12),new t(a*.145,-.01,-.2),new t(a*.065,.085,-.1),new t(a*.028,.075,.05),new t(a*.024,-.035,.09)],c=new Q(l),h=new rt(c,44,.021,12,!1),i=h.getAttribute("position").count,p=h.getAttribute("position");for(let w=0;w<i;w++){const n=Math.floor(w/13)/44,s=c.getPoint(Math.min(1,n)),r=1.35*(1-.62*n)*Math.sin(Math.max(.08,Math.min(.95,n))*Math.PI);p.setXYZ(w,s.x+(p.getX(w)-s.x)*r,s.y+(p.getY(w)-s.y)*r,s.z+(p.getZ(w)-s.z)*r)}h.computeVertexNormals(),h.setAttribute("aSulcusDepth",new B(new Float32Array(i).fill(.12),1)),h.setAttribute("aGyralHeight",new B(new Float32Array(i).fill(.88),1)),h.setAttribute("aLobeIndex",new B(new Float32Array(i).fill(3),1)),h.setAttribute("aCorticalPhase",new B(new Float32Array(i).fill(2.4),1)),e.push(h)}return V(e)}function zt(){const e=[],a=[],l=[],c=[];let h=133742;const i=()=>(h=h*1664525+1013904223>>>0,h/4294967296),p=(n,s,r)=>{const d=new Q(n),f=32,m=d.getPoints(f),g=new F(s),y=new F(r),M=new F,b=i();for(let P=0;P<f;P++){const T=P/f,C=(P+1)/f,A=m[P],u=m[P+1];e.push(A.x,A.y,A.z,u.x,u.y,u.z),M.copy(g).lerp(y,T),a.push(M.r,M.g,M.b),M.copy(g).lerp(y,C),a.push(M.r,M.g,M.b),l.push(T,C),c.push(b,b)}};for(let n=0;n<22;n++){const s=n/21,r=-.34+s*.72,d=.08+.13*Math.sin(s*Math.PI),f=-.62+s*1.32+(i()-.5)*.12,m=.24+.28*Math.sin(s*Math.PI)+(i()-.5)*.14,g=.34+.14*Math.sin(s*Math.PI);p([new t(-g,m,f),new t(-.14,d+.03,(r+f)*.5),new t(0,d,r),new t(.14,d+.03,(r+f)*.5),new t(g,m,f)],"#38bdf8","#c084fc")}for(const n of[-1,1]){for(let s=0;s<14;s++){const r=(s/13-.5)*.14;p([new t(n*(.3+r*.4),.18+r,.54+r*.5),new t(n*(.34+r*.5),.36+r*.6,.12),new t(n*(.38+r*.4),.18+r*.4,-.26),new t(n*(.4+r*.3),-.1+r*.4,.04),new t(n*(.34+r*.3),-.18+r*.3,.24)],"#22d3ee","#e879f9")}for(let s=0;s<12;s++){const r=s/11,d=-.58+r*1.24,f=.28+.34*Math.sin(r*Math.PI),m=n*(.2+.22*Math.sin(r*Math.PI)+(i()-.5)*.08);p([new t(n*.035,-.62-i()*.16,-.2),new t(n*.06,-.26,-.06),new t(n*.085,.02,-.02),new t(m*.62,f*.58,d*.62),new t(m,f,d)],"#34d399","#38bdf8")}for(let s=0;s<6;s++){const r=(s/5-.5)*.18;p([new t(n*(.24+r*.5),-.34+r*.3,-.58+r*.4),new t(n*.11,-.2,-.24),new t(0,-.04,-.06),new t(-n*.08,.03,.02)],"#34d399","#f472b6")}}const w=new $;return w.setAttribute("position",new z(e,3)),w.setAttribute("color",new z(a,3)),w.setAttribute("aTractProgress",new z(l,1)),w.setAttribute("aTractSeed",new z(c,1)),w}function kt(){const e=[],a=[],l=(d,f,m,g,y,M,b,P=1)=>{e.push(d,f,m,g,y,M),a.push(b.r*P,b.g*P,b.b*P,b.r*P,b.g*P,b.b*P)},c=new F("#0ea5e9"),h=new F("#334155"),i=new F("#38bdf8"),p=1.38,w=-.06,n=144;for(let d=0;d<n;d++){const f=d/n*Math.PI*2,m=(d+1)/n*Math.PI*2;if(l(Math.cos(f)*p,w,Math.sin(f)*p,Math.cos(m)*p,w,Math.sin(m)*p,d%12===0?c:h,d%12===0?.85:.42),d%4===0){const g=d%12===0,y=g?.048:.022;l(Math.cos(f)*p,w,Math.sin(f)*p,Math.cos(f)*(p+y),w,Math.sin(f)*(p+y),g?i:h,g?.9:.45)}}const s=1.26;for(let d=-36;d<36;d++){const f=d/72*Math.PI,m=(d+1)/72*Math.PI;l(Math.sin(f)*s,Math.cos(f)*s*.86-.04,0,Math.sin(m)*s,Math.cos(m)*s*.86-.04,0,h,.28)}for(let d=-40;d<40;d++){const f=d/80*Math.PI*1.05,m=(d+1)/80*Math.PI*1.05;l(0,Math.cos(f)*s*.86-.04,Math.sin(f)*s,0,Math.cos(m)*s*.86-.04,Math.sin(m)*s,h,.24)}const r=new $;return r.setAttribute("position",new z(e,3)),r.setAttribute("color",new z(a,3)),r}function Ft(e,a){const c={working:[],procedural:[],semantic:[],episodic:[],alignment:[]};let h=20261116;const i=()=>(h=h*1664525+1013904223>>>0,h/4294967296),p=e.getAttribute("position"),w=e.getAttribute("aLobeIndex"),n=Math.max(1,Math.floor(p.count/2400));for(let m=0;m<p.count;m+=n){const g=Math.round(w.getX(m))%5,y=st[g]||"semantic";if(y==="alignment")continue;const M=.72+i()*.21,b=(i()-.5)*.022,P=(i()-.5)*.022,T=(i()-.5)*.022;c[y].push([p.getX(m)*M+b,p.getY(m)*M+P,p.getZ(m)*M+T])}const s=a.getAttribute("position"),r=Math.max(1,Math.floor(s.count/600));for(let m=0;m<s.count;m+=r){const g=.76+i()*.19;c.alignment.push([s.getX(m)*g+(i()-.5)*.018,s.getY(m)*g+(i()-.5)*.016,s.getZ(m)*g+(i()-.5)*.018])}const d=[];let f=0;for(const m of st){const g=c[m],y=[];for(let M=0;M<192&&g.length>0;M++){const b=Math.floor(M*.61803398875%1*g.length);y.push(g[b])}for(let M=0;M<y.length;M++)d.push({index:f++,lobe:m,lobeRank:M,position:y[M],phase:f*1.6180339887%(Math.PI*2),birthMonthHint:Math.round(M/192*48)})}return d}function Ot(){const e=ht(-1),a=ht(1),l=V([e,a]),c=Ct(),h=It(),i=Tt(),p=Lt(),w=Gt(),n=Nt(),s=Dt(),r=Ht(),d=zt(),f=kt(),m=[],g=[],y=(o,v,k)=>{const I=o.getAttribute("position"),N=o.getAttribute("aSulcusDepth"),_=o.getAttribute("aLobeIndex"),O=o.getIndex();if(!O)return;const D=O.array,L=new F;for(let H=0;H<D.length;H+=3*k){const E=D[H],W=D[H+1],q=D[H+2];if(N.getX(E)>v&&N.getX(W)>v){const K=st[Math.round(_.getX(E))%5]||"semantic";L.set(mt[K].hex).multiplyScalar(.58),m.push(I.getX(E)*1.002,I.getY(E)*1.002,I.getZ(E)*1.002,I.getX(W)*1.002,I.getY(W)*1.002,I.getZ(W)*1.002),g.push(L.r,L.g,L.b,L.r,L.g,L.b)}else if(N.getX(W)>v&&N.getX(q)>v){const K=st[Math.round(_.getX(W))%5]||"semantic";L.set(mt[K].hex).multiplyScalar(.58),m.push(I.getX(W)*1.002,I.getY(W)*1.002,I.getZ(W)*1.002,I.getX(q)*1.002,I.getY(q)*1.002,I.getZ(q)*1.002),g.push(L.r,L.g,L.b,L.r,L.g,L.b)}}};y(l,.58,2),y(c,.62,2);const M=new $;M.setAttribute("position",new z(m,3)),M.setAttribute("color",new z(g,3));const b=l.getAttribute("position"),P=l.getAttribute("aGyralHeight"),T=l.getAttribute("aLobeIndex"),C=850,A=new Float32Array(C*3),u=new Float32Array(C*3),S=new Float32Array(C),G=Math.max(1,Math.floor(b.count/C)),Y=new F;let R=0;for(let o=0;o<b.count&&R<C;o+=G){const k=P.getX(o)<.42&&o+3<b.count?o+3:o,I=b.getX(k)*.992,N=b.getY(k)*.992,_=b.getZ(k)*.992,O=Math.round(T.getX(k))%5,D=st[O]||"semantic";Y.set(mt[D].hex),A[R*3]=I,A[R*3+1]=N,A[R*3+2]=_,u[R*3]=Y.r,u[R*3+1]=Y.g,u[R*3+2]=Y.b,S[R]=R*1.6180339887%(Math.PI*2),R++}const X=[{azDeg:28,elDeg:18,radius:1.54,lobe:"working",soma:[-.18,.22,.44]},{azDeg:-32,elDeg:22,radius:1.54,lobe:"working",soma:[.18,.22,.44]},{azDeg:78,elDeg:28,radius:1.56,lobe:"procedural",soma:[.18,.34,-.02]},{azDeg:-82,elDeg:8,radius:1.55,lobe:"semantic",soma:[-.24,-.08,.1]},{azDeg:112,elDeg:-4,radius:1.55,lobe:"semantic",soma:[.24,-.08,.1]},{azDeg:156,elDeg:14,radius:1.56,lobe:"episodic",soma:[.16,.08,-.46]},{azDeg:-148,elDeg:12,radius:1.56,lobe:"episodic",soma:[-.16,.08,-.46]},{azDeg:180,elDeg:-20,radius:1.52,lobe:"alignment",soma:[0,-.26,-.3]}].map((o,v)=>{const k=o.azDeg*Math.PI/180,I=o.elDeg*Math.PI/180,N=Math.cos(I);return{index:v,position:[Number((Math.sin(k)*N*o.radius).toFixed(4)),Number((Math.sin(I)*o.radius).toFixed(4)),Number((Math.cos(k)*N*o.radius).toFixed(4))],somaTarget:o.soma,lobe:o.lobe,ringElevationDeg:o.elDeg,azimuthDeg:o.azDeg}}),x=Ft(l,c);return{cerebrumGeometry:l,cerebellumGeometry:c,brainstemGeometry:h,corpusCallosumGeometry:i,ventriclesGeometry:p,thalamusGeometry:w,dthalamusNucleiGeometries:n.nucleiGeometries,trnLatticeGeometry:n.trnLatticeGeometry,thalamocorticalRadiationGeometry:n.thalamocorticalRadiationGeometry,peripheralAfferentGeometry:n.peripheralAfferentGeometry,dolfactorySubregionGeometries:s.subregionGeometries,cribriformLatticeGeometry:s.cribriformLatticeGeometry,olfactoryTractGeometry:s.olfactoryTractGeometry,hippocampusGeometry:r,dtiTractGeometry:d,sulcalContourGeometry:M,microSynapsePositions:A,microSynapseColors:u,microSynapsePhases:S,stereotacticFrameGeometry:f,orbitalStations:X,capsuleLoci:x,dispose:()=>{l.dispose(),c.dispose(),h.dispose(),i.dispose(),p.dispose(),w.dispose();for(const o of xt)n.nucleiGeometries[o].dispose();n.trnLatticeGeometry.dispose(),n.thalamocorticalRadiationGeometry.dispose(),n.peripheralAfferentGeometry.dispose();for(const o of St)s.subregionGeometries[o].dispose();s.cribriformLatticeGeometry.dispose(),s.olfactoryTractGeometry.dispose(),r.dispose(),d.dispose(),M.dispose(),f.dispose()}}}const Bt=8,Rt=`
  attribute float aSulcusDepth;
  attribute float aGyralHeight;
  attribute float aLobeIndex;
  attribute float aCorticalPhase;

  uniform float uTime;
  uniform float uMotionScale;

  varying vec3 vWorldPos;
  varying vec3 vLocalPos;
  varying vec3 vWorldNormal;
  varying float vSulcusDepth;
  varying float vGyralHeight;
  varying float vLobeIndex;
  varying float vCorticalPhase;

  void main() {
    // Subtle physiological 4D CSF / vascular micro-pulsation (< 0.45mm equivalent)
    float csfPulse = sin(uTime * 1.45 + position.y * 3.2 + aCorticalPhase * 0.25) * 0.0022 * uMotionScale;
    vec3 displaced = position + normal * csfPulse * (0.4 + 0.6 * aGyralHeight);

    vLocalPos = displaced;
    vec4 worldPosition = modelMatrix * vec4(displaced, 1.0);
    vWorldPos = worldPosition.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);

    vSulcusDepth = aSulcusDepth;
    vGyralHeight = aGyralHeight;
    vLobeIndex = aLobeIndex;
    vCorticalPhase = aCorticalPhase;

    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`,Et=`
  uniform float uTime;
  uniform float uShellOpacity;
  uniform float uBackPassScale;
  uniform int uSelectedLobe;
  uniform float uMotionScale;

  uniform vec3 uExciteCenters[8];
  uniform vec3 uExciteColors[8];
  uniform vec4 uExciteParams[8]; // x = strength, y = elapsedSec, z = radius, w = freqHz

  uniform vec4 uMorphicWave;     // x = strength, y = radiusFront, z = isSiren, w = reserved
  uniform vec3 uMorphicColor;
  uniform vec4 uSliceConfig;     // x = enabled, y = axis (0=Y, 1=X, 2=Z), z = offset, w = pruneSideFade

  varying vec3 vWorldPos;
  varying vec3 vLocalPos;
  varying vec3 vWorldNormal;
  varying float vSulcusDepth;
  varying float vGyralHeight;
  varying float vLobeIndex;
  varying float vCorticalPhase;

  vec3 getLobeTint(int idx) {
    if (idx == 0) return vec3(0.06, 0.68, 0.98); // Working: Prefrontal Cyan-Sapphire
    if (idx == 1) return vec3(0.62, 0.34, 0.98); // Procedural: Parietal Violet-Amethyst
    if (idx == 2) return vec3(0.08, 0.80, 0.88); // Semantic: Temporal Teal-Cyan
    if (idx == 3) return vec3(0.88, 0.30, 0.68); // Episodic: Occipital Rose-Orchid
    return vec3(0.12, 0.82, 0.58);               // Alignment: Cerebellar-Brainstem Emerald-Cyan
  }

  void main() {
    vec3 N = normalize(vWorldNormal);
    vec3 V = normalize(cameraPosition - vWorldPos);
    float ndotv = clamp(abs(dot(N, V)), 0.0, 1.0);

    // Dual-band clinical holographic Fresnel: transparent window straight-on so tiny DIG.net
    // micro-capsules inside the brain stay razor-clear, luminous rim along every folded gyrus!
    float fresnelRim = pow(1.0 - ndotv, 2.35);
    float fresnelSpec = pow(1.0 - ndotv, 5.5);

    int lobeIdx = int(floor(vLobeIndex + 0.5));
    vec3 lobeCol = getLobeTint(lobeIdx);

    // Base neurology hospital holographic palette: deep sapphire-indigo sulci -> luminous cyan/violet gyri
    vec3 deepSulcusCol = vec3(0.012, 0.045, 0.125);
    vec3 crownBaseCol = mix(vec3(0.04, 0.28, 0.54), lobeCol * 0.72, 0.48);
    vec3 tissueCol = mix(crownBaseCol, deepSulcusCol, clamp(vSulcusDepth * 0.92, 0.0, 1.0));

    // Pial micro-sulcal contour glow: highlights the intricate cortical folds like 7T T2* neuroimaging
    float sulcusWallBand = smoothstep(0.32, 0.68, vSulcusDepth) * (1.0 - smoothstep(0.74, 0.98, vSulcusDepth));
    float gyralCrestGlow = smoothstep(0.62, 0.96, vGyralHeight);
    tissueCol += lobeCol * (sulcusWallBand * 0.18 + gyralCrestGlow * 0.22 * fresnelRim);

    // Sub-millimeter stereotactic holographic scanlines & interference shimmer
    float scanLine = 0.5 + 0.5 * sin(vLocalPos.y * 155.0 - uTime * 1.6 * uMotionScale);
    float microColumnWave = 0.5 + 0.5 * sin(uTime * 2.4 * uMotionScale + vCorticalPhase + vLocalPos.z * 14.0);
    tissueCol += vec3(0.14, 0.68, 0.96) * fresnelRim * (0.42 + 0.16 * scanLine);
    tissueCol += vec3(0.65, 0.90, 1.0) * fresnelSpec * 0.65;
    tissueCol += lobeCol * microColumnWave * gyralCrestGlow * 0.07;

    // 4D fMRI BOLD + 40Hz Gamma Electrophysiological Wave Propagation around accessed DIG.net capsules
    float boldAlphaBoost = 0.0;
    for (int i = 0; i < 8; i++) {
      float strength = uExciteParams[i].x;
      if (strength > 0.005) {
        float elapsed = uExciteParams[i].y;
        float radius = max(0.12, uExciteParams[i].z);
        float dist = distance(vLocalPos, uExciteCenters[i]);
        float envelope = exp(-pow(dist / radius, 2.0)) * strength;

        // Traveling concentric cortical ripple wave from the accessed micro-capsule locus
        float waveFront = elapsed * 0.55 * max(0.25, uMotionScale);
        float ring = exp(-pow((dist - mod(waveFront, radius * 1.85)) / 0.038, 2.0)) * strength * smoothstep(radius * 2.1, 0.0, dist);
        float gammaOsc = 0.72 + 0.28 * sin(dist * 38.0 - uTime * 9.5 * uMotionScale);

        vec3 excCol = uExciteColors[i];
        tissueCol += excCol * (envelope * 0.85 * gammaOsc + ring * 0.95) * (0.45 + 0.55 * vGyralHeight);
        boldAlphaBoost += (envelope * 0.28 + ring * 0.32);
      }
    }

    // Global 3-Plane Morphic Resonance / Doctor Green Siren (#00e676) Harmonic Wave
    if (uMorphicWave.x > 0.005) {
      float rOrigin = length(vLocalPos);
      float shellRing = exp(-pow((rOrigin - uMorphicWave.y) / 0.09, 2.0)) * uMorphicWave.x;
      float ambientMorphic = uMorphicWave.x * 0.22 * (0.5 + 0.5 * fresnelRim);
      tissueCol += uMorphicColor * (shellRing * 1.35 + ambientMorphic);
      boldAlphaBoost += shellRing * 0.36 + uMorphicWave.x * 0.08;
    }

    // Lobe isolation dimming when operator selects a single cortical lobe
    float lobeFilterScale = 1.0;
    if (uSelectedLobe >= 0 && lobeIdx != uSelectedLobe) {
      lobeFilterScale = 0.24;
      tissueCol *= 0.42;
    }

    // Interactive 3D Multi-Axis MRI / LSH Tomographic Laser Slice Plane
    float sliceAlphaBoost = 0.0;
    float sliceSideAtten = 1.0;
    if (uSliceConfig.x > 0.5) {
      float coord = vLocalPos.y;
      if (uSliceConfig.y > 0.5 && uSliceConfig.y < 1.5) {
        coord = vLocalPos.x;
      } else if (uSliceConfig.y >= 1.5) {
        coord = vLocalPos.z;
      }
      float dSlice = coord - uSliceConfig.z;
      float laserCore = exp(-pow(dSlice / 0.009, 2.0));
      float laserHalo = exp(-pow(dSlice / 0.036, 2.0));
      vec3 sliceCol = mix(vec3(0.0, 0.95, 1.0), vec3(0.95, 0.98, 1.0), laserCore);
      tissueCol += sliceCol * (laserCore * 1.65 + laserHalo * 0.48);
      sliceAlphaBoost = laserCore * 0.72 + laserHalo * 0.18;

      if (uSliceConfig.w > 0.5 && dSlice < -0.015) {
        sliceSideAtten = 0.28;
        tissueCol *= 0.45;
      }
    }

    // Compute clinical glass transmission alpha: crystal-transparent through center, defined along folds & rims
    float baseAlpha =
      (0.055 + 0.34 * fresnelRim + 0.16 * fresnelSpec + 0.075 * sulcusWallBand) *
      uShellOpacity *
      uBackPassScale *
      lobeFilterScale *
      sliceSideAtten;

    float finalAlpha = clamp(baseAlpha + boldAlphaBoost * uBackPassScale + sliceAlphaBoost, 0.015, 0.92);

    gl_FragColor = vec4(tissueCol, finalAlpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;function Xt(e=!1){const a=[],l=[],c=[];for(let p=0;p<Bt;p++)a.push(new t(0,0,0)),l.push(new F("#00f2fe")),c.push(new ut(0,0,.28,40));const h={uTime:{value:0},uShellOpacity:{value:.76},uBackPassScale:{value:e?.42:1},uSelectedLobe:{value:-1},uMotionScale:{value:1},uExciteCenters:{value:a},uExciteColors:{value:l},uExciteParams:{value:c},uMorphicWave:{value:new ut(0,0,0,0)},uMorphicColor:{value:new F("#e879f9")},uSliceConfig:{value:new ut(0,0,0,0)}};return{material:new at({uniforms:h,vertexShader:Rt,fragmentShader:Et,transparent:!0,depthWrite:!1,depthTest:!0,side:e?bt:yt,blending:Mt}),uniforms:h}}function Vt(e,a,l=.32){return new at({uniforms:{uTime:{value:0},uBaseColor:{value:new F(e)},uRimColor:{value:new F(a)},uOpacity:{value:l}},vertexShader:`
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,fragmentShader:`
      uniform float uTime;
      uniform vec3 uBaseColor;
      uniform vec3 uRimColor;
      uniform float uOpacity;
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;

      void main() {
        vec3 V = normalize(cameraPosition - vWorldPos);
        float ndotv = clamp(abs(dot(normalize(vWorldNormal), V)), 0.0, 1.0);
        float fresnel = pow(1.0 - ndotv, 2.1);
        float pulse = 0.88 + 0.12 * sin(uTime * 2.1 + vWorldPos.z * 8.0);
        vec3 col = mix(uBaseColor * 0.45, uRimColor * 1.15, fresnel) * pulse;
        float alpha = clamp((0.14 + 0.68 * fresnel) * uOpacity, 0.02, 0.85);
        gl_FragColor = vec4(col, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,transparent:!0,depthWrite:!1,side:gt})}function Ut(){return new at({uniforms:{uTime:{value:0},uOpacity:{value:.42},uMotionScale:{value:1}},vertexColors:!0,vertexShader:`
      attribute float aTractProgress;
      attribute float aTractSeed;
      varying vec3 vColor;
      varying float vProgress;
      varying float vSeed;
      void main() {
        vColor = color;
        vProgress = aTractProgress;
        vSeed = aTractSeed;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,fragmentShader:`
      uniform float uTime;
      uniform float uOpacity;
      uniform float uMotionScale;
      varying vec3 vColor;
      varying float vProgress;
      varying float vSeed;

      void main() {
        // Traveling bioluminescent action-potential packet along white-matter tract
        float head = fract(uTime * (0.22 + vSeed * 0.18) * uMotionScale + vSeed * 3.7);
        float dist = abs(vProgress - head);
        dist = min(dist, 1.0 - dist);
        float packet = exp(-pow(dist / 0.075, 2.0));
        float endFade = sin(clamp(vProgress, 0.02, 0.98) * 3.14159265);
        vec3 col = vColor * (0.42 + packet * 1.65) + vec3(0.8, 0.96, 1.0) * packet * 0.45;
        float alpha = clamp((0.18 + packet * 0.65) * endFade * uOpacity, 0.0, 0.95);
        gl_FragColor = vec4(col, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,transparent:!0,depthWrite:!1,blending:dt})}function Yt(e=1){return new at({uniforms:{uTime:{value:0},uOpacity:{value:.58},uMotionScale:{value:1},uSoloNucleus:{value:-1},uSpeedSign:{value:e}},vertexColors:!0,vertexShader:`
      attribute float aTractProgress;
      attribute float aTractSeed;
      attribute float aNucleusIndex;
      varying vec3 vColor;
      varying float vProgress;
      varying float vSeed;
      varying float vNucleusIndex;
      void main() {
        vColor = color;
        vProgress = aTractProgress;
        vSeed = aTractSeed;
        vNucleusIndex = aNucleusIndex;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,fragmentShader:`
      uniform float uTime;
      uniform float uOpacity;
      uniform float uMotionScale;
      uniform int uSoloNucleus;
      uniform float uSpeedSign;
      varying vec3 vColor;
      varying float vProgress;
      varying float vSeed;
      varying float vNucleusIndex;

      void main() {
        int nIdx = int(floor(vNucleusIndex + 0.5));
        float soloScale = 1.0;
        if (uSoloNucleus >= 0) {
          soloScale = (nIdx == uSoloNucleus) ? 1.85 : 0.14;
        }

        float head = fract(uTime * (0.34 + vSeed * 0.22) * uMotionScale * uSpeedSign + vSeed * 5.1);
        float dist = abs(vProgress - head);
        dist = min(dist, 1.0 - dist);
        float packet = exp(-pow(dist / 0.085, 2.0));
        float endFade = sin(clamp(vProgress, 0.03, 0.97) * 3.14159265);
        vec3 col = vColor * (0.48 + packet * 1.95) + vec3(0.9, 0.98, 1.0) * packet * 0.55;
        float alpha = clamp((0.22 + packet * 0.72) * endFade * uOpacity * soloScale, 0.0, 0.98);
        gl_FragColor = vec4(col, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,transparent:!0,depthWrite:!1,blending:dt})}function Zt(){return new at({uniforms:{uTime:{value:0},uOpacity:{value:.68},uPixelRatio:{value:1},uMotionScale:{value:1}},vertexColors:!0,vertexShader:`
      attribute float aPhase;
      uniform float uTime;
      uniform float uPixelRatio;
      uniform float uMotionScale;
      varying vec3 vColor;
      varying float vTwinkle;

      void main() {
        vColor = color;
        vTwinkle = 0.45 + 0.55 * sin(uTime * 2.2 * uMotionScale + aPhase);
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = clamp((3.6 + 1.8 * vTwinkle) * uPixelRatio / max(0.45, -mvPos.z), 1.2, 7.5);
        gl_Position = projectionMatrix * mvPos;
      }
    `,fragmentShader:`
      uniform float uOpacity;
      varying vec3 vColor;
      varying float vTwinkle;

      void main() {
        vec2 c = gl_PointCoord - vec2(0.5);
        float r = length(c) * 2.0;
        if (r > 1.0) discard;
        float core = exp(-r * r * 4.2);
        vec3 col = mix(vColor, vec3(0.95, 0.99, 1.0), core * 0.65);
        gl_FragColor = vec4(col, core * vTwinkle * uOpacity);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,transparent:!0,depthWrite:!1,blending:dt})}function jt(){return new at({uniforms:{uTime:{value:0},uMotionScale:{value:1}},vertexShader:`
      attribute vec4 aCapsuleState;
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;
      varying vec3 vLocalPos;
      varying vec3 vInstColor;
      varying vec4 vState;

      void main() {
        vState = aCapsuleState;
        #ifdef USE_INSTANCING_COLOR
          vInstColor = instanceColor;
        #else
          vInstColor = vec3(0.0, 0.95, 1.0);
        #endif
        vLocalPos = position;
        vec4 worldPos = modelMatrix * instanceMatrix * vec4(position, 1.0);
        vWorldPos = worldPos.xyz;
        vWorldNormal = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,fragmentShader:`
      uniform float uTime;
      uniform float uMotionScale;
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;
      varying vec3 vLocalPos;
      varying vec3 vInstColor;
      varying vec4 vState;

      void main() {
        vec3 V = normalize(cameraPosition - vWorldPos);
        vec3 N = normalize(vWorldNormal);
        float ndotv = clamp(abs(dot(N, V)), 0.0, 1.0);
        float fresnel = pow(1.0 - ndotv, 2.0);

        float excitation = vState.x;
        float statusCode = vState.y;
        float phase = vState.z;
        float focusFlag = vState.w;

        // WCAG 2.3.1 safe gentle oscillation (< 1.8 Hz, never > 3 flashes/sec)
        float gentlePulse = 0.84 + 0.16 * sin(uTime * 3.4 * uMotionScale + phase);
        // Equatorial photonic waist band & dual surgical end-cap collars on the tiny .dig micro-capsule
        float equatorBand = exp(-pow(vLocalPos.y / 0.0032, 2.0));
        float capCollar = exp(-pow((abs(vLocalPos.y) - 0.0065) / 0.0018, 2.0));
        float innerNucleus = smoothstep(0.55, 1.0, ndotv);

        vec3 baseCol = vInstColor;
        // Pruned capsules appear dim ghosted slate-rose
        if (statusCode > 1.5 && statusCode < 2.5) {
          baseCol *= 0.35;
        }

        vec3 coreWhite = vec3(0.95, 0.99, 1.0);
        vec3 col =
          baseCol * (0.56 + 0.88 * fresnel + 0.62 * equatorBand + 0.38 * capCollar) * gentlePulse +
          coreWhite * (innerNucleus * (0.40 + 0.55 * excitation + 0.45 * focusFlag) + equatorBand * 0.34 + capCollar * 0.22) +
          baseCol * (excitation * 1.15 + focusFlag * 0.75);

        float alpha = statusCode > 1.5 && statusCode < 2.5 ? 0.36 : 0.96;
        gl_FragColor = vec4(col, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,transparent:!0,depthWrite:!0,side:gt})}export{_t as D,st as I,it as L,Bt as M,xt as a,St as b,Xt as c,Ut as d,Yt as e,Zt as f,Ot as g,jt as h,Vt as i};
