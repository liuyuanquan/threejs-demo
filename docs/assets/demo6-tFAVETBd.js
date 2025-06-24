var B=Object.defineProperty;var F=(h,e,i)=>e in h?B(h,e,{enumerable:!0,configurable:!0,writable:!0,value:i}):h[e]=i;var n=(h,e,i)=>F(h,typeof e!="symbol"?e+"":e,i);import{e as A,O as U,f as D,s as w,H as d,U as C,I as u,J as v,K as T,N,x as y,Q as x,V as g,t as L,n as z,X as O,Y as I,Z as Q,_ as H,$ as k,a0 as V,a1 as G,a2 as W,a3 as j,S as K,P as X,W as q,k as Y,a4 as $,a5 as J,a6 as Z,a7 as ee,a8 as te}from"./three.module-Dp6ZLe64.js";import{g as ie}from"./lil-gui.module.min-Vka56b52.js";import{S as se}from"./stats.module--VATS4Kh.js";import{O as re}from"./OrbitControls---LevtVI.js";import{d as ae,r as P,o as oe,c as le,s as ne,f as he}from"./index-dhdguok0.js";const E={name:"CopyShader",uniforms:{tDiffuse:{value:null},opacity:{value:1}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform float opacity;

		uniform sampler2D tDiffuse;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );
			gl_FragColor = opacity * texel;


		}`};class p{constructor(){this.isPass=!0,this.enabled=!0,this.needsSwap=!0,this.clear=!1,this.renderToScreen=!1}setSize(){}render(){console.error("THREE.Pass: .render() must be implemented in derived pass.")}dispose(){}}const ue=new U(-1,1,1,-1,0,1);class fe extends D{constructor(){super(),this.setAttribute("position",new w([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute("uv",new w([0,2,0,0,2,0],2))}}const ce=new fe;class S{constructor(e){this._mesh=new A(ce,e)}dispose(){this._mesh.geometry.dispose()}render(e){e.render(this._mesh,ue)}get material(){return this._mesh.material}set material(e){this._mesh.material=e}}class de extends p{constructor(e,i){super(),this.textureID=i!==void 0?i:"tDiffuse",e instanceof d?(this.uniforms=e.uniforms,this.material=e):e&&(this.uniforms=C.clone(e.uniforms),this.material=new d({name:e.name!==void 0?e.name:"unspecified",defines:Object.assign({},e.defines),uniforms:this.uniforms,vertexShader:e.vertexShader,fragmentShader:e.fragmentShader})),this.fsQuad=new S(this.material)}render(e,i,s){this.uniforms[this.textureID]&&(this.uniforms[this.textureID].value=s.texture),this.fsQuad.material=this.material,this.renderToScreen?(e.setRenderTarget(null),this.fsQuad.render(e)):(e.setRenderTarget(i),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this.fsQuad.render(e))}dispose(){this.material.dispose(),this.fsQuad.dispose()}}class R extends p{constructor(e,i){super(),this.scene=e,this.camera=i,this.clear=!0,this.needsSwap=!1,this.inverse=!1}render(e,i,s){const a=e.getContext(),t=e.state;t.buffers.color.setMask(!1),t.buffers.depth.setMask(!1),t.buffers.color.setLocked(!0),t.buffers.depth.setLocked(!0);let r,o;this.inverse?(r=0,o=1):(r=1,o=0),t.buffers.stencil.setTest(!0),t.buffers.stencil.setOp(a.REPLACE,a.REPLACE,a.REPLACE),t.buffers.stencil.setFunc(a.ALWAYS,r,4294967295),t.buffers.stencil.setClear(o),t.buffers.stencil.setLocked(!0),e.setRenderTarget(s),this.clear&&e.clear(),e.render(this.scene,this.camera),e.setRenderTarget(i),this.clear&&e.clear(),e.render(this.scene,this.camera),t.buffers.color.setLocked(!1),t.buffers.depth.setLocked(!1),t.buffers.color.setMask(!0),t.buffers.depth.setMask(!0),t.buffers.stencil.setLocked(!1),t.buffers.stencil.setFunc(a.EQUAL,1,4294967295),t.buffers.stencil.setOp(a.KEEP,a.KEEP,a.KEEP),t.buffers.stencil.setLocked(!0)}}class me extends p{constructor(){super(),this.needsSwap=!1}render(e){e.state.buffers.stencil.setLocked(!1),e.state.buffers.stencil.setTest(!1)}}class pe{constructor(e,i){if(this.renderer=e,this._pixelRatio=e.getPixelRatio(),i===void 0){const s=e.getSize(new u);this._width=s.width,this._height=s.height,i=new v(this._width*this._pixelRatio,this._height*this._pixelRatio,{type:T}),i.texture.name="EffectComposer.rt1"}else this._width=i.width,this._height=i.height;this.renderTarget1=i,this.renderTarget2=i.clone(),this.renderTarget2.texture.name="EffectComposer.rt2",this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2,this.renderToScreen=!0,this.passes=[],this.copyPass=new de(E),this.copyPass.material.blending=N,this.clock=new y}swapBuffers(){const e=this.readBuffer;this.readBuffer=this.writeBuffer,this.writeBuffer=e}addPass(e){this.passes.push(e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}insertPass(e,i){this.passes.splice(i,0,e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}removePass(e){const i=this.passes.indexOf(e);i!==-1&&this.passes.splice(i,1)}isLastEnabledPass(e){for(let i=e+1;i<this.passes.length;i++)if(this.passes[i].enabled)return!1;return!0}render(e){e===void 0&&(e=this.clock.getDelta());const i=this.renderer.getRenderTarget();let s=!1;for(let a=0,t=this.passes.length;a<t;a++){const r=this.passes[a];if(r.enabled!==!1){if(r.renderToScreen=this.renderToScreen&&this.isLastEnabledPass(a),r.render(this.renderer,this.writeBuffer,this.readBuffer,e,s),r.needsSwap){if(s){const o=this.renderer.getContext(),l=this.renderer.state.buffers.stencil;l.setFunc(o.NOTEQUAL,1,4294967295),this.copyPass.render(this.renderer,this.writeBuffer,this.readBuffer,e),l.setFunc(o.EQUAL,1,4294967295)}this.swapBuffers()}R!==void 0&&(r instanceof R?s=!0:r instanceof me&&(s=!1))}}this.renderer.setRenderTarget(i)}reset(e){if(e===void 0){const i=this.renderer.getSize(new u);this._pixelRatio=this.renderer.getPixelRatio(),this._width=i.width,this._height=i.height,e=this.renderTarget1.clone(),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.renderTarget1=e,this.renderTarget2=e.clone(),this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2}setSize(e,i){this._width=e,this._height=i;const s=this._width*this._pixelRatio,a=this._height*this._pixelRatio;this.renderTarget1.setSize(s,a),this.renderTarget2.setSize(s,a);for(let t=0;t<this.passes.length;t++)this.passes[t].setSize(s,a)}setPixelRatio(e){this._pixelRatio=e,this.setSize(this._width,this._height)}dispose(){this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.copyPass.dispose()}}class ge extends p{constructor(e,i,s=null,a=null,t=null){super(),this.scene=e,this.camera=i,this.overrideMaterial=s,this.clearColor=a,this.clearAlpha=t,this.clear=!0,this.clearDepth=!1,this.needsSwap=!1,this._oldClearColor=new x}render(e,i,s){const a=e.autoClear;e.autoClear=!1;let t,r;this.overrideMaterial!==null&&(r=this.scene.overrideMaterial,this.scene.overrideMaterial=this.overrideMaterial),this.clearColor!==null&&(e.getClearColor(this._oldClearColor),e.setClearColor(this.clearColor)),this.clearAlpha!==null&&(t=e.getClearAlpha(),e.setClearAlpha(this.clearAlpha)),this.clearDepth==!0&&e.clearDepth(),e.setRenderTarget(this.renderToScreen?null:s),this.clear===!0&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),e.render(this.scene,this.camera),this.clearColor!==null&&e.setClearColor(this._oldClearColor),this.clearAlpha!==null&&e.setClearAlpha(t),this.overrideMaterial!==null&&(this.scene.overrideMaterial=r),e.autoClear=a}}const ve={uniforms:{tDiffuse:{value:null},luminosityThreshold:{value:1},smoothWidth:{value:1},defaultColor:{value:new x(0)},defaultOpacity:{value:0}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;

			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform sampler2D tDiffuse;
		uniform vec3 defaultColor;
		uniform float defaultOpacity;
		uniform float luminosityThreshold;
		uniform float smoothWidth;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );

			vec3 luma = vec3( 0.299, 0.587, 0.114 );

			float v = dot( texel.xyz, luma );

			vec4 outputColor = vec4( defaultColor.rgb, defaultOpacity );

			float alpha = smoothstep( luminosityThreshold, luminosityThreshold + smoothWidth, v );

			gl_FragColor = mix( outputColor, texel, alpha );

		}`};class m extends p{constructor(e,i,s,a){super(),this.strength=i!==void 0?i:1,this.radius=s,this.threshold=a,this.resolution=e!==void 0?new u(e.x,e.y):new u(256,256),this.clearColor=new x(0,0,0),this.renderTargetsHorizontal=[],this.renderTargetsVertical=[],this.nMips=5;let t=Math.round(this.resolution.x/2),r=Math.round(this.resolution.y/2);this.renderTargetBright=new v(t,r,{type:T}),this.renderTargetBright.texture.name="UnrealBloomPass.bright",this.renderTargetBright.texture.generateMipmaps=!1;for(let f=0;f<this.nMips;f++){const _=new v(t,r,{type:T});_.texture.name="UnrealBloomPass.h"+f,_.texture.generateMipmaps=!1,this.renderTargetsHorizontal.push(_);const M=new v(t,r,{type:T});M.texture.name="UnrealBloomPass.v"+f,M.texture.generateMipmaps=!1,this.renderTargetsVertical.push(M),t=Math.round(t/2),r=Math.round(r/2)}const o=ve;this.highPassUniforms=C.clone(o.uniforms),this.highPassUniforms.luminosityThreshold.value=a,this.highPassUniforms.smoothWidth.value=.01,this.materialHighPassFilter=new d({uniforms:this.highPassUniforms,vertexShader:o.vertexShader,fragmentShader:o.fragmentShader}),this.separableBlurMaterials=[];const l=[3,5,7,9,11];t=Math.round(this.resolution.x/2),r=Math.round(this.resolution.y/2);for(let f=0;f<this.nMips;f++)this.separableBlurMaterials.push(this.getSeperableBlurMaterial(l[f])),this.separableBlurMaterials[f].uniforms.invSize.value=new u(1/t,1/r),t=Math.round(t/2),r=Math.round(r/2);this.compositeMaterial=this.getCompositeMaterial(this.nMips),this.compositeMaterial.uniforms.blurTexture1.value=this.renderTargetsVertical[0].texture,this.compositeMaterial.uniforms.blurTexture2.value=this.renderTargetsVertical[1].texture,this.compositeMaterial.uniforms.blurTexture3.value=this.renderTargetsVertical[2].texture,this.compositeMaterial.uniforms.blurTexture4.value=this.renderTargetsVertical[3].texture,this.compositeMaterial.uniforms.blurTexture5.value=this.renderTargetsVertical[4].texture,this.compositeMaterial.uniforms.bloomStrength.value=i,this.compositeMaterial.uniforms.bloomRadius.value=.1;const c=[1,.8,.6,.4,.2];this.compositeMaterial.uniforms.bloomFactors.value=c,this.bloomTintColors=[new g(1,1,1),new g(1,1,1),new g(1,1,1),new g(1,1,1),new g(1,1,1)],this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors;const b=E;this.copyUniforms=C.clone(b.uniforms),this.blendMaterial=new d({uniforms:this.copyUniforms,vertexShader:b.vertexShader,fragmentShader:b.fragmentShader,blending:L,depthTest:!1,depthWrite:!1,transparent:!0}),this.enabled=!0,this.needsSwap=!1,this._oldClearColor=new x,this.oldClearAlpha=1,this.basic=new z,this.fsQuad=new S(null)}dispose(){for(let e=0;e<this.renderTargetsHorizontal.length;e++)this.renderTargetsHorizontal[e].dispose();for(let e=0;e<this.renderTargetsVertical.length;e++)this.renderTargetsVertical[e].dispose();this.renderTargetBright.dispose();for(let e=0;e<this.separableBlurMaterials.length;e++)this.separableBlurMaterials[e].dispose();this.compositeMaterial.dispose(),this.blendMaterial.dispose(),this.basic.dispose(),this.fsQuad.dispose()}setSize(e,i){let s=Math.round(e/2),a=Math.round(i/2);this.renderTargetBright.setSize(s,a);for(let t=0;t<this.nMips;t++)this.renderTargetsHorizontal[t].setSize(s,a),this.renderTargetsVertical[t].setSize(s,a),this.separableBlurMaterials[t].uniforms.invSize.value=new u(1/s,1/a),s=Math.round(s/2),a=Math.round(a/2)}render(e,i,s,a,t){e.getClearColor(this._oldClearColor),this.oldClearAlpha=e.getClearAlpha();const r=e.autoClear;e.autoClear=!1,e.setClearColor(this.clearColor,0),t&&e.state.buffers.stencil.setTest(!1),this.renderToScreen&&(this.fsQuad.material=this.basic,this.basic.map=s.texture,e.setRenderTarget(null),e.clear(),this.fsQuad.render(e)),this.highPassUniforms.tDiffuse.value=s.texture,this.highPassUniforms.luminosityThreshold.value=this.threshold,this.fsQuad.material=this.materialHighPassFilter,e.setRenderTarget(this.renderTargetBright),e.clear(),this.fsQuad.render(e);let o=this.renderTargetBright;for(let l=0;l<this.nMips;l++)this.fsQuad.material=this.separableBlurMaterials[l],this.separableBlurMaterials[l].uniforms.colorTexture.value=o.texture,this.separableBlurMaterials[l].uniforms.direction.value=m.BlurDirectionX,e.setRenderTarget(this.renderTargetsHorizontal[l]),e.clear(),this.fsQuad.render(e),this.separableBlurMaterials[l].uniforms.colorTexture.value=this.renderTargetsHorizontal[l].texture,this.separableBlurMaterials[l].uniforms.direction.value=m.BlurDirectionY,e.setRenderTarget(this.renderTargetsVertical[l]),e.clear(),this.fsQuad.render(e),o=this.renderTargetsVertical[l];this.fsQuad.material=this.compositeMaterial,this.compositeMaterial.uniforms.bloomStrength.value=this.strength,this.compositeMaterial.uniforms.bloomRadius.value=this.radius,this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,e.setRenderTarget(this.renderTargetsHorizontal[0]),e.clear(),this.fsQuad.render(e),this.fsQuad.material=this.blendMaterial,this.copyUniforms.tDiffuse.value=this.renderTargetsHorizontal[0].texture,t&&e.state.buffers.stencil.setTest(!0),this.renderToScreen?(e.setRenderTarget(null),this.fsQuad.render(e)):(e.setRenderTarget(s),this.fsQuad.render(e)),e.setClearColor(this._oldClearColor,this.oldClearAlpha),e.autoClear=r}getSeperableBlurMaterial(e){const i=[];for(let s=0;s<e;s++)i.push(.39894*Math.exp(-.5*s*s/(e*e))/e);return new d({defines:{KERNEL_RADIUS:e},uniforms:{colorTexture:{value:null},invSize:{value:new u(.5,.5)},direction:{value:new u(.5,.5)},gaussianCoefficients:{value:i}},vertexShader:`varying vec2 vUv;
				void main() {
					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
				}`,fragmentShader:`#include <common>
				varying vec2 vUv;
				uniform sampler2D colorTexture;
				uniform vec2 invSize;
				uniform vec2 direction;
				uniform float gaussianCoefficients[KERNEL_RADIUS];

				void main() {
					float weightSum = gaussianCoefficients[0];
					vec3 diffuseSum = texture2D( colorTexture, vUv ).rgb * weightSum;
					for( int i = 1; i < KERNEL_RADIUS; i ++ ) {
						float x = float(i);
						float w = gaussianCoefficients[i];
						vec2 uvOffset = direction * invSize * x;
						vec3 sample1 = texture2D( colorTexture, vUv + uvOffset ).rgb;
						vec3 sample2 = texture2D( colorTexture, vUv - uvOffset ).rgb;
						diffuseSum += (sample1 + sample2) * w;
						weightSum += 2.0 * w;
					}
					gl_FragColor = vec4(diffuseSum/weightSum, 1.0);
				}`})}getCompositeMaterial(e){return new d({defines:{NUM_MIPS:e},uniforms:{blurTexture1:{value:null},blurTexture2:{value:null},blurTexture3:{value:null},blurTexture4:{value:null},blurTexture5:{value:null},bloomStrength:{value:1},bloomFactors:{value:null},bloomTintColors:{value:null},bloomRadius:{value:0}},vertexShader:`varying vec2 vUv;
				void main() {
					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
				}`,fragmentShader:`varying vec2 vUv;
				uniform sampler2D blurTexture1;
				uniform sampler2D blurTexture2;
				uniform sampler2D blurTexture3;
				uniform sampler2D blurTexture4;
				uniform sampler2D blurTexture5;
				uniform float bloomStrength;
				uniform float bloomRadius;
				uniform float bloomFactors[NUM_MIPS];
				uniform vec3 bloomTintColors[NUM_MIPS];

				float lerpBloomFactor(const in float factor) {
					float mirrorFactor = 1.2 - factor;
					return mix(factor, mirrorFactor, bloomRadius);
				}

				void main() {
					gl_FragColor = bloomStrength * ( lerpBloomFactor(bloomFactors[0]) * vec4(bloomTintColors[0], 1.0) * texture2D(blurTexture1, vUv) +
						lerpBloomFactor(bloomFactors[1]) * vec4(bloomTintColors[1], 1.0) * texture2D(blurTexture2, vUv) +
						lerpBloomFactor(bloomFactors[2]) * vec4(bloomTintColors[2], 1.0) * texture2D(blurTexture3, vUv) +
						lerpBloomFactor(bloomFactors[3]) * vec4(bloomTintColors[3], 1.0) * texture2D(blurTexture4, vUv) +
						lerpBloomFactor(bloomFactors[4]) * vec4(bloomTintColors[4], 1.0) * texture2D(blurTexture5, vUv) );
				}`})}}m.BlurDirectionX=new u(1,0);m.BlurDirectionY=new u(0,1);const Te={name:"OutputShader",uniforms:{tDiffuse:{value:null},toneMappingExposure:{value:1}},vertexShader:`
		precision highp float;

		uniform mat4 modelViewMatrix;
		uniform mat4 projectionMatrix;

		attribute vec3 position;
		attribute vec2 uv;

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`
	
		precision highp float;

		uniform sampler2D tDiffuse;

		#include <tonemapping_pars_fragment>
		#include <colorspace_pars_fragment>

		varying vec2 vUv;

		void main() {

			gl_FragColor = texture2D( tDiffuse, vUv );

			// tone mapping

			#ifdef LINEAR_TONE_MAPPING

				gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );

			#elif defined( REINHARD_TONE_MAPPING )

				gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );

			#elif defined( CINEON_TONE_MAPPING )

				gl_FragColor.rgb = OptimizedCineonToneMapping( gl_FragColor.rgb );

			#elif defined( ACES_FILMIC_TONE_MAPPING )

				gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );

			#elif defined( AGX_TONE_MAPPING )

				gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );

			#elif defined( NEUTRAL_TONE_MAPPING )

				gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );

			#endif

			// color space

			#ifdef SRGB_TRANSFER

				gl_FragColor = sRGBTransferOETF( gl_FragColor );

			#endif

		}`};class Ce extends p{constructor(){super();const e=Te;this.uniforms=C.clone(e.uniforms),this.material=new O({name:e.name,uniforms:this.uniforms,vertexShader:e.vertexShader,fragmentShader:e.fragmentShader}),this.fsQuad=new S(this.material),this._outputColorSpace=null,this._toneMapping=null}render(e,i,s){this.uniforms.tDiffuse.value=s.texture,this.uniforms.toneMappingExposure.value=e.toneMappingExposure,(this._outputColorSpace!==e.outputColorSpace||this._toneMapping!==e.toneMapping)&&(this._outputColorSpace=e.outputColorSpace,this._toneMapping=e.toneMapping,this.material.defines={},I.getTransfer(this._outputColorSpace)===Q&&(this.material.defines.SRGB_TRANSFER=""),this._toneMapping===H?this.material.defines.LINEAR_TONE_MAPPING="":this._toneMapping===k?this.material.defines.REINHARD_TONE_MAPPING="":this._toneMapping===V?this.material.defines.CINEON_TONE_MAPPING="":this._toneMapping===G?this.material.defines.ACES_FILMIC_TONE_MAPPING="":this._toneMapping===W?this.material.defines.AGX_TONE_MAPPING="":this._toneMapping===j&&(this.material.defines.NEUTRAL_TONE_MAPPING=""),this.material.needsUpdate=!0),this.renderToScreen===!0?(e.setRenderTarget(null),this.fsQuad.render(e)):(e.setRenderTarget(i),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this.fsQuad.render(e))}dispose(){this.material.dispose(),this.fsQuad.dispose()}}const Pe=ae({__name:"demo6",setup(h){const e=P(),i=P();class s{constructor(t){n(this,"container");n(this,"scene");n(this,"camera");n(this,"renderer");n(this,"axesHelper");n(this,"stats");n(this,"gui");n(this,"controls");n(this,"uniforms");n(this,"clock");n(this,"audioLoaded",!1);n(this,"audioBuffer");n(this,"sound");n(this,"soundAnalyser");n(this,"bloomComposer");this.container=t,this.initScene(),this.initCamera(),this.initRenderer(),this.uniforms=ne({u_time:{type:"f",value:0},u_frequency:{type:"f",value:0},u_red:{type:"f",value:.3},u_green:{type:"f",value:1},u_blue:{type:"f",value:.6}}),this.clock=new y,this.initWorld(),this.initAudio(),this.initUtils(),this.initEventListeners(),this.update()}initScene(){this.scene=new K}initCamera(){this.camera=new X(60,this.container.clientWidth/this.container.clientHeight,.1,1e4),this.camera.position.set(10,10,10),this.camera.lookAt(0,0,0)}initRenderer(){this.renderer=new q({antialias:!0}),this.renderer.outputColorSpace=Y,this.renderer.setSize(this.container.clientWidth,this.container.clientHeight),this.renderer.setPixelRatio(window.devicePixelRatio),this.renderer.setClearColor(0,.5),this.container.appendChild(this.renderer.domElement);const t=new ge(this.scene,this.camera),r=new m(new u(this.container.clientWidth,this.container.clientHeight),.5,.1,.5);this.bloomComposer=new pe(this.renderer),this.bloomComposer.addPass(t),this.bloomComposer.addPass(r);const o=new Ce;this.bloomComposer.addPass(o)}async loadShader(t){try{const r=await fetch(t);if(!r.ok)throw new Error(`HTTP error! status: ${r.status}`);return await r.text()}catch(r){console.error("Error loading shader:",r)}}async initWorld(){const t=await this.loadShader("/demo6/vertex.glsl"),r=await this.loadShader("/demo6/fragment.glsl"),o=new d({uniforms:this.uniforms,vertexShader:t,fragmentShader:r}),l=new $(4,30),c=new A(l,o);c.material.wireframe=!0,this.scene.add(c)}initAudio(){const t=new J;this.camera.add(t),this.sound=new Z(t),this.sound.setLoop(!0),this.sound.setVolume(.5),new ee().load("/demo6/Beats.mp3",o=>{console.log("🚀 ~ World ~ audioLoader.load ~ buffer:",o),this.audioBuffer=o,this.audioLoaded=!0}),this.soundAnalyser=new te(this.sound,32)}initUtils(){this.controls=new re(this.camera,this.renderer.domElement),this.controls.enableDamping=!0,this.stats=new se,document.body.appendChild(this.stats.dom),this.gui=new ie,this.gui.close()}initEventListeners(){document.addEventListener("click",()=>{if(this.audioLoaded){this.sound.setBuffer(this.audioBuffer);try{this.sound.isPlaying||this.sound.play()}catch(t){console.log("🚀 ~ World ~ document.addEventListener ~ e:",t)}}}),window.addEventListener("resize",this.onWindowResize.bind(this))}onWindowResize(){this.camera.aspect=this.container.clientWidth/this.container.clientHeight,this.camera.updateProjectionMatrix(),this.renderer.setSize(this.container.clientWidth,this.container.clientHeight)}update(){var t,r,o,l,c;this.clock&&(this.uniforms.u_time.value=this.clock.getElapsedTime()),this.soundAnalyser&&(this.uniforms.u_frequency.value=this.soundAnalyser.getAverageFrequency()),(r=(t=this.controls)==null?void 0:t.update)==null||r.call(t),(l=(o=this.stats)==null?void 0:o.update)==null||l.call(o),(c=this.bloomComposer)==null||c.render(),requestAnimationFrame(this.update.bind(this))}}return oe(()=>{i.value=new s(e.value),document.title="音乐可视化 - Three.js"}),(a,t)=>(he(),le("div",{ref_key:"container",ref:e,class:"container"},null,512))}});export{Pe as default};
