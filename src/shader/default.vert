precision mediump float;

attribute vec3 color;
attribute float opacity;
attribute vec3 nextPosition;

uniform float time;
uniform float noiseAmount;
uniform float progress;

varying vec3 vColor;
varying float vOpacity;


#pragma glslify: snoise2 = require(glsl-noise/simplex/2d);


void main() {
	vColor = color;
	vOpacity = opacity;

	vec3 newPosition = mix(position, nextPosition, progress);

	newPosition += vec3(
		snoise2(vec2(newPosition.x, time)),
		snoise2(vec2(newPosition.y, time)),
		snoise2(vec2(newPosition.z, time))
	) * noiseAmount;

	gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}
