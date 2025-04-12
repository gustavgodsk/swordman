<script>

  import {game} from "$lib/stores/gameController.svelte"
    import { onMount } from "svelte";
  import SkillCard from "./SkillCard.svelte";
  import { slide } from "svelte/transition";
    import { chooseSkillsFromSkillPool, skillPool } from "$lib/stores/skillPool.svelte";
  // import {skillPool} from "$lib/stores/skillPool.svelte"

  let {player, startAnimation} = $props();
  let chosenSkills = new Array();
  let ready = $state(false);

  let chosenI = $state(null);

  onMount(()=>{

    // console.log(skillPool.pool)

    chosenSkills = chooseSkillsFromSkillPool(3);

    ready = true;

    window.addEventListener("keydown", keyPressed)

    return () => {
      window.removeEventListener("keydown", keyPressed)
    }

  })


  function keyPressed(e){
    if (e.key == 1 || e.key == 2 ||e.key == 3){
      chooseSkill(e.key-1)
    }
  }

  function chooseSkill(i){
    let skill = chosenSkills[i];
    chosenI = i;
    player.skillPoints -= 1
    skill.Apply();
    setTimeout(() => {
    game.screen.levelUp = false;
    startAnimation();
    }, 200);
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
    <!-- <div>
      <SkillCard {chooseSkill}/>
    </div>
    <div>
      <SkillCard {chooseSkill}/>
    </div>
    <div>
      <SkillCard {chooseSkill}/>
    </div> -->
  </div>
</div>

{/if}
