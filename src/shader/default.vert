attribute vec3 color;
varying vec3 vColor;

attribute float opacity;
varying float vOpacity;

attribute vec3 nextPosition;

uniform float time;
uniform float noiseAmount;
uniform float progress;


#pragma glslify: snoise2 = require(glsl-noise/simplex/2d);


void main() {
	vColor = color;
	vOpacity = opacity;

	// 頂点ポジション
	vec3 newPosition = mix(position, nextPosition, progress);

	// ノイズを加える
	newPosition += vec3(
		snoise2(vec2(newPosition.x, time)),
		snoise2(vec2(newPosition.y, time)),
		snoise2(vec2(newPosition.z, time))
	) * noiseAmount;

	gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}
