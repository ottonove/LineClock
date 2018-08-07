attribute vec3 customColor;
varying vec3 vColor;

attribute float customOpacity;
varying float vOpacity;

attribute vec3 nextPosition;
uniform float progress;
uniform float time;
uniform float noiseAmount;


#pragma glslify: snoise2 = require(glsl-noise/simplex/2d);



void main() {
	vColor = customColor;
	vOpacity = customOpacity;

	// 頂点ポジション
	vec3 newPosition = mix(position, nextPosition, progress);

	// 頂点ポジションにノイズを加える
	newPosition += vec3(
		snoise2(vec2(newPosition.x, time * customOpacity)),
		snoise2(vec2(newPosition.y, time * customOpacity)),
		snoise2(vec2(newPosition.z, time * customOpacity))
	) * noiseAmount;

	gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}
