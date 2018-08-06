attribute vec3 customColor;
varying vec3 vColor;

attribute vec3 nextPosition;
uniform float progress;
uniform float time;


#pragma glslify: snoise2 = require(glsl-noise/simplex/2d);



void main() {
	vColor = customColor;
	vec3 newPosition = mix( position, nextPosition, progress);

	vec3 noise = vec3(
		snoise2(vec2(newPosition.x, time)),
		snoise2(vec2(newPosition.y, time)),
		snoise2(vec2(newPosition.z, time))
	) * .9;

	gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition + noise, 1.0);
	// gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}
