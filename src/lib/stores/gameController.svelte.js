export const game = $state({
    gameText: new Array(),
    enemies: new Array(),
    dead: new Array(),
    deadCount: 0,
    time: 0,
    experience: new Array(),
    deadExperience: new Array(),
    gameOver: false,
    isPaused: false,
    screen: {
      levelUp: false
    },
    reset: function(){
      this.gameText = new Array(),
      this.enemies = new Array(),
      this.dead = new Array(),
      this.deadCount = 0,
      this.time = 0,
      this.experience = new Array(),
      this.deadExperience = new Array(),
      this.gameOver = false,
      this.isPaused = false,
      this.screen = {
        levelUp: false
      }
    }
});