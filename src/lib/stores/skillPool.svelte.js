

export const skillPool = $state({
  pool: [],
  reset: function(){
    this.pool = []
  }
})

export class Upgrade{
  constructor(target = null, upgradeType = null, name = "Name", description = "", stats = [], amounts = [], limits = false){
    this.target = target;
    this.upgradeType = upgradeType;
    this.name = name;
    this.description = description;
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
          skillPool.pool.splice(skillPool.pool.indexOf(this), 1)
        } else if (this.limits.direction == "max"){

        }
      }
    }
  }
}

export class AugmentLevelUp extends Upgrade {
  constructor(target = null, upgradeType = null, name = "Name", description = "", stats = [], amounts = []){
    super(target, upgradeType, name, description, stats);
  }

  Apply(){
    this.target.LevelUp(1);
  }
}

export function chooseSkillsFromSkillPool(amount = 3){
  let randomValues = [];
  let arr = skillPool.pool;
  while (randomValues.length < amount) {
    let randomIndex = Math.floor(Math.random() * arr.length);
    let randomValue = arr[randomIndex];
    if (!randomValues.includes(randomValue)) {
      randomValues.push(randomValue);
    }
  }
  return randomValues;
}