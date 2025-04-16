import * as SAT from "sat";
import {drawCircle, checkCollision} from "./helperFunctions.svelte"
import { canvasContext, groundOffset } from "./canvasStore";
import { get } from 'svelte/store';
import { game } from "./gameController.svelte";
import { LevelUp, skillPool } from "./skillPool.svelte";
import { audio } from "$lib/audio/AudioManager.svelte";

class Augment {
  constructor(){
    this.name = "Augment";
    this.upgradeType = "Augment";
      this.imgSrc = "";
      this.level = 1;
  }

  init(){
    skillPool.pool.push(new LevelUp(this, this.name, this.upgradeType, "Increase level of augment by 1", this.imgSrc))

  }

  LevelUp(amount = 1){
    this.level += amount;
  }
}

export class ShootFireballs extends Augment {
  constructor(level = 1){
    super();
    this.name = "ShootFireballs";
    this.imgSrc = "fireballs.jpeg";
    this.level = level;
    this.amount = 0;
    this.damageModifier = 1;
    this.baseDamage = 1;
    this.baseSpeed = 5;
    this.speed = 5;
    this.baseRadius = 15;
    this.radius = 15;
    this.fireballs = [];
    this.direction = null;
    this.firstHit = false;

    this.fireball = class Fireball{
      constructor(index, parent){
        this.x = 0;
        this.y = 0;
        this.vx = 1;
        this.vy = 1;
        this.index = index; //fireball number 
        this.radius = parent.radius;
        this.color = "orange";
        this.parent = parent;
        this.direction = parent.direction;
        this.speed = parent.speed;
        this.duration = 500;
      }

      init(weapon){
        this.x = weapon.x
        this.y = weapon.y
        setTimeout(() => {
          this.Destroy();
        }, this.duration);
      }

      Destroy(){
        this.parent.fireballs = this.parent.fireballs.filter((e)=>{
          return e !== this;
        })
      }

      update(){
        this.Move();
      }

      Move(){
        const xy = this.CalculateDirection(this.index);
        this.x += xy.vx + this.parent.player.vx;
        this.y += xy.vy + this.parent.player.vy;

        const circle = new SAT.Circle(new SAT.Vector(this.x,this.y), this.radius)

        this.Draw(circle);
      }

      Draw(circle){
        const ctx = get(canvasContext);
        if (!ctx) return;
        drawCircle(ctx, circle, this.color);
        this.CheckEnemyHits(circle)
      }

      CalculateDirection(i){
        let dir = this.direction;

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
        let spread = 0.1;
        let offset = posOrNegative * spread * i;
        angle += offset;

        let vx = Math.cos(angle) * this.speed;
        let vy = Math.sin(angle) * this.speed;
        return {
          vx, vy
        }
      }

      CheckEnemyHits(weapon) {
        let hits = game.enemies.filter((e)=>{
          const enemy = new SAT.Circle(new SAT.Vector(e.x, e.y), e.radius);
          return checkCollision(weapon, enemy)
        })

        if (hits.length > 0 && !this.parent.firstHit) {
          // Only set firstHit to true the first time ANY fireball hits
          this.parent.firstHit = true;
          // Play the sound immediately on the first hit
          audio.soundManager.play("flame", {volume: 0.5});
        }
  
        hits.filter(e => {
          // if (this.continuousDamage){
          //   return true;
          // } else {
          //   if (this.enemiesHit.includes(e)){
          //     return false;
          //   } else {
          //     this.enemiesHit.push(e);
          //     return true;
          //   }
          // }
          return true;
        })
        .forEach(e => {
          let damage = this.parent.baseDamage * this.parent.damageModifier;
          e.TakeDamage(damage, "Burn")
          // this.ApplyOnHitEffects(e)
        });
      }
    }
  }

  init(weapon, player){
    super.init();
    let levelChanges = this.EvaluateLevel(this.level);
    this.ApplyLevelChanges(levelChanges);
    this.player = player;
  }

  EvaluateLevel(level){
    let amount = level;
    let damageModifier = 1 + level*0.3;
    let speed = this.baseSpeed + 0.8*level;
    let radius = this.baseRadius + 2.5*level;
    return {amount, damageModifier, speed, radius}
  }

  LevelUp(amount = 1){
    super.LevelUp(amount)
    let levelChanges = this.EvaluateLevel(this.level);
    this.ApplyLevelChanges(levelChanges)
  }

  ApplyLevelChanges(changes){
    this.amount = changes.amount;
    this.damageModifier = changes.damageModifier;
    this.speed = changes.speed;
    this.radius = changes.radius;

  }

  afterFire(weapon){
    this.direction = weapon.directionWhenCasting;
    this.SpawnNewFireballs(weapon)

  }

  SpawnNewFireballs(weapon){
    this.firstHit = false;
    audio.soundManager.play("fireball", {volume: 0.15})
    //add new fireballs
    for (let i = 0; i < this.amount; i++){
      let fireball = new this.fireball(i, this);
      fireball.init(weapon);
      this.fireballs.push(fireball)
    }


  }

  update(){
    this.fireballs.forEach(fireball => {
      fireball.update();
    });
  }
}