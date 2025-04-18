<script>
  import * as SAT from "sat";
  // Add an event listener to handle window resize
  import { onMount, onDestroy } from 'svelte';
  import {gameState} from "$lib/stores/gameState.svelte"
  import Overlay from "./Overlay.svelte";
  import {game} from "$lib/stores/gameController.svelte"
  import LevelUpScreen from "./LevelUpScreen.svelte";
  import { fade } from "svelte/transition";
  import { sineIn } from "svelte/easing";
  import * as AUGMENT from "$lib/stores/augments"
  import {drawVector, drawLine, drawCircle, drawPolygon, checkCollision, calculateDistance, ctx2} from "$lib/stores/helperFunctions.svelte";
  import { canvasContext, groundOffset } from "$lib/stores/canvasStore";
  import {gameText} from "$lib/stores/gameText"
  import { skillPool, StatUpgrade, LevelUp, FirstTimePickUp } from "$lib/stores/skillPool.svelte";
  import { audio } from '$lib/audio/AudioManager.svelte';
  import EndScreen from "./EndScreen.svelte";
  import * as WEAPON from "$lib/stores/weapons"
  import {joystick, handleControllers} from "$lib/stores/joystick.svelte"

  let goblinXP = 25;
  let training = true;

  let ctx;
  let canvas;
  let ground;
  let player = $state(false);
  // let ground;
  let width = $state(0), height = $state(0);
  // Track which keys are currently pressed
  const keys = {
    w: false,
    a: false,
    s: false,
    d: false,
    ArrowUp: false,
    ArrowLeft: false,
    ArrowDown: false,
    ArrowRight: false
  };

  let groundCtx;

  const enemyImages = {
    goblin: new Image(),
    orc: new Image()
  }
  enemyImages.goblin.src = '/enemies/goblin6.jpeg';
  enemyImages.orc.src = '/enemies/goblin5.jpeg'; 



  $effect(()=>{
    // console.log(game.screen.levelUp)
  })


  onMount(() => {
    resizeCanvas(); // Set the canvas size initially

    setup();
    
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('keydown', keyDown);
    window.addEventListener('keyup', keyUp);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('keydown', keyDown);
      window.removeEventListener('keyup', keyUp);
    };
  });

  

  function setup(){
    ctx = canvas.getContext('2d');
    ctx2.context = canvas.getContext('2d');
    canvasContext.set(ctx);
    groundCtx = ground.getContext('2d');
    

    startGame();
  }

  function startGame(){
    audio.musicManager.start();
    game.reset();
    skillPool.reset();
    player = new Player();
    player.init();
    let sword = new WEAPON.Sword(player);
    sword.AddToSkillPool();
    let wand = new WEAPON.Wand(player);
    wand.AddToSkillPool();

    let frostNova = new WEAPON.FrostNova(player);
    frostNova.AddToSkillPool();

    let electrocute = new WEAPON.Electrocute(player);
    electrocute.AddToSkillPool();
    let bow = new WEAPON.Bow(player);
    bow.AddToSkillPool();
    ground = new Ground();
    update();
  }

  function restartGame(){
    audio.musicManager.stop();
    player.weapons.forEach(element => {
      element.destroy();
    });
    startGame();
  }

  function update(){

    if (game.isPaused) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    groundCtx.clearRect(0, 0, canvas.width, canvas.height);

    ground.Draw();
    player.Draw();

    let cdGoblin = Math.max(200 - Math.floor(game.time/80), 10);
    if (game.time < 15000 && game.time % cdGoblin === 0) {
      let enemy = new Goblin("Goblin");
      enemy.Spawn();
    }

    let cdOrc = Math.max(500 - Math.floor(game.time/20), 30);
    // console.log(cd1,cd2)

    if (player.level > 1 && game.time % cdOrc === 0) {
      let enemy = new Orc("Orc");
      enemy.Spawn();
    }

    let cdTroll = Math.max(1000 - Math.floor(game.time/80), 50);
    // console.log(cd1,cd2)

    if (game.time > 3000 && game.time % cdTroll === 0) {
      let enemy = new Troll("Troll");
      enemy.Spawn();
    }

    let cdWolf = Math.max(600 - Math.floor(game.time/50), 100);
    // console.log(cd1,cd2)

    if (game.time > 5000 && game.time % cdWolf === 0) {
      let enemy = new Wolf("Wolf");
      let packSize = Math.floor(game.time/1000) + 5;
      enemy.SpawnPack(packSize, 30, Wolf);
    }

    let cdWarlord = Math.max(300 - Math.floor(game.time/70), 150);
    // console.log(cd1,cd2)

    if (game.time > 9000 && game.time % cdWarlord === 0) {
      let enemy = new Warlord("Warlord");
      let packSize = Math.floor(game.time/6000) + 2;
      enemy.SpawnPack(packSize, 60, Warlord);
    }

    let cdValkyrie = Math.max(300 - Math.floor((game.time - 10000)/40), 20);
    // console.log(cd1,cd2)

    if (game.time > 10000 && game.time % cdValkyrie === 0) {
      let enemy = new Valkyrie("Valkyrie");
      enemy.Spawn();
    }

    // if (game.time % 1000 === 0) {
    //   let xpOrb = new ExperienceOrb(200, 200);
    //   xpOrb.Spawn();
    // }

    //remove dead enemies from game
    game.enemies = game.enemies.filter((circle)=>{
      return !game.dead.includes(circle);
    })
    game.dead = new Array();

    //remove consumed experience from game
    game.experience = game.experience.filter((experience)=>{
      return !game.deadExperience.includes(experience);
    })
    game.deadExperience = new Array();

    game.enemies.forEach(element => {
      element.Draw();
    });

    game.experience.forEach(element => {
      element.Draw();
    });

    game.gameText.forEach(element => {
      element.update();
    });

    game.time++;
    if (game.gameOver === false){
      requestAnimationFrame(update)
    }
  }

  function startAnimation(){
    if (game.isPaused){
      game.isPaused = false;
      update();
    }
  }

  function stopAnimation(){

  }

 

  class Ground {
    constructor(){
      this.x = 0;
      this.y = 0;
      this.rectHeight = 300;
      this.rectWidth = 300;
      this.rectGap = 100;
    }

    Move(){
      this.x += player.vx;
      this.y += player.vy;

      groundOffset.set({
        x: this.x,
        y: this.y
      })
    }

    Draw() {
    this.Move();
    
    // Calculate the starting point for drawing
    // We need to start from outside the screen to ensure full coverage
    const totalTileWidth = this.rectWidth + this.rectGap;
    const totalTileHeight = this.rectHeight + this.rectGap;
    
    // Calculate starting positions that will ensure coverage when moving in any direction
    // Use modulo to create a repeating offset within the tile size
    const offsetX = ((this.x % totalTileWidth) - totalTileWidth);
    const offsetY = ((this.y % totalTileHeight) - totalTileHeight);
    
    // Start drawing from the calculated offset
    // Calculate how many tiles we need in each direction
    const tilesX = Math.ceil(canvas.width / totalTileWidth) + 2;
    const tilesY = Math.ceil(canvas.height / totalTileHeight) + 2;
    
    // Draw the grid of rectangles
    for (let i = 0; i < tilesX; i++) {
      for (let j = 0; j < tilesY; j++) {
        const x = offsetX + (i * totalTileWidth);
        const y = offsetY + (j * totalTileHeight);
        this.DrawRectangle(x, y);
      }
    }
  }

    DrawRectangle(x,y ){


      groundCtx.beginPath();
      groundCtx.rect(x, y, this.rectWidth, this.rectHeight);
      groundCtx.stroke();

    }


  }

  class Player {
    constructor(){
      this.name = "Player"
      this.radius = 12;
      this.maxHealth = 100;
      this.experience = 0;
      this.skillPoints = 0;
      this.color = "#a82dce"
      this.imgSrc = "player.jpeg";
      this.lifeSteal = 0;
      this.damageModifier = 1;
      this.upgradeType = "Player";
      this.healthRegen = 0.02;
      this.rerolls = 1;

      this.level = 0;
      this.currentXP = 0;
      this.XPToNextLevel = this.CalculateXPForNextLevel(this.level);

      this.health = this.maxHealth;
      this.criticalHP = false;
      this.speed = 2.5;
      this.x = canvas.width/2;
      this.y = canvas.height/2;
      this.vx = 0;
      this.vy = 0;
      this.faceDirection = 0;
      this.pickupRange = 50;
      this.weapons = [
        
      ]
    }

    init(){
      // this.AddWeapon(new WEAPON.Sword(this));
      this.AddWeapon(new WEAPON.Dash(this));
      // this.AddWeapon(new WEAPON.Wand(this));

      skillPool.pool.push(new StatUpgrade(this, "Damage", this.upgradeType, "Increase damage by 10%", this.imgSrc, "damageModifier", 0.10))
      skillPool.pool.push(new StatUpgrade(this, "HP", this.upgradeType, "Increase max health by 25 points", this.imgSrc, "maxHealth", 25))
      skillPool.pool.push(new StatUpgrade(this, "Movement Speed", this.upgradeType, "Increase movement speed by 0.25", this.imgSrc, "speed", 0.25))
      // skillPool.pool.push(new StatUpgrade(this, "Pickup Range", this.upgradeType, "Increase pickup range by 50", this.imgSrc, "pickupRange", 50))
      skillPool.pool.push(new StatUpgrade(this, "Lifesteal", this.upgradeType, "Increase lifesteal by 1%", this.imgSrc, "lifeSteal", 0.01))
      skillPool.pool.push(new StatUpgrade(this, "Health Regen", this.upgradeType, "Increase health regeneration by 0.03", this.imgSrc, "healthRegen", 0.03))
      // skillPool.pool.push(new Upgrade(this, this.upgradeType, "Size", "Increase size by 10", "radius", 10))

      this.LevelUp();
    }

    Update(){
      let part = this.health / this.maxHealth;
      if (part <= 0.3){
        this.criticalHP = true;
      } else {
        this.criticalHP = false;
      }

      //regen health
      this.Heal(this.healthRegen)
    }

    Draw(){

      if (this.health <= 0){
        this.Kill();
        return;
      }
      this.Update();

      this.CheckSkillPoints()



      this.Move();

      //player
      drawCircle(ctx, this.SATObject(), this.color)

      //Health bar
      ctx.beginPath();
      ctx.fillStyle = "red"
      ctx.rect(this.x - 30, this.y - this.radius-20, this.health/this.maxHealth * 60, 5);
      ctx.fill();

      //weapons
      this.weapons.forEach(element => {
        element.Draw();
      });

      this.DrawDirection()

      
      //cooldown
      // ctx.strokeStyle = "yellow";
      // ctx.beginPath();
      // ctx.arc(this.x, this.y, this.radius-5,0,2*Math.PI * (game.time % this.weaponCooldown) / this.weaponCooldown);
      // ctx.stroke();

    }

    Move() {
    this.vx = 0;
    this.vy = 0;
    
    // Track which keys are pressed
    let upPressed = keys.w || keys.ArrowUp || joystick.y < -0.3;
    let downPressed = keys.s || keys.ArrowDown || joystick.y > 0.3;
    let leftPressed = keys.a || keys.ArrowLeft || joystick.x < -0.3;
    let rightPressed = keys.d || keys.ArrowRight || joystick.x > 0.3;
    
    // Set face direction based on dominant input
    // This prioritizes the direction with the strongest input

    // if (Math.abs(joystick.y) > Math.abs(joystick.x)) {
    //   if (upPressed) this.faceDirection = 0;
    //   else if (downPressed) this.faceDirection = 2;
    // } else {
    //   if (rightPressed) this.faceDirection = 1;
    //   else if (leftPressed) this.faceDirection = 3;
    // }

    // Set face direction based on key press
    if (upPressed) {
      this.faceDirection = 0;
      if (rightPressed) this.faceDirection = 0.5;
      if (leftPressed) this.faceDirection = 3.5;
    } else if (rightPressed) {
      this.faceDirection = 1;
      if (upPressed) this.faceDirection = 0.5;
      if (downPressed) this.faceDirection = 1.5;
    } else if (downPressed) {
      this.faceDirection = 2;
      if (rightPressed) this.faceDirection = 1.5;
      if (leftPressed) this.faceDirection = 2.5;
    } else if (leftPressed) {
      this.faceDirection = 3;
      if (upPressed) this.faceDirection = 3.5;
      if (downPressed) this.faceDirection = 2.5;
    }
    
    // Calculate movement direction
    if (upPressed) this.vy = this.speed;
    if (downPressed) this.vy = -this.speed;
    if (leftPressed) this.vx = this.speed; 
    if (rightPressed) this.vx = -this.speed; 
    
    // If moving diagonally, normalize the speed
    if ((this.vx !== 0) && (this.vy !== 0)) {
      // Normalize by dividing by sqrt(2)
      const normalizer = 1 / Math.sqrt(2);
      this.vx *= normalizer;
      this.vy *= normalizer;
    }
  }

    DrawDirection(){
      // ctx.beginPath();
      
      // Set the arrow properties
      // const arrowLength = 20;
      // const arrowWidth = 10;

      const x = this.x;
      const y = this.y;

      let angle = this.faceDirection * Math.PI / 2 - (Math.PI/2)

      const smallCircleX = x + this.radius * Math.cos(angle);
      const smallCircleY = y + this.radius * Math.sin(angle);

      ctx.beginPath();
      ctx.arc(smallCircleX, smallCircleY, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#3498db';
      ctx.fill();


      // ctx.strokeStyle = "yellow"

      // switch (this.faceDirection) {
      //     case 0: // Up
      //         ctx.moveTo(x, y);
      //         ctx.lineTo(x, y - arrowLength);
      //         ctx.lineTo(x - arrowWidth / 2, y - arrowLength + arrowWidth);
      //         ctx.moveTo(x, y - arrowLength);
      //         ctx.lineTo(x + arrowWidth / 2, y - arrowLength + arrowWidth);
      //         break;
      //     case 1: // Right
      //         ctx.moveTo(x, y);
      //         ctx.lineTo(x + arrowLength, y);
      //         ctx.lineTo(x + arrowLength - arrowWidth, y - arrowWidth / 2);
      //         ctx.moveTo(x + arrowLength, y);
      //         ctx.lineTo(x + arrowLength - arrowWidth, y + arrowWidth / 2);
      //         break;
      //     case 2: // Down
      //         ctx.moveTo(x, y);
      //         ctx.lineTo(x, y + arrowLength);
      //         ctx.lineTo(x - arrowWidth / 2, y + arrowLength - arrowWidth);
      //         ctx.moveTo(x, y + arrowLength);
      //         ctx.lineTo(x + arrowWidth / 2, y + arrowLength - arrowWidth);
      //         break;
      //     case 3: // Left
      //         ctx.moveTo(x, y);
      //         ctx.lineTo(x - arrowLength, y);
      //         ctx.lineTo(x - arrowLength + arrowWidth, y - arrowWidth / 2);
      //         ctx.moveTo(x - arrowLength, y);
      //         ctx.lineTo(x - arrowLength + arrowWidth, y + arrowWidth / 2);
      //         break;
      //     default:
      //         console.error('Invalid direction');
      //         return;
      // }

      // ctx.stroke();
    }

    Kill(){
      audio.musicManager.stop();
      game.gameOver = true;
    }

    TakeDamage(amount){
      audio.soundManager.play('playerhit', { volume: 0.5 });
      let takenDamage = amount;
      this.health -= takenDamage;

      if (Math.floor(amount) > 1){
        const text = new gameText(this, amount, "PlayerDamage", amount);
        text.init();
      }


      return takenDamage;
    }

    Heal(amount){
      let healedAmount = amount;
      //make sure to not heal above maxHealth
      if (this.health + amount > this.maxHealth){
        healedAmount = this.maxHealth - this.health;
      }

      this.health += healedAmount;

      let roundedAmount = Math.round(healedAmount)
      if (roundedAmount >= 1){
        const text = new gameText(this, roundedAmount, "PlayerHeal", amount);
        text.init();
      }


    }

    CalculateXPForNextLevel(level) {
  // Base XP requirement with moderate growth
  let baseXP = 100 * (1.2 ** (level - 1));
  
  // Time-based reduction (caps at 40% reduction after playing for a while)
  let timeReduction = Math.min(0.4, game.time / 50000);
  
  return Math.floor(baseXP * (1 - timeReduction));
}

    AddXP(amount){
      this.experience += amount;
      this.CheckLevelUp();
      const text = new gameText(this, amount, "Experience", amount);
      text.init();
    }

    CheckLevelUp(){
      while (this.experience >= this.XPToNextLevel){
        this.LevelUp()
        
      }
    }

    LevelUp(){
      this.experience = Math.max(0, this.experience - this.XPToNextLevel);
      this.level += 1;
      this.XPToNextLevel = this.CalculateXPForNextLevel(this.level);
      this.skillPoints++;
      this.pickupRange += 2.5;

      //add reroll every 5th level
      if (this.level % 5 === 0){
        this.rerolls++
      }

    }

    CheckSkillPoints(){
      if (this.skillPoints > 0){
        this.OpenLevelUpScreen();
      }
    }

    OpenLevelUpScreen(){
      game.isPaused = true;

      setTimeout(() => {
        game.screen.levelUp = true;
        
      }, 10);   

    }

    SATObject(){
      return new SAT.Circle(new SAT.Vector(canvas.width/2,canvas.height/2), this.radius);
    }

    AddWeapon(weapon){
      this.weapons.push(weapon);
      if (weapon.init){
        weapon.init(this);
      }
    }

    getSpeed(){
      return this.speed;
    }

    ApplyLifeSteal(damage){
      let amount = this.lifeSteal * damage;
      this.Heal(amount)
    }

    ModifiedDamage(damage){
      return damage * this.damageModifier;
    }

  }

  

  class Enemy {
    constructor(name){
      this.name = name;
      this.radius = 20;
      this.maxHealth = 20;
      this.health = this.maxHealth;
      this.color = "blue"
      this.speed = 2;
      this.x = null
      this.y= null
      this.vx = 0;
      this.vy = 0;
      this.damage = 1;
      this.knockbackParams = {
        timer: null,
        isKnockedBack: false,
        originX: 0,
        originY: 0,
        strength: 0,
        groundX: ground.x,
        groundY: ground.y
      }
      this.statusEffects = [];

      this.xp = {
        amount: 50,
        color: "aqua",
        radius: 4
      }
    }

    Spawn(position = null){
      if (!position){
        position = this.GetSpawnPosition();
      }
      this.x = position.x;
      this.y = position.y;
      game.enemies.push(this);
    }
    
    GetSpawnPosition(){
      let rng = Math.random();
      let sideSelection = Math.round(Math.random())
      let x, y;
      //rng chooses right or left side
      if (rng >= 0.5){
        x = sideSelection * canvas.width;
        y = Math.random() * canvas.height;
      } else {
        //rng chooses top or bottom
        x = Math.random() * canvas.width;
        y = sideSelection * canvas.height;
      }
      return {x,y, rng, sideSelection}
    }

    Draw(){
      if (this.health <= 0){
        this.Kill();
        return;
      }

      this.HandleStatusEffects();
      this.CheckIfCollision()
      
      this.Move();

      drawCircle(ctx, this.SATObject(), this.color)

      // ctx.save()


      // ctx.closePath();
      // ctx.clip(); // Clip to the circle

      // ctx.drawImage(this.image, this.x - this.radius, this.y - this.radius, this.radius*2, this.radius*2); // Center the image

      // ctx.restore()


      //Health bar
      ctx.beginPath();
      ctx.fillStyle = "red"
      ctx.rect(this.x - 20, this.y - 30, Math.max(this.health/this.maxHealth * 40, 1), 3);
      ctx.fill();

    }

    Move(){
      if (this.knockbackParams.isKnockedBack === true){
        this.CalculateKnockbackVelocity()
      } else {
        this.CalculateVelocityTowardPlayer();
      }
      this.x += this.vx + player.vx;
      this.y += this.vy + player.vy;
    }

    Kill(){
      game.deadCount++;
      game.dead.push(this);
      //0.1% chance to spawn xp attraction orb
      if (Math.random() < 0.001){
        let xpOrb = new ExperienceOrb(this.x, this.y);
        xpOrb.Spawn();
      }
      let xp = new Experience(this.x, this.y, this.xp.amount, this.xp.color, this.xp.radius);
      xp.Spawn();

    }

    HandleStatusEffects(){
      if (this.statusEffects.includes("Frozen")){

      }
    }

    CalculateVelocityTowardPlayer(){
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      const directionX = centerX - this.x
      const directionY = centerY - this.y

      const distance = Math.sqrt(directionX * directionX + directionY * directionY);
      
      this.vx = (directionX / distance) * this.speed;
      this.vy = (directionY / distance) * this.speed;
    }

    CalculateKnockbackVelocity(){
      //calculate knockback direction
      const offsetDiffX = ground.x - this.knockbackParams.groundX;
      const offsetDiffY = ground.y - this.knockbackParams.groundY;

      const directionX = this.knockbackParams.originX - this.x + offsetDiffX
      const directionY = this.knockbackParams.originY - this.y + offsetDiffY

      const distance = Math.sqrt(directionX * directionX + directionY * directionY);
      
      this.vx = (directionX / distance) * -this.knockbackParams.strength;
      this.vy = (directionY / distance) * -this.knockbackParams.strength;
    }

    CheckIfCollision(){
      let circle = this.SATObject();
      let res = new SAT.Response();
      let col = SAT.testCircleCircle(player.SATObject(), circle, res)
      
      if (col){
        player.TakeDamage(this.damage);
      }
    }

    TakeDamage(amount, type = "EnemyDamage"){
      let takenDamage = player.ModifiedDamage(amount);
      this.health -= takenDamage;
      player.ApplyLifeSteal(takenDamage)

      let roundedDamage = Math.round(takenDamage * 10) / 10;
      
      const text = new gameText(this, roundedDamage, type, amount); //target, content, type, size
      text.init();

      return takenDamage;
    }

    ApplyKnockback(strength, fromX, fromY){
      this.knockbackParams.strength = strength;
      this.knockbackParams.originX = fromX;
      this.knockbackParams.originY = fromY;
      this.knockbackParams.groundX = ground.x;
      this.knockbackParams.groundY = ground.y;
      this.knockbackParams.isKnockedBack = true;
      this.knockbackParams.timer = setTimeout(() => {
        this.knockbackParams.isKnockedBack = false;
      }, 500);

    }

    SATObject(){
      return new SAT.Circle(new SAT.Vector(this.x,this.y), this.radius);
    }

    SpawnPack(packSize, distance, className){
      let spawnPos = this.GetSpawnPosition()
      this.x = spawnPos.x;
      this.y = spawnPos.y;
      let rng = spawnPos.rng;
      let sideSelection = spawnPos.sideSelection;
      const plusOrMinus = () => {
       return Math.random() < 0.5 ? -1 : 1;
      }
      let xDir, yDir;
      

      
      game.enemies.push(this);
      for (let index = 0; index < packSize; index++) {
        if (rng >= 0.5){
        if (sideSelection == 0){
          xDir = -1;
          yDir = plusOrMinus();
        } else {
          xDir = 1;
          yDir = plusOrMinus();
        }
      } else {
        if (sideSelection == 0){
          xDir = plusOrMinus();
          yDir = -1;
        } else {
          xDir = plusOrMinus();
          yDir = 1;
        }
      }
        let friend = new className(this.name)
        friend.Spawn({
          x: spawnPos.x + Math.random() * packSize * distance * xDir,
          y: spawnPos.y + Math.random() * packSize * distance * yDir
        });
      }
    }
  }

  class Boss extends Enemy {
    constructor(name){
      super(name);
      this.image = enemyImages.orc
      this.color = "#245625"
      this.radius = 30;
      this.maxHealth = 200;
      this.health = this.maxHealth;

      this.xp = {
        amount: 100,
        color: "red"
      }
    }
  }

  class Goblin extends Enemy {
    constructor(name){
      super(name);
      this.image = enemyImages.goblin
      this.color = "#479e48"
      this.xp.amount = goblinXP;
      this.radius = 15;
      this.speed = 1.8;
    }
  }

  class Orc extends Enemy {
    constructor(){
      super(name);
      this.image = enemyImages.orc
      this.color = "#245625"
      this.radius = 30;
      this.maxHealth = 100;
      this.speed = 1.6;
      this.health = this.maxHealth;

      this.xp = {
        amount: 50,
        color: "red"
      }

    }
  }

  class Troll extends Enemy {
    constructor(){
      super(name);
      // this.image = enemyImages.orc
      this.color = "#4b396a"
      this.radius = 80;
      this.maxHealth = 1000;
      this.speed = 1.3;
      this.health = this.maxHealth;
      this.damage = 1.8;

      this.xp = {
        amount: 200,
        color: "#785da8"
      }

    }
  }

  class Wolf extends Enemy {
    constructor(){
      super(name);
      // this.image = enemyImages.orc
      this.color = "#897e77"
      this.radius = 10;
      this.maxHealth = 30;
      this.speed = 2.7;
      this.health = this.maxHealth;
      this.damage = 0.75;

      this.xp = {
        amount: 25,
        color: "#f73800"
      }
    }

    
  }

  class Warlord extends Enemy {
    constructor(){
      super(name);
      // this.image = enemyImages.orc
      this.color = "#6e8040"
      this.radius = 30;
      this.maxHealth = 300;
      this.speed = 2.2;
      this.health = this.maxHealth;
      this.damage = 2;

      this.xp = {
        amount: 100,
        color: "#9e9d54"
      }

    }

  }

  class Valkyrie extends Enemy {
    constructor(){
      super(name);
      // this.image = enemyImages.orc
      this.color = "#e470ff"
      this.radius = 50;
      this.maxHealth = 600;
      this.speed = 2.5;
      this.health = this.maxHealth;
      this.damage = 2.5;

      this.xp = {
        amount: 500,
        color: "#9e9d54"
      }
    }
  }

  class Experience {
    constructor(x,y,amount, color = "aqua", radius = 4){
      this.x = x;
      this.y = y;
      this.amount = amount;
      this.vx = 0;
      this.vy = 0;
      this.speed = player.speed + 1;
      this.color = color;
      this.radius = radius;
      this.orbed = false; //orbed is true if picking up experience orb (attracts all xp)
    }

    Spawn(){
      game.experience.push(this)
    }

    Draw(){
      this.Move();

      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x,this.y, this.radius, 0, Math.PI * 2)
      // ctx.arc(this.x,this.y, this.radius + (this.amount/300), 0, Math.PI * 2)
      ctx.fill();
    }

    Move(){
      if (this.CheckIfCollision()){
        this.Consume();
      }
      this.CalculateVelocityTowardPlayer();

      this.x += player.vx + this.vx
      this.y += player.vy + this.vy
    }

    CheckIfCollision(){
      let res = new SAT.Response();
      return SAT.testCircleCircle(player.SATObject(), this.SATObject(), res)
    }

    CalculateVelocityTowardPlayer(){
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      const directionX = centerX - this.x
      const directionY = centerY - this.y

      const distance = Math.sqrt(directionX * directionX + directionY * directionY);

      if (distance > player.pickupRange && this.orbed == false){
        this.vx = 0;
        this.vy = 0;
      } else {
        this.vx = (directionX / distance) * this.speed;
        this.vy = (directionY / distance) * this.speed;
      }   
    }

    Consume(){
      player.AddXP(this.amount);
      audio.soundManager.play("experience", {volume: 0.1})
      game.deadExperience.push(this)
    }

    SATObject(){
      return new SAT.Circle(new SAT.Vector(this.x,this.y), this.radius);
    }
  }

  class ExperienceOrb extends Experience {
    constructor(x, y){
      super(x, y);
      this.color = "black";
      this.radius = 20;
    }

    Consume(){
      game.deadExperience.push(this)
      game.experience.forEach(element => {
        element.orbed = true;
      });
    }
  }

 





  

  // Adjust the canvas size to match the window size
  const resizeCanvas = () => {
    width = window.innerWidth;
    height = window.innerHeight;
    if (canvas) {
      canvas.width = width;
      canvas.height = height;
    }
    if (ground) {
      ground.width = width;
      ground.height = height;
    }
  };

  function keyDown(e){
    if (keys.hasOwnProperty(e.key)) {
      keys[e.key] = true;
    }
  }

  function keyUp(e){
    if (keys.hasOwnProperty(e.key)) {
      keys[e.key] = false;
    }
  }
</script>

<div class="relative">
  <canvas class="absolute" bind:this={ground} width={width} height={height}/>
  <canvas class="absolute" bind:this={canvas} width={width} height={height}/>
</div>

<Overlay {player}/>

{#if game.screen.levelUp === true}
  
<div class="w-screen h-screen absolute z-10" in:fade out:fade={{duration: 100}}>
  <LevelUpScreen {player} {startAnimation} key={player.level}/>

</div>

{/if}

{#if game.gameOver}
<div class="absolute w-screen h-screen flex flex-col items-center justify-center z-10">
  <h1 class="text-7xl">Game Over!</h1>
  <EndScreen {restartGame}/>
</div>
{/if}





