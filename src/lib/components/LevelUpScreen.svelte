<script>

  import {game} from "$lib/stores/gameController.svelte"
    import { onDestroy, onMount } from "svelte";
  import SkillCard from "./SkillCard.svelte";
  import { slide } from "svelte/transition";
    import { chooseSkillsFromSkillPool, skillPool } from "$lib/stores/skillPool.svelte";
    import {audio} from "$lib/audio/AudioManager.svelte"
  // import {skillPool} from "$lib/stores/skillPool.svelte"

  let {player, startAnimation} = $props();
  let chosenSkills = $state([]);
  let ready = $state(false);
  let sounds = [];

  let chosenI = $state(null);

  onMount(()=>{
    sounds.push(audio.soundManager.play('levelup', { volume: 0.5 }));
    // sounds.push(audio.soundManager.play('victoryhorn', { volume: 0.5 }));
    generateLevelScreen();
      

    // console.log(skillPool.pool)

    

    window.addEventListener("keydown", keyPressed)

    return () => {
      window.removeEventListener("keydown", keyPressed)
    }

  })

  onDestroy(()=>{
      sounds.forEach(element => {
        element.stop();
      });
  })

  function generateLevelScreen(){
    chosenI = null;
    chosenSkills = chooseSkillsFromSkillPool(3);

    ready = true; 
  }


  function keyPressed(e){
    if (e.key == 1 || e.key == 2 ||e.key == 3){
      chooseSkill(e.key-1)
    }
  }

  function chooseSkill(i){
    sounds.push(audio.soundManager.play('scale', { volume: 1 }));
    let skill = chosenSkills[i];
    chosenI = i;
    player.skillPoints -= 1
    skill.Apply();

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

<div class="w-full h-full bg-gray-800/60 grid items-center justify-items-center">
  <div class="w-[80%] h-[80%] grid grid-cols-3 gap-10" >
    {#each chosenSkills as skill, i}
    <div transition:slide={{duration:200}}>
      <SkillCard {chooseSkill} {skill} {i} {chosenI}/>
    </div>
    {/each}
  </div>
</div>

{/if}
