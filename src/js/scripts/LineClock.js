import RenderManeger3D from "./RenderManeger3D";


// 数値の頂点座標管理用
let numGeoList = [];

// 最大頂点数をもつGeometry
let maxGeometry = null;

// 時間（文字）の頂点管理用
let vertexList = [];

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
		// numGeometryList
		// 0から9までのTextBufferGeometryを生成
		let numGeometryList = [];
		for (let i = 0; i < 10; ++i) {
			numGeometryList[i] = {};

			numGeometryList[i] = new THREE.TextBufferGeometry(i, {
				font: font,
				size: 40,
				height: 15,
				curveSegments: 10,
				bevelThickness: 5,
				bevelSize: 2,
				bevelEnabled: true,
				bevelSegments: 10
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

		// numGeoList
		// 頂点アニメーション用のGeometryListを生成(数字Geometryの頂点数を全て揃えて作り直す)
		for (let i = 0; i < 10; ++i) {
			let geometry = new THREE.BufferGeometry();
			let position = new THREE.Float32BufferAttribute(count * 3, 3);
			let customColor = new THREE.Float32BufferAttribute(count * 3, 3);
			let customOpacity = new THREE.Float32BufferAttribute(count, 1);
			let numAry = numGeometryList[i].attributes.position.array;
			let maxCount = numGeometryList[i].attributes.position.count;
			let add = (customOpacity.count / maxCount);

			for (let j = 0, k = 0; j < customColor.array.length; j += 1, k += add) {
				position.array[j] = numAry[j % numAry.length];
				let color = new THREE.Color(0xffffff);
				let colorH = k / maxCount;
				color.setHSL(colorH, 0.5, 0.5);

				if (maxCount > j){
					customOpacity.array[j] = 1.0;
				} else {
					customOpacity.array[j] = 0.0;
					// 頂点数が少ないgeometry用に適当に調整している
					// let nn = j / maxCount;
					// if (13 < nn && 15 > nn){
					// 	customOpacity.array[j] = nn/100;
					// } else {
					// 	customOpacity.array[j] = 0.0;
					// }
				}

				color.toArray(customColor.array, j * customColor.itemSize);
			}

			geometry.addAttribute('position', position);
			geometry.addAttribute('customColor', customColor);
			geometry.addAttribute('customOpacity', customOpacity);
			numGeoList[i] = geometry;
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
			customColor.array = new Float32Array(numGeoList[now[i]].attributes.customColor.array);
			geometry.addAttribute('customColor', customColor);

			let customOpacity = new THREE.Float32BufferAttribute(count, 1);
			customOpacity.array = new Float32Array(numGeoList[now[i]].attributes.customOpacity.array);
			geometry.addAttribute('customOpacity', customOpacity);

			// let color = new THREE.Color(0xffffff);
			// for (let j = 0; j < customColor.count; j++) {
			// 	color.setHSL((j / numGeometryList[now[i]].attributes.position.array.length), 0.5, 0.5);
			// 	// color.setHSL( i/6, 0.5, 0.5);
			// 	color.toArray(customColor.array, j * customColor.itemSize);
			// }

			let uniforms = {
				noiseAmount: { type: "f", value: 1.0 },
				opacity: { type: "f", value: 0.2 },
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

			let line = new THREE.Line(geometry, shaderMaterial);
			line.position.x = 35 * i - (35 * 2.5);

			// 時間表示用頂点
			vertexList.push(line);
			renderManeger3D.scene.add(line);
		}


		// Start
		if (INK.isSmartPhone()) {
			renderManeger3D.camera.position.z = 360;
		} else {
			renderManeger3D.camera.position.z = 150;
		}
		renderManeger3D.start();


		renderManeger3D.gui.params.noise = 0.5;

		renderManeger3D.gui.add(renderManeger3D.gui.params, 'noise', 0, 3).onChange((val) => {
			vertexList.forEach((item) => {
				item.material.uniforms.noiseAmount.value = val;
			});
		});
	});


	// update
	renderManeger3D.event.on("update", () => {
		vertexList.forEach((item)=>{
			item.material.uniforms.color.value.offsetHSL(0.0005, 0, 0);
			item.material.uniforms.time.value += 1/60;
		});

		// 表示時間の更新
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
	vertexList[index].geometry.attributes.nextPosition.array = new Float32Array(numGeoList[num].attributes.position.array);
	vertexList[index].geometry.attributes.customColor.array = new Float32Array(numGeoList[num].attributes.customColor.array);
	vertexList[index].geometry.attributes.customOpacity.array = new Float32Array(numGeoList[num].attributes.customOpacity.array);
	vertexList[index].material.uniforms.progress.value = 0;

	vertexList[index].geometry.attributes.nextPosition.needsUpdate = true;
	vertexList[index].geometry.attributes.customColor.needsUpdate = true;
	vertexList[index].geometry.attributes.customOpacity.needsUpdate = true;
	vertexList[index].geometry.attributes.position.needsUpdate = true;

	TweenMax.to(vertexList[index].material.uniforms.progress, .6, {
		value: 1,
		ease: Expo.easeOut,
		onComplete: () => {
			vertexList[index].geometry.attributes.position.array = new Float32Array(numGeoList[num].attributes.position.array);
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
