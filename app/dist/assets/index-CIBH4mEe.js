var ne=Object.defineProperty;var ae=(a,e,t)=>e in a?ne(a,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):a[e]=t;var r=(a,e,t)=>ae(a,typeof e!="symbol"?e+"":e,t);(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))i(s);new MutationObserver(s=>{for(const n of s)if(n.type==="childList")for(const o of n.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&i(o)}).observe(document,{childList:!0,subtree:!0});function t(s){const n={};return s.integrity&&(n.integrity=s.integrity),s.referrerPolicy&&(n.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?n.credentials="include":s.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function i(s){if(s.ep)return;s.ep=!0;const n=t(s);fetch(s.href,n)}})();const B={rest:{fingers:[0,0,0,0],thumb:20},open_hand:{fingers:[75,80,78,72],thumb:45},close_hand:{fingers:[8,8,8,8],thumb:55},pinch:{fingers:[5,5,60,55],thumb:70}};class re{constructor(){r(this,"id","virtual_glove");r(this,"label","Virtual Assistive Glove");r(this,"connected",!1);r(this,"previewCommand","rest");r(this,"previewConfidence",0);r(this,"firedCommand",null);r(this,"firedAt",0);r(this,"lastEvent",null);r(this,"container",null);r(this,"onStateChange",null);r(this,"displayPose",{fingers:[...B.rest.fingers],thumb:B.rest.thumb});r(this,"animFrame",null)}setContainer(e){this.container=e,this.renderDom()}setOnStateChange(e){this.onStateChange=e}getPreviewCommand(){return this.previewCommand}getLastEvent(){return this.lastEvent}async connect(){this.connected=!0}async disconnect(){this.connected=!1,this.previewCommand="rest",this.firedCommand=null}setPreview(e,t){this.connected&&(this.previewCommand=e,this.previewConfidence=t,this.animateTowardTarget())}send(e){var t;this.connected&&(this.firedCommand=e.commandId,this.firedAt=Date.now(),this.lastEvent=e,(t=this.onStateChange)==null||t.call(this,e.commandId,e),this.animateTowardTarget())}getStatus(){return this.connected?`Preview: ${this.previewCommand.replace("_"," ")}`:"Disconnected"}renderDom(){if(this.container){if(this.container.querySelector(".glove-svg")){this.updateSvgPaths();return}this.container.innerHTML=`
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
    `,this.updateSvgPaths()}}animateTowardTarget(){if(this.animFrame!==null)return;const e=()=>{var d,h,u;const t=B[this.previewCommand],i=.08+this.previewConfidence*.12;let s=!0;this.displayPose.fingers=this.displayPose.fingers.map((p,w)=>{const $=p+(t.fingers[w]-p)*i;return Math.abs($-t.fingers[w])>.5&&(s=!1),$});const n=this.displayPose.thumb+(t.thumb-this.displayPose.thumb)*i;Math.abs(n-t.thumb)>.5&&(s=!1),this.displayPose.thumb=n,this.updateSvgPaths();const o=(d=this.container)==null?void 0:d.querySelector(".glove-fired-ring");o&&this.firedCommand&&Date.now()-this.firedAt<500?o.classList.add("pulse"):o&&o.classList.remove("pulse");const l=(h=this.container)==null?void 0:h.querySelector("#glove-preview-label");l&&(l.textContent=this.previewCommand.replace(/_/g," "));const c=(u=this.container)==null?void 0:u.querySelector("#glove-fired-label");c&&this.lastEvent&&(c.textContent=`${this.lastEvent.label} (${Math.round(this.lastEvent.confidence*100)}%)`),s?this.animFrame=null:this.animFrame=requestAnimationFrame(e)};this.animFrame=requestAnimationFrame(e)}updateSvgPaths(){if(!this.container)return;const e=this.displayPose;for(let i=0;i<4;i++){const s=this.container.querySelector(`[data-finger="${i}"]`);if(!s)continue;const n=48+i*22,o=e.fingers[i],l=30+o*.55,c=55+o*.35;s.setAttribute("d",`M ${n} 95 Q ${n-4} ${c} ${n} ${l}`)}const t=this.container.querySelector(".glove-thumb");if(t){const i=18+e.thumb*.15,s=70-e.thumb*.2;t.setAttribute("d",`M 28 88 Q ${i} ${s} 42 52`)}}}const J=[{id:"open_hand",label:"Open Hand",description:"Extend fingers outward — index and middle sensors rise."},{id:"close_hand",label:"Close Hand",description:"Make a fist — all sensors rise evenly."},{id:"pinch",label:"Pinch",description:"Thumb and index pressure — sensors 0 and 2 activate."},{id:"rest",label:"Rest",description:"Neutral relaxed state — minimal activation."}],P=Object.fromEntries(J.map(a=>[a.id,a.label]));function K(){return[{id:"open_hand",label:"Open Hand",description:"Extend fingers outward",samples:[[.08,.35,.42,.38,.12,.08],[.07,.33,.4,.36,.11,.07]],featureVector:[]},{id:"close_hand",label:"Close Hand",description:"Make a fist",samples:[[.45,.48,.52,.5,.44,.42],[.43,.46,.5,.48,.42,.4]],featureVector:[]},{id:"pinch",label:"Pinch",description:"Thumb and index",samples:[[.55,.1,.52,.08,.12,.1],[.52,.09,.5,.07,.11,.09]],featureVector:[]},{id:"rest",label:"Rest",description:"Neutral relaxed",samples:[[.05,.06,.05,.06,.05,.05],[.06,.05,.06,.05,.06,.05]],featureVector:[]}]}const b=6,oe=50,x=120;class Y{constructor(){r(this,"rollingBuffers",Array.from({length:b},()=>[]));r(this,"windowSize",5)}process(e,t){const i=(t==null?void 0:t.baseline)??Array(b).fill(.05),s=(t==null?void 0:t.gain)??2.5,n=(t==null?void 0:t.noiseThreshold)??.08;return this.processValues(e.timestamp,e.sensors,i,s,n)}processValues(e,t,i,s,n){const d=t.map((h,u)=>{const p=h-(i[u]??.05);return Math.max(0,p*s)}).map((h,u)=>(this.rollingBuffers[u].push(h),this.rollingBuffers[u].length>this.windowSize&&this.rollingBuffers[u].shift(),this.rollingBuffers[u].reduce((p,w)=>p+w,0)/this.rollingBuffers[u].length)).map((h,u)=>{const p=this.rollingBuffers[u].slice(-2,-1)[0]??h;return Math.abs(h-p)>.4?p:h}).map(h=>h<n?0:h-n);return{timestamp:e,raw:t,normalized:d,features:[...d,...d.map(h=>h>0?1:0)],active:d.some(h=>h>.02)}}reset(){this.rollingBuffers=Array.from({length:b},()=>[])}}function le(a){if(a.length===0)return Array(b).fill(.05);const e=Array(b).fill(0);for(const t of a)t.forEach((i,s)=>{e[s]+=i});return e.map(t=>t/a.length)}function ce(a,e){if(e.length===0)return 2.5;let t=0;for(const i of e)i.forEach((s,n)=>{const o=Math.abs(s-(a[n]??.05));o>t&&(t=o)});return t<.05?3.5:Math.min(5,Math.max(1.5,.35/t))}function H(a,e,t,i){if(a.length===0)return[];const s=new Y,n=a.map((c,d)=>{const h=c.slice(0,b);for(;h.length<b;)h.push(.05);return s.processValues(Date.now()+d,h,e,t,i).features}),o=n[0].length,l=Array(o).fill(0);for(const c of n)c.forEach((d,h)=>{l[h]+=d});return l.map(c=>c/n.length)}function V(a,e){if(a.length===0||e.length===0)return 1/0;const t=Math.min(a.length,e.length);let i=0;for(let s=0;s<t;s++)i+=(a[s]-e[s])**2;return Math.sqrt(i)}class Q{constructor(){r(this,"baselineSamples",[]);r(this,"commandSamples",new Map);r(this,"recording",!1);r(this,"recordTarget",null);r(this,"recordStart",0)}startBaselineRecording(){this.baselineSamples=[],this.recording=!0,this.recordTarget="baseline",this.recordStart=Date.now()}startCommandRecording(e){this.recording=!0,this.recordTarget=e,this.recordStart=Date.now(),this.commandSamples.has(e)||this.commandSamples.set(e,[])}stopRecording(){this.recording=!1,this.recordTarget=null}isRecording(){return this.recording}getRecordTarget(){return this.recordTarget}getRecordElapsed(){return this.recording?Date.now()-this.recordStart:0}ingestSample(e){if(!this.recording||!this.recordTarget)return;const t=e.slice(0,b);for(;t.length<b;)t.push(.05);if(this.recordTarget==="baseline")this.baselineSamples.push(t);else{const i=this.commandSamples.get(this.recordTarget)??[];i.push(t),this.commandSamples.set(this.recordTarget,i)}}buildProfile(e,t,i){const s=this.baselineSamples.length>0?le(this.baselineSamples):(i==null?void 0:i.baseline)??Array(b).fill(.05),n=[...this.commandSamples.values()].flat(),o=ce(s,n.length>0?n:[[.2,.2,.2,.2,.2,.2]]),l=(i==null?void 0:i.noiseThreshold)??.08,c=K().map(h=>{const u=this.commandSamples.get(h.id),p=u&&u.length>0?u:h.samples,w=H(p,s,o,l);return{...h,samples:p,featureVector:w}}),d=Date.now();return{id:e,name:t,createdAt:(i==null?void 0:i.createdAt)??d,updatedAt:d,baseline:s,gain:o,noiseThreshold:l,commands:c}}getBaselineSampleCount(){return this.baselineSamples.length}getCommandSampleCount(e){var t;return((t=this.commandSamples.get(e))==null?void 0:t.length)??0}clearCommandSamples(e){this.commandSamples.set(e,[])}reset(){this.baselineSamples=[],this.commandSamples.clear(),this.recording=!1,this.recordTarget=null}}function X(a){const e=new Q;e.startBaselineRecording();for(let t=0;t<40;t++)e.ingestSample([.05,.06,.05,.06,.05,.05]);e.stopRecording();for(const t of K()){e.startCommandRecording(t.id);for(const i of t.samples)e.ingestSample(i);e.stopRecording()}return e.buildProfile(`profile_${Date.now()}`,a)}function de(a){const e=a.commands.map(t=>({...t,featureVector:H(t.samples,a.baseline,a.gain,a.noiseThreshold)}));return{...a,commands:e}}const he=.5,ue=250,j=1.2,U=.35;class me{constructor(){r(this,"stableCommand",null);r(this,"stableSince",0);r(this,"lastFired",null);r(this,"lastFiredAt",0);r(this,"cooldownMs",400)}evaluate(e,t){if(!t||t.commands.length===0)return{commandId:null,label:"No profile",confidence:0,stable:!1};if(!e.active)return this.stableCommand=null,{commandId:"rest",label:P.rest,confidence:.95,stable:!0};const{bestId:i,confidence:s}=this.matchBest(e.features,t.commands),n=e.timestamp;return s>=he&&i&&i!=="rest"?this.stableCommand===i?{commandId:i,label:P[i],confidence:s,stable:n-this.stableSince>=ue}:(this.stableCommand=i,this.stableSince=n,{commandId:i,label:P[i],confidence:s,stable:!1}):(this.stableCommand=null,s>=U&&i?{commandId:i,label:P[i],confidence:s,stable:!1}:{commandId:null,label:"Uncertain",confidence:s,stable:!1})}getPreviewCommand(e){return e.commandId&&e.confidence>=U?e.commandId:"rest"}shouldFire(e,t){return!(!e.stable||!e.commandId||e.commandId==="rest"||this.lastFired===e.commandId&&t-this.lastFiredAt<this.cooldownMs)}markFired(e,t){this.lastFired=e,this.lastFiredAt=t}reset(){this.stableCommand=null,this.stableSince=0,this.lastFired=null,this.lastFiredAt=0}scoreAgainstCommand(e,t,i){const s=t.commands.find(l=>l.id===i);if(!s)return 0;const n=this.resolveTemplate(s,t);if(n.length===0)return 0;const o=V(e.features,n);return Math.max(0,Math.min(1,1-o/j))}matchBest(e,t){let i=null,s=1/0;for(const n of t){if(n.id==="rest")continue;const o=n.featureVector;if(!o||o.length===0)continue;const l=V(e,o);l<s&&(s=l,i=n.id)}return{bestId:i,confidence:Math.max(0,Math.min(1,1-s/j))}}resolveTemplate(e,t){return e.featureVector&&e.featureVector.length>0?e.featureVector:e.samples.length===0?[]:H(e.samples,t.baseline,t.gain,t.noiseThreshold)}}class pe{constructor(e,t){r(this,"input");r(this,"output");r(this,"preprocessor",new Y);r(this,"intentEngine",new me);r(this,"calibrationSession",new Q);r(this,"profile",null);r(this,"timer",null);r(this,"listeners",[]);r(this,"commandLog",[]);r(this,"frameTimestamps",[]);r(this,"lastFiredConfidence",0);r(this,"state",{frame:null,intent:{commandId:null,label:"Idle",confidence:0,stable:!1},previewCommand:"rest",previewConfidence:0,lastCommand:null,lastCommandAt:null,lastFiredConfidence:0});this.input=e,this.output=t}getCalibrationSession(){return this.calibrationSession}getInputAdapter(){return this.input}async setInputAdapter(e){this.input!==e&&this.input.connected&&await this.input.disconnect(),this.input=e,this.preprocessor.reset(),this.frameTimestamps=[],e.id==="simulator"&&!e.connected&&await e.connect()}setProfile(e){this.profile=e,this.preprocessor.reset(),this.intentEngine.reset()}getProfile(){return this.profile}getIntentEngine(){return this.intentEngine}getCommandLog(){return[...this.commandLog]}getState(){return this.state}getInputMetrics(){const e=Date.now();return{framesPerSecond:this.frameTimestamps.filter(i=>e-i<1e3).length,lastFrameAt:this.frameTimestamps.at(-1)??null,connected:this.input.connected,sourceLabel:this.input.label,status:this.input.getStatus()}}isReceivingData(){const e=this.frameTimestamps.at(-1);return e?Date.now()-e<500:!1}onUpdate(e){return this.listeners.push(e),()=>{this.listeners=this.listeners.filter(t=>t!==e)}}async start(){!this.input.connected&&this.input.id==="simulator"&&await this.input.connect(),this.output.connected||await this.output.connect(),!this.timer&&(this.timer=setInterval(()=>this.tick(),oe))}stop(){this.timer&&(clearInterval(this.timer),this.timer=null)}tick(){const e=this.input.read();if(!e)return;this.frameTimestamps.push(e.timestamp),this.frameTimestamps.length>60&&this.frameTimestamps.shift(),this.calibrationSession.isRecording()&&this.calibrationSession.ingestSample(e.sensors);const t=this.preprocessor.process(e,this.profile),i=this.intentEngine.evaluate(t,this.profile),s=this.intentEngine.getPreviewCommand(i),n=[];if(this.updateGlovePreview(s,i.confidence),this.intentEngine.shouldFire(i,e.timestamp)&&i.commandId){const o={commandId:i.commandId,label:P[i.commandId],confidence:i.confidence,timestamp:e.timestamp};this.output.send(o),this.commandLog.unshift(o),this.commandLog.length>50&&this.commandLog.pop(),this.intentEngine.markFired(i.commandId,e.timestamp),this.lastFiredConfidence=i.confidence,n.push(o),this.state={frame:t,intent:i,previewCommand:s,previewConfidence:i.confidence,lastCommand:i.commandId,lastCommandAt:e.timestamp,lastFiredConfidence:i.confidence}}else this.state={...this.state,frame:t,intent:i,previewCommand:s,previewConfidence:i.confidence};for(const o of this.listeners)o(this.state,n)}updateGlovePreview(e,t){var s;const i=this.output;(s=i.setPreview)==null||s.call(i,e,t)}}function G(a){return Z(a)}function fe(a){return Z(a.trim())}function Z(a){if(!a)return null;try{const e=JSON.parse(a);if(!Array.isArray(e.sensors)||e.sensors.length===0)return null;const t=e.sensors.slice(0,b).map(i=>Math.max(0,Math.min(1,Number(i))));for(;t.length<b;)t.push(.05);return{timestamp:e.t??Date.now(),sensors:t}}catch{return null}}const z="12345678-1234-5678-1234-56789abcdef0",ge="12345678-1234-5678-1234-56789abcdef1",W="6e400001-b5a3-f393-e0a9-e50e24dcca9e",be="6e400003-b5a3-f393-e0a9-e50e24dcca9e";class ve{constructor(){r(this,"id","bluetooth");r(this,"label","BLE Wristband");r(this,"connected",!1);r(this,"device",null);r(this,"latestFrame",null);r(this,"lineBuffer","");r(this,"lastPacketLine","");r(this,"packetListeners",[]);r(this,"useNus",!1);r(this,"onDisconnect",null)}setOnDisconnect(e){this.onDisconnect=e}onPacket(e){return this.packetListeners.push(e),()=>{this.packetListeners=this.packetListeners.filter(t=>t!==e)}}getLastPacketLine(){return this.lastPacketLine}async connect(){var s;if(!("bluetooth"in navigator))throw new Error("Web Bluetooth requires Chrome or Edge on desktop.");const e=await navigator.bluetooth.requestDevice({acceptAllDevices:!0,optionalServices:[z,W]});this.device=e,e.addEventListener("gattserverdisconnected",()=>{var n;this.connected=!1,(n=this.onDisconnect)==null||n.call(this)});const t=await((s=e.gatt)==null?void 0:s.connect());if(!t)throw new Error("Could not connect to the BLE device.");let i;try{i=await(await t.getPrimaryService(z)).getCharacteristic(ge),this.useNus=!1}catch{i=await(await t.getPrimaryService(W)).getCharacteristic(be),this.useNus=!0}await i.startNotifications(),i.addEventListener("characteristicvaluechanged",n=>{const o=n.target;o.value&&this.handleIncomingText(new TextDecoder().decode(o.value))}),this.connected=!0,this.lineBuffer=""}async disconnect(){var e,t;(t=(e=this.device)==null?void 0:e.gatt)!=null&&t.connected&&this.device.gatt.disconnect(),this.connected=!1,this.device=null,this.latestFrame=null,this.lineBuffer=""}read(){return this.latestFrame}getStatus(){var t;return this.connected?`${((t=this.device)==null?void 0:t.name)??"BLE device"}${this.useNus?" · Nordic UART":" · MindBridge GATT"}`:"Not connected"}handleIncomingText(e){this.lineBuffer+=e;const t=this.lineBuffer.split(/\r?\n/);this.lineBuffer=t.pop()??"";for(const s of t){const n=s.trim();if(!n)continue;this.lastPacketLine=n;for(const l of this.packetListeners)l(n);const o=G(n);o&&(this.latestFrame=o)}const i=this.lineBuffer.trim();if(i.startsWith("{")&&i.endsWith("}")){const s=G(i);s&&(this.latestFrame=s,this.lastPacketLine=i)}}}class Se{constructor(){r(this,"id","serial");r(this,"label","Serial / Arduino");r(this,"connected",!1);r(this,"port",null);r(this,"reader",null);r(this,"readLoopActive",!1);r(this,"buffer","");r(this,"latestFrame",null);r(this,"lastPacketLine","");r(this,"packetListeners",[])}onPacket(e){return this.packetListeners.push(e),()=>{this.packetListeners=this.packetListeners.filter(t=>t!==e)}}getLastPacketLine(){return this.lastPacketLine}async connect(){if(!("serial"in navigator))throw new Error("Web Serial is not supported. Use Chrome/Edge on desktop.");this.port=await navigator.serial.requestPort(),await this.port.open({baudRate:115200}),this.connected=!0,this.readLoopActive=!0,this.readLoop()}async disconnect(){if(this.readLoopActive=!1,this.reader){try{await this.reader.cancel()}catch{}this.reader=null}if(this.port){try{await this.port.close()}catch{}this.port=null}this.connected=!1,this.latestFrame=null,this.buffer=""}read(){return this.latestFrame}getStatus(){return this.connected?"Connected — Serial device @ 115200 baud":"Not connected"}async readLoop(){var t,i;if(!((t=this.port)!=null&&t.readable))return;this.reader=this.port.readable.getReader();const e=new TextDecoder;try{for(;this.readLoopActive&&this.reader;){const{value:s,done:n}=await this.reader.read();if(n)break;s&&(this.buffer+=e.decode(s,{stream:!0}),this.flushLines())}}catch{this.connected=!1}finally{(i=this.reader)==null||i.releaseLock()}}flushLines(){const e=this.buffer.split(`
`);this.buffer=e.pop()??"";for(const t of e){const i=t.trim();if(!i)continue;this.lastPacketLine=i;for(const n of this.packetListeners)n(i);const s=fe(i);s&&(this.latestFrame=s)}}}class we{constructor(){r(this,"id","simulator");r(this,"label","Pressure Simulator");r(this,"connected",!1);r(this,"values",Array(b).fill(.05));r(this,"autoDemo",!1);r(this,"noiseInjection",!1);r(this,"demoPhase",0);r(this,"demoCommand","rest");r(this,"demoTimer",0)}setSlider(e,t){e>=0&&e<b&&(this.values[e]=Math.max(0,Math.min(1,t)))}getValues(){return[...this.values]}setAutoDemo(e){this.autoDemo=e,e||(this.demoPhase=0,this.demoTimer=0)}isAutoDemo(){return this.autoDemo}setNoiseInjection(e){this.noiseInjection=e}isNoiseInjection(){return this.noiseInjection}async connect(){this.connected=!0}async disconnect(){this.connected=!1,this.autoDemo=!1}getStatus(){return this.connected?this.autoDemo?"Connected — Auto-demo active":"Connected — Manual control":"Disconnected"}read(){if(!this.connected)return null;this.autoDemo&&this.updateAutoDemo();const e=this.values.map((t,i)=>{let s=t;return this.noiseInjection&&(s+=(Math.random()-.5)*.15),s+=(Math.random()-.5)*.02,Math.max(0,Math.min(1,s))});return{timestamp:Date.now(),sensors:e}}applyCommandPattern(e){const t={open_hand:[.08,.35,.42,.38,.12,.08],close_hand:[.45,.48,.52,.5,.44,.42],pinch:[.55,.1,.52,.08,.12,.1],rest:[.05,.06,.05,.06,.05,.05]};this.values=[...t[e]??t.rest]}updateAutoDemo(){if(this.demoTimer+=ye,this.demoTimer>=4e3){this.demoTimer=0;const n=["rest","close_hand","rest","open_hand","rest","pinch"],o=n.indexOf(this.demoCommand);this.demoCommand=n[(o+1)%n.length]}const t=this.getTargetPattern(this.demoCommand),i=Math.min(1,this.demoTimer/800),s=i<.5?2*i*i:1-Math.pow(-2*i+2,2)/2;this.values=t.map((n,o)=>{const c=Math.sin(this.demoPhase+o*.7)*.03;return .05+(n-.05)*s+c}),this.demoPhase+=.08}getTargetPattern(e){const t={open_hand:[.08,.32,.4,.36,.1,.08],close_hand:[.42,.45,.48,.46,.4,.38],pinch:[.5,.08,.48,.07,.1,.08],rest:[.05,.06,.05,.06,.05,.05]};return t[e]??t.rest}}const ye=50;class Ce{constructor(){r(this,"simulator",new we);r(this,"bluetooth",new ve);r(this,"serial",new Se);r(this,"active");r(this,"source","simulator");this.active=this.simulator}getActive(){return this.active}getSource(){return this.source}getAdapter(e){switch(e){case"bluetooth":return this.bluetooth;case"serial":return this.serial;default:return this.simulator}}isHardwareConnected(){return this.bluetooth.connected||this.serial.connected}async useSimulator(){return this.bluetooth.connected&&await this.bluetooth.disconnect().catch(()=>{}),this.serial.connected&&await this.serial.disconnect().catch(()=>{}),this.source="simulator",this.active=this.simulator,this.simulator.connected||await this.simulator.connect(),this.simulator}async connectBluetooth(){return this.simulator.connected&&await this.simulator.disconnect().catch(()=>{}),this.serial.connected&&await this.serial.disconnect().catch(()=>{}),this.source="bluetooth",this.active=this.bluetooth,await this.bluetooth.connect(),this.bluetooth}async connectSerial(){return this.simulator.connected&&await this.simulator.disconnect().catch(()=>{}),this.bluetooth.connected&&await this.bluetooth.disconnect().catch(()=>{}),this.source="serial",this.active=this.serial,await this.serial.connect(),this.serial}async disconnectHardware(){await this.bluetooth.disconnect().catch(()=>{}),await this.serial.disconnect().catch(()=>{})}displayLabel(){return this.source==="simulator"?"Pressure Simulator":this.source==="bluetooth"?this.bluetooth.connected?"BLE Wristband":"BLE Wristband (disconnected)":this.serial.connected?"Serial Device":"Serial Device (disconnected)"}}const q="mindbridge_profiles",ee="mindbridge_settings",Ee=2;function Ie(a){return a.commands.some(e=>!e.featureVector||e.featureVector.length===0)}function C(){try{const a=localStorage.getItem(q);if(!a)return[];const e=JSON.parse(a),t=e.map(i=>Ie(i)?de(i):i);return t.some((i,s)=>i!==e[s])&&_(t),t}catch{return[]}}function _(a){localStorage.setItem(q,JSON.stringify(a)),localStorage.setItem(`${q}_version`,String(Ee))}function O(a){const e=C(),t=e.findIndex(i=>i.id===a.id);t>=0?e[t]=a:e.push(a),_(e)}function ke(a){_(C().filter(e=>e.id!==a))}function Le(){try{const a=localStorage.getItem(ee);return a?JSON.parse(a):{inputSource:"simulator",autoDemo:!1,noiseInjection:!1,activeProfileId:null}}catch{return{inputSource:"simulator",autoDemo:!1,noiseInjection:!1,activeProfileId:null}}}function I(a){localStorage.setItem(ee,JSON.stringify(a))}function te(){const a=C(),e=a.find(i=>i.name==="MS Demo User");if(e)return e;if(a.length>0)return a[0];const t=X("MS Demo User");return O(t),t}class $e{constructor(e,t){r(this,"root");r(this,"canvases",[]);r(this,"rawCanvases",[]);r(this,"histories",Array.from({length:b},()=>[]));r(this,"rawHistories",Array.from({length:b},()=>[]));r(this,"intentEl");r(this,"confidenceEl");r(this,"previewEl");r(this,"firedEl");r(this,"statusEl");r(this,"logEl");r(this,"gloveContainer");r(this,"metricsEl");r(this,"inputMetricsEl");r(this,"onGloveMount");r(this,"mounted",!1);this.root=e,this.onGloveMount=t,this.build()}build(){this.root.innerHTML=`
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
    `;const e=this.root.querySelector("#signal-grid-raw"),t=this.root.querySelector("#signal-grid");for(let i=0;i<b;i++)for(const s of[e,t]){const n=document.createElement("div");n.className="signal-cell",n.innerHTML=`<label>Sensor ${i+1}${s===e?" (raw)":""}</label>`;const o=document.createElement("canvas");o.width=200,o.height=40,n.appendChild(o),s.appendChild(n),s===e?this.rawCanvases.push(o):this.canvases.push(o)}this.intentEl=this.root.querySelector(".intent-preview-label"),this.confidenceEl=this.root.querySelector(".intent-preview-confidence"),this.previewEl=this.root.querySelector(".intent-preview-label"),this.firedEl=this.root.querySelector(".intent-fired-label"),this.statusEl=this.root.querySelector("#intent-status"),this.logEl=this.root.querySelector("#command-log"),this.gloveContainer=this.root.querySelector("#glove-wrap"),this.metricsEl=this.root.querySelector("#profile-metrics"),this.inputMetricsEl=this.root.querySelector("#input-metrics"),this.mounted||(this.onGloveMount(this.gloveContainer),this.mounted=!0)}update(e,t,i,s){if(e.frame){e.frame.raw.forEach((h,u)=>{this.rawHistories[u].push(h),this.rawHistories[u].length>x&&this.rawHistories[u].shift(),this.drawSparkline(this.rawCanvases[u],this.rawHistories[u],"#6b8cae",1)}),e.frame.normalized.forEach((h,u)=>{this.histories[u].push(h),this.histories[u].length>x&&this.histories[u].shift(),this.drawSparkline(this.canvases[u],this.histories[u],"#38bdb0",.5)});const d=this.root.querySelector("#signal-meta");d.innerHTML=`
        <span class="badge ${e.frame.active?"badge-active":""}">${e.frame.active?"Active signal":"Below threshold"}</span>
        <span>Channels: ${b}</span>
        <span>Rate: ${s.framesPerSecond} Hz</span>
      `}i&&(this.metricsEl.innerHTML=`
        <div class="metric-chip"><span>Gain</span><strong>${i.gain.toFixed(2)}×</strong></div>
        <div class="metric-chip"><span>Noise gate</span><strong>${i.noiseThreshold.toFixed(2)}</strong></div>
        <div class="metric-chip"><span>Baseline avg</span><strong>${(i.baseline.reduce((d,h)=>d+h,0)/i.baseline.length).toFixed(3)}</strong></div>
      `),this.inputMetricsEl.innerHTML=`
      <span class="badge ${s.connected?"badge-active":""}">${s.sourceLabel}</span>
      <span>${s.status}</span>
    `;const n=e.intent,o=e.previewCommand.replace(/_/g," ");this.previewEl.textContent=o,this.root.querySelector(".intent-preview-confidence").textContent=`${Math.round(e.previewConfidence*100)}%`,this.previewEl.className=`intent-label intent-preview-label ${e.previewConfidence>=.35?"intent-stable":""}`;const l=this.root.querySelector(".intent-fired-label"),c=this.root.querySelector(".intent-fired-confidence");e.lastCommand&&e.lastCommandAt?(l.textContent=e.lastCommand.replace(/_/g," "),c.textContent=`${Math.round(e.lastFiredConfidence*100)}%`,l.className="intent-label intent-fired-label intent-fired-active"):(l.textContent="—",c.textContent="—",l.className="intent-label intent-fired-label"),n.stable&&n.commandId&&n.commandId!=="rest"?this.statusEl.textContent=`Stable match — command will send: ${n.label}`:n.commandId?this.statusEl.textContent=`Matching ${n.label}… hold steady`:this.statusEl.textContent="Analyzing pressure pattern…",this.logEl.innerHTML=t.slice(0,12).map(d=>`<li><time>${new Date(d.timestamp).toLocaleTimeString()}</time> <strong>${d.label}</strong> <span>${Math.round(d.confidence*100)}%</span></li>`).join("")||'<li class="empty">No commands fired yet</li>'}drawSparkline(e,t,i,s){const n=e.getContext("2d");if(!n||t.length===0)return;const o=e.width,l=e.height;n.clearRect(0,0,o,l),n.strokeStyle="rgba(143, 163, 184, 0.2)",n.beginPath(),n.moveTo(0,l*.75),n.lineTo(o,l*.75),n.stroke(),n.strokeStyle=i,n.lineWidth=2,n.beginPath(),t.forEach((c,d)=>{const h=d/Math.max(1,x-1)*o,u=l-Math.min(s,c)/s*(l-4)-2;d===0?n.moveTo(h,u):n.lineTo(h,u)}),n.stroke()}}const S=J.filter(a=>a.id!=="rest"),Pe=4e3,Te=6e3,N=20,Ae=.5,R=5;class Me{constructor(e,t,i,s,n){r(this,"root");r(this,"pipeline");r(this,"inputManager");r(this,"simulator");r(this,"options");r(this,"step","landing");r(this,"mode","new");r(this,"editingProfile",null);r(this,"profileName","");r(this,"commandIndex",0);r(this,"validationIndex",0);r(this,"validationHits",0);r(this,"validationScores",{open_hand:[],close_hand:[],pinch:[],rest:[]});r(this,"tickTimer",null);r(this,"validationTimer",null);r(this,"recordingGeneration",0);this.root=e,this.pipeline=t,this.inputManager=i,this.simulator=s,this.options=n,this.render()}startRecalibrate(e){this.mode="recalibrate",this.editingProfile=e,this.profileName=e.name,this.resetSession(),this.step="baseline",this.render()}destroy(){this.clearTimers()}clearTimers(){this.tickTimer&&clearInterval(this.tickTimer),this.validationTimer&&clearInterval(this.validationTimer),this.tickTimer=null,this.validationTimer=null,this.recordingGeneration++,this.pipeline.getCalibrationSession().stopRecording()}resetSession(){this.clearTimers(),this.pipeline.getCalibrationSession().reset(),this.commandIndex=0,this.validationIndex=0,this.validationHits=0;for(const e of Object.keys(this.validationScores))this.validationScores[e]=[]}isSimulatorInput(){return this.inputManager.getSource()==="simulator"}inputStatusHtml(){const e=this.pipeline.isReceivingData(),t=this.inputManager.displayLabel(),i=e?"status-ok":"status-warn",s=e?`Receiving sensor data from ${t}`:"No sensor data yet — connect your wristband under Input, or use the simulator";return`<p class="input-status ${i}">${s}</p>`}render(){this.pipeline.getCalibrationSession();const e=S[this.commandIndex],t=S[this.validationIndex],i=[{id:"landing",label:"Start"},{id:"baseline",label:"Rest"},{id:"commands",label:"Train"},{id:"validate",label:"Verify"},{id:"complete",label:"Done"}],s=i.findIndex(o=>o.id===this.step);let n="";if(this.step==="landing"){const o=this.options.getActiveProfile();n=`
        <h2>Calibration</h2>
        <p class="lead">Calibration records your rest pressure and three hand gestures so MindBridge can recognize your intent from the wristband.</p>
        ${this.inputStatusHtml()}
        <div class="cal-choices">
          <div class="cal-choice">
            <h3>New profile</h3>
            <p>Create a calibration for a new user.</p>
            <label class="field">
              <span>Profile name</span>
              <input type="text" id="profile-name" value="${this.profileName||"My Profile"}" placeholder="e.g. Alex" />
            </label>
            <button type="button" class="btn btn-primary" id="start-new">Start new calibration</button>
          </div>
          <div class="cal-choice">
            <h3>Recalibrate</h3>
            <p>Update the active profile <strong>${o.name}</strong> with a fresh calibration.</p>
            <button type="button" class="btn btn-secondary" id="start-recal">Recalibrate "${o.name}"</button>
          </div>
        </div>
        <p class="hint">Use Input to connect a BLE wristband or serial device before calibrating. The simulator works for testing only.</p>
      `}else if(this.step==="baseline")n=`
        <h2>Step 1 — Rest baseline</h2>
        <p class="lead">Keep your hand relaxed on the wristband. Do not squeeze.</p>
        ${this.inputStatusHtml()}
        <div class="live-cal-bar" id="live-cal-bar"></div>
        <div class="progress-bar"><div class="progress-fill" id="record-progress"></div></div>
        <p class="record-meta">Samples: <strong id="sample-count">0</strong> · need at least ${N}</p>
        <div class="wizard-actions">
          <button type="button" class="btn btn-primary" id="record-baseline">Record rest (6 sec)</button>
          <button type="button" class="btn btn-secondary" id="cancel-cal">Cancel</button>
        </div>
      `;else if(this.step==="commands")n=`
        <h2>Step 2 — Train: ${(e==null?void 0:e.label)??""}</h2>
        <p class="lead">${(e==null?void 0:e.description)??""}</p>
        <p>Gesture ${this.commandIndex+1} of ${S.length}. Hold the pose while recording.</p>
        ${this.inputStatusHtml()}
        ${this.isSimulatorInput()?'<button type="button" class="btn btn-secondary btn-sm" id="fill-demo">Fill demo pattern (simulator only)</button>':""}
        <div class="live-cal-bar" id="live-cal-bar"></div>
        <div class="progress-bar"><div class="progress-fill" id="record-progress"></div></div>
        <p class="record-meta">Samples: <strong id="sample-count">0</strong></p>
        <div class="wizard-actions">
          <button type="button" class="btn btn-primary" id="record-command">Record gesture (4 sec)</button>
          <button type="button" class="btn btn-secondary" id="skip-command">Skip</button>
          <button type="button" class="btn btn-secondary" id="cancel-cal">Cancel</button>
        </div>
      `;else if(this.step==="validate"){const o=this.validationScores[(t==null?void 0:t.id)??"open_hand"],l=o.length>0?Math.round(o.reduce((c,d)=>c+d,0)/o.length*100):0;n=`
        <h2>Step 3 — Verify: ${(t==null?void 0:t.label)??""}</h2>
        <p class="lead">Perform <strong>${(t==null?void 0:t.label)??""}</strong> naturally. MindBridge will score each reading against your training.</p>
        <p>Gesture ${this.validationIndex+1} of ${S.length} · ${this.validationHits}/${R} good readings</p>
        ${this.inputStatusHtml()}
        ${this.isSimulatorInput()?'<button type="button" class="btn btn-secondary btn-sm" id="fill-demo">Show demo pattern</button>':""}
        <div class="validation-score">
          <div class="validation-meter"><div class="validation-fill" id="validation-fill" style="width: ${l}%"></div></div>
          <span id="validation-score-label">${l}% match</span>
        </div>
        <ul class="verify-list">
          ${S.map(c=>{const d=this.validationScores[c.id],h=d.length?Math.round(d.reduce((p,w)=>p+w,0)/d.length*100):null;return`<li class="${this.validationIndex>S.findIndex(p=>p.id===c.id)||c.id===(t==null?void 0:t.id)&&this.validationHits>=R?"verify-pass":""}">${c.label}${h!==null?` — ${h}% avg`:""}</li>`}).join("")}
        </ul>
        <div class="wizard-actions">
          <button type="button" class="btn btn-primary" id="start-verify">Start verification</button>
          <button type="button" class="btn btn-secondary" id="skip-verify">Skip verification</button>
          <button type="button" class="btn btn-secondary" id="cancel-cal">Cancel</button>
        </div>
      `}else this.step==="complete"&&(n=`
        <h2>Calibration saved</h2>
        <p class="lead success">Profile <strong>${this.profileName}</strong> is active. Open the Dashboard to test intent detection in real time.</p>
        <div class="wizard-actions">
          <button type="button" class="btn btn-primary" id="go-dashboard">Go to Dashboard</button>
          <button type="button" class="btn btn-secondary" id="recal-again">Calibrate again</button>
        </div>
      `);this.root.innerHTML=`
      <div class="wizard panel">
        <nav class="wizard-nav" aria-label="Calibration steps">
          ${i.map((o,l)=>`<span class="wizard-nav-item ${o.id===this.step?"active":""} ${l<s?"done":""}">${l+1}. ${o.label}</span>`).join("")}
        </nav>
        <div class="wizard-body">${n}</div>
      </div>
    `,this.bindEvents()}bindEvents(){var e,t,i,s,n,o,l,c,d,h,u;(e=this.root.querySelector("#start-new"))==null||e.addEventListener("click",()=>{const p=this.root.querySelector("#profile-name");this.profileName=(p==null?void 0:p.value.trim())||"My Profile",this.mode="new",this.editingProfile=null,this.resetSession(),this.pipeline.isReceivingData()||this.options.onInputWarning("No sensor data detected. Connect hardware under Input, or enable the simulator."),this.step="baseline",this.render()}),(t=this.root.querySelector("#start-recal"))==null||t.addEventListener("click",()=>{this.startRecalibrate(this.options.getActiveProfile())}),(i=this.root.querySelector("#record-baseline"))==null||i.addEventListener("click",()=>this.recordBaseline()),(s=this.root.querySelector("#record-command"))==null||s.addEventListener("click",()=>this.recordCommand()),(n=this.root.querySelector("#skip-command"))==null||n.addEventListener("click",()=>this.skipCommand()),(o=this.root.querySelector("#start-verify"))==null||o.addEventListener("click",()=>this.runValidation()),(l=this.root.querySelector("#skip-verify"))==null||l.addEventListener("click",()=>this.saveProfile()),(c=this.root.querySelector("#cancel-cal"))==null||c.addEventListener("click",()=>this.goLanding()),(d=this.root.querySelector("#fill-demo"))==null||d.addEventListener("click",()=>{var w,$;const p=this.step==="baseline"?"rest":this.step==="commands"?(w=S[this.commandIndex])==null?void 0:w.id:($=S[this.validationIndex])==null?void 0:$.id;p&&this.simulator.applyCommandPattern(p)}),(h=this.root.querySelector("#go-dashboard"))==null||h.addEventListener("click",()=>{var p;(p=document.querySelector('[data-view="dashboard"]'))==null||p.click()}),(u=this.root.querySelector("#recal-again"))==null||u.addEventListener("click",()=>this.goLanding())}goLanding(){this.resetSession(),this.step="landing",this.render()}recordBaseline(){const e=this.pipeline.getCalibrationSession();e.startBaselineRecording(),this.isSimulatorInput()&&this.simulator.applyCommandPattern("rest"),this.runRecording(Te,()=>{e.stopRecording();const t=e.getBaselineSampleCount();if(t<N){alert(`Only ${t} samples captured. Check your input connection and try again.`);return}this.commandIndex=0,this.step="commands",this.render()})}recordCommand(){const e=S[this.commandIndex];if(!e)return;const t=this.pipeline.getCalibrationSession();this.isSimulatorInput()&&this.simulator.applyCommandPattern(e.id),t.startCommandRecording(e.id),this.runRecording(Pe,()=>{t.stopRecording();const i=t.getCommandSampleCount(e.id);if(i<N/2){alert(`Only ${i} samples for ${e.label}. Hold the gesture steady and try again.`);return}this.commandIndex++,this.commandIndex<S.length?(this.step="commands",this.render()):(this.validationIndex=0,this.validationHits=0,this.step="validate",this.render())})}skipCommand(){this.pipeline.getCalibrationSession().stopRecording(),this.commandIndex++,this.commandIndex<S.length?this.render():(this.validationIndex=0,this.step="validate",this.render())}runValidation(){this.validationTimer&&clearInterval(this.validationTimer);const e=S[this.validationIndex];e&&(this.isSimulatorInput()&&this.simulator.applyCommandPattern(e.id),this.validationHits=0,this.validationScores[e.id]=[],this.validationTimer=setInterval(()=>{if(this.step!=="validate")return;const t=this.pipeline.getState().frame;if(!t)return;const i=this.pipeline.getCalibrationSession().buildProfile("_draft","_draft",this.editingProfile??void 0),s=this.pipeline.getIntentEngine().scoreAgainstCommand(t,i,e.id),n=this.root.querySelector("#validation-fill"),o=this.root.querySelector("#validation-score-label");n&&(n.style.width=`${Math.round(s*100)}%`),o&&(o.textContent=`${Math.round(s*100)}% match`),this.validationScores[e.id].push(s),this.validationScores[e.id].length>30&&this.validationScores[e.id].shift(),s>=Ae&&(this.validationHits++,this.validationHits>=R&&this.advanceValidation()),this.updateLiveBar()},100))}advanceValidation(){this.validationTimer&&clearInterval(this.validationTimer),this.validationTimer=null;const e=this.validationIndex+1;e<S.length?(this.validationIndex=e,this.validationHits=0,this.render()):this.saveProfile()}saveProfile(){this.clearTimers();const e=this.pipeline.getCalibrationSession(),t=this.mode==="recalibrate"&&this.editingProfile?this.editingProfile.id:`profile_${Date.now()}`,i=e.buildProfile(t,this.profileName,this.editingProfile??void 0);O(i),this.options.onComplete(i),this.step="complete",this.render()}runRecording(e,t){const i=this.pipeline.getCalibrationSession(),s=Date.now(),n=++this.recordingGeneration;this.tickTimer&&clearInterval(this.tickTimer);const o=this.root.querySelector("#record-progress");o&&(o.style.width="0%"),this.tickTimer=setInterval(()=>{if(n!==this.recordingGeneration)return;const l=Date.now()-s,c=Math.min(100,l/e*100),d=this.root.querySelector("#record-progress"),h=this.root.querySelector("#sample-count");if(d&&(d.style.width=`${c}%`),h){const u=i.getRecordTarget();h.textContent=String(u==="baseline"?i.getBaselineSampleCount():u?i.getCommandSampleCount(u):0)}this.updateLiveBar(),l>=e&&(this.tickTimer&&clearInterval(this.tickTimer),this.tickTimer=null,i.stopRecording(),n===this.recordingGeneration&&t())},50)}updateLiveBar(){const e=this.root.querySelector("#live-cal-bar"),t=this.pipeline.getState().frame;!e||!t||(e.innerHTML=t.raw.map((i,s)=>`<div class="live-cal-cell" title="Sensor ${s+1}"><div class="live-cal-fill" style="height: ${Math.min(100,i*100)}%"></div></div>`).join(""))}}class De{constructor(e,t,i,s,n,o){r(this,"root");r(this,"simulator");r(this,"bluetooth");r(this,"serial");r(this,"callbacks");r(this,"inputSource");r(this,"lastPacket","");r(this,"errorMessage","");r(this,"inputMetrics",{framesPerSecond:0,lastFrameAt:null,connected:!1,sourceLabel:"",status:""});this.root=e,this.simulator=t,this.bluetooth=i,this.serial=s,this.inputSource=n,this.callbacks=o,i.onPacket(l=>{this.lastPacket=l,this.refreshPacketLog()}),s.onPacket(l=>{this.lastPacket=l,this.refreshPacketLog()}),this.render()}setInputMetrics(e){this.inputMetrics=e,this.refreshStatusBar()}setError(e){this.errorMessage=e;const t=this.root.querySelector("#device-error");t&&(t.textContent=e)}refresh(){this.render()}render(){const e=this.simulator.getValues(),t=this.inputSource==="simulator",i=this.bluetooth.connected,s=this.serial.connected;this.root.innerHTML=`
      <div class="devices-layout">
        <section class="panel">
          <h2>Input source</h2>
          <p class="lead">Choose where pressure readings come from. Use Chrome or Edge for hardware connections.</p>
          <div id="device-error" class="device-error">${this.errorMessage}</div>
          <div class="source-cards">
            <article class="source-card ${t?"selected":""}">
              <header>
                <h3>Pressure Simulator</h3>
                <span class="source-tag">Testing</span>
              </header>
              <p>For demos and development. Sliders or auto-demo generate synthetic sensor data.</p>
              <button type="button" class="btn ${t?"btn-primary":"btn-secondary"}" id="use-simulator" ${t?"disabled":""}>
                ${t?"Active":"Use simulator"}
              </button>
            </article>
            <article class="source-card ${this.inputSource==="bluetooth"?"selected":""}">
              <header>
                <h3>BLE Wristband</h3>
                <span class="source-tag">Production</span>
              </header>
              <p>Web Bluetooth. Supports MindBridge GATT or Nordic UART (NUS) firmware.</p>
              <p class="source-status">${this.bluetooth.getStatus()}</p>
              <button type="button" class="btn btn-primary" id="connect-ble" ${i?"disabled":""}>Connect BLE device</button>
              ${i?'<button type="button" class="btn btn-secondary btn-sm" id="disconnect-ble">Disconnect</button>':""}
            </article>
            <article class="source-card ${this.inputSource==="serial"?"selected":""}">
              <header>
                <h3>Serial / USB</h3>
                <span class="source-tag">Production</span>
              </header>
              <p>Web Serial at 115200 baud. One JSON object per line from Arduino or similar.</p>
              <p class="source-status">${this.serial.getStatus()}</p>
              <button type="button" class="btn btn-primary" id="connect-serial" ${s?"disabled":""}>Connect serial port</button>
              ${s?'<button type="button" class="btn btn-secondary btn-sm" id="disconnect-serial">Disconnect</button>':""}
            </article>
          </div>
          <div class="input-status-live" id="input-status-live"></div>
        </section>

        <section class="panel ${t?"":"panel-muted"}">
          <h2>Simulator controls</h2>
          <p class="hint">${t?"Adjust channels manually or enable auto-demo.":"Switch to the simulator to use these controls."}</p>
          <div class="toggle-row">
            <label class="toggle">
              <input type="checkbox" id="auto-demo" ${this.simulator.isAutoDemo()?"checked":""} ${t?"":"disabled"} />
              <span>Auto-demo (cycles through gestures)</span>
            </label>
            <label class="toggle">
              <input type="checkbox" id="noise-injection" ${this.simulator.isNoiseInjection()?"checked":""} ${t?"":"disabled"} />
              <span>Add noise (stress-test filtering)</span>
            </label>
          </div>
          <div class="slider-grid" id="slider-grid">
            ${e.map((n,o)=>`
              <label class="slider-field">
                <span>Ch ${o+1}</span>
                <input type="range" min="0" max="100" value="${Math.round(n*100)}" data-index="${o}" ${t?"":"disabled"} />
                <output>${Math.round(n*100)}%</output>
              </label>
            `).join("")}
          </div>
        </section>

        <section class="panel">
          <h2>Packet format</h2>
          <p class="hint">Firmware must send one JSON line per reading, values 0.0–1.0:</p>
          <pre class="code-block">{"t":1717000000,"sensors":[0.12,0.08,0.31,0.05,0.19,0.11]}</pre>
          <h3>Last received packet</h3>
          <pre class="code-block" id="packet-log">${this.lastPacket||"—"}</pre>
        </section>
      </div>
    `,this.bindEvents(),this.refreshStatusBar()}bindEvents(){var e,t,i,s,n,o,l;(e=this.root.querySelector("#use-simulator"))==null||e.addEventListener("click",()=>{this.callbacks.onUseSimulator().then(()=>this.render())}),(t=this.root.querySelector("#connect-ble"))==null||t.addEventListener("click",()=>{this.callbacks.onConnectBle().then(()=>this.render()).catch(c=>{this.setError(c instanceof Error?c.message:"BLE connection failed")})}),(i=this.root.querySelector("#connect-serial"))==null||i.addEventListener("click",()=>{this.callbacks.onConnectSerial().then(()=>this.render()).catch(c=>{this.setError(c instanceof Error?c.message:"Serial connection failed")})}),(s=this.root.querySelector("#disconnect-ble"))==null||s.addEventListener("click",()=>{this.callbacks.onDisconnectHardware().then(()=>this.render())}),(n=this.root.querySelector("#disconnect-serial"))==null||n.addEventListener("click",()=>{this.callbacks.onDisconnectHardware().then(()=>this.render())}),(o=this.root.querySelector("#auto-demo"))==null||o.addEventListener("change",c=>{const d=c.target.checked;this.simulator.setAutoDemo(d),this.callbacks.onSettingsChange("autoDemo",d)}),(l=this.root.querySelector("#noise-injection"))==null||l.addEventListener("change",c=>{const d=c.target.checked;this.simulator.setNoiseInjection(d),this.callbacks.onSettingsChange("noiseInjection",d)}),this.root.querySelectorAll('input[type="range"]').forEach(c=>{c.addEventListener("input",()=>{this.simulator.setSlider(Number(c.dataset.index),Number(c.value)/100);const d=c.nextElementSibling;d&&(d.textContent=`${c.value}%`)})})}refreshSliders(){if(!this.root.querySelector("#slider-grid"))return;const e=this.simulator.getValues();this.root.querySelectorAll('input[type="range"]').forEach(t=>{const i=Number(t.dataset.index);if(i>=0&&i<b){t.value=String(Math.round(e[i]*100));const s=t.nextElementSibling;s&&(s.textContent=`${Math.round(e[i]*100)}%`)}})}refreshStatusBar(){const e=this.root.querySelector("#input-status-live");if(!e)return;const t=this.inputMetrics;e.innerHTML=`
      <span>${t.sourceLabel}</span>
      <span>${t.status}</span>
      <span>${t.framesPerSecond} Hz</span>
      <span class="${t.lastFrameAt&&Date.now()-t.lastFrameAt<500?"status-ok":"status-warn"}">
        ${t.lastFrameAt&&Date.now()-t.lastFrameAt<500?"Data flowing":"No recent data"}
      </span>
    `}refreshPacketLog(){const e=this.root.querySelector("#packet-log");e&&(e.textContent=this.lastPacket||"—")}updateSource(e){this.inputSource=e,this.render()}}const g=new Ce,F=new re,v=new pe(g.simulator,F);let f=Le(),y=te();if(f.activeProfileId){const a=C().find(e=>e.id===f.activeProfileId);a&&(y=a)}v.setProfile(y);let ie="dashboard",T=null,k=null,m=null;const Be=document.getElementById("app");Be.innerHTML=`
  <header class="app-header">
    <div class="brand">
      <h1>MindBridge</h1>
    </div>
    <nav class="main-nav" id="main-nav">
      <button type="button" data-view="dashboard" class="nav-btn active">Dashboard</button>
      <button type="button" data-view="calibrate" class="nav-btn">Calibrate</button>
      <button type="button" data-view="profiles" class="nav-btn">Profiles</button>
      <button type="button" data-view="devices" class="nav-btn">Input</button>
      <button type="button" data-view="about" class="nav-btn">Guide</button>
    </nav>
    <div class="header-meta">
      <span class="meta-item"><span class="meta-label">Profile</span> <strong id="header-profile">${y.name}</strong></span>
      <span class="meta-item"><span class="meta-label">Input</span> <strong id="header-input">—</strong></span>
    </div>
  </header>
  <main class="app-main" id="app-main">
    <div id="view-dashboard" class="view-pane"></div>
    <div id="view-calibrate" class="view-pane hidden"></div>
    <div id="view-profiles" class="view-pane hidden"></div>
    <div id="view-devices" class="view-pane hidden"></div>
    <div id="view-about" class="view-pane hidden"></div>
  </main>
`;const L={dashboard:document.getElementById("view-dashboard"),calibrate:document.getElementById("view-calibrate"),profiles:document.getElementById("view-profiles"),devices:document.getElementById("view-devices"),about:document.getElementById("view-about")};function D(a){ie=a,document.querySelectorAll(".nav-btn").forEach(e=>{e.classList.toggle("active",e.dataset.view===a)}),Object.entries(L).forEach(([e,t])=>{t.classList.toggle("hidden",e!==a)}),Ne(a)}function se(){k==null||k.destroy(),k=new Me(L.calibrate,v,g,g.simulator,{getActiveProfile:()=>y,onComplete:a=>{y=a,v.setProfile(a),f.activeProfileId=a.id,I(f),E()},onInputWarning:a=>{console.warn(a)}})}function xe(a){se(),k==null||k.startRecalibrate(a)}function Ne(a){switch(a){case"dashboard":T||(T=new $e(L.dashboard,e=>{F.setContainer(e),F.renderDom()})),T.update(v.getState(),v.getCommandLog(),y,v.getInputMetrics());break;case"calibrate":se();break;case"profiles":M(L.profiles);break;case"devices":m?m.refresh():m=new De(L.devices,g.simulator,g.bluetooth,g.serial,f.inputSource,{onSettingsChange:(e,t)=>{f={...f,[e]:t},I(f)},onUseSimulator:async()=>{const e=await g.useSimulator();await v.setInputAdapter(e),f.inputSource="simulator",g.simulator.setAutoDemo(f.autoDemo),g.simulator.setNoiseInjection(f.noiseInjection),I(f),m==null||m.updateSource("simulator"),E()},onConnectBle:async()=>{g.simulator.setAutoDemo(!1);const e=await g.connectBluetooth();await v.setInputAdapter(e),f.inputSource="bluetooth",I(f),m==null||m.updateSource("bluetooth"),m==null||m.setError(""),E()},onConnectSerial:async()=>{g.simulator.setAutoDemo(!1);const e=await g.connectSerial();await v.setInputAdapter(e),f.inputSource="serial",I(f),m==null||m.updateSource("serial"),m==null||m.setError(""),E()},onDisconnectHardware:async()=>{await g.disconnectHardware();const e=await g.useSimulator();await v.setInputAdapter(e),f.inputSource="simulator",I(f),m==null||m.updateSource("simulator"),E()}}),m.setInputMetrics(v.getInputMetrics());break;case"about":Re(L.about);break}}function M(a){var t,i;const e=C();a.innerHTML=`
    <section class="panel profiles-panel">
      <h2>Profiles</h2>
      <p class="lead">Each profile stores a rest baseline and trained gestures for one user. Switch profiles when a different person uses MindBridge.</p>
      <ul class="profile-list">
        ${e.map(s=>{const n=s.id===y.id,o=s.commands.filter(l=>l.id!=="rest"&&l.samples.length>0).length;return`
          <li class="profile-item ${n?"active":""}">
            <div class="profile-info">
              <strong>${s.name}</strong>
              ${n?'<span class="profile-badge">Active</span>':""}
              <span class="profile-detail">Gain ${s.gain.toFixed(1)}× · ${o} gestures · ${new Date(s.updatedAt).toLocaleDateString()}</span>
            </div>
            <div class="profile-actions">
              ${n?"":`<button type="button" class="btn btn-secondary btn-sm" data-select="${s.id}">Activate</button>`}
              <button type="button" class="btn btn-secondary btn-sm" data-recal="${s.id}">Recalibrate</button>
              <button type="button" class="btn btn-danger btn-sm" data-delete="${s.id}">Delete</button>
            </div>
          </li>`}).join("")}
      </ul>
      <div class="wizard-actions">
        <button type="button" class="btn btn-primary" id="new-calibration">New calibration</button>
        <button type="button" class="btn btn-secondary" id="create-demo-profile">Add demo profile</button>
      </div>
    </section>
  `,a.querySelectorAll("[data-select]").forEach(s=>{s.addEventListener("click",()=>{const n=s.dataset.select,o=C().find(l=>l.id===n);o&&(A(o),M(a))})}),a.querySelectorAll("[data-recal]").forEach(s=>{s.addEventListener("click",()=>{const n=s.dataset.recal,o=C().find(l=>l.id===n);o&&(A(o),D("calibrate"),xe(o))})}),a.querySelectorAll("[data-delete]").forEach(s=>{s.addEventListener("click",()=>{const n=s.dataset.delete;if(C().length<=1){alert("At least one profile must remain.");return}confirm("Delete this profile?")&&(ke(n),y.id===n&&A(te()),M(a))})}),(t=a.querySelector("#new-calibration"))==null||t.addEventListener("click",()=>D("calibrate")),(i=a.querySelector("#create-demo-profile"))==null||i.addEventListener("click",()=>{const s=X(`Demo ${C().length+1}`);O(s),A(s),M(a)})}function Re(a){a.innerHTML=`
    <article class="guide panel">
      <h2>Operating MindBridge</h2>
      <p class="lead">MindBridge reads pressure from a wristband, interprets your intended hand gesture, and sends commands to an assistive device (shown here as a virtual glove).</p>

      <section class="guide-section">
        <h3>1. Connect input</h3>
        <p>Go to <strong>Input</strong> and choose your source:</p>
        <ul>
          <li><strong>Pressure Simulator</strong> — for testing without hardware. Enable auto-demo to cycle gestures automatically.</li>
          <li><strong>BLE Wristband</strong> — pair via Web Bluetooth (Chrome/Edge). Firmware must broadcast JSON sensor packets.</li>
          <li><strong>Serial / USB</strong> — connect an Arduino or similar at 115200 baud.</li>
        </ul>
        <p>Confirm <em>Data flowing</em> appears before calibrating.</p>
      </section>

      <section class="guide-section">
        <h3>2. Calibrate</h3>
        <ol>
          <li>Open <strong>Calibrate</strong> → start a new profile or recalibrate an existing one.</li>
          <li><strong>Rest baseline</strong> — relax your hand for 6 seconds.</li>
          <li><strong>Train</strong> — hold each gesture (open hand, close hand, pinch) for 4 seconds while recording.</li>
          <li><strong>Verify</strong> — perform each gesture naturally; MindBridge scores recognition quality.</li>
        </ol>
        <p>Recalibrate whenever symptoms change or recognition drifts. Use Profiles → Recalibrate on any saved profile.</p>
      </section>

      <section class="guide-section">
        <h3>3. Operate</h3>
        <p>On the <strong>Dashboard</strong>:</p>
        <ul>
          <li><strong>Live preview</strong> — what MindBridge thinks you intend right now (drives the glove animation).</li>
          <li><strong>Command sent</strong> — a confirmed command after a stable match (debounced, sent to the assistive device).</li>
          <li>Raw and filtered sensor charts show what the algorithm sees.</li>
        </ul>
      </section>

      <section class="guide-section">
        <h3>4. Firmware packet format</h3>
        <p>Send one JSON object per line. Six sensor values, each 0.0–1.0:</p>
        <pre class="code-block">{"t":1717000000,"sensors":[0.12,0.08,0.31,0.05,0.19,0.11]}</pre>
        <p>BLE: MindBridge GATT service or Nordic UART. Serial: 115200 baud, newline-delimited.</p>
      </section>

      <section class="guide-section">
        <h3>5. Profiles</h3>
        <p>Each user needs their own profile. Activate the correct profile before a session. Demo profiles use pre-recorded patterns for presentations only.</p>
      </section>
    </article>
  `}function A(a){y=a,v.setProfile(a),f.activeProfileId=a.id,I(f),E()}function E(){const a=document.getElementById("header-profile");a&&(a.textContent=y.name);const e=document.getElementById("header-input");e&&(e.textContent=g.displayLabel())}document.getElementById("main-nav").addEventListener("click",a=>{const e=a.target.closest(".nav-btn");e!=null&&e.dataset.view&&D(e.dataset.view)});g.bluetooth.setOnDisconnect(async()=>{f.inputSource==="bluetooth"&&(await g.useSimulator(),await v.setInputAdapter(g.simulator),f.inputSource="simulator",I(f),m==null||m.updateSource("simulator"),E())});g.simulator.setAutoDemo(f.autoDemo);g.simulator.setNoiseInjection(f.noiseInjection);v.onUpdate(a=>{const e=v.getInputMetrics();T&&T.update(a,v.getCommandLog(),y,e),m&&ie==="devices"&&(m.setInputMetrics(e),g.getSource()==="simulator"&&g.simulator.isAutoDemo()&&m.refreshSliders()),E()});async function qe(){await g.useSimulator(),await v.setInputAdapter(g.simulator),await v.start(),E(),D("dashboard")}qe();
