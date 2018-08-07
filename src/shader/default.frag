varying vec3 vColor;
varying float vOpacity;

uniform vec3 color;
uniform float opacity;

void main() {
	if(vOpacity == 0.0){
		discard;
	} else {
		gl_FragColor = vec4(vColor * color, (vOpacity * opacity));
	}
	// gl_FragColor = vec4(vColor * color, (vOpacity * opacity));
}
