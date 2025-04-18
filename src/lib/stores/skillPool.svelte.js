

export const skillPool = $state({
  pool: [],
  reset: function(){
    this.pool = [] 
  }
})

class SkillCardInfo{
  constructor(target = null, name = "Name", upgradeType = "upgradeType", description = "Description", img = ""){
    this.target = target;
    this.name = name;
    this.upgradeType = upgradeType;
    this.description = description;
    this.img = "/items/" + img;
  }

  RemoveFromSkillPool(){
    skillPool.pool.splice(skillPool.pool.indexOf(this), 1)
  }

}

export class StatUpgrade extends SkillCardInfo {
  constructor(target, name, upgradeType, description, img, stats = [], amounts = [], limits = false){
    super(target, name, upgradeType, description, img)
    this.stats = stats;
    this.amounts = amounts;
    this.limits = limits;
  }

  Apply(){
    if (this.target[this.stats] !== undefined){
      this.target[this.stats] += this.amounts
      if (this.limits){
        //if below cap
        if (this.limits.direction == "min" && this.target[this.stats] <= this.limits.cap){
          this.target[this.stats] = this.limits.cap;
          this.limits.dependencies.forEach(element => {
            this.target[element] = this.limits.cap;
          });

          //remove from skillpool since cap is reached
          super.RemoveFromSkillPool();
        } else if (this.limits.direction == "max"){

        }
      }
    }
  }
}

export class LevelUp extends SkillCardInfo {
  constructor(target, name, upgradeType, description, img){
    super(target, name, upgradeType, description, img);
  }

  Apply(){
    this.target.LevelUp();
  }
}

export function chooseSkillsFromSkillPool(amount = 3, skillsToIgnore = [], type = ""){
  let randomValues = [];
  let arr = skillPool.pool;
  let ignorePrevious = true;

  if (type.length > 0){
    arr = arr.filter(e => {
      return e.upgradeType == type;
    })
    ignorePrevious = false;
  }
  while (randomValues.length < amount) {
    let randomIndex = Math.floor(Math.random() * arr.length);
    let randomValue = arr[randomIndex];
    if (!randomValues.includes(randomValue)) {
      if (ignorePrevious === true  && !skillsToIgnore.includes(randomValue)){
        randomValues.push(randomValue);
      } else if (ignorePrevious === false){
        randomValues.push(randomValue);
      }
    }
  }
  return randomValues;
}

export class FirstTimePickUp extends SkillCardInfo{
  constructor(target, name, upgradeType, description, img, item){
    super(target, name, upgradeType, description, img)
    this.item = item;
  }

  Apply(){
    this.target.AddWeapon(this.item);
    super.RemoveFromSkillPool();
    // let levelUpCard = new LevelUp(this.item, this.name, this.upgradeType, "level up by 1");
    // skillPool.pool.push(levelUpCard)
  }
}