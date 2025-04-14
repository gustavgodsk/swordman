<script>
  import {game} from "$lib/stores/gameController.svelte"
    import { fade } from "svelte/transition";
  import Icon from "./Icon.svelte";

  let {player} = $props();
  let tim = $derived.by(
    formatTime
  )

  function roundedHealth(){
    return Math.round(player.health)
  }

  function formatTime(){
    let gameTime = game.time / 60;
    
    let minutes = Math.floor(gameTime/60)
    let seconds = (gameTime - (minutes * 60)).toFixed(1);
    let zero = seconds < 10 ? "0" : "";
    return minutes + ":" + zero + seconds;
  }


</script>

{#key game.time}
  
{#if player.criticalHP}
<div class="absolute min-h-screen min-w-screen z-10 bg-radial to-red-800/80 pointer-events-none"></div>
{/if}
{/key}

<div class="min-h-screen min-w-screen max-h-screen absolute grid grid-rows-2 pointer-events-none">
  <div class="grid grid-cols-3">
    <div class=" flex flex-col">
      <h2>Stats</h2>
      {#key game.time}
        
      <p>Radius: {player.radius}</p>
      <p>maxHealth: {player.maxHealth}</p>
      <p>damageModifier: {player.damageModifier}</p>
      <p>Speed: {player.speed}</p>
      {#each player.weapons as weapon}
        <p>{weapon.name}</p>
        <p>{weapon.cooldown}</p>
        <p>{weapon.duration}</p>
        {#each weapon.augments as augment}
          <p>{augment.name}: {augment.level}</p>
        {/each}
      {/each}
      {/key}

      </div>
    <div class="w-min justify-self-center">
      <!-- <p>{(game.time / 60).toFixed(1)}</p> -->
      <p>{tim}</p>
    </div>
    <div class="w-fit justify-self-end">
      {#key game.time}
      <p>HP: {roundedHealth()} / {player.maxHealth}</p>        
      {/key}

    </div>
  </div>
  <div class="w-full grid">
    <div class="min-w-1/2 w-1/2 justify-self-center self-end grid-rows-2 justify-center gap-2">
      <div class="justify-self-center w-full">
        {#key game.time}
          
        {#each player.weapons as weapon}
          <Icon {weapon}/>
         {/each}
        {/key}

      </div>
      <div class="flex justify-center w-full gap-2">
        <p class="text-lg">{player.level}</p>
        <div class="flex-1 w-full relative grid">
          <div class="absolute h-1/2 bg-purple-500 transition-all duration-100 self-center" style="width: {player.experience/player.XPToNextLevel*100}%"></div>
          <p class="z-10">{player.experience}</p>
        </div>
        <p class="text-lg">{player.level+1}</p>
      </div>
    </div>
  </div>

</div>