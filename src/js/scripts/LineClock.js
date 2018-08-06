import RenderManeger3D from "./RenderManeger3D";


// 数値の頂点座標管理用
let numGeometryList = [];
let numGeoList = [];

// 最大長点数をもつGeometry
let maxGeometry = null;

// 時間（文字）の頂点管理用
let vertexesSystemList = [];

// 現在時間（6桁の文字列）
let now = getNow();


export default function () {
	let renderManeger3D = new RenderManeger3D($("#canvas_container"), {
		isController: true
	});

	// numGeometryListに数字の頂点生成して座標をキャッシュしておく
	// font loader
	let loader = new THREE.FontLoader();
	let typeface = "../assets/fonts/helvetiker_regular.typeface.json?" + performance.now();

	loader.load(typeface, (font) => {
		for (let i = 0; i < 10; ++i) {
			numGeometryList[i] = {};

			// TextGeometry
			numGeometryList[i] = new THREE.TextBufferGeometry(i, {
				font: font,
				// size: 40,
				// height: 8,
				// curveSegments: 5,
				// bevelEnabled: true,
				// bevelThickness: 5,
				// bevelSize: 1.5,
				// bevelSegments: 5

				size: 40,
				height: 10,
				curveSegments: 10,

				bevelThickness: 5,
				bevelSize: 2,
				bevelEnabled: true,
				bevelSegments: 10,

			});

			// ジオメトリを中央に配置
			numGeometryList[i].center();

			// 最大頂点を持つGeometryを保管
			if (!maxGeometry || maxGeometry.attributes.position.count < numGeometryList[i].attributes.position.count){
				maxGeometry = numGeometryList[i];
			}
		}

		// 最大頂点数
		let count = maxGeometry.attributes.position.count;

		// numGeoList 数字geometryキャッシュ用
		for (let i = 0; i < 10; ++i) {
			let geometry = new THREE.BufferGeometry();
			let position = new THREE.Float32BufferAttribute(count * 3, 3);

			let numAry = numGeometryList[i].attributes.position.array;
			let len = position.array.length;
			for (let j = 0; j < len; j += 1) {
				// if (numAry.length-1 < j){
				// 	position.array[j] = numAry[numAry.length-1];
				// } else {
				// 	position.array[j] = numAry[j];
				// }
				position.array[j] = numAry[j % numAry.length];
			}


			geometry.addAttribute('position', position);
			numGeoList[i] = geometry;

			numGeoList[i].opacityAmount = count/ numGeometryList[i].attributes.position.count;
		}


		// 表示する時間の頂点を生成
		for (let i = 0; i < 6; ++i) {
			let geometry = new THREE.BufferGeometry();

			let position = new THREE.Float32BufferAttribute(count * 3, 3);
			position.array = new Float32Array(numGeoList[now[i]].attributes.position.array);
			geometry.addAttribute('position', position);

			let nextPosition = new THREE.Float32BufferAttribute(count * 3, 3);
			nextPosition.array = new Float32Array(numGeoList[now[i]].attributes.position.array);
			geometry.addAttribute('nextPosition', nextPosition);

			let customColor = new THREE.Float32BufferAttribute(count * 3, 3);
			geometry.addAttribute('customColor', customColor);

			let color = new THREE.Color(0xffffff);
			for (let j = 0; j < customColor.count; j++) {
				// console.log(j / customColor.count);
				// color.setHSL( (j / customColor.count), 0.5, 0.5);
				color.setHSL( i/6, 0.5, 0.5);
				color.toArray(customColor.array, j * customColor.itemSize);
			}

			let uniforms = {
				opacity: { type: "f", value: 0.2 },
				opacityAmount: { type: "f", value: numGeoList[now[i]].opacityAmount},
				color: { type: "c", value: new THREE.Color(0xffffff) },
				time: { type: "f", value: 0},
				progress: { type: "f", value: 0},
			};

			let shaderMaterial = new THREE.ShaderMaterial({
				uniforms: uniforms,
				vertexShader: require("../../shader/default.vert"),
				fragmentShader: require("../../shader/default.frag"),
				blending: THREE.AdditiveBlending,
				depthTest: false,
				transparent: true
			});

			let vertexesSystem = new THREE.Line(geometry, shaderMaterial);
			vertexesSystem.position.x = 35 * i - (35 * 2.5);

			// 時間表示用頂点
			vertexesSystemList.push(vertexesSystem);
			renderManeger3D.scene.add(vertexesSystem);
		}


		// renderManeger3D.scene.background = new THREE.Color(0x050505);

		// camera positon
		renderManeger3D.camera.position.z = 150;

		if (INK.isSmartPhone()) {
			renderManeger3D.camera.position.z = 360;
		}

		// start
		renderManeger3D.start();
	});


	// update
	renderManeger3D.event.on("update", () => {
		vertexesSystemList.forEach((item)=>{
			item.material.uniforms.color.value.offsetHSL(0.0005, 0, 0);
			item.material.uniforms.time.value += 1/60;
		});

		let _now = getNow();
		if (now != _now) {
			for (let i = 0; i < now.length; i++) {
				if (now[i] != _now[i]) {
					morphTo(i, +_now[i]);
				}
			}
			now = _now;
		}
	});
}


/*--------------------------------------------------------------------------
	utils
--------------------------------------------------------------------------*/
/**
 * @method morphTo モーフィングアニメーション
 * @param {Number} index 桁数（頭から数えて）
 * @param {Number} num アニメーションする数字
 */
function morphTo(index, num) {
	vertexesSystemList[index].geometry.attributes.nextPosition.array = new Float32Array(numGeoList[num].attributes.position.array);

	vertexesSystemList[index].material.uniforms.progress.value = 0;
	vertexesSystemList[index].material.uniforms.opacityAmount.value = numGeoList[num].opacityAmount;

	vertexesSystemList[index].geometry.attributes.position.needsUpdate = true;
	vertexesSystemList[index].geometry.attributes.nextPosition.needsUpdate = true;

	TweenMax.to(vertexesSystemList[index].material.uniforms.progress, .5, {
		value: 1,
		ease: Expo.easeOut,
		onComplete: () => {
			vertexesSystemList[index].geometry.attributes.position.array = new Float32Array(numGeoList[num].attributes.position.array);
		}
	});
}


/**
 * @method getNow 現在の時、分、秒を文字列にして返す
 * @return {String}
 */
function getNow() {
	let date = new Date();
	return zeroPadding(date.getHours()) + zeroPadding(date.getMinutes()) + zeroPadding(date.getSeconds());
}


/**
 * @method zeroPadding 1桁の場合、先頭に0を追加して2桁にする
 * @param {Number} num
 * @return {String}
 */
function zeroPadding(num) {
	let numStr = "" + num;
	if (numStr.length < 2) {
		numStr = "0" + numStr;
	}
	return numStr;
}
