var container;
var count = 0;
var camera, scene, renderer, particles, geometry, i, h, color;
var shaderMaterial, metalMaterial;
var mouseX = 0, mouseY = 0;
var starfield;
var planes = [];
var clock;
var textMesh;
var logoMesh;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

init();
animate();

function createStarfield(n, size, spread) {
  var clouds = n;

  var vertices = new Float32Array(clouds * 3);
  var randoms = new Float32Array(clouds * 1);

  var r1 = 1.0;
  var g1 = 1.0;
  var b1 = 1.0;

  var r2 = 0.9;
  var g2 = 0.9;
  var b2 = 1.0;

  var oz = 0;

  for (i = 0; i < clouds; ++i) {
    var f = (clouds - i) / clouds;
    var g = i / clouds;

    var x = 2 * Math.random() * spread - spread;
    var y = 2 * Math.random() * spread - spread;
    var z = 2 * Math.random() * spread - spread;

    vertices[i * 3 + 0] = x;
    vertices[i * 3 + 1] = y;
    vertices[i * 3 + 2] = z;

    randoms[i] = Math.random();
  }

  return {
    spread: spread,
    size: size,
    vertices: vertices,
    randoms: randoms
  };
}

function init() {
  THREE.ImageUtils.crossOrigin = '';
  container = document.createElement('div');
  container.id = 'fullscreen';
  document.body.appendChild(container);

  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 10000);
  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(new THREE.Color(0.1, 0.1, 0.1), 1000, 9000);
  scene.background = new THREE.Color(0.1, 0.1, 0.1);

  clock = new THREE.Clock();
  clock.start();

  {
    var s = 16;
    var n = 1024;
    var spread = 1024.0;
    starfield = createStarfield(n, s, spread);
  }
  geometry = new THREE.Geometry();

  var bufferGeometry = new THREE.BufferGeometry();
  bufferGeometry.addAttribute('position', new THREE.BufferAttribute(starfield.vertices, 3));
  bufferGeometry.addAttribute('random', new THREE.BufferAttribute(starfield.randoms, 1));

  uniforms = {
    texture: { type: "t", value: THREE.ImageUtils.loadTexture('sphere.png') },
    uCameraPos: { type: "3f", value: THREE.Vector3(0, 0, 0) },
    uReflection: { type: "1f", value: 0.0 },
    uTime: { type: "1f", value: 0.0 },
    uSize: { type: "1f", value: 0.0 }
  };

  shaderMaterial = new THREE.ShaderMaterial({
    uniforms:       uniforms,
    vertexShader:   document.getElementById('vertexshader').textContent,
    fragmentShader: document.getElementById('fragmentshader').textContent,
    transparent:    true,
    depthTest:      true,
    depthWrite:     false,
    blending:       THREE.AdditiveBlending
  });

  particles = new THREE.Points(bufferGeometry, shaderMaterial);
  scene.add(particles);

  /*
     cubeCamera1 = new THREE.CubeCamera(1, 10000, 1024);
     cubeCamera1.renderTarget.texture.minFilter = THREE.LinearMipMapLinearFilter;
     scene.add(cubeCamera1);

     cubeCamera2 = new THREE.CubeCamera(1, 10000, 1024);
     cubeCamera2.renderTarget.texture.minFilter = THREE.LinearMipMapLinearFilter;
     scene.add(cubeCamera2);
   */

  /*
     var urls = [
     "posx.jpg", "negx.jpg",
     "posy.jpg", "negy.jpg",
     "posz.jpg", "negz.jpg"
     ];

     var reflectionCube = new THREE.CubeTextureLoader().load(urls);

     var materialArray = [];
     for (var i = 0; i < 6; ++i) {
     materialArray.push( new THREE.MeshBasicMaterial({
     map: THREE.ImageUtils.loadTexture(urls[i]),
     side: THREE.BackSide
     }));
     }

     var skybox = new THREE.Mesh(new THREE.CubeGeometry(10000, 10000, 10000), new THREE.MeshFaceMaterial(materialArray));
     skybox.rotation.x = Math.PI * 0.5;
     skybox.rotation.y = Math.PI;
     scene.add(skybox);
   */
  var nebulaTexture = new THREE.TextureLoader().load('nebula.png', function (texture) {
    for (var i = 0; i < 8; ++i) {
      var plane = new THREE.Mesh(new THREE.PlaneGeometry(2048, 2048, 32), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, map: texture, transparent: true }));
      plane.rotation.x = Math.PI * 0.5;
      plane.position.y = 1000;
      scene.add(plane);
      planes.push(plane);
    }
  });

  var baseColor = new THREE.Color(0, 140 / 255, 186 / 255);
  var whiteColor = new THREE.Color(0.9, 0.9, 0.9);
  metalMaterial = new THREE.MeshStandardMaterial({
    color: whiteColor,
    emissive: baseColor,
    emissiveIntensity: 0.1,
    //envMap: cubeCamera2.renderTarget.texture,
    //envMap: reflectionCube,
    metalness: 0.1,
    roughness: 0
  });

  var objLoader = new THREE.OBJLoader();

  objLoader.load(
    'nitor.obj',
    function (object) {
      object.traverse(function (child) {
        if (child instanceof THREE.Mesh) {
          child.material = metalMaterial;
        }
      });
      object.rotation.x = Math.PI;
      object.rotation.z = Math.PI;
      logoMesh = object;
      scene.add(object);
    });

  var ambientlight = new THREE.AmbientLight(0xffffff, 0.2);
  scene.add(ambientlight);

  var pointLight = new THREE.PointLight(0xe0f0ff, 2.0, 10000);
  pointLight.position.set(0, 200, 200);
  scene.add(pointLight);

  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  //renderer.autoClear = false;
  //renderer.setFaceCulling(THREE.CullFaceNone);
  container.appendChild(renderer.domElement);

  document.addEventListener('mousedown', onDocumentMouseDown, false);
  document.addEventListener('mousemove', onDocumentMouseMove, false);
  document.addEventListener('touchstart', onDocumentTouchStart, false);
  document.addEventListener('touchmove', onDocumentTouchMove, false);
  window.addEventListener('resize', onWindowResize, false);
}

function onDocumentMouseDown(event) {
  var target = document.getElementById('fullscreen');
  var requestFullscreen = target.requestFullscreen || target.webkitRequestFullscreen || target.mozRequestFullScreen;
  if (event.button === 2) {
    requestFullscreen.call(target);
  }
}

function onDocumentMouseMove(event) {
  mouseX = event.clientX - windowHalfX;
  mouseY = event.clientY - windowHalfY;
}

function goFullscreen(event) {
  var target = document.getElementById('fullscreen');
  var requestFullscreen = target.requestFullscreen || target.webkitRequestFullscreen || target.mozRequestFullScreen;
  requestFullscreen.call(target);
  if (event) event.preventDefault();
}

function onDocumentTouchStart(event) {
  var target = document.getElementById('fullscreen');
  var requestFullscreen = target.requestFullscreen || target.webkitRequestFullscreen || target.mozRequestFullScreen;
  if (event.touches.length == 2) {
    requestFullscreen.call(target);
  } else if (event.touches.length === 1) {
    event.preventDefault();
    mouseX = event.touches[0].pageX - windowHalfX;
    mouseY = event.touches[0].pageY - windowHalfY;
  }
}

function onDocumentTouchMove(event) {
  if (event.touches.length === 1) {
    event.preventDefault();
    mouseX = event.touches[0].pageX - windowHalfX;
    mouseY = event.touches[0].pageY - windowHalfY;
  }
}

function onWindowResize(event) {
  windowHalfX = window.innerWidth / 2;
  windowHalfY = window.innerHeight / 2;

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);

  var t = clock.getElapsedTime();

  var a = 0;//2 * mouseX / windowHalfX;
  var b = 0;//2 * mouseY / windowHalfY;
  var x = 0.0;
  var y = 500;
  var z = 1000 * b;

  camera.position.x = x * Math.cos(a) - y * Math.sin(a);
  camera.position.y = - x * Math.sin(a) + y * Math.cos(a);
  camera.position.z = z;

  camera.lookAt(scene.position);
  //camera.rotation.order = 'XYZ';
  //camera.rotateOnAxis(new THREE.Vector3(0, 0, 1), a / 10.0);
  //camera.up = new THREE.Vector3(0, 0, 1);

  camera.rotation.z = 7.0 * Math.sin(t * 0.03) + 3.0 * Math.sin(t * 0.03) * Math.sin(t * 0.1) * Math.PI * 2.0;

  if (logoMesh) {
    logoMesh.rotation.y = -camera.rotation.z + Math.PI;
  }

  //console.log(planes[0].position.y + " " + planes[0].opacity);
  for (var i = 0; i < planes.length; ++i) {
    planes[i].position.y += 140.0;
    if (planes[i].position.y > -3000) {
      planes[i].material.opacity = -(planes[i].position.y + 700) / 2300;
    } else {
      planes[i].material.opacity = 1.0;
    }
    if (planes[i].position.y > -700) {
      planes[i].material.opacity = 0.0;
      var spread = 2048;
      planes[i].position.x = Math.random() * 2 * spread - spread;
      planes[i].position.y = -10000 - Math.random() * 10000;
      planes[i].position.z = Math.random() * 2 * spread - spread;
      rr = Math.random() * Math.PI * 2.0;
      planes[i].rotation.z = rr;
      rs = Math.random() * 5.0 + 0.5;
      planes[i].scale.x = rs;
      planes[i].scale.y = rs;
      planes[i].scale.z = rs;
    }
  }

  render();
}

function render() {
  var t = clock.getElapsedTime();
  /*
  if (logoMesh || textMesh) {
    shaderMaterial.uniforms.uCameraPos.value = new THREE.Vector3(0, 0, 0);
    var reflectionDistance = camera.position.distanceTo(new THREE.Vector3(0, 0, 0));
    if (textMesh) textMesh.visible = false;
    if (logoMesh) logoMesh.visible = false;

    if (count % 2 === 0) {
      metalMaterial.envMap = cubeCamera1.renderTarget.texture;
      shaderMaterial.uniforms.uReflection.value = reflectionDistance;
      cubeCamera2.update(renderer, scene);
    } else {
      metalMaterial.envMap = cubeCamera2.renderTarget.texture;
      shaderMaterial.uniforms.uReflection.value = reflectionDistance;
      cubeCamera1.update(renderer, scene);
    }
    ++count;

    if (textMesh) textMesh.visible = true;
    if (logoMesh) logoMesh.visible = true;
  }
  */

  shaderMaterial.uniforms.uCameraPos.value = camera.position;
  shaderMaterial.uniforms.uReflection.value = 0.0;
  shaderMaterial.uniforms.uTime.value = t;
  shaderMaterial.uniforms.uSize.value = starfield.size;

  renderer.render(scene, camera);
}

function initFullscreen() {
  var gofull = document.getElementById('gofull');
  if (gofull) {
    gofull.addEventListener('mousedown', goFullscreen);
    gofull.addEventListener('touchstart', goFullscreen);
  } else {
    setTimeout(initFullscreen, 500);
  }
}

initFullscreen();
