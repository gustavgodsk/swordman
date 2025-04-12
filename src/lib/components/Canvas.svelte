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
  import {drawVector, drawLine, drawCircle, drawPolygon, checkCollision, calculateDistance} from "$lib/stores/helperFunctions";
  import { canvasContext, groundOffset } from "$lib/stores/canvasStore";
  import {gameText} from "$lib/stores/gameText"
  import { skillPool, Upgrade } from "$lib/stores/skillPool.svelte";

  let training = true;

  let ctx;
  let canvas;
  let ground;
  let player = $state(false);
  // let ground;
  let width, height;
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
    canvasContext.set(ctx);
    groundCtx = ground.getContext('2d');
    startGame();
  }

  function startGame(){
    game.reset();
    skillPool.reset();
    player = new Player();
    player.init();
    ground = new Ground();
    update();
  }

  function update(){
    if (game.isPaused) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    groundCtx.clearRect(0, 0, canvas.width, canvas.height);

    ground.Draw();
    player.Draw();

    let cdGoblin = Math.max(150 - Math.floor(game.time/50), 10);
    if (game.time < 15000 && game.time % cdGoblin === 0) {
      let enemy = new Goblin("Goblin");
      enemy.Spawn();
    }

    let cdOrc = Math.max(500 - Math.floor(game.time/30), 30);
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

    let cdWolf = Math.max(300 - Math.floor(game.time/900), 100);
    // console.log(cd1,cd2)

    if (game.time > 5000 && game.time % cdWolf === 0) {
      let enemy = new Wolf("Wolf");
      let packSize = Math.floor(game.time/1000) + 5;
      enemy.SpawnPack(packSize, 30, Wolf);
    }

    let cdWarlord = Math.max(300 - Math.floor(game.time/900), 150);
    // console.log(cd1,cd2)

    if (game.time > 8000 && game.time % cdWolf === 0) {
      let enemy = new Warlord("Warlord");
      let packSize = Math.floor(game.time/5000) + 2;
      enemy.SpawnPack(packSize, 60, Warlord);
    }

    let cdValkyrie = Math.max(300 - Math.floor(game.time/100), 2);
    // console.log(cd1,cd2)

    if (game.time > 10000 && game.time % cdWolf === 0) {
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
      this.radius = 15;
      this.maxHealth = 100;
      this.experience = 0;
      this.skillPoints = 0;
      this.color = "#a82dce"
      this.lifeSteal = 0.03;
      this.damageModifier = 1;
      this.upgradeType = "Player";
      this.healthRegen = 0.02;

      this.level = 1;
      this.currentXP = 0;
      this.XPToNextLevel = this.CalculateXPForNextLevel(this.level);

      this.health = this.maxHealth;
      this.criticalHP = false;
      this.speed = 3;
      this.x = canvas.width/2;
      this.y = canvas.height/2;
      this.vx = 0;
      this.vy = 0;
      this.faceDirection = 0;
      this.pickupRange = 25;
      this.weapons = [
        
      ]
    }

    init(){
      this.AddWeapon(new Sword("Sword"));
      this.AddWeapon(new FrostNova("FrostNova"));
      this.AddWeapon(new Dash("Dash"));
      this.AddWeapon(new Electrocute("Electrocute"));

      skillPool.pool.push(new Upgrade(this, this.upgradeType, "Damage", "Increase damage by 10%", "damageModifier", 0.10))
      skillPool.pool.push(new Upgrade(this, this.upgradeType, "HP", "Increase max health by 40 points", "maxHealth", 40))
      skillPool.pool.push(new Upgrade(this, this.upgradeType, "Movement Speed", "Increase movement speed by 1", "speed", 1))
      skillPool.pool.push(new Upgrade(this, this.upgradeType, "Pickup Range", "Increase pickup range by 50", "pickupRange", 50))
      skillPool.pool.push(new Upgrade(this, this.upgradeType, "Lifesteal", "Increase lifesteal by 5%", "lifeSteal", 0.05))
      skillPool.pool.push(new Upgrade(this, this.upgradeType, "Health Regen", "Increase health regeneration by 0.05", "healthRegen", 0.05))
      // skillPool.pool.push(new Upgrade(this, this.upgradeType, "Size", "Increase size by 10", "radius", 10))
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
      ctx.rect(this.x - 30, this.y - 40, this.health/this.maxHealth * 60, 5);
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
    let upPressed = keys.w || keys.ArrowUp;
    let downPressed = keys.s || keys.ArrowDown;
    let leftPressed = keys.a || keys.ArrowLeft;
    let rightPressed = keys.d || keys.ArrowRight;
    
    // Set face direction based on key press
    if (upPressed) {
      this.faceDirection = 0;
    } else if (rightPressed) {
      this.faceDirection = 1;
    } else if (downPressed) {
      this.faceDirection = 2;
    } else if (leftPressed) {
      this.faceDirection = 3;
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
      ctx.beginPath();
      
      // Set the arrow properties
      const arrowLength = 20;
      const arrowWidth = 10;

      const x = this.x;
      const y = this.y;
      ctx.strokeStyle = "yellow"

      switch (this.faceDirection) {
          case 0: // Up
              ctx.moveTo(x, y);
              ctx.lineTo(x, y - arrowLength);
              ctx.lineTo(x - arrowWidth / 2, y - arrowLength + arrowWidth);
              ctx.moveTo(x, y - arrowLength);
              ctx.lineTo(x + arrowWidth / 2, y - arrowLength + arrowWidth);
              break;
          case 1: // Right
              ctx.moveTo(x, y);
              ctx.lineTo(x + arrowLength, y);
              ctx.lineTo(x + arrowLength - arrowWidth, y - arrowWidth / 2);
              ctx.moveTo(x + arrowLength, y);
              ctx.lineTo(x + arrowLength - arrowWidth, y + arrowWidth / 2);
              break;
          case 2: // Down
              ctx.moveTo(x, y);
              ctx.lineTo(x, y + arrowLength);
              ctx.lineTo(x - arrowWidth / 2, y + arrowLength - arrowWidth);
              ctx.moveTo(x, y + arrowLength);
              ctx.lineTo(x + arrowWidth / 2, y + arrowLength - arrowWidth);
              break;
          case 3: // Left
              ctx.moveTo(x, y);
              ctx.lineTo(x - arrowLength, y);
              ctx.lineTo(x - arrowLength + arrowWidth, y - arrowWidth / 2);
              ctx.moveTo(x - arrowLength, y);
              ctx.lineTo(x - arrowLength + arrowWidth, y + arrowWidth / 2);
              break;
          default:
              console.error('Invalid direction');
              return;
      }

      ctx.stroke();
    }

    Kill(){
      game.gameOver = true;
    }

    TakeDamage(amount){
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
      this.experience -= this.XPToNextLevel;
        this.level += 1;
        this.XPToNextLevel = this.CalculateXPForNextLevel(this.level);
        this.skillPoints++;


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
      //0.3% chance to spawn xp attraction orb
      if (Math.random() < 0.003){
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
      this.xp.amount = 30;
    }
  }

  class Orc extends Enemy {
    constructor(){
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

  class Troll extends Enemy {
    constructor(){
      super(name);
      // this.image = enemyImages.orc
      this.color = "#4b396a"
      this.radius = 80;
      this.maxHealth = 1000;
      this.speed = 0.8;
      this.health = this.maxHealth;
      this.damage = 2;

      this.xp = {
        amount: 500,
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
      this.speed = 4;
      this.health = this.maxHealth;
      this.damage = 0.75;

      this.xp = {
        amount: 70,
        color: "#ed6917"
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
      this.speed = 2;
      this.health = this.maxHealth;
      this.damage = 2;

      this.xp = {
        amount: 600,
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
      this.maxHealth = 400;
      this.speed = 2.5;
      this.health = this.maxHealth;
      this.damage = 2.5;

      this.xp = {
        amount: 1000,
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
      ctx.arc(this.x,this.y, this.radius + (this.amount/100), 0, Math.PI * 2)
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
      this.radius = 10;
    }

    Consume(){
      game.deadExperience.push(this)
      game.experience.forEach(element => {
        element.orbed = true;
      });
    }
  }

  class Weapon {
    constructor(name){
      this.name = name;
      this.level = 1;
      this.baseDamage = 0;
      this.damageModifier = 1;
      this.continuousDamage = false;
      this.autoFire = true;
      this.size = 1;
      this.enemiesHit = new Array();
      this.isActive = false;
      this.baseCooldown = 100;
      this.cooldown = 100;
      this.minCooldown = 20;
      this.duration = 50;
      this.startTime = 0;
      this.knockback = 0;
      this.directionWhenCasting = null;
      this.timeLeft = 0;
      this.x = 0;
      this.y = 0;
      this.upgradeType = "Weapon";
      this.augments = [
        
      ];
      this.hooks = {
        beforeFire: [],
        afterFire: [],
        update: []
      }
    }

    init(){

    }

    Update(){
      for (const hook of this.hooks.update){
        hook(this);
      }

      //autoswing
      if (this.autoFire && (game.time % this.cooldown) / this.cooldown <= this.duration/this.baseCooldown){
        if (!this.isActive){
          this.Fire();
        }
        this.isActive = true;
      } else {
        this.isActive = false;
      }

      this.timeLeft = (game.time - this.startTime) / this.cooldown * this.baseCooldown;
      // console.log(this.timeLeft)
    }

    Fire(){

      for (const hook of this.hooks.beforeFire){
        hook(this);
      }

      this._FireImplementation();

      for (const hook of this.hooks.afterFire){
        hook(this);
      }
    }

    _FireImplementation(){
      this.enemiesHit = new Array();
      this.startTime = game.time;
      this.directionWhenCasting = player.faceDirection;
    }

    AddAugment(augment){
      this.augments.push(augment);

      //find all hooks from augment and add them to this.hooks array
      for (const hookName in this.hooks){
        if (augment[hookName]){
          this.hooks[hookName].push(augment[hookName].bind(augment))
        }
      }

      if (augment.init){
        augment.init(this, player)
      }

      return this;
    }

    Draw(){
      this.Move();
    }

    Move(){
      this.x = player.x;
      this.y = player.y;
    }

    CheckEnemyHits(weapon) {
      let hits = game.enemies.filter((e)=>{
        const enemy = new SAT.Circle(new SAT.Vector(e.x, e.y), e.radius);
        return checkCollision(weapon, enemy)
      })

      hits.filter(e => {
        if (this.continuousDamage){
          return true;
        } else {
          if (this.enemiesHit.includes(e)){
            return false;
          } else {
            this.enemiesHit.push(e);
            return true;
          }
        }
      })
      .forEach(e => {
        this.HitEnemy(e);
      });
    }

    HitEnemy(enemy){
      let damage = this.baseDamage * this.damageModifier;
      enemy.TakeDamage(damage)
      this.ApplyOnHitEffects(enemy)
    }

    ApplyOnHitEffects(enemy){

    }
  }



  class Sword extends Weapon {
    constructor(name){
      super(name)
      this.size = 1;
      this.color = "#d3cbbe"
      this.baseDamage = 10;
      this.knockback = 1;

    }

    init(){
      super.init()
      this.AddAugment(new AUGMENT.ShootFireballs(1));

      //add upgrades to skillpool
      skillPool.pool.push(new Upgrade(this, this.upgradeType, "Sword Attack Speed", "Increase attack speed by 13", "cooldown", -13, {
        cap: this.minCooldown,
        direction: "min",
        dependencies: ["duration"]
      }))
      skillPool.pool.push(new Upgrade(this, this.upgradeType, "Sword Knockback", "Increase knockback by 1", "knockback", 1))
      skillPool.pool.push(new Upgrade(this, this.upgradeType, "Sword Size", "Increase weapon size by 35%", "size", 0.35))
      skillPool.pool.push(new Upgrade(this, this.upgradeType, "Sword Damage", "Increase base weapon damage by 40%", "damageModifier", 0.4))


    }

    SATObject(x,y){
       // Create a polygon for a simple sword shape
      let sword = new SAT.Polygon(
        new SAT.Vector(x, y),
        [
          new SAT.Vector(0 * this.size, -100 * this.size),    // Tip of sword
          new SAT.Vector(5 * this.size, -80 * this.size),
          new SAT.Vector(5 * this.size, -20 * this.size),     // Handle start
          new SAT.Vector(15 * this.size, -10 * this.size),    // Guard
          new SAT.Vector(-15 * this.size, -10 * this.size),   // Guard
          new SAT.Vector(-5 * this.size, -20 * this.size),    // Handle start
          new SAT.Vector(-5 * this.size, -80 * this.size)
        ]
      );

      let diff = game.time - this.startTime; // Calculate the elapsed time
      let part = (diff / this.duration) * (this.baseCooldown / this.cooldown); // Calculate the proportion of the duration

      let a = -Math.PI/2
      let b = Math.PI/2
      let angle = a + (b-a)* Math.sin(part* Math.PI/2) + (this.directionWhenCasting * Math.PI/2)

      return sword.setAngle(angle);
    }


    Draw(){
      super.Draw();
      this.Update();

      if (!this.isActive) return;
      //Sword
      let sword = this.SATObject(player.x, player.y)

      drawPolygon(ctx, sword, this.color);

      this.CheckEnemyHits(sword);
    }

    ApplyOnHitEffects(enemy){
      enemy.ApplyKnockback(this.knockback, this.x, this.y) //strength, fromX, fromY
    }
  }
  
  class FrostNova extends Weapon {
    constructor(name){
      super(name);
      this.radius = 100;
      this.baseCooldown = 400;
      this.cooldown = 400;
      this.minCooldown = 50;
      this.duration = 10;
      this.color = "rgba(37, 150, 190,0.2)"
      this.effectDuration = 1000;
    }

    init(){
      skillPool.pool.push(new Upgrade(this, this.upgradeType, "Frost Nova Radius", "Increase radius by 100", "radius", 100))
      skillPool.pool.push(new Upgrade(this, this.upgradeType, "Frost Nova Effect Duration", "Increase effect duration by 0.5s", "effectDuration", 500))
      skillPool.pool.push(new Upgrade(this, this.upgradeType, "Frost Nova Cooldown", "Decrease cooldown by 75", "cooldown", -75, {
        cap: this.minCooldown,
        direction: "min",
        dependencies: []
      }))
    }

    Draw(){
      super.Draw();
      this.Update();

      if (!this.isActive) return;
      let circle = this.SATObject(player.x, player.y)

      drawCircle(ctx, circle, this.color);

      this.CheckEnemyHits(circle);
    }

    SATObject(x,y){
      let diff = game.time - this.startTime; // Calculate the elapsed time
      let part = (diff / this.duration) * (this.baseCooldown / this.cooldown); // Calculate the proportion of the duration  
      return new SAT.Circle(new SAT.Vector(x,y), this.radius*part);
    }

    HitEnemy(enemy){
      this.ApplyOnHitEffects(enemy)
    }

    ApplyOnHitEffects(enemy){
      if (enemy.statusEffects.includes("Frozen")){
        return;
      }
      enemy.statusEffects.push("Frozen");
      let values = {
        speed: enemy.speed,
        damage: enemy.damage,
        color: enemy.color
      }

      enemy.speed = 0;
      enemy.damage = 0;
      enemy.color = this.AddOpacity(values.color, 0.5)
      setTimeout(() => {
        enemy.statusEffects.splice(enemy.statusEffects.indexOf("Frozen"))
        enemy.speed = values.speed;
        enemy.damage = values.damage;
        enemy.color = values.color;
      }, this.effectDuration);
    }

    AddOpacity(hexColor, opacity) {
      // Remove the hash if it exists
      hexColor = hexColor.replace('#', '');
      
      // Parse the hex values to get RGB
      const r = parseInt(hexColor.substring(0, 2), 16);
      const g = parseInt(hexColor.substring(2, 4), 16);
      const b = parseInt(hexColor.substring(4, 6), 16);
      
      // Return rgba format with the specified opacity
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
  }

  class Dash extends Weapon {
    constructor(name){
      super(name);
      this.baseCooldown = 1000;
      this.cooldown = 1000;
      this.minCooldown = 200;
      this.duration = 200;
      this.isReady = true;
    }

    init(){
      // skillPool.pool.push(new Upgrade(this, this.upgradeType, "Frost Nova Radius", "Increase radius by 100", "radius", 100))
      document.addEventListener("keydown", (e) => {
        if (e.code == "Space" && this.isReady){
          this.Fire();
        }
      })
    }

    _FireImplementation(){
      this.isReady = false;
      this.startTime = game.time;
      let speed = player.speed;
      player.speed *= 2;
      this.directionWhenCasting = player.faceDirection;
      setTimeout(() => {
        player.speed = speed;
      }, this.duration);
      setTimeout(() => {
        this.isReady = true;
        
      }, this.cooldown);
    }

    Update(){
      for (const hook of this.hooks.update){
        hook(this);
      }

      //if ready
      // if ((game.time % this.cooldown) / this.cooldown <= this.duration/this.baseCooldown){
      //   if (!this.isActive){
      //     this.isReady = true;
      //   }
      // }

      // this.timeLeft = (game.time - this.startTime) / this.cooldown * this.baseCooldown;
      // console.log(this.timeLeft)
    }

    Draw(){
      // super.Draw();
      this.Update();

      // if (!this.isActive) return;
      // let circle = this.SATObject(player.x, player.y)

      // drawCircle(ctx, circle, this.color);

      // this.CheckEnemyHits(circle);
    }

    // SATObject(x,y){
    //   let diff = game.time - this.startTime; // Calculate the elapsed time
    //   let part = (diff / this.duration) * (this.baseCooldown / this.cooldown); // Calculate the proportion of the duration  
    //   return new SAT.Circle(new SAT.Vector(x,y), this.radius*part);
    // }

    // HitEnemy(enemy){
    //   this.ApplyOnHitEffects(enemy)
    // }


  }

  class Electrocute extends Weapon {
    constructor(name){
      super(name)
      this.color = "#60b5ff"
      this.baseDamage = 5;
      this.knockback = 1;
      this.amount = 1;
      this.bounce = 1;
      this.electrocutes = [];
      this.cooldown = 80;
      this.duration = 50;
      this.chainDelay = 20;

    }

    init(){
      super.init()
    }

    LevelUp(){
      this.level += 1;
      this.amount += 1;
      this.bounce += 2;
      this.cooldown -= 15;
      this.damageModifier += 0.25
    }


    Draw(){
      super.Draw();
      this.Update();

      if (!this.isActive) return;

      this.electrocutes.forEach(element => {
        let p1 = {x: element.origin.x, y: element.origin.y}
        let p2 = {x: element.target.x, y: element.target.y}
        drawLine(ctx, {p1, p2}, this.color, 1);
      });
    }

    _FireImplementation(){
      super._FireImplementation();
      let enemiesToHit = this.FindEnemiesToHit()

      enemiesToHit.forEach(element => {
        this.SpawnElectrocute(
          this, 
          element.target, 
          this.bounce,
          [] //start with empty hit list for each chain
        );
      });
    }

    FindEnemiesToHit() {
      if (game.enemies.length == 0) return [];
      let numberOfEnemiesToHit = this.amount;
      let point1 = {x: this.x, y: this.y};
      
      // Calculate distance for all enemies
      let enemiesWithDistance = game.enemies.map((enemy) => {
        let point2 = {x: enemy.x, y: enemy.y}; // Fixed: was using e.x twice
        let distance = calculateDistance(point1, point2);
        return {target: enemy, dist: distance};
      });

      
      // Sort enemies by distance (closest first)
      enemiesWithDistance.sort((a, b) => a.dist - b.dist);
      
      // Take the closest enemy
      let closestEnemies = [enemiesWithDistance[0]];

      // Remove the closest enemy from potential targets
      let remainingEnemies = enemiesWithDistance.slice(1);

      // Randomly select the rest
      for (let i = 1; i < numberOfEnemiesToHit && remainingEnemies.length > 0; i++) {
        let randomIndex = Math.floor(Math.random() * remainingEnemies.length);
        closestEnemies.push(remainingEnemies[randomIndex]);
        remainingEnemies.splice(randomIndex, 1);
      }

      return closestEnemies;
    }

    SpawnElectrocute(origin, target, remainingBounces, hitList){
      // let p1 = {x: origin.x, y: origin.y}
      // let p2 = {x: target.target.x, y: target.target.y}
      let entities = {origin, target};
      this.electrocutes.push(entities)

      //remove chain after timeout
      setTimeout(() => {
        this.electrocutes.splice(this.electrocutes.indexOf(entities), 1)
      }, this.duration);

      //apply damage
      let damage = this.baseDamage * this.damageModifier;
      target.TakeDamage(damage)

      //add target to hitlist to avoid hitting again
      hitList.push(target)

      //if bounces remaining
      if (remainingBounces > 0){
        setTimeout(() => {
          this.ProcessBounce(target, remainingBounces - 1, hitList)
        }, 20);
      }
    }

    ProcessBounce(source, remainingBounces, hitList) {
      console.log(remainingBounces)
      // Find the nearest enemy that hasn't been hit yet
      let nextTarget = this.FindNearestUnhitEnemy(source, hitList);
      
      // If we found a valid target, continue the chain
      if (nextTarget) {
        this.SpawnElectrocute(
          source, 
          nextTarget.target, 
          remainingBounces,
          hitList
        );
      }
    }
    
    FindNearestUnhitEnemy(source, hitList) {
      let point1 = {x: source.x, y: source.y};
      
      // Calculate distance for all enemies that haven't been hit yet
      let enemiesWithDistance = game.enemies
        .filter(enemy => !hitList.includes(enemy.id || enemy)) // Filter out already hit enemies
        .map((enemy) => {
          let point2 = {x: enemy.x, y: enemy.y};
          let distance = calculateDistance(point1, point2);
          return {target: enemy, dist: distance};
        });
      
      // Sort by distance and return the closest one
      enemiesWithDistance.sort((a, b) => a.dist - b.dist);
      
      return enemiesWithDistance.length > 0 ? enemiesWithDistance[0] : null;
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
{#key player.skillPoints}

{#if game.screen.levelUp === true}
  
<div class="w-screen h-screen absolute" in:fade out:fade={{duration: 200}}>
  <LevelUpScreen {player} {startAnimation}/>

</div>

{/if}
{/key}

{#if game.gameOver}
<div class="absolute w-screen h-screen flex flex-col items-center justify-center z-10">
  <h1 class="text-7xl">Game Over!</h1>
  <button class="text-5xl" onclick={startGame}>Restart Game</button>
</div>
{/if}





