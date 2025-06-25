precision highp float;

uniform sampler2D uEnvmap1;
uniform sampler2D uEnvmap2;
uniform float uWeight;
uniform float uIntensity;

varying vec2 vUv;

void main() {
	vec3 envmap1 = texture2D(uEnvmap1, vUv).rgb;
	vec3 envmap2 = texture2D(uEnvmap2, vUv).rgb;
	vec3 col = mix(envmap1, envmap2, clamp(uWeight, 0.0, 1.0)) * uIntensity;
	col = col / (col + vec3(1.0)); // 可选：HDR 色调映射
	gl_FragColor = vec4(col, 1.0);
}