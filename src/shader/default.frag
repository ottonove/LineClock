precision mediump float;

varying vec3 vColor;
varying float vOpacity;


void main() {
	if(vOpacity == 0.0){
		discard;
	} else {
		gl_FragColor = vec4(vColor, (vOpacity * 0.2));
	}
}
