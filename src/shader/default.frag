varying vec3 vColor;
uniform vec3 color;
uniform float opacity;
uniform float opacityAmount;

void main() {
	// gl_FragColor = vec4(vColor/opacityAmount * (color/opacityAmount), (.3));
	gl_FragColor = vec4(vColor/1.0 * (color/1.0), (.3/opacityAmount));
}
