<script>

  import {game} from "$lib/stores/gameController.svelte"
    import { onDestroy, onMount } from "svelte";
  import SkillCard from "./SkillCard.svelte";
  import { slide } from "svelte/transition";
    import { chooseSkillsFromSkillPool, skillPool } from "$lib/stores/skillPool.svelte";
    import {audio} from "$lib/audio/AudioManager.svelte"
    import {joystick} from "$lib/stores/joystick.svelte"
  // import {skillPool} from "$lib/stores/skillPool.svelte"

  let {player, startAnimation} = $props();
  let chosenSkills = $state([]);
  let ready = $state(false);
  let sounds = [];
  let triggerUpdate = $state(0)
  let readyToChoose = false;

  let type = player.level == 1 ? "Weapon" : "";

  let joystickCooldown = 10;
  let time = $state(0);
  let skillIsChosen = false;

  let hoveredI = $state(0);
  let chosenI = $state(null);
  let timeSinceLastReroll = 100;

  let updateReq;

  onMount(()=>{
    sounds.push(audio.soundManager.play('levelup', { volume: 0.1 }));
    // sounds.push(audio.soundManager.play('victoryhorn', { volume: 0.5 }));
    generateLevelScreen();
    

    // console.log(skillPool.pool)
    updateReq = requestAnimationFrame(update)

    

    window.addEventListener("keydown", keyPressed)

    return () => {
      window.removeEventListener("keydown", keyPressed)
    }

  })

  onDestroy(()=>{
      sounds.forEach(element => {
        element.stop();
      });

      cancelAnimationFrame(updateReq)
  })

  function update(){
    let Xbutton = joystick.buttons[0];
    let triangle = joystick.buttons[3];
    if (Xbutton.pressed === true && !skillIsChosen){
      chooseSkill(hoveredI)
    }
    if (triangle.pressed === true && !skillIsChosen && timeSinceLastReroll > 100){
      reroll();
    }
    if (joystick.x < -0.3 && time > joystickCooldown){
      changeHover(-1)
      time = 0;
    } else if (joystick.x > 0.3 && time > joystickCooldown){
      changeHover(1)
      time = 0;
    }

    time++;
    timeSinceLastReroll++;

    updateReq = requestAnimationFrame(update)
  }

  function generateLevelScreen(){
    chosenI = null;
    hoveredI = 0;
    skillIsChosen = false;
    chosenSkills = chooseSkillsFromSkillPool(3, [], type);

    ready = true; 
    setTimeout(() => {
      readyToChoose = true;
    }, 200);
  }

  function reroll(skillsToIgnore = []){
    if (player.rerolls === 0) return;
    chosenSkills = chooseSkillsFromSkillPool(3, skillsToIgnore, type);
    player.rerolls--;
    triggerUpdate++;
    timeSinceLastReroll = 0;
  }


  function keyPressed(e){
    if (e.key == 1 || e.key == 2 ||e.key == 3){
      chooseSkill(e.key-1)
    }
    if (e.key == "d"){
      changeHover(1)
    }
    if (e.key == "a"){
      changeHover(-1)
    }
    if (e.key == "Enter"){
      chooseSkill(hoveredI)
    }
    if (e.key == "r"){
      reroll(chosenSkills)
    }
  }

  function changeHover(dir){
    if (!readyToChoose) return;
    if (hoveredI + dir < 0){
      hoveredI = chosenSkills.length - 1;
    } else if (hoveredI + dir >= chosenSkills.length){
      hoveredI = 0;
    } else {
      hoveredI += dir;
    }
    
  }

  function chooseSkill(i){
    if (!readyToChoose) return;
    sounds.push(audio.soundManager.play('scale', { volume: 1 }));
    let skill = chosenSkills[i];
    chosenI = i;
    player.skillPoints -= 1
    skill.Apply();
    readyToChoose = false
    skillIsChosen = true;

    if (player.skillPoints > 0){
      setTimeout(() => {
        generateLevelScreen();
      }, 200);
    } else {
      setTimeout(() => {
        game.screen.levelUp = false;
        startAnimation();
      }, 100);
    }
    
  }


</script>
{#if ready}



<div class="w-full h-full bg-gray-800/60 flex flex-col items-center justify-evenly py-4">
  <div class="">
    {#if player.level == 1}
    <p class="text-3xl text-gray-200 font-bold">Choose a starter weapon!</p>
    {:else}
      <p class="text-3xl text-gray-200 font-bold">Level {player.level}!{player.level % 5 === 0? " (+1 reroll)" : ""}</p>
    {/if}
  </div>

  <div class="w-[80%] h-[80%] grid grid-cols-3 gap-10" >
    {#each chosenSkills as skill, i}
    <div transition:slide={{duration:200}}>
      <SkillCard {chooseSkill} {skill} {i} {chosenI} {hoveredI}/>
    </div>
    {/each}
  </div>

  <div class="">
    {#key triggerUpdate}
    <p class="text-lg text-gray-200 font-bold">Rerolls: {player.rerolls}</p>
    {/key}
  </div>
</div>





{/if}
