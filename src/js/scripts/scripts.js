import RenderManeger3D from "./utils/RenderManeger3D";


/*--------------------------------------------------------------------------
	parameter
--------------------------------------------------------------------------*/
let renderManeger3D;

// 数値の頂点管理リスト
let numGeoList = [];

// 最大頂点数をもつGeometry
let maxGeometry = null;

// 表示時間の頂点リスト（文字単位）
let vertexList = [];

// font data
let fontData;

// 現在時間（6桁の文字列）
let now = getNow();


/*--------------------------------------------------------------------------
	init
--------------------------------------------------------------------------*/
function init() {
	renderManeger3D = new RenderManeger3D($("#canvas_container"), {
		isController: true
	});


	// 頂点のノイズ量・ノイズ速度
	renderManeger3D.gui.params.noise = 0.5;
	renderManeger3D.gui.params.speed = 1;


	// numGeometryListに数字の頂点生成して座標をキャッシュしておく
	let loader = new THREE.FontLoader();
	let typeface = "./assets/fonts/helvetiker_regular.typeface.json?" + performance.now();

	loader.load(typeface, (font) => {
		fontData = font;

		// dat.gui
		renderManeger3D.gui.add(renderManeger3D.gui.params, 'noise', 0, 10).onChange((val) => {
			vertexList.forEach((item) => {
				item.material.uniforms.noiseAmount.value = val;
			});
		});
		renderManeger3D.gui.add(renderManeger3D.gui.params, 'speed', 0, 100);

		// ライン生成
		createLine();

		// start
		renderManeger3D.start();
	});


	// camera positon
	if (INK.isSmartPhone()) {
		renderManeger3D.camera.position.z = 360;
	} else {
		renderManeger3D.camera.position.z = 150;
	}


	// update
	renderManeger3D.event.on("update", () => {
		vertexList.forEach((item)=>{
			// item.material.uniforms.color.value.offsetHSL(0.0005, 0, 0);
			item.material.uniforms.time.value = renderManeger3D.time * renderManeger3D.gui.params.speed;
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
	createLine
--------------------------------------------------------------------------*/
function createLine() {
	// numGeometryList: 0から9までのTextBufferGeometryを生成
	let numGeometryList = [];

	for (let i = 0; i < 10; ++i) {
		numGeometryList[i] = {};

		numGeometryList[i] = new THREE.TextBufferGeometry(i, {
			font: fontData,
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
		if (i == 0 || maxGeometry.attributes.position.count < numGeometryList[i].attributes.position.count) {
			maxGeometry = numGeometryList[i];
		}
	}

	// 最大頂点数
	let count = maxGeometry.attributes.position.count;

	// numGeoList: 頂点アニメーション用のGeometryListを生成
	// 最大頂点数に合わせて、数字Geometryの頂点数を全て揃えて作り直す
	for (let i = 0; i < 10; ++i) {
		let geometry = new THREE.BufferGeometry();

		let position = new THREE.Float32BufferAttribute(count * 3, 3);
		let color = new THREE.Float32BufferAttribute(count * 3, 3);
		let opacity = new THREE.Float32BufferAttribute(count, 1);

		let numAry = numGeometryList[i].attributes.position.array;
		let maxCount = numGeometryList[i].attributes.position.count;
		let addCount = (opacity.count / maxCount);
		let baseColor = new THREE.Color(0x00000);

		// 全ての文字の頂点数が合うように頂点を生成
		// 頂点色も調整
		for (let j = 0, k = 0; j < color.array.length; j += 1, k += addCount) {
			position.array[j] = numAry[j % numAry.length];
			baseColor.setHSL(k / maxCount, 0.5, 0.5);

			// 頂点が重複したら透過
			if (maxCount > j) {
				opacity.array[j] = 1.0;
			} else {
				opacity.array[j] = 0.0;
			}

			baseColor.toArray(color.array, j * color.itemSize);
		}

		geometry.addAttribute('position', position);
		geometry.addAttribute('color', color);
		geometry.addAttribute('opacity', opacity);

		numGeoList[i] = geometry;
	}


	// vertexList: 表示する時間の頂点を生成
	for (let i = 0; i < now.length; ++i) {
		let geometry = new THREE.BufferGeometry();

		// set attributes
		// 頂点ポジション
		let position = new THREE.Float32BufferAttribute(count * 3, 3);
		position.array = new Float32Array(numGeoList[now[i]].attributes.position.array);
		geometry.addAttribute('position', position);

		// 次に表示するポジション
		let nextPosition = new THREE.Float32BufferAttribute(count * 3, 3);
		nextPosition.array = new Float32Array(numGeoList[now[i]].attributes.position.array);
		geometry.addAttribute('nextPosition', nextPosition);

		// 頂点色
		let color = new THREE.Float32BufferAttribute(count * 3, 3);
		color.array = new Float32Array(numGeoList[now[i]].attributes.color.array);
		geometry.addAttribute('color', color);

		// 頂点の透明度（重複する頂点は0.0 透過する）
		let opacity = new THREE.Float32BufferAttribute(count, 1);
		opacity.array = new Float32Array(numGeoList[now[i]].attributes.opacity.array);
		geometry.addAttribute('opacity', opacity);

		let uniforms = {
			time: { type: "f", value: 0 },
			noiseAmount: { type: "f", value: 1.0 },
			progress: { type: "f", value: 0 },
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

		// 文字を中央配置
		line.position.x = 35 * i - (35 * 2.5);

		// 表示時間頂点リスト
		vertexList.push(line);

		renderManeger3D.scene.add(line);
	}
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
	vertexList[index].geometry.attributes.color.array = new Float32Array(numGeoList[num].attributes.color.array);
	vertexList[index].geometry.attributes.opacity.array = new Float32Array(numGeoList[num].attributes.opacity.array);
	vertexList[index].material.uniforms.progress.value = 0;

	vertexList[index].geometry.attributes.nextPosition.needsUpdate = true;
	vertexList[index].geometry.attributes.color.needsUpdate = true;
	vertexList[index].geometry.attributes.opacity.needsUpdate = true;
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


/*==========================================================================
	DOM READY
==========================================================================*/
$(()=>{
	init();
});
