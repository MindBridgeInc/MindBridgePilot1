var se=Object.defineProperty;var ne=(n,e,t)=>e in n?se(n,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):n[e]=t;var r=(n,e,t)=>ne(n,typeof e!="symbol"?e+"":e,t);(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))i(s);new MutationObserver(s=>{for(const a of s)if(a.type==="childList")for(const o of a.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&i(o)}).observe(document,{childList:!0,subtree:!0});function t(s){const a={};return s.integrity&&(a.integrity=s.integrity),s.referrerPolicy&&(a.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?a.credentials="include":s.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function i(s){if(s.ep)return;s.ep=!0;const a=t(s);fetch(s.href,a)}})();const A={rest:{fingers:[0,0,0,0],thumb:20},open_hand:{fingers:[75,80,78,72],thumb:45},close_hand:{fingers:[8,8,8,8],thumb:55},pinch:{fingers:[5,5,60,55],thumb:70}};class ae{constructor(){r(this,"id","virtual_glove");r(this,"label","Virtual Assistive Glove");r(this,"connected",!1);r(this,"previewCommand","rest");r(this,"previewConfidence",0);r(this,"firedCommand",null);r(this,"firedAt",0);r(this,"lastEvent",null);r(this,"container",null);r(this,"onStateChange",null);r(this,"displayPose",{fingers:[...A.rest.fingers],thumb:A.rest.thumb});r(this,"animFrame",null)}setContainer(e){this.container=e,this.renderDom()}setOnStateChange(e){this.onStateChange=e}getPreviewCommand(){return this.previewCommand}getLastEvent(){return this.lastEvent}async connect(){this.connected=!0}async disconnect(){this.connected=!1,this.previewCommand="rest",this.firedCommand=null}setPreview(e,t){this.connected&&(this.previewCommand=e,this.previewConfidence=t,this.animateTowardTarget())}send(e){var t;this.connected&&(this.firedCommand=e.commandId,this.firedAt=Date.now(),this.lastEvent=e,(t=this.onStateChange)==null||t.call(this,e.commandId,e),this.animateTowardTarget())}getStatus(){return this.connected?`Preview: ${this.previewCommand.replace("_"," ")}`:"Disconnected"}renderDom(){if(this.container){if(this.container.querySelector(".glove-svg")){this.updateSvgPaths();return}this.container.innerHTML=`
      <div class="glove-stage">
        <svg viewBox="0 0 160 140" class="glove-svg" aria-label="Virtual assistive glove">
          <path class="glove-palm" d="M 30 100 Q 80 115 130 100 L 125 55 Q 80 40 35 55 Z" fill="var(--surface-2)" stroke="currentColor" stroke-width="2"/>
          <path class="glove-finger" data-finger="0" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>
          <path class="glove-finger" data-finger="1" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>
          <path class="glove-finger" data-finger="2" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>
          <path class="glove-finger" data-finger="3" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>
          <path class="glove-thumb" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>
        </svg>
        <div class="glove-fired-ring" aria-hidden="true"></div>
      </div>
      <div class="glove-legend">
        <span class="glove-legend-preview">Preview: <strong id="glove-preview-label">Rest</strong></span>
        <span class="glove-legend-fired">Sent: <strong id="glove-fired-label">—</strong></span>
      </div>
    `,this.updateSvgPaths()}}animateTowardTarget(){if(this.animFrame!==null)return;const e=()=>{var h,c,d;const t=A[this.previewCommand],i=.08+this.previewConfidence*.12;let s=!0;this.displayPose.fingers=this.displayPose.fingers.map((b,C)=>{const _=b+(t.fingers[C]-b)*i;return Math.abs(_-t.fingers[C])>.5&&(s=!1),_});const a=this.displayPose.thumb+(t.thumb-this.displayPose.thumb)*i;Math.abs(a-t.thumb)>.5&&(s=!1),this.displayPose.thumb=a,this.updateSvgPaths();const o=(h=this.container)==null?void 0:h.querySelector(".glove-fired-ring");o&&this.firedCommand&&Date.now()-this.firedAt<500?o.classList.add("pulse"):o&&o.classList.remove("pulse");const l=(c=this.container)==null?void 0:c.querySelector("#glove-preview-label");l&&(l.textContent=this.previewCommand.replace(/_/g," "));const u=(d=this.container)==null?void 0:d.querySelector("#glove-fired-label");u&&this.lastEvent&&(u.textContent=`${this.lastEvent.label} (${Math.round(this.lastEvent.confidence*100)}%)`),s?this.animFrame=null:this.animFrame=requestAnimationFrame(e)};this.animFrame=requestAnimationFrame(e)}updateSvgPaths(){if(!this.container)return;const e=this.displayPose;for(let i=0;i<4;i++){const s=this.container.querySelector(`[data-finger="${i}"]`);if(!s)continue;const a=48+i*22,o=e.fingers[i],l=30+o*.55,u=55+o*.35;s.setAttribute("d",`M ${a} 95 Q ${a-4} ${u} ${a} ${l}`)}const t=this.container.querySelector(".glove-thumb");if(t){const i=18+e.thumb*.15,s=70-e.thumb*.2;t.setAttribute("d",`M 28 88 Q ${i} ${s} 42 52`)}}}const g=[{id:"open_hand",label:"Open Hand",description:"Extend fingers outward — index and middle sensors rise."},{id:"close_hand",label:"Close Hand",description:"Make a fist — all sensors rise evenly."},{id:"pinch",label:"Pinch",description:"Thumb and index pressure — sensors 0 and 2 activate."},{id:"rest",label:"Rest",description:"Neutral relaxed state — minimal activation."}],k=Object.fromEntries(g.map(n=>[n.id,n.label]));function W(){return[{id:"open_hand",label:"Open Hand",description:"Extend fingers outward",samples:[[.08,.35,.42,.38,.12,.08],[.07,.33,.4,.36,.11,.07]],featureVector:[]},{id:"close_hand",label:"Close Hand",description:"Make a fist",samples:[[.45,.48,.52,.5,.44,.42],[.43,.46,.5,.48,.42,.4]],featureVector:[]},{id:"pinch",label:"Pinch",description:"Thumb and index",samples:[[.55,.1,.52,.08,.12,.1],[.52,.09,.5,.07,.11,.09]],featureVector:[]},{id:"rest",label:"Rest",description:"Neutral relaxed",samples:[[.05,.06,.05,.06,.05,.05],[.06,.05,.06,.05,.06,.05]],featureVector:[]}]}const p=6,re=50,$=120;class J{constructor(){r(this,"rollingBuffers",Array.from({length:p},()=>[]));r(this,"windowSize",5)}process(e,t){const i=(t==null?void 0:t.baseline)??Array(p).fill(.05),s=(t==null?void 0:t.gain)??2.5,a=(t==null?void 0:t.noiseThreshold)??.08;return this.processValues(e.timestamp,e.sensors,i,s,a)}processValues(e,t,i,s,a){const h=t.map((c,d)=>{const b=c-(i[d]??.05);return Math.max(0,b*s)}).map((c,d)=>(this.rollingBuffers[d].push(c),this.rollingBuffers[d].length>this.windowSize&&this.rollingBuffers[d].shift(),this.rollingBuffers[d].reduce((b,C)=>b+C,0)/this.rollingBuffers[d].length)).map((c,d)=>{const b=this.rollingBuffers[d].slice(-2,-1)[0]??c;return Math.abs(c-b)>.4?b:c}).map(c=>c<a?0:c-a);return{timestamp:e,raw:t,normalized:h,features:[...h,...h.map(c=>c>0?1:0)],active:h.some(c=>c>.02)}}reset(){this.rollingBuffers=Array.from({length:p},()=>[])}}function oe(n){if(n.length===0)return Array(p).fill(.05);const e=Array(p).fill(0);for(const t of n)t.forEach((i,s)=>{e[s]+=i});return e.map(t=>t/n.length)}function le(n,e){if(e.length===0)return 2.5;let t=0;for(const i of e)i.forEach((s,a)=>{const o=Math.abs(s-(n[a]??.05));o>t&&(t=o)});return t<.05?3.5:Math.min(5,Math.max(1.5,.35/t))}function R(n,e,t,i){if(n.length===0)return[];const s=new J,a=n.map((u,h)=>{const c=u.slice(0,p);for(;c.length<p;)c.push(.05);return s.processValues(Date.now()+h,c,e,t,i).features}),o=a[0].length,l=Array(o).fill(0);for(const u of a)u.forEach((h,c)=>{l[c]+=h});return l.map(u=>u/a.length)}function F(n,e){if(n.length===0||e.length===0)return 1/0;const t=Math.min(n.length,e.length);let i=0;for(let s=0;s<t;s++)i+=(n[s]-e[s])**2;return Math.sqrt(i)}class K{constructor(){r(this,"baselineSamples",[]);r(this,"commandSamples",new Map);r(this,"recording",!1);r(this,"recordTarget",null);r(this,"recordStart",0)}startBaselineRecording(){this.baselineSamples=[],this.recording=!0,this.recordTarget="baseline",this.recordStart=Date.now()}startCommandRecording(e){this.recording=!0,this.recordTarget=e,this.recordStart=Date.now(),this.commandSamples.has(e)||this.commandSamples.set(e,[])}stopRecording(){this.recording=!1,this.recordTarget=null}isRecording(){return this.recording}getRecordTarget(){return this.recordTarget}getRecordElapsed(){return this.recording?Date.now()-this.recordStart:0}ingestSample(e){if(!this.recording||!this.recordTarget)return;const t=e.slice(0,p);for(;t.length<p;)t.push(.05);if(this.recordTarget==="baseline")this.baselineSamples.push(t);else{const i=this.commandSamples.get(this.recordTarget)??[];i.push(t),this.commandSamples.set(this.recordTarget,i)}}buildProfile(e,t,i){const s=this.baselineSamples.length>0?oe(this.baselineSamples):(i==null?void 0:i.baseline)??Array(p).fill(.05),a=[...this.commandSamples.values()].flat(),o=le(s,a.length>0?a:[[.2,.2,.2,.2,.2,.2]]),l=(i==null?void 0:i.noiseThreshold)??.08,u=W().map(c=>{const d=this.commandSamples.get(c.id),b=d&&d.length>0?d:c.samples,C=R(b,s,o,l);return{...c,samples:b,featureVector:C}}),h=Date.now();return{id:e,name:t,createdAt:(i==null?void 0:i.createdAt)??h,updatedAt:h,baseline:s,gain:o,noiseThreshold:l,commands:u}}getBaselineSampleCount(){return this.baselineSamples.length}getCommandSampleCount(e){var t;return((t=this.commandSamples.get(e))==null?void 0:t.length)??0}clearCommandSamples(e){this.commandSamples.set(e,[])}reset(){this.baselineSamples=[],this.commandSamples.clear(),this.recording=!1,this.recordTarget=null}}function Y(n){const e=new K;e.startBaselineRecording();for(let t=0;t<40;t++)e.ingestSample([.05,.06,.05,.06,.05,.05]);e.stopRecording();for(const t of W()){e.startCommandRecording(t.id);for(const i of t.samples)e.ingestSample(i);e.stopRecording()}return e.buildProfile(`profile_${Date.now()}`,n)}function ce(n){const e=n.commands.map(t=>({...t,featureVector:R(t.samples,n.baseline,n.gain,n.noiseThreshold)}));return{...n,commands:e}}const de=.5,he=250,H=1.2,V=.35;class ue{constructor(){r(this,"stableCommand",null);r(this,"stableSince",0);r(this,"lastFired",null);r(this,"lastFiredAt",0);r(this,"cooldownMs",400)}evaluate(e,t){if(!t||t.commands.length===0)return{commandId:null,label:"No profile",confidence:0,stable:!1};if(!e.active)return this.stableCommand=null,{commandId:"rest",label:k.rest,confidence:.95,stable:!0};const{bestId:i,confidence:s}=this.matchBest(e.features,t.commands),a=e.timestamp;return s>=de&&i&&i!=="rest"?this.stableCommand===i?{commandId:i,label:k[i],confidence:s,stable:a-this.stableSince>=he}:(this.stableCommand=i,this.stableSince=a,{commandId:i,label:k[i],confidence:s,stable:!1}):(this.stableCommand=null,s>=V&&i?{commandId:i,label:k[i],confidence:s,stable:!1}:{commandId:null,label:"Uncertain",confidence:s,stable:!1})}getPreviewCommand(e){return e.commandId&&e.confidence>=V?e.commandId:"rest"}shouldFire(e,t){return!(!e.stable||!e.commandId||e.commandId==="rest"||this.lastFired===e.commandId&&t-this.lastFiredAt<this.cooldownMs)}markFired(e,t){this.lastFired=e,this.lastFiredAt=t}reset(){this.stableCommand=null,this.stableSince=0,this.lastFired=null,this.lastFiredAt=0}scoreAgainstCommand(e,t,i){const s=t.commands.find(l=>l.id===i);if(!s)return 0;const a=this.resolveTemplate(s,t);if(a.length===0)return 0;const o=F(e.features,a);return Math.max(0,Math.min(1,1-o/H))}matchBest(e,t){let i=null,s=1/0;for(const a of t){if(a.id==="rest")continue;const o=a.featureVector;if(!o||o.length===0)continue;const l=F(e,o);l<s&&(s=l,i=a.id)}return{bestId:i,confidence:Math.max(0,Math.min(1,1-s/H))}}resolveTemplate(e,t){return e.featureVector&&e.featureVector.length>0?e.featureVector:e.samples.length===0?[]:R(e.samples,t.baseline,t.gain,t.noiseThreshold)}}class me{constructor(e,t){r(this,"input");r(this,"output");r(this,"preprocessor",new J);r(this,"intentEngine",new ue);r(this,"calibrationSession",new K);r(this,"profile",null);r(this,"timer",null);r(this,"listeners",[]);r(this,"commandLog",[]);r(this,"frameTimestamps",[]);r(this,"lastFiredConfidence",0);r(this,"state",{frame:null,intent:{commandId:null,label:"Idle",confidence:0,stable:!1},previewCommand:"rest",previewConfidence:0,lastCommand:null,lastCommandAt:null,lastFiredConfidence:0});this.input=e,this.output=t}getCalibrationSession(){return this.calibrationSession}getInputAdapter(){return this.input}async setInputAdapter(e){this.input.connected&&await this.input.disconnect(),this.input=e,this.preprocessor.reset(),e.connected||await e.connect()}setProfile(e){this.profile=e,this.preprocessor.reset(),this.intentEngine.reset()}getProfile(){return this.profile}getIntentEngine(){return this.intentEngine}getCommandLog(){return[...this.commandLog]}getState(){return this.state}getInputMetrics(){const e=Date.now();return{framesPerSecond:this.frameTimestamps.filter(i=>e-i<1e3).length,lastFrameAt:this.frameTimestamps.at(-1)??null,connected:this.input.connected,sourceLabel:this.input.label,status:this.input.getStatus()}}onUpdate(e){return this.listeners.push(e),()=>{this.listeners=this.listeners.filter(t=>t!==e)}}async start(){this.input.connected||await this.input.connect(),this.output.connected||await this.output.connect(),!this.timer&&(this.timer=setInterval(()=>this.tick(),re))}stop(){this.timer&&(clearInterval(this.timer),this.timer=null)}tick(){const e=this.input.read();if(!e)return;this.frameTimestamps.push(e.timestamp),this.frameTimestamps.length>60&&this.frameTimestamps.shift(),this.calibrationSession.isRecording()&&this.calibrationSession.ingestSample(e.sensors);const t=this.preprocessor.process(e,this.profile),i=this.intentEngine.evaluate(t,this.profile),s=this.intentEngine.getPreviewCommand(i),a=[];if(this.updateGlovePreview(s,i.confidence),this.intentEngine.shouldFire(i,e.timestamp)&&i.commandId){const o={commandId:i.commandId,label:k[i.commandId],confidence:i.confidence,timestamp:e.timestamp};this.output.send(o),this.commandLog.unshift(o),this.commandLog.length>50&&this.commandLog.pop(),this.intentEngine.markFired(i.commandId,e.timestamp),this.lastFiredConfidence=i.confidence,a.push(o),this.state={frame:t,intent:i,previewCommand:s,previewConfidence:i.confidence,lastCommand:i.commandId,lastCommandAt:e.timestamp,lastFiredConfidence:i.confidence}}else this.state={...this.state,frame:t,intent:i,previewCommand:s,previewConfidence:i.confidence};for(const o of this.listeners)o(this.state,a)}updateGlovePreview(e,t){var s;const i=this.output;(s=i.setPreview)==null||s.call(i,e,t)}}function pe(n){return Q(n)}function fe(n){return Q(n.trim())}function Q(n){if(!n)return null;try{const e=JSON.parse(n);if(!Array.isArray(e.sensors)||e.sensors.length===0)return null;const t=e.sensors.slice(0,p).map(i=>Math.max(0,Math.min(1,Number(i))));for(;t.length<p;)t.push(.05);return{timestamp:e.t??Date.now(),sensors:t}}catch{return null}}const O="12345678-1234-5678-1234-56789abcdef0",ve="12345678-1234-5678-1234-56789abcdef1",j="6e400001-b5a3-f393-e0a9-e50e24dcca9e",ge="6e400003-b5a3-f393-e0a9-e50e24dcca9e";class be{constructor(){r(this,"id","bluetooth");r(this,"label","BLE Wristband");r(this,"connected",!1);r(this,"device",null);r(this,"latestFrame",null);r(this,"lastPacketLine","");r(this,"packetListeners",[]);r(this,"useNus",!1)}onPacket(e){return this.packetListeners.push(e),()=>{this.packetListeners=this.packetListeners.filter(t=>t!==e)}}getLastPacketLine(){return this.lastPacketLine}async connect(){var s;if(!("bluetooth"in navigator))throw new Error("Web Bluetooth is not supported. Use Chrome/Edge on desktop.");const e=await navigator.bluetooth.requestDevice({acceptAllDevices:!0,optionalServices:[O,j]});this.device=e,e.addEventListener("gattserverdisconnected",()=>{this.connected=!1});const t=await((s=e.gatt)==null?void 0:s.connect());if(!t)throw new Error("Failed to connect to GATT server.");let i=null;try{i=await(await t.getPrimaryService(O)).getCharacteristic(ve),this.useNus=!1}catch{i=await(await t.getPrimaryService(j)).getCharacteristic(ge),this.useNus=!0}await i.startNotifications(),i.addEventListener("characteristicvaluechanged",a=>{const o=a.target,l=new TextDecoder().decode(o.value);this.handleIncomingText(l)}),this.connected=!0}async disconnect(){var e,t;(t=(e=this.device)==null?void 0:e.gatt)!=null&&t.connected&&this.device.gatt.disconnect(),this.connected=!1,this.device=null,this.latestFrame=null}read(){return this.latestFrame}getStatus(){var t;return this.connected?`Connected — ${((t=this.device)==null?void 0:t.name)??"BLE device"}${this.useNus?" (NUS)":""}`:"Not connected"}handleIncomingText(e){this.lastPacketLine=e.trim();for(const i of this.packetListeners)i(this.lastPacketLine);const t=pe(this.lastPacketLine);t&&(this.latestFrame=t)}}class Se{constructor(){r(this,"id","serial");r(this,"label","Serial / Arduino");r(this,"connected",!1);r(this,"port",null);r(this,"reader",null);r(this,"readLoopActive",!1);r(this,"buffer","");r(this,"latestFrame",null);r(this,"lastPacketLine","");r(this,"packetListeners",[])}onPacket(e){return this.packetListeners.push(e),()=>{this.packetListeners=this.packetListeners.filter(t=>t!==e)}}getLastPacketLine(){return this.lastPacketLine}async connect(){if(!("serial"in navigator))throw new Error("Web Serial is not supported. Use Chrome/Edge on desktop.");this.port=await navigator.serial.requestPort(),await this.port.open({baudRate:115200}),this.connected=!0,this.readLoopActive=!0,this.readLoop()}async disconnect(){if(this.readLoopActive=!1,this.reader){try{await this.reader.cancel()}catch{}this.reader=null}if(this.port){try{await this.port.close()}catch{}this.port=null}this.connected=!1,this.latestFrame=null,this.buffer=""}read(){return this.latestFrame}getStatus(){return this.connected?"Connected — Serial device @ 115200 baud":"Not connected"}async readLoop(){var t,i;if(!((t=this.port)!=null&&t.readable))return;this.reader=this.port.readable.getReader();const e=new TextDecoder;try{for(;this.readLoopActive&&this.reader;){const{value:s,done:a}=await this.reader.read();if(a)break;s&&(this.buffer+=e.decode(s,{stream:!0}),this.flushLines())}}catch{this.connected=!1}finally{(i=this.reader)==null||i.releaseLock()}}flushLines(){const e=this.buffer.split(`
`);this.buffer=e.pop()??"";for(const t of e){const i=t.trim();if(!i)continue;this.lastPacketLine=i;for(const a of this.packetListeners)a(i);const s=fe(i);s&&(this.latestFrame=s)}}}class we{constructor(){r(this,"id","simulator");r(this,"label","Pressure Simulator");r(this,"connected",!1);r(this,"values",Array(p).fill(.05));r(this,"autoDemo",!1);r(this,"noiseInjection",!1);r(this,"demoPhase",0);r(this,"demoCommand","rest");r(this,"demoTimer",0)}setSlider(e,t){e>=0&&e<p&&(this.values[e]=Math.max(0,Math.min(1,t)))}getValues(){return[...this.values]}setAutoDemo(e){this.autoDemo=e,e||(this.demoPhase=0,this.demoTimer=0)}isAutoDemo(){return this.autoDemo}setNoiseInjection(e){this.noiseInjection=e}isNoiseInjection(){return this.noiseInjection}async connect(){this.connected=!0}async disconnect(){this.connected=!1,this.autoDemo=!1}getStatus(){return this.connected?this.autoDemo?"Connected — Auto-demo active":"Connected — Manual control":"Disconnected"}read(){if(!this.connected)return null;this.autoDemo&&this.updateAutoDemo();const e=this.values.map((t,i)=>{let s=t;return this.noiseInjection&&(s+=(Math.random()-.5)*.15),s+=(Math.random()-.5)*.02,Math.max(0,Math.min(1,s))});return{timestamp:Date.now(),sensors:e}}applyCommandPattern(e){const t={open_hand:[.08,.35,.42,.38,.12,.08],close_hand:[.45,.48,.52,.5,.44,.42],pinch:[.55,.1,.52,.08,.12,.1],rest:[.05,.06,.05,.06,.05,.05]};this.values=[...t[e]??t.rest]}updateAutoDemo(){if(this.demoTimer+=ye,this.demoTimer>=4e3){this.demoTimer=0;const a=["rest","close_hand","rest","open_hand","rest","pinch"],o=a.indexOf(this.demoCommand);this.demoCommand=a[(o+1)%a.length]}const t=this.getTargetPattern(this.demoCommand),i=Math.min(1,this.demoTimer/800),s=i<.5?2*i*i:1-Math.pow(-2*i+2,2)/2;this.values=t.map((a,o)=>{const u=Math.sin(this.demoPhase+o*.7)*.03;return .05+(a-.05)*s+u}),this.demoPhase+=.08}getTargetPattern(e){const t={open_hand:[.08,.32,.4,.36,.1,.08],close_hand:[.42,.45,.48,.46,.4,.38],pinch:[.5,.08,.48,.07,.1,.08],rest:[.05,.06,.05,.06,.05,.05]};return t[e]??t.rest}}const ye=50;class Ce{constructor(){r(this,"simulator",new we);r(this,"bluetooth",new be);r(this,"serial",new Se);r(this,"active");r(this,"source","simulator");this.active=this.simulator}getActive(){return this.active}getSource(){return this.source}getAdapter(e){switch(e){case"bluetooth":return this.bluetooth;case"serial":return this.serial;default:return this.simulator}}async switchSource(e){return this.active.connected&&this.active!==this.getAdapter(e)&&await this.active.disconnect(),this.source=e,this.active=this.getAdapter(e),this.active.connected||await this.active.connect(),this.active}async connectHardware(e){return this.active.connected&&await this.active.disconnect(),this.source=e,this.active=this.getAdapter(e),await this.active.connect(),this.active}async disconnectAll(){await Promise.all([this.simulator.disconnect().catch(()=>{}),this.bluetooth.disconnect().catch(()=>{}),this.serial.disconnect().catch(()=>{})])}}const x="mindbridge_profiles",X="mindbridge_settings",Ie=2;function Ee(n){return n.commands.some(e=>!e.featureVector||e.featureVector.length===0)}function y(){try{const n=localStorage.getItem(x);if(!n)return[];const e=JSON.parse(n),t=e.map(i=>Ee(i)?ce(i):i);return t.some((i,s)=>i!==e[s])&&B(t),t}catch{return[]}}function B(n){localStorage.setItem(x,JSON.stringify(n)),localStorage.setItem(`${x}_version`,String(Ie))}function q(n){const e=y(),t=e.findIndex(i=>i.id===n.id);t>=0?e[t]=n:e.push(n),B(e)}function ke(n){B(y().filter(e=>e.id!==n))}function Pe(){try{const n=localStorage.getItem(X);return n?JSON.parse(n):{inputSource:"simulator",autoDemo:!1,noiseInjection:!1,activeProfileId:null}}catch{return{inputSource:"simulator",autoDemo:!1,noiseInjection:!1,activeProfileId:null}}}function L(n){localStorage.setItem(X,JSON.stringify(n))}function Z(){const n=y(),e=n.find(i=>i.name==="MS Demo User");if(e)return e;if(n.length>0)return n[0];const t=Y("MS Demo User");return q(t),t}class Le{constructor(e,t){r(this,"root");r(this,"canvases",[]);r(this,"rawCanvases",[]);r(this,"histories",Array.from({length:p},()=>[]));r(this,"rawHistories",Array.from({length:p},()=>[]));r(this,"intentEl");r(this,"confidenceEl");r(this,"previewEl");r(this,"firedEl");r(this,"statusEl");r(this,"logEl");r(this,"gloveContainer");r(this,"metricsEl");r(this,"inputMetricsEl");r(this,"onGloveMount");r(this,"mounted",!1);this.root=e,this.onGloveMount=t,this.build()}build(){this.root.innerHTML=`
      <div class="dashboard-grid">
        <section class="panel signals-panel">
          <h2>Live Pressure Signals</h2>
          <p class="hint">Top row: raw input · Bottom row: filtered (post baseline, gain, noise gate)</p>
          <div class="signal-grid" id="signal-grid-raw"></div>
          <div class="signal-grid signal-grid-filtered" id="signal-grid"></div>
          <div class="signal-meta" id="signal-meta"></div>
          <div class="profile-metrics" id="profile-metrics"></div>
        </section>
        <section class="panel intent-panel">
          <h2>Intent Detection</h2>
          <div class="intent-split">
            <div class="intent-block intent-preview-block">
              <span class="intent-block-label">Live preview</span>
              <div class="intent-display">
                <span class="intent-label intent-preview-label">Rest</span>
                <span class="intent-confidence intent-preview-confidence">—</span>
              </div>
              <p class="intent-block-hint" id="preview-hint">Drives glove animation in real time</p>
            </div>
            <div class="intent-block intent-fired-block">
              <span class="intent-block-label">Command sent</span>
              <div class="intent-display">
                <span class="intent-label intent-fired-label">—</span>
                <span class="intent-confidence intent-fired-confidence">—</span>
              </div>
              <p class="intent-block-hint" id="fired-hint">Fires after stable match (debounced)</p>
            </div>
          </div>
          <div class="intent-status" id="intent-status">Waiting for input…</div>
          <div class="input-metrics" id="input-metrics"></div>
        </section>
        <section class="panel glove-panel">
          <h2>Virtual Assistive Glove</h2>
          <div class="glove-wrap" id="glove-wrap"></div>
        </section>
        <section class="panel log-panel">
          <h2>Command Log</h2>
          <ul class="command-log" id="command-log"></ul>
        </section>
      </div>
    `;const e=this.root.querySelector("#signal-grid-raw"),t=this.root.querySelector("#signal-grid");for(let i=0;i<p;i++)for(const s of[e,t]){const a=document.createElement("div");a.className="signal-cell",a.innerHTML=`<label>Sensor ${i+1}${s===e?" (raw)":""}</label>`;const o=document.createElement("canvas");o.width=200,o.height=40,a.appendChild(o),s.appendChild(a),s===e?this.rawCanvases.push(o):this.canvases.push(o)}this.intentEl=this.root.querySelector(".intent-preview-label"),this.confidenceEl=this.root.querySelector(".intent-preview-confidence"),this.previewEl=this.root.querySelector(".intent-preview-label"),this.firedEl=this.root.querySelector(".intent-fired-label"),this.statusEl=this.root.querySelector("#intent-status"),this.logEl=this.root.querySelector("#command-log"),this.gloveContainer=this.root.querySelector("#glove-wrap"),this.metricsEl=this.root.querySelector("#profile-metrics"),this.inputMetricsEl=this.root.querySelector("#input-metrics"),this.mounted||(this.onGloveMount(this.gloveContainer),this.mounted=!0)}update(e,t,i,s){if(e.frame){e.frame.raw.forEach((c,d)=>{this.rawHistories[d].push(c),this.rawHistories[d].length>$&&this.rawHistories[d].shift(),this.drawSparkline(this.rawCanvases[d],this.rawHistories[d],"#6b8cae",1)}),e.frame.normalized.forEach((c,d)=>{this.histories[d].push(c),this.histories[d].length>$&&this.histories[d].shift(),this.drawSparkline(this.canvases[d],this.histories[d],"#38bdb0",.5)});const h=this.root.querySelector("#signal-meta");h.innerHTML=`
        <span class="badge ${e.frame.active?"badge-active":""}">${e.frame.active?"Active signal":"Below threshold"}</span>
        <span>Channels: ${p}</span>
        <span>Rate: ${s.framesPerSecond} Hz</span>
      `}i&&(this.metricsEl.innerHTML=`
        <div class="metric-chip"><span>Gain</span><strong>${i.gain.toFixed(2)}×</strong></div>
        <div class="metric-chip"><span>Noise gate</span><strong>${i.noiseThreshold.toFixed(2)}</strong></div>
        <div class="metric-chip"><span>Baseline avg</span><strong>${(i.baseline.reduce((h,c)=>h+c,0)/i.baseline.length).toFixed(3)}</strong></div>
      `),this.inputMetricsEl.innerHTML=`
      <span class="badge ${s.connected?"badge-active":""}">${s.sourceLabel}</span>
      <span>${s.status}</span>
    `;const a=e.intent,o=e.previewCommand.replace(/_/g," ");this.previewEl.textContent=o,this.root.querySelector(".intent-preview-confidence").textContent=`${Math.round(e.previewConfidence*100)}%`,this.previewEl.className=`intent-label intent-preview-label ${e.previewConfidence>=.35?"intent-stable":""}`;const l=this.root.querySelector(".intent-fired-label"),u=this.root.querySelector(".intent-fired-confidence");e.lastCommand&&e.lastCommandAt?(l.textContent=e.lastCommand.replace(/_/g," "),u.textContent=`${Math.round(e.lastFiredConfidence*100)}%`,l.className="intent-label intent-fired-label intent-fired-active"):(l.textContent="—",u.textContent="—",l.className="intent-label intent-fired-label"),a.stable&&a.commandId&&a.commandId!=="rest"?this.statusEl.textContent=`Stable match — command will send: ${a.label}`:a.commandId?this.statusEl.textContent=`Matching ${a.label}… hold steady`:this.statusEl.textContent="Analyzing pressure pattern…",this.logEl.innerHTML=t.slice(0,12).map(h=>`<li><time>${new Date(h.timestamp).toLocaleTimeString()}</time> <strong>${h.label}</strong> <span>${Math.round(h.confidence*100)}%</span></li>`).join("")||'<li class="empty">No commands fired yet</li>'}drawSparkline(e,t,i,s){const a=e.getContext("2d");if(!a||t.length===0)return;const o=e.width,l=e.height;a.clearRect(0,0,o,l),a.strokeStyle="rgba(143, 163, 184, 0.2)",a.beginPath(),a.moveTo(0,l*.75),a.lineTo(o,l*.75),a.stroke(),a.strokeStyle=i,a.lineWidth=2,a.beginPath(),t.forEach((u,h)=>{const c=h/Math.max(1,$-1)*o,d=l-Math.min(s,u)/s*(l-4)-2;h===0?a.moveTo(c,d):a.lineTo(c,d)}),a.stroke()}}const U=3,G=.55;class Te{constructor(e,t,i,s){r(this,"root");r(this,"pipeline");r(this,"simulator");r(this,"step","intro");r(this,"profileName","New Profile");r(this,"commandIndex",0);r(this,"validationIndex",0);r(this,"validationSuccesses",0);r(this,"validationResults",{open_hand:{pass:0,fail:0},close_hand:{pass:0,fail:0},pinch:{pass:0,fail:0},rest:{pass:0,fail:0}});r(this,"onComplete");r(this,"tickTimer",null);r(this,"validationTimer",null);this.root=e,this.pipeline=t,this.simulator=i,this.onComplete=s,this.render()}destroy(){this.tickTimer&&clearInterval(this.tickTimer),this.validationTimer&&clearInterval(this.validationTimer)}render(){this.pipeline.getCalibrationSession();const e=g[this.commandIndex],t=g[this.validationIndex],i={intro:`
        <p>Calibration teaches MindBridge your unique pressure patterns. You'll record a rest baseline, train each command, then validate recognition live.</p>
        <label class="field">
          <span>Profile name</span>
          <input type="text" id="profile-name" value="${this.profileName}" />
        </label>
        <button class="btn btn-primary" id="wizard-next">Start calibration</button>
      `,baseline:`
        <p>Relax — recording rest baseline for 5 seconds. Keep sensors at neutral pressure.</p>
        <div class="live-cal-bar" id="live-cal-bar"></div>
        <div class="progress-bar"><div class="progress-fill" id="record-progress" style="width: 0%"></div></div>
        <p class="hint">Samples captured: <strong id="sample-count">0</strong></p>
      `,commands:`
        <p>Train command <strong>${this.commandIndex+1}/${g.length}</strong>: <em>${e.label}</em></p>
        <p class="hint">${e.description}</p>
        <p>Hold the pattern for 3 seconds. Pattern is applied automatically — adjust sliders if using manual mode.</p>
        <button class="btn btn-secondary" id="apply-pattern">Re-apply pattern</button>
        <div class="live-cal-bar" id="live-cal-bar"></div>
        <div class="progress-bar"><div class="progress-fill" id="record-progress" style="width: 0%"></div></div>
        <p class="hint">Samples captured: <strong id="sample-count">0</strong></p>
      `,validate:`
        <p>Live validation — perform: <strong>${t.label}</strong> (${this.validationSuccesses}/${U} successes)</p>
        <p class="hint">${t.description}. Match confidence must exceed ${Math.round(G*100)}%.</p>
        <button class="btn btn-secondary" id="apply-validation-pattern">Show demo pattern</button>
        <div class="validation-score">
          <div class="validation-meter"><div class="validation-fill" id="validation-fill" style="width: 0%"></div></div>
          <span id="validation-score-label">0%</span>
        </div>
        <ul class="trained-list" id="validation-summary">
          ${g.filter(s=>s.id!=="rest").map(s=>{const a=this.validationResults[s.id];return`<li>${s.label}: ${a.pass} pass / ${a.fail} fail <button class="btn btn-sm btn-secondary" data-retrain="${s.id}">Retrain</button></li>`}).join("")}
        </ul>
        <div class="wizard-actions">
          <button class="btn btn-secondary" id="skip-validation">Skip to save</button>
          <button class="btn btn-primary" id="save-profile" ${this.allValidated()?"":"disabled"}>Save profile</button>
        </div>
      `,done:`
        <p class="success">Profile saved and activated. Open Dashboard with auto-demo to test end-to-end.</p>
      `};this.root.innerHTML=`
      <div class="wizard panel">
        <div class="wizard-steps">
          ${["intro","baseline","commands","validate","done"].map(s=>`<span class="wizard-step ${s===this.step?"active":""}">${s}</span>`).join("")}
        </div>
        <div class="wizard-body">${i[this.step]}</div>
      </div>
    `,this.bindEvents(),this.step==="validate"&&this.startValidationRound()}bindEvents(){var e,t,i,s,a,o;(e=this.root.querySelector("#wizard-next"))==null||e.addEventListener("click",()=>this.startBaseline()),(t=this.root.querySelector("#apply-pattern"))==null||t.addEventListener("click",()=>{this.simulator.applyCommandPattern(g[this.commandIndex].id)}),(i=this.root.querySelector("#apply-validation-pattern"))==null||i.addEventListener("click",()=>{this.simulator.applyCommandPattern(g[this.validationIndex].id)}),(s=this.root.querySelector("#save-profile"))==null||s.addEventListener("click",()=>this.saveProfile()),(a=this.root.querySelector("#skip-validation"))==null||a.addEventListener("click",()=>this.saveProfile()),(o=this.root.querySelector("#profile-name"))==null||o.addEventListener("input",l=>{this.profileName=l.target.value||"New Profile"}),this.root.querySelectorAll("[data-retrain]").forEach(l=>{l.addEventListener("click",()=>{const u=l.dataset.retrain;this.retrainCommand(u)})})}allValidated(){return g.filter(e=>e.id!=="rest").every(e=>this.validationResults[e.id].pass>=1)}startBaseline(){const e=this.pipeline.getCalibrationSession();e.reset(),this.simulator.applyCommandPattern("rest"),e.startBaselineRecording(),this.step="baseline",this.render(),this.runRecording(5e3,()=>{e.stopRecording(),this.commandIndex=0,this.step="commands",this.render(),this.startCommandRecord()})}startCommandRecord(){const e=g[this.commandIndex],t=this.pipeline.getCalibrationSession();this.simulator.applyCommandPattern(e.id),t.startCommandRecording(e.id),this.runRecording(3e3,()=>{t.stopRecording(),this.commandIndex++,this.commandIndex<g.length?(this.render(),this.startCommandRecord()):(this.validationIndex=0,this.validationSuccesses=0,this.step="validate",this.render())})}retrainCommand(e){const t=this.pipeline.getCalibrationSession();t.clearCommandSamples(e),this.simulator.applyCommandPattern(e),t.startCommandRecording(e),this.step="commands",this.commandIndex=g.findIndex(i=>i.id===e),this.render(),this.runRecording(3e3,()=>{t.stopRecording(),this.validationResults[e]={pass:0,fail:0},this.validationIndex=g.findIndex(i=>i.id===e),this.validationSuccesses=0,this.step="validate",this.render()})}startValidationRound(){this.validationTimer&&clearInterval(this.validationTimer);const e=g[this.validationIndex];if(e.id==="rest"){this.advanceValidationCommand();return}this.simulator.applyCommandPattern(e.id),this.validationSuccesses=0,this.validationTimer=setInterval(()=>{const t=this.pipeline.getState(),i=this.pipeline.getCalibrationSession().buildProfile("_tmp","_tmp"),s=t.frame,a=this.root.querySelector("#validation-fill"),o=this.root.querySelector("#validation-score-label");if(s){const l=this.pipeline.getIntentEngine().scoreAgainstCommand(s,i,e.id);a&&(a.style.width=`${Math.round(l*100)}%`),o&&(o.textContent=`${Math.round(l*100)}%`),l>=G&&(this.validationSuccesses++,this.validationResults[e.id].pass++,this.validationSuccesses>=U&&this.advanceValidationCommand())}this.updateLiveCalBar()},100)}advanceValidationCommand(){this.validationTimer&&clearInterval(this.validationTimer);const e=g.filter(s=>s.id!=="rest"),i=e.findIndex(s=>s.id===g[this.validationIndex].id)+1;if(i<e.length)this.validationIndex=g.findIndex(s=>s.id===e[i].id),this.validationSuccesses=0,this.render();else{const s=this.root.querySelector("#save-profile");s&&(s.disabled=!1),this.validationTimer&&clearInterval(this.validationTimer)}}runRecording(e,t){const i=this.pipeline.getCalibrationSession(),s=Date.now();this.tickTimer&&clearInterval(this.tickTimer),this.tickTimer=setInterval(()=>{const a=Date.now()-s,o=Math.min(100,a/e*100),l=this.root.querySelector("#record-progress"),u=this.root.querySelector("#sample-count");if(l&&(l.style.width=`${o}%`),u){const h=i.getRecordTarget();u.textContent=String(h==="baseline"?i.getBaselineSampleCount():h?i.getCommandSampleCount(h):0)}this.updateLiveCalBar(),a>=e&&(this.tickTimer&&clearInterval(this.tickTimer),this.tickTimer=null,t())},50)}updateLiveCalBar(){const e=this.root.querySelector("#live-cal-bar"),t=this.pipeline.getState().frame;!e||!t||(e.innerHTML=t.normalized.map((i,s)=>`<div class="live-cal-cell" title="Sensor ${s+1}"><div class="live-cal-fill" style="height: ${Math.min(100,i*200)}%"></div></div>`).join(""))}saveProfile(){this.validationTimer&&clearInterval(this.validationTimer);const e=this.pipeline.getCalibrationSession(),t=`profile_${Date.now()}`,i=e.buildProfile(t,this.profileName);q(i),this.onComplete(i),this.step="done",this.render()}}class Me{constructor(e,t,i,s,a,o){r(this,"root");r(this,"simulator");r(this,"bluetooth");r(this,"serial");r(this,"callbacks");r(this,"inputSource");r(this,"lastPacket","");r(this,"inputMetrics");this.root=e,this.simulator=t,this.bluetooth=i,this.serial=s,this.inputSource=a,this.callbacks=o,this.inputMetrics={framesPerSecond:0,lastFrameAt:null,connected:!1,sourceLabel:"",status:""},i.onPacket(l=>{this.lastPacket=l,this.refreshPacketLog()}),s.onPacket(l=>{this.lastPacket=l,this.refreshPacketLog()}),this.render()}setInputMetrics(e){this.inputMetrics=e;const t=this.root.querySelector("#input-status-live");t&&(t.innerHTML=`
        <span class="badge ${e.connected?"badge-active":""}">${e.sourceLabel}</span>
        <span>${e.status}</span>
        <span>${e.framesPerSecond} Hz</span>
      `)}render(){const e=this.simulator.getValues(),t=this.inputSource==="simulator",i=this.bluetooth.connected||this.serial.connected;this.root.innerHTML=`
      <div class="devices-layout">
        <section class="panel">
          <h2>Input Source</h2>
          <div class="source-selector">
            <label class="source-option ${t?"active":""}">
              <input type="radio" name="input-source" value="simulator" ${t?"checked":""} />
              <span>Pressure Simulator</span>
            </label>
            <label class="source-option ${this.inputSource==="bluetooth"?"active":""}">
              <input type="radio" name="input-source" value="bluetooth" ${this.inputSource==="bluetooth"?"checked":""} />
              <span>BLE Wristband</span>
            </label>
            <label class="source-option ${this.inputSource==="serial"?"active":""}">
              <input type="radio" name="input-source" value="serial" ${this.inputSource==="serial"?"checked":""} />
              <span>Serial / Arduino</span>
            </label>
          </div>
          <div class="input-status-live" id="input-status-live"></div>
        </section>

        <section class="panel ${t?"":"panel-disabled"}">
          <h2>Pressure Simulator</h2>
          <p class="hint">Stand-in for the MindBridge wristband. Disabled when hardware input is active.</p>
          <div class="toggle-row">
            <label class="toggle">
              <input type="checkbox" id="auto-demo" ${this.simulator.isAutoDemo()?"checked":""} ${t?"":"disabled"} />
              <span>Auto-demo mode (MS-like variability)</span>
            </label>
            <label class="toggle">
              <input type="checkbox" id="noise-injection" ${this.simulator.isNoiseInjection()?"checked":""} ${t?"":"disabled"} />
              <span>Inject noise (test filtering)</span>
            </label>
          </div>
          <div class="slider-grid" id="slider-grid">
            ${e.map((s,a)=>`
              <label class="slider-field">
                <span>Sensor ${a+1}</span>
                <input type="range" min="0" max="100" value="${Math.round(s*100)}" data-index="${a}" ${t?"":"disabled"} />
                <output>${Math.round(s*100)}%</output>
              </label>
            `).join("")}
          </div>
        </section>

        <section class="panel">
          <h2>Hardware Connection</h2>
          <p class="hint">Connect a wristband transmitting newline-delimited JSON packets.</p>
          <div class="adapter-cards">
            <div class="adapter-card">
              <h3>BLE Wristband</h3>
              <p>${this.bluetooth.getStatus()}</p>
              <code>{ "t": 1717000000, "sensors": [0.12, 0.08, 0.31, 0.05, 0.19, 0.11] }</code>
              <p class="hint">Service UUID: MindBridge custom or Nordic UART (NUS)</p>
              <button class="btn btn-primary" id="connect-ble" ${this.bluetooth.connected?"disabled":""}>Connect BLE</button>
            </div>
            <div class="adapter-card">
              <h3>Serial / Arduino</h3>
              <p>${this.serial.getStatus()}</p>
              <code>{ "t": 1717000000, "sensors": [0.12, 0.08, 0.31, 0.05, 0.19, 0.11] }</code>
              <p class="hint">115200 baud, one JSON object per line</p>
              <button class="btn btn-primary" id="connect-serial" ${this.serial.connected?"disabled":""}>Connect Serial</button>
            </div>
          </div>
          ${i?'<button class="btn btn-secondary" id="disconnect-hw">Disconnect hardware</button>':""}
          <div class="packet-inspector">
            <h3>Last packet</h3>
            <pre id="packet-log">${this.lastPacket||"No packets received yet"}</pre>
          </div>
        </section>
      </div>
    `,this.bindEvents(),this.setInputMetrics(this.inputMetrics)}bindEvents(){var e,t,i,s,a;this.root.querySelectorAll('input[name="input-source"]').forEach(o=>{o.addEventListener("change",()=>{o.checked&&(this.inputSource=o.value,this.callbacks.onInputSourceChange(this.inputSource))})}),(e=this.root.querySelector("#auto-demo"))==null||e.addEventListener("change",o=>{const l=o.target.checked;this.simulator.setAutoDemo(l),this.callbacks.onSettingsChange("autoDemo",l)}),(t=this.root.querySelector("#noise-injection"))==null||t.addEventListener("change",o=>{const l=o.target.checked;this.simulator.setNoiseInjection(l),this.callbacks.onSettingsChange("noiseInjection",l)}),(i=this.root.querySelector("#connect-ble"))==null||i.addEventListener("click",()=>{this.callbacks.onConnectBle().then(()=>this.render())}),(s=this.root.querySelector("#connect-serial"))==null||s.addEventListener("click",()=>{this.callbacks.onConnectSerial().then(()=>this.render())}),(a=this.root.querySelector("#disconnect-hw"))==null||a.addEventListener("click",()=>{this.callbacks.onDisconnectHardware().then(()=>this.render())}),this.root.querySelectorAll('input[type="range"]').forEach(o=>{o.addEventListener("input",()=>{const l=Number(o.dataset.index);this.simulator.setSlider(l,Number(o.value)/100);const u=o.nextElementSibling;u&&(u.textContent=`${o.value}%`)})})}refreshSliders(){if(!this.root.querySelector("#slider-grid"))return;const e=this.simulator.getValues();this.root.querySelectorAll('input[type="range"]').forEach(t=>{const i=Number(t.dataset.index);if(i>=0&&i<p){t.value=String(Math.round(e[i]*100));const s=t.nextElementSibling;s&&(s.textContent=`${Math.round(e[i]*100)}%`)}})}refreshPacketLog(){const e=this.root.querySelector("#packet-log");e&&(e.textContent=this.lastPacket||"No packets received yet")}updateSource(e){this.inputSource=e,this.render()}}const v=new Ce,N=new ae,f=new me(v.simulator,N);let m=Pe(),w=Z();if(m.activeProfileId){const n=y().find(e=>e.id===m.activeProfileId);n&&(w=n)}f.setProfile(w);let ee="dashboard",P=null,T=null,S=null;const Ae=document.getElementById("app");Ae.innerHTML=`
  <header class="app-header">
    <div class="brand">
      <span class="brand-mark">MB</span>
      <div>
        <h1>MindBridge</h1>
        <p class="tagline">Intent translation for assistive technology</p>
      </div>
    </div>
    <nav class="main-nav" id="main-nav">
      <button data-view="dashboard" class="nav-btn active">Dashboard</button>
      <button data-view="calibrate" class="nav-btn">Calibrate</button>
      <button data-view="profiles" class="nav-btn">Profiles</button>
      <button data-view="devices" class="nav-btn">Devices</button>
      <button data-view="about" class="nav-btn">About</button>
    </nav>
    <div class="header-status">
      <span class="status-dot" id="status-dot"></span>
      <span id="header-profile">${w.name}</span>
      <span id="header-input" class="header-input-label"></span>
    </div>
  </header>
  <main class="app-main" id="app-main">
    <div id="view-dashboard" class="view-pane"></div>
    <div id="view-calibrate" class="view-pane hidden"></div>
    <div id="view-profiles" class="view-pane hidden"></div>
    <div id="view-devices" class="view-pane hidden"></div>
    <div id="view-about" class="view-pane hidden"></div>
  </main>
`;const I={dashboard:document.getElementById("view-dashboard"),calibrate:document.getElementById("view-calibrate"),profiles:document.getElementById("view-profiles"),devices:document.getElementById("view-devices"),about:document.getElementById("view-about")};function te(n){ee=n,document.querySelectorAll(".nav-btn").forEach(e=>{e.classList.toggle("active",e.dataset.view===n)}),Object.entries(I).forEach(([e,t])=>{t.classList.toggle("hidden",e!==n)}),$e(n)}function $e(n){switch(n){case"dashboard":P||(P=new Le(I.dashboard,e=>{N.setContainer(e),N.renderDom()}),P.update(f.getState(),f.getCommandLog(),w,f.getInputMetrics()));break;case"calibrate":T==null||T.destroy(),T=new Te(I.calibrate,f,v.simulator,e=>{w=e,f.setProfile(e),m.activeProfileId=e.id,L(m),E()});break;case"profiles":M(I.profiles);break;case"devices":S?S.updateSource(m.inputSource):S=new Me(I.devices,v.simulator,v.bluetooth,v.serial,m.inputSource,{onSettingsChange:(e,t)=>{m={...m,[e]:t},L(m)},onInputSourceChange:e=>void De(e),onConnectBle:()=>z("bluetooth"),onConnectSerial:()=>z("serial"),onDisconnectHardware:()=>ie()}),S.setInputMetrics(f.getInputMetrics());break;case"about":xe(I.about);break}}async function De(n){m.inputSource=n,L(m),n==="simulator"&&(await ie(),await f.setInputAdapter(v.simulator),v.simulator.setAutoDemo(m.autoDemo),v.simulator.setNoiseInjection(m.noiseInjection)),S==null||S.updateSource(n),E()}async function z(n){try{v.simulator.setAutoDemo(!1);const e=await v.connectHardware(n);await f.setInputAdapter(e),m.inputSource=n,L(m),E()}catch(e){alert(e instanceof Error?e.message:"Connection failed")}}async function ie(){await v.bluetooth.disconnect().catch(()=>{}),await v.serial.disconnect().catch(()=>{}),m.inputSource==="simulator"&&await f.setInputAdapter(v.simulator),E()}function M(n){var t;const e=y();n.innerHTML=`
    <div class="profiles-layout">
      <section class="panel">
        <h2>User Profiles</h2>
        <p class="hint">Each profile stores baseline, gain, and trained command templates for a specific user.</p>
        <ul class="profile-list">
          ${e.map(i=>`
            <li class="profile-item ${i.id===w.id?"active":""}">
              <div>
                <strong>${i.name}</strong>
                <span>Gain ${i.gain.toFixed(2)}× · Updated ${new Date(i.updatedAt).toLocaleDateString()}</span>
              </div>
              <div class="profile-actions">
                <button class="btn btn-secondary btn-sm" data-select="${i.id}">Activate</button>
                <button class="btn btn-danger btn-sm" data-delete="${i.id}">Delete</button>
              </div>
            </li>
          `).join("")}
        </ul>
        <button class="btn btn-primary" id="create-demo-profile">Create demo profile</button>
      </section>
    </div>
  `,n.querySelectorAll("[data-select]").forEach(i=>{i.addEventListener("click",()=>{const s=i.dataset.select,a=y().find(o=>o.id===s);a&&D(a),M(n)})}),n.querySelectorAll("[data-delete]").forEach(i=>{i.addEventListener("click",()=>{const s=i.dataset.delete;if(y().length<=1){alert("Keep at least one profile.");return}ke(s),w.id===s&&D(Z()),M(n)})}),(t=n.querySelector("#create-demo-profile"))==null||t.addEventListener("click",()=>{const i=Y(`Profile ${y().length+1}`);q(i),D(i),M(n)})}function xe(n){n.innerHTML=`
    <article class="about panel">
      <h2>About MindBridge</h2>
      <p>MindBridge maps wristband pressure micro-signals into commands for assistive devices — a universal compatibility layer between human intent and hardware.</p>
      <h3>Hardware setup</h3>
      <p>Firmware should emit one JSON line per reading:</p>
      <code>{ "t": 1717000000, "sensors": [0.12, 0.08, 0.31, 0.05, 0.19, 0.11] }</code>
      <p>BLE: MindBridge GATT service or Nordic UART. Serial: 115200 baud.</p>
      <h3>Demo script</h3>
      <ol>
        <li>Activate a profile under Profiles</li>
        <li>Devices → enable Auto-demo → Dashboard</li>
        <li>Watch live preview drive the glove; sent commands appear separately</li>
        <li>Calibrate → validate → save a custom profile</li>
      </ol>
    </article>
  `}function D(n){w=n,f.setProfile(n),m.activeProfileId=n.id,L(m),E()}function E(){const n=document.getElementById("header-profile");n&&(n.textContent=w.name);const e=document.getElementById("header-input");e&&(e.textContent=f.getInputMetrics().sourceLabel);const t=document.getElementById("status-dot");t&&(t.className=`status-dot ${f.getInputMetrics().connected?"online":""}`)}document.getElementById("main-nav").addEventListener("click",n=>{const e=n.target.closest(".nav-btn");e!=null&&e.dataset.view&&te(e.dataset.view)});v.simulator.setAutoDemo(m.autoDemo);v.simulator.setNoiseInjection(m.noiseInjection);f.onUpdate((n,e)=>{const t=f.getInputMetrics();P&&P.update(n,f.getCommandLog(),w,t),S&&ee==="devices"&&(S.setInputMetrics(t),v.simulator.isAutoDemo()&&m.inputSource==="simulator"&&S.refreshSliders()),E()});async function Ne(){m.inputSource==="simulator"&&await f.setInputAdapter(v.simulator),await f.start(),te("dashboard")}Ne();
