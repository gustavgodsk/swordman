import * as AUGMENT from "$lib/stores/augments"
import { skillPool, LevelUp, FirstTimePickUp } from "./skillPool.svelte";
import { game } from "./gameController.svelte";
import { audio } from "$lib/audio/AudioManager.svelte";
import SAT from "sat";
import {drawVector, drawLine, drawCircle, drawPolygon, checkCollision, calculateDistance, enemiesWithDistance} from "$lib/stores/helperFunctions.svelte";
import { read } from "$app/server";
import { joystick } from "./joystick.svelte";

let ctx;

class Weapon {
  constructor(holder){
    this.holder = holder;
    this.name = "weapon name";
    this.description = "Deadly weapon description"
    this.imgSrc = "";
    this.level = 1;
    this.baseDamage = 0;
    this.damageModifier = 1;
    this.continuousDamage = false;
    this.autoFire = true;
    this.size = 1;
    this.enemiesHit = new Array();
    this.firstHit = false;
    this.isActive = false;
    this.baseCooldown = 100;
    this.cooldown = 100;
    this.minCooldown = 20;
    this.duration = 50;
    this.startTime = 0;
    this.knockback = 0;
    this.directionWhenCasting = null;
    this.timeLeft = 0;
    this.maxLevel = 7;
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
    this.controller = new AbortController();
    this.signal = this.controller.signal;
  }

  init(){

  }

  AddToSkillPool(){
    let skillCardInfo = new FirstTimePickUp(this.holder, this.name, this.upgradeType, this.description, this.imgSrc, this);
    skillPool.pool.push(skillCardInfo)
  }

  RemoveFromSkillPool(){
    let skillCardInfo = skillPool.pool.filter(e => e.name == this.name)
    let i = skillPool.pool.indexOf(skillCardInfo[0])
    let removed = skillPool.pool.splice(i,1)
    console.log(skillCardInfo, i, removed)
  }

  LevelUp(){
    this.level += 1;

    if (this.level == this.maxLevel){
      this.ReachMaxLevel();
    }
  }

  ReachMaxLevel(){
    this.RemoveFromSkillPool();
  }

  Update(){
    for (const hook of this.hooks.update){
      hook(this);
    }

    //autoswing
    let readyToFire = (game.time % this.cooldown) / this.cooldown <= this.duration/this.baseCooldown;

    if (this.autoFire && readyToFire){
      if (!this.isActive){
        this.Fire();
      }
      this.isActive = true;
    } else {
      this.isActive = false;
    }

    this.timeLeft = (game.time - this.startTime) / this.cooldown * this.baseCooldown;
    // console.log(this.timeLeft)

    if (!this.firstHit && this.enemiesHit.length > 0){
      // audio.soundManager.play('sword-slash', { volume: 0.5 });
      this.firstHit = true;
    }
  }

  Fire(){
    this.firstHit = false;

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
    this.directionWhenCasting = this.holder.faceDirection;
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
      augment.init(this, this.holder)
    }

    return this;
  }

  Draw(){
    this.Move();
  }

  Move(){
    this.x = this.holder.x;
    this.y = this.holder.y;
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

  destroy(){
    this.controller.abort();
  }
}

export class Sword extends Weapon {
  constructor(holder){
    super(holder)
    this.size = 1;
    this.color = "#d3cbbe"
    this.baseDamage = 10;
    this.knockback = 1;
    this.imgSrc = "sword.jpeg";
    this.name = "Greatsword"

  }

  init(){
    super.init()
    // this.AddAugment(new AUGMENT.ShootFireballs(0));

    //add upgrades to skillpool
    //   ---INDIVIDUAL STAT UPGRADES
    // skillPool.pool.push(new Upgrade(this, this.upgradeType, "Sword Attack Speed", "Increase attack speed by 13", "cooldown", -13, {
    //   cap: this.minCooldown,
    //   direction: "min",
    //   dependencies: ["duration"]
    // }))
    // skillPool.pool.push(new Upgrade(this, this.upgradeType, "Sword Knockback", "Increase knockback by 1", "knockback", 1))
    // skillPool.pool.push(new Upgrade(this, this.upgradeType, "Sword Size", "Increase weapon size by 35%", "size", 0.35))
    // skillPool.pool.push(new Upgrade(this, this.upgradeType, "Sword Damage", "Increase base weapon damage by 40%", "damageModifier", 0.4))

  skillPool.pool.push(new LevelUp(this, this.name, this.upgradeType, "Increase level of sword by 1", this.imgSrc))
  }

  LevelUp(){
    this.cooldown -= 5;
    this.knockback += 0.3;
    this.size += 0.15;
    this.damageModifier += 0.3;
    super.LevelUp();
  }

  ReachMaxLevel(){
    super.ReachMaxLevel();
    this.cooldown = 35;
    this.size = 3;
    this.knockback = 3;
    this.baseDamage = 15;
    this.color = "rgba(255, 255, 255, 1)"
  }

  _FireImplementation(){
    super._FireImplementation();
    audio.soundManager.play('sword', { volume: 0.5 });
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
    let sword = this.SATObject(this.holder.x, this.holder.y)

    drawPolygon(ctx, sword, this.color);

    this.CheckEnemyHits(sword);
  }

  ApplyOnHitEffects(enemy){
    enemy.ApplyKnockback(this.knockback, this.x, this.y) //strength, fromX, fromY
  }

  HitEnemy(enemy){
    super.HitEnemy(enemy);
    audio.soundManager.play('sword-slash', { volume: 0.5 });
  }
}

export class FrostNova extends Weapon {
  constructor(holder){
    super(holder);
    this.radius = 150;
    this.imgSrc = "frostnova.jpeg";
    this.baseCooldown = 400;
    this.cooldown = 250;
    this.minCooldown = 50;
    this.duration = 50;
    this.baseDamage = 8;
    this.color = "rgba(37, 150, 190,0.2)"
    this.effectDuration = 500;
    this.speedReduction = 0.7;
    this.name = "Frost Nova"

  }

  init(){
    // skillPool.pool.push(new Upgrade(this, this.upgradeType, "Frost Nova Radius", "Increase radius by 100", "radius", 100))
    // skillPool.pool.push(new Upgrade(this, this.upgradeType, "Frost Nova Effect Duration", "Increase effect duration by 0.5s", "effectDuration", 500))
    // skillPool.pool.push(new Upgrade(this, this.upgradeType, "Frost Nova Cooldown", "Decrease cooldown by 75", "cooldown", -75, {
    //   cap: this.minCooldown,
    //   direction: "min",
    //   dependencies: []
    // }))

    skillPool.pool.push(new LevelUp(this, this.name, this.upgradeType, "Increase level of FrostNova by 1", this.imgSrc))

  }

  LevelUp(){
    this.radius += 30;
    this.effectDuration += 100;
    this.cooldown -= 30;
    this.speedReduction -= 0.08;
    super.LevelUp();
  }

  ReachMaxLevel(){
    super.ReachMaxLevel();
    this.speedReduction = 0;
    this.radius = 500;
    this.effectDuration = 1600
  }

  _FireImplementation(){
    audio.soundManager.play("icicles", {volume:1})
    super._FireImplementation();
  }

  Draw(){
    super.Draw();
    this.Update();

    if (!this.isActive) return;
    let circle = this.SATObject(this.holder.x, this.holder.y)

    drawCircle(ctx, circle, this.color);

    this.CheckEnemyHits(circle);
  }

  SATObject(x,y){
    let diff = game.time - this.startTime; // Calculate the elapsed time
    let part = (diff / this.duration) * (this.baseCooldown / this.cooldown); // Calculate the proportion of the duration  
    return new SAT.Circle(new SAT.Vector(x,y), this.radius*part);
  }

  HitEnemy(enemy){
    super.HitEnemy(enemy);
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

    enemy.speed *= this.speedReduction;
    enemy.damage = 0;
    enemy.color = this.AddOpacity(values.color, 0.5)
    setTimeout(() => {
      enemy.statusEffects.splice(enemy.statusEffects.indexOf("Frozen"),1)
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

export class Dash extends Weapon {
  constructor(holder){
    super(holder);
    this.baseCooldown = 1000;
    this.cooldown = 1000;
    this.minCooldown = 200;
    this.duration = 200;
    this.isReady = true;
    this.imgSrc = "dash.jpeg";
    this.name = "Dash"

  }

  init(){
    // skillPool.pool.push(new Upgrade(this, this.upgradeType, "Frost Nova Radius", "Increase radius by 100", "radius", 100))
    
    document.addEventListener("keydown",
      (e)=> this.handleKeyDown(e),
      {signal: this.signal}
    )

    // this.eventListeners.push({event: "keydown", fn: this.handleKeyDown})

    
  }

  

  handleKeyDown(e){
    if (e.code == "Space" && this.isReady){
      this.Fire();
    }
  }

  _FireImplementation(){
    this.isReady = false;
    this.startTime = game.time;
    let speed = this.holder.getSpeed();
    this.holder.speed *= 2;
    this.directionWhenCasting = this.holder.faceDirection;
    setTimeout(() => {
      this.holder.speed = speed;
    }, this.duration);
    setTimeout(() => {
      this.isReady = true;
      
    }, this.cooldown);
  }

  Update(){
    for (const hook of this.hooks.update){
      hook(this);
    }

    if (joystick.buttons[2]?.pressed === true && this.isReady){
      this.Fire();
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
    // let circle = this.SATObject(this.holder.x, this.holder.y)

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

export class Electrocute extends Weapon {
  constructor(holder){
    super(holder)
    this.color = "#60b5ff"
    this.imgSrc = "electrocute.jpeg";
    this.baseDamage = 5;
    this.levelOneDamage = 8;
    this.knockback = 1;
    this.amount = 1;
    this.bounce = 1;
    this.electrocutes = [];
    this.cooldown = 100;
    this.duration = 50;
    this.chainDelay = 50;
    this.name = "Electrocute"


  }

  init(){
    super.init()
    skillPool.pool.push(new LevelUp(this, this.name, this.upgradeType, "Increase level of electrocute by 1", this.imgSrc))
    this.baseDamage = this.levelOneDamage;
  }

  LevelUp(){
    this.amount += 1;
    this.bounce += 2;
    this.cooldown -= 5;
    // this.damageModifier += 0.15
    this.damageModifier -= 0.12;
    this.baseDamage = 5;
    super.LevelUp();
  }

  ReachMaxLevel(){
    this.bounce = 40;
    this.cooldown = 30;
    this.amount = 10;
    this.baseDamage = 1.5;
    this.damageModifier = 1;
    super.ReachMaxLevel();
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
    audio.soundManager.play('electrocute', { volume: 10 });
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
    
    let enemiesWithDistanceArray = enemiesWithDistance(this.x,this.y, true)

    // Take the closest enemy
    let closestEnemies = [enemiesWithDistanceArray[0]];

    // Remove the closest enemy from potential targets
    let remainingEnemies = enemiesWithDistanceArray.slice(1);

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
      }, this.chainDelay);
    }
  }

  ProcessBounce(source, remainingBounces, hitList) {
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

export class Wand extends Weapon {
  constructor(holder){
    super(holder);
    this.name = "Wand"
    this.imgSrc = "staff.jpeg"
    this.cooldown = 150;
    this.baseCooldown = 150;
    this.duration = 50;
    this.baseDamage = 15;
    this.projectileDuration = 800;
    this.pierce = 1;
    this.radius = 6;
    this.speed = 5;
    this.amount = 1;
    this.color = "#f0ffb7"
    this.continuousDamage = false;
    this.projectiles = [];
    this.projectile = class Projectile{
      constructor(parent, x, y, vx, vy){
        this.parent = parent;
        this.x = x;
        this.y = y;
        this.duration = parent.projectileDuration;
        this.enemiesHit = [];
        this.vx = vx;
        this.vy = vy;
      }

      init(){
        this.x = this.parent.x;
        this.y = this.parent.y;
        setTimeout(() => {
          this.Destroy();
        }, this.duration)
      }

      Destroy(){
        this.parent.projectiles = this.parent.projectiles.filter((e)=>{
          return e !== this;
        })
      }

      update(){
        this.Move();
      }

      Move(){
        this.x += this.vx + this.parent.holder.vx;
        this.y += this.vy + this.parent.holder.vy;

        const circle = new SAT.Circle(new SAT.Vector(this.x,this.y), this.parent.radius*this.parent.size)

        this.Draw(circle);
      }

      Draw(circle){
        // const ctx = get(canvasContext);
        // if (!ctx) return;
        // if (!this.isActive) return;  

        const ctx = null;
        drawCircle(ctx, circle, this.parent.color);
        this.CheckEnemyHits(circle)
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
          
          let damage = this.parent.baseDamage * this.parent.damageModifier;
          e.TakeDamage(damage)
          // this.ApplyOnHitEffects(e)
          //destroy on pierce hit
          if (this.enemiesHit.length > this.parent.pierce){
            return this.Destroy();
          }
        });
      }
    }


  }

  init(){
    super.init()
    skillPool.pool.push(new LevelUp(this, this.name, this.upgradeType, "Increase level of magic wand by 1", this.imgSrc))
    this.AddAugment(new AUGMENT.ShootFireballs(0));
  }

  LevelUp(){
    this.cooldown -= 20;
    this.pierce += 1;
    this.damageModifier += 0.25
    this.projectileDuration += 200;
    this.size += 0.5;
    super.LevelUp();
  }

  ReachMaxLevel(){
    super.ReachMaxLevel();
    this.pierce = 20;
    // this.size = 2;
    // this.speed = 6;
    this.amount = 3;
    // this.baseDamage = 20;
    this.color = "rgba(240,255,183,0.5"
  }

  Draw(){
    super.Draw();
    this.Update();
  }

  Update(){
    super.Update();
    this.projectiles.forEach(element => {
      element.update();
    });
  }

  _FireImplementation(){
    super._FireImplementation();
    let numberOfEnemiesToFind = this.amount;
    let vArray = this.CalculateVelocityDirection(numberOfEnemiesToFind);
    for (let index = 0; index < this.amount; index++) {
      if (vArray[index]){
        this.SpawnProjectile(vArray[index])
      }
    }

  }

  SpawnProjectile(v){
    let projectile = new this.projectile(this, this.x, this.y, v.x, v.y)
    projectile.init();
    this.projectiles.push(projectile)
  }

  CalculateVelocityDirection(numberOfEnemiesToFind){
    if (game.enemies.length === 0){
      return {
        x: 0,
        y: 0
      }
    }
    let enemiesWithDistSorted = enemiesWithDistance(this.x, this.y, true);


    let closestEnemies = enemiesWithDistSorted.slice(0,numberOfEnemiesToFind);
    let vArray = [];

    closestEnemies.forEach(element => {
      const directionX = element.target.x - this.x
      const directionY = element.target.y - this.y
      const distance = Math.sqrt(directionX * directionX + directionY * directionY);

      let v = {x :0,y: 0}
      v.x = (directionX / distance) * this.speed;
      v.y = (directionY / distance) * this.speed;

      vArray.push(v);
    });

    return vArray;
  }

}

export class Bow extends Weapon {
  constructor(holder){
    super(holder);
    this.name = "Bow"
    this.imgSrc = "bow.png"
    this.cooldown = 110;
    this.baseCooldown = 110;
    this.duration = 50;
    this.baseDamage = 8;
    this.projectileDuration = 800;
    this.pierce = 0;
    this.radius = 6;
    this.spread = 0.05;
    this.speed = 8;
    this.volleys = 1;
    this.amount = 2;
    this.color = "grey"
    this.continuousDamage = false;
    this.projectiles = [];
    this.projectile = class Projectile{
      constructor(parent, x, y, vx, vy){
        this.parent = parent;
        this.x = x;
        this.y = y;
        this.duration = parent.projectileDuration;
        this.enemiesHit = [];
        this.vx = vx;
        this.vy = vy;
      }

      init(){
        this.x = this.parent.x;
        this.y = this.parent.y;
        setTimeout(() => {
          this.Destroy();
        }, this.duration)
      }

      Destroy(){
        this.parent.projectiles = this.parent.projectiles.filter((e)=>{
          return e !== this;
        })
      }

      update(){
        this.Move();
      }

      Move(){
        this.x += this.vx + this.parent.holder.vx;
        this.y += this.vy + this.parent.holder.vy;

        const circle = new SAT.Circle(new SAT.Vector(this.x,this.y), this.parent.radius*this.parent.size)

        this.Draw(circle);
      }

      Draw(circle){
        // const ctx = get(canvasContext);
        // if (!ctx) return;
        // if (!this.isActive) return;  

        const ctx = null;
        drawCircle(ctx, circle, this.parent.color);
        this.CheckEnemyHits(circle)
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
          
          let damage = this.parent.baseDamage * this.parent.damageModifier;
          e.TakeDamage(damage)
          // this.ApplyOnHitEffects(e)
          //destroy on pierce hit
          if (this.enemiesHit.length > this.parent.pierce){
            return this.Destroy();
          }
        });
      }
    }


  }

  init(){
    super.init()
    skillPool.pool.push(new LevelUp(this, this.name, this.upgradeType, "Increase level of bow by 1", this.imgSrc))
    // this.AddAugment(new AUGMENT.ShootFireballs(0));
  }

  LevelUp(){
    this.cooldown -= 7;
    this.pierce += 0.5;
    this.damageModifier += 0.3
    this.projectileDuration += 100;
    this.speed += 0.5;
    this.amount += 2;
    this.holder.speed += 0.1
    super.LevelUp();
  }

  ReachMaxLevel(){
    super.ReachMaxLevel();
    this.pierce = 10;
    this.volleys = 3;
    // this.size = 2;
    // this.speed = 6;
    this.amount = 15;
    this.baseDamage = 12;
    // this.baseDamage = 20;
    this.color = "rgba(240,255,183,0.5"
  }

  Draw(){
    super.Draw();
    this.Update();
  }

  Update(){
    super.Update();
    this.projectiles.forEach(element => {
      element.update();
    });
  }

  _FireImplementation(){
    super._FireImplementation();
    let numberOfEnemiesToFind = this.amount;

    let i = 0;

    this.SpawnVolley();
    let interval = setInterval(() => {
      i++
      if (i >= this.volleys){
        clearInterval(interval)
        return;
      }
      this.SpawnVolley();
    }, 200);

  }

  SpawnVolley(){

    for (let index = 0; index < this.amount; index++) {
    let v = this.CalculateVelocityDirection(index);

    this.SpawnProjectile({x: v.vx, y: v.vy})
      
    }
  }

  SpawnProjectile(v){
    let projectile = new this.projectile(this, this.x, this.y, v.x, v.y)
    projectile.init();
    this.projectiles.push(projectile)
  }

  CalculateVelocityDirection(i){
    let dir = this.directionWhenCasting;

    //calculate main angle
    // let spread = Math.PI/8 * i
    let angle = dir * Math.PI/2 - Math.PI/2;
    // angle += spread;

    //modified angle
    // const spread = Math.PI/8;
    // const halfTotal = (this.parent.amount - 1) / 2;
    // const offset = (i - halfTotal) * (spread / halfTotal);
    // angle += offset;

    let posOrNegative = i % 2 === 0 ? 1 : -1;
    let spread = this.spread;
    let offset = posOrNegative * spread * i;
    angle += offset;

    let vx = Math.cos(angle) * this.speed;
    let vy = Math.sin(angle) * this.speed;
    return {
      vx, vy
    }
  }

}