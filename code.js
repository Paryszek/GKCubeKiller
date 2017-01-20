var scene, camera, renderer, meshfloor,ambientLight , light, cube, crosshair, position,clock,killsLeft,ammoLeft,  winOrLose;
var mesh;

var meshes = {};
var bullets = [];
var enemy = [];
var PLAYABLE = true;
var MAP_SIZE_WIDTH = 100;
var MAP_SIZE_HEIGHT = 100;
var LatestX = -30, LatestZ = 30; //Tree spawn latest position
var LatestEnemyX = 60, LatestEnemyZ = -30; //Enemy spawn latest position
var USE_WIREFRAME = false;
var TREE_COUNT = 300;
var ENEMY_COUNT = 4; // musi tak zostac
var ENEMY_DOWN = false;
var HIT_BOX = 2;
var AMMUNITION = 15;
var AMMO_LESS = false;
var WIDTH = window.innerWidth;
var HEIGHT = window.innerHeight;
var player = { height: 1.0, speed: 0.2, turnSpeed: Math.PI * 0.02, canShoot:0};
var keyboard = {};
var crosshairpositioning = { top: (HEIGHT / 2)-15, left: (WIDTH / 2)-2};

function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}
function collision(EnemyPosZ,EnemyPosX,BulletPosZ,BulletPosX,id){
  var distanceInX = Math.floor(EnemyPosX-BulletPosX);
  var distanceInZ = Math.floor(EnemyPosZ-BulletPosZ);
  if((distanceInX > -HIT_BOX && distanceInX < HIT_BOX) && (distanceInZ > -HIT_BOX && distanceInZ < HIT_BOX))
  {
    enemy[id].isDown = true;
  }
}
function outOfSpawnArea(nX, nZ){
  if(!((-15 < nX && nX < 15) && (-15 < nZ && nZ < 15))){
      return true;
  }else { return false; }
}
//for enemy is he in spawn?
function outOfSpawnAreaCHECK(nX, nZ,id){
  //if(enemy[id].isDown == false){
    if(!((-5 < nX && nX < 5) && (-5 < nZ && nZ < 5))){
        return true;
    }else { return false; }
//  }
}
function outOfSpawnAreaENEMY(nX, nZ){
  if(!((-30 < nX && nX < 30) && (-30 < nZ && nZ < 30))){
      return true;
  }else { return false; }
}
function isInMapArea(nX, nZ){
  if((-MAP_SIZE_WIDTH < nX && nX < MAP_SIZE_WIDTH) && (-MAP_SIZE_HEIGHT < nZ && nZ < MAP_SIZE_HEIGHT)){
    return true;
  }else { return false };
}
function objSpawnCollision(lX,lZ,nX, nZ){
  if((LatestX>nX || LatestX<nX) && (LatestZ>nZ || LatestZ<nZ)){
    return true;
  }else { return false; }
}
function spawnRules(lX,lZ,nX, nZ){
  if(isInMapArea(nX, nZ)){
    if(outOfSpawnArea(nX, nZ)){
      if(objSpawnCollision(lX,lZ,nX, nZ)){
        return true;
      }
    }
  }else{
    return false;
  }
}
function spawnRulesENEMY(lX,lZ,nX, nZ){
  if(isInMapArea(nX, nZ)){
    if(outOfSpawnAreaENEMY(nX, nZ)){
      if(objSpawnCollision(lX,lZ,nX, nZ)){
        return true;
      }
    }
  }else{
    return false;
  }
}
var loadingScreen = {
  scene: new THREE.Scene(),
  camera: new THREE.PerspectiveCamera(90,WIDTH/HEIGHT,0.1,100),
  box: new THREE.Mesh(
    new THREE.BoxGeometry(0.5,0.5,0.5),
    new THREE.MeshBasicMaterial({color:0x4444ff})
  )
};
var RESOURCES_LOADED = false;
var LOADING_MANAGER = null;
var models = {
	tree: {
		obj:"models/Large_Oak_Dark_01.obj",
		mtl:"models/Large_Oak_Dark_01.mtl",
		mesh: null,
    castShadow: false,
    receiveShadow: false,
	},
  gun: {
		obj:"models/uziGold.obj",
		mtl:"models/uziGold.mtl",
		mesh: null,
    castShadow: false,
    receiveShadow: false,
	},
  tent: {
    obj:"models/Tent_Poles_01.obj",
    mtl:"models/Tent_Poles_01.mtl",
    mesh: null,
    castShadow: false,
    receiveShadow: false,
  }
};

function init() {
  scene = new THREE.Scene();
  clock = new THREE.Clock();

  camera = new THREE.PerspectiveCamera(50, WIDTH/HEIGHT, 0.1, 10000);
  camera.position.set(0,player.height,-5);
  camera.lookAt(new THREE.Vector3(0, player.height, 0));

  loadingScreen.camera.lookAt(loadingScreen.box.position);
  loadingScreen.scene.add(loadingScreen.box);

  var loadingManager = new THREE.LoadingManager();
  loadingManager.onProgress = function(item,loaded,total){
    console.log(item,loaded,total);
  };
  loadingManager.onLoad = function(){
    console.log("Loaded all resources");
    onResourcesLoaded();
    RESOURCES_LOADED=true;
  }

  crosshair = document.getElementById('crosshair');
  crosshair.style.left = crosshairpositioning.left + 'px';
  crosshair.style.top = crosshairpositioning.top + 'px';

  position = document.getElementById('position');
  ammoLeft = document.getElementById('ammoLeft');
  winOrLose = document.getElementById('winOrLose');

  meshfloor = new THREE.Mesh(
    new THREE.PlaneGeometry(MAP_SIZE_WIDTH*2,MAP_SIZE_HEIGHT*2),
    new THREE.MeshPhongMaterial({color:0x3B5323, wireframe:USE_WIREFRAME})
  );
  meshfloor.rotation.x -= Math.PI / 2;
  meshfloor.receiveShadow = true;

  ambientLight = new THREE.AmbientLight(0xffffff,0.2); // soft white light
  light = new THREE.PointLight(0xffffff,0.8,200);
  light.position.set(-3,6,-3);
  light.castShadow = true;
  light.shadow.camera.near = 0.1;
  light.shadow.camera.far = 25;

  for( var _key in models ){
		(function(key){

			var mtlLoader = new THREE.MTLLoader(loadingManager);
			mtlLoader.load(models[key].mtl, function(materials){
				materials.preload();

				var objLoader = new THREE.OBJLoader(loadingManager);

				objLoader.setMaterials(materials);
				objLoader.load(models[key].obj, function(mesh){

					mesh.traverse(function(node){
						if( node instanceof THREE.Mesh ){
              if('castShadow' in models[key])
                node.castShadow = models[key].castShadow;
              else
                node.castShadow = true;
              if('receiveShadow' in models[key])
                  node.receiveShadow = models[key].receiveShadow;
                else
                  node.receiveShadow = true;
						}
					});
					models[key].mesh = mesh;

				});
			});
		})(_key);
	}

  function onResourcesLoaded(){
    //Loading a FOREST
    for(var i = 0; i<TREE_COUNT;i++){
    	meshes["tree"+i] = models.tree.mesh.clone();
      while(true){
        var randomX = getRandomArbitrary(-MAP_SIZE_WIDTH,MAP_SIZE_WIDTH);
        var randomZ = getRandomArbitrary(-MAP_SIZE_HEIGHT,MAP_SIZE_HEIGHT);
        if(spawnRules(LatestX,LatestZ,randomX,randomZ)){
        	meshes["tree"+i].position.set(randomX, 0, randomZ);
          LatestX = randomX;
          LatestZ = randomZ;
        	scene.add(meshes["tree"+i]);
          break;
        }
      }
  }
  for(var i=0;i<ENEMY_COUNT;i++){
    while(true){
      var randomX = Math.floor(getRandomArbitrary(-MAP_SIZE_WIDTH,MAP_SIZE_WIDTH));
      var randomZ = Math.floor(getRandomArbitrary(-MAP_SIZE_HEIGHT,MAP_SIZE_HEIGHT));
      if(spawnRulesENEMY(LatestEnemyZ,LatestEnemyZ,randomX,randomZ)){
        enemy[i] = new THREE.Mesh(
          new THREE.BoxGeometry(1,1,1),
          new THREE.MeshPhongMaterial({color:0xff4444, wireframe:USE_WIREFRAME})
        );
        enemy[i].position.x = randomX;
        enemy[i].position.z =  randomZ;
        enemy[i].position.y = 1;
        enemy[i].receiveShadow = true;
        enemy[i].castShadow = false;
        enemy[i].isDown = false;
        LatestEnemyZ = randomZ;
        LatestEnemyX = randomX;
        scene.add(enemy[i]);
        break;
      }
    }
  }
      //Loading a GUN
    meshes["tent"] = models.tent.mesh.clone();
    meshes["tent"].position.x=-1; meshes["tent"].position.y=-0.5; meshes["tent"].position.z=5;
    meshes["tent"].rotation.y = 60;
    scene.add(meshes["tent"]);
    meshes["tent2"] = models.tent.mesh.clone();
    meshes["tent2"].position.x=5; meshes["tent2"].position.y=-0.5; meshes["tent2"].position.z=-2;
    meshes["tent2"].rotation.y = 30;
    scene.add(meshes["tent2"]);
    meshes["gun"] = models.gun.mesh.clone();
    meshes["gun"].scale.set(10,10,5);
    scene.add(meshes["gun"]);
  }


  scene.add(light);
  scene.add(ambientLight);
  scene.add(camera);
  scene.add(meshfloor);

  renderer = new THREE.WebGLRenderer({antialias:true});
  renderer.setSize(WIDTH,HEIGHT);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.BasicShadowMap;
  document.body.appendChild(renderer.domElement);
  animate();
}
function animate() {
    if(RESOURCES_LOADED == false){
      requestAnimationFrame(animate);
      renderer.render(loadingScreen.scene, loadingScreen.camera);
      return;
    }
    //ZWYCIESTWO
    if(enemy[0].isDown&&enemy[1].isDown&&enemy[2].isDown&&enemy[3].isDown || AMMUNITION == 0){
        requestAnimationFrame(animate);
        renderer.render(loadingScreen.scene, loadingScreen.camera);
        winOrLose.textContent = "Zwyciestwo - obroniles oboz";
        winOrLose.style.left = (WIDTH/2)-350 + "px";
        return;
    }
    //PORAZKA
    if(!outOfSpawnAreaCHECK(enemy[0].position.x,enemy[0].position.z,0)||!outOfSpawnAreaCHECK(enemy[1].position.x,enemy[1].position.z,1)||!outOfSpawnAreaCHECK(enemy[2].position.x,enemy[2].position.z,2)||!outOfSpawnAreaCHECK(enemy[3].position.x,enemy[3].position.z,3)){
      requestAnimationFrame(animate);
      renderer.render(loadingScreen.scene, loadingScreen.camera);
      winOrLose.textContent = "Porazka - wrog znajduje sie w obozie";
      winOrLose.style.left = (WIDTH/2)-450 + "px";
      PLAYABLE = false;
      return;
    }
    if(AMMO_LESS == true){
      AMMUNITION--;
      AMMO_LESS = false;
    }

    //////////////// ENEMY BEHAVIOR /////////////////////
    // If enemy get shot
      if(enemy[0].isDown == true){
        enemy[0].position.y -= Math.sin(Math.PI/6) *0.15;
        if(enemy[0].position.y < 0) {
          enemy[0].position.x= -200;
          enemy[0].position.z= -200;
          scene.remove(enemy[0]);

        }
      }
      if(enemy[1].isDown == true){
        enemy[1].position.y -= Math.sin(Math.PI/6) *0.15;
        if(enemy[1].position.y < 0) {
          enemy[1].position.x= -200;
          enemy[1].position.z= -200;
          scene.remove(enemy[1]);
        }
      }
      if(enemy[2].isDown == true){
        enemy[2].position.y -= Math.sin(Math.PI/6) *0.15;
        if(enemy[2].position.y < 0) {
          enemy[2].position.x= -200;
          enemy[2].position.z= -200;
          scene.remove(enemy[2]);
        }
      }
      if(enemy[3].isDown == true){
        enemy[3].position.y -= Math.sin(Math.PI/6) *0.15;
        if(enemy[3].position.y < 0) {
          enemy[3].position.x= -200;
          enemy[3].position.z= -200;

          scene.remove(enemy[3]);
        }
      }
      // Enemy movement to the camp
      //Enemy #1
      var enemySpeed = Math.sin(Math.PI/6) *0.15;
      if(enemy[0].position.x > 0 && enemy[0].position.z > 0){
        enemy[0].position.x -= enemySpeed;
        enemy[0].position.z -= enemySpeed;
      } else if(enemy[0].position.x > 0 && enemy[0].position.z < 0){
        enemy[0].position.x -= enemySpeed;
        enemy[0].position.z += enemySpeed;
      }else if(enemy[0].position.x < 0 && enemy[0].position.z > 0){
        enemy[0].position.x += enemySpeed;
        enemy[0].position.z -= enemySpeed;
      }else {
        enemy[0].position.x += enemySpeed;
        enemy[0].position.z += enemySpeed;
      }
      //Enemy #2
      if(enemy[1].position.x > 0 && enemy[1].position.z > 0){
        enemy[1].position.x -= enemySpeed;
        enemy[1].position.z -= enemySpeed;
      } else if(enemy[1].position.x > 0 && enemy[1].position.z < 0){
        enemy[1].position.x -= enemySpeed;
        enemy[1].position.z += enemySpeed;
      }else if(enemy[1].position.x < 0 && enemy[1].position.z > 0){
        enemy[1].position.x += enemySpeed;
        enemy[1].position.z -= enemySpeed;
      }else {
        enemy[1].position.x += enemySpeed;
        enemy[1].position.z += enemySpeed;
      }
      //Enemy #3
      if(enemy[2].position.x > 0 && enemy[2].position.z > 0){
        enemy[2].position.x -= enemySpeed;
        enemy[2].position.z -= enemySpeed;
      } else if(enemy[0].position.x > 0 && enemy[2].position.z < 0){
        enemy[2].position.x -= enemySpeed;
        enemy[2].position.z += enemySpeed;
      }else if(enemy[2].position.x < 0 && enemy[2].position.z > 0){
        enemy[2].position.x += enemySpeed;
        enemy[2].position.z -= enemySpeed;
      }else {
        enemy[2].position.x += enemySpeed;
        enemy[2].position.z += enemySpeed;
      }
      //Enemy #4
      if(enemy[3].position.x > 0 && enemy[3].position.z > 0){
        enemy[3].position.x -= enemySpeed;
        enemy[3].position.z -= enemySpeed;
      } else if(enemy[3].position.x > 0 && enemy[3].position.z < 0){
        enemy[3].position.x -= enemySpeed;
        enemy[3].position.z += enemySpeed;
      }else if(enemy[3].position.x < 0 && enemy[3].position.z > 0){
        enemy[3].position.x += enemySpeed;
        enemy[3].position.z -= enemySpeed;
      }else {
        enemy[3].position.x += enemySpeed;
        enemy[3].position.z += enemySpeed;
      }

      //Enemy rotation
      enemy[0].rotation.x += 0.01;
      enemy[0].rotation.y += 0.01;
      enemy[1].rotation.x += 0.01;
      enemy[1].rotation.y += 0.01;
      enemy[2].rotation.x += 0.01;
      enemy[2].rotation.y += 0.01;
      enemy[3].rotation.x += 0.01;
      enemy[3].rotation.y += 0.01;

    var time = Date.now()*0.0005;
    var delta = clock.getDelta();

  //pociski
  for(var index=0; index<bullets.length; index+=1){
		if( bullets[index] === undefined ) continue;
		if( bullets[index].alive == false ){
			continue;
		}else{
      for(var i =0; i<ENEMY_COUNT;i++){
        collision(enemy[i].position.z,enemy[i].position.x,bullets[index].position.z,bullets[index].position.x,i);
      }
    }

		bullets[index].position.add(bullets[index].velocity);
	}
  //BOX PANEL
    position.textContent = "Aktualna pozycja x:" + Math.floor(camera.position.x, 5) + "  y:" + Math.floor(camera.position.y, 5) + "  z:" + Math.floor(camera.position.z, 5);
    ammoLeft.textContent = "Amunicja: " + AMMUNITION;

  if(keyboard[87] && PLAYABLE){ //W
    camera.position.x -= Math.sin(camera.rotation.y) * player.speed;
    camera.position.z -= -Math.cos(camera.rotation.y) * player.speed;
  }
  if(keyboard[83] && PLAYABLE){ //S
    camera.position.x += Math.sin(camera.rotation.y) * player.speed;
    camera.position.z += -Math.cos(camera.rotation.y) * player.speed;
  }
  if(keyboard[65] && PLAYABLE){ //A
    camera.position.x -= Math.sin(camera.rotation.y - Math.PI/2) * player.speed;
    camera.position.z -= -Math.cos(camera.rotation.y - Math.PI/2) * player.speed;
  }
  if(keyboard[68] && PLAYABLE){ //D
    camera.position.x += Math.sin(camera.rotation.y - Math.PI/2) * player.speed;
    camera.position.z += -Math.cos(camera.rotation.y - Math.PI/2) * player.speed;
  }
  if(keyboard[37] && PLAYABLE){ //LEFT
    camera.rotation.y -= player.turnSpeed;
  }
  if(keyboard[39] && PLAYABLE){ //RIGHT
    camera.rotation.y += player.turnSpeed;
  }

  if(keyboard[32] && player.canShoot <= 0 && AMMUNITION > 0 && PLAYABLE){ // SPACEBAR
		// creates a bullet

		var bullet = new THREE.Mesh(
			new THREE.SphereGeometry(0.05,8,8),
			new THREE.MeshBasicMaterial({color:0xffd700})
		);

		// position the bullet to come from the player's weapon
		bullet.position.set(
			meshes["gun"].position.x,
			meshes["gun"].position.y + 0.15,
			meshes["gun"].position.z
		);
		//velocity of the bullet
		bullet.velocity = new THREE.Vector3(
			-Math.sin(camera.rotation.y),
			0,
			Math.cos(camera.rotation.y)
		);

		bullet.alive = true;

		setTimeout(function(){
			bullet.alive = false;
			scene.remove(bullet);
		}, 1000);


		// add to array and delay the weapon
		bullets.push(bullet);
		scene.add(bullet);
		player.canShoot = 70;
    AMMO_LESS = true;
	}

	if(player.canShoot > 0) player.canShoot -= 1;

  //GUN position in front of camera
  meshes["gun"].position.set(
    camera.position.x - Math.sin(camera.rotation.y + Math.PI/6) *0.55,
    camera.position.y - 0.4 + Math.sin(time+camera.position.x+camera.position.z)*0.03,
    camera.position.z + Math.cos(camera.rotation.y + Math.PI/6) *0.55
  );
  meshes["gun"].rotation.set(
    camera.rotation.x,
    camera.rotation.y - Math.PI,
    camera.rotation.z
  );

  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
function keyDown(event){
  keyboard[event.keyCode] = true;
}
function keyUp(event){
  keyboard[event.keyCode] = false;
}
window.addEventListener('keydown',keyDown);
window.addEventListener('keyup',keyUp);
window.onload = init;
