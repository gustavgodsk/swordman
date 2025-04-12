import { get } from 'svelte/store';
import { game } from "./gameController.svelte";
import { canvasContext } from "./canvasStore";

export class gameText{
  constructor(target, content, type, size){
    this.target = target;
    this.x = 0;
    this.y = target.y + (Math.random() - Math.random()) * target.radius;
    this.originY = this.y;
    this.randomOffsetX = (Math.random() - Math.random()) * target.radius;
    this.randomOffsetY = (Math.random() - Math.random()) * target.radius;
    this.vy = 3;
    this.content = content;
    this.type = type;
    this.duration = 90 + (3*size);
    this.time = 0;
    this.size = size;
    this.yDist = 0;
  }

  init(){
    if (game.gameText.length > 30){
      // game.gameText.shift();
      return;
    }
      game.gameText.push(this)
    setTimeout(() => {
      this.Destroy();
    }, this.duration);
  }

  update(){
    this.time++;
    this.Move();

  }

  Move(){
    let diff = this.y - (this.originY - 50);
    let modifier = diff * 0.03;

    this.yDist -= this.vy * modifier;

    this.x = this.target.x + this.randomOffsetX;
    this.y = this.target.y + this.yDist;

    this.Draw();
  }

  Draw(){
    let part = (this.duration / this.time) / this.duration;
    let ctx = get(canvasContext);
    ctx.font = `${20 + this.size/10}px Arial`

    ctx.fillStyle = this.GetFillStyle(part)
    // ctx.fillStyle = "grey"
    ctx.fillText(this.content, this.x, this.y)
  }

  Destroy(){
    game.gameText = game.gameText.filter((e)=>{
      return e !== this;
    })
  }

  GetFillStyle(part){
    switch(this.type){
      case "EnemyDamage":
        return `rgba(255,255,255,${part*3})`
        break;
      case "PlayerDamage":
        return `rgba(255,0,0,${part*3})`;
        break;
      case "PlayerHeal":
        return `rgba(0,125,100,${1})`;
        break;
      case "Experience":
        return `rgba(173, 70, 255,${part*3})`
        break;
      case "Burn":
        return `rgba(247, 116, 9,${part*3})`
        break;
      default:
        return "black"
    }

  }
}