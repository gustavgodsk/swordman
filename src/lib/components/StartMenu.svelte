<script>
  import {gameState} from "$lib/stores/gameState.svelte"
  import {joystick} from "$lib/stores/joystick.svelte"
  import { onDestroy, onMount } from "svelte";

  let {isReady} = $props();

  let req = null;

  onMount(()=>{
    req = requestAnimationFrame(update)
  })

  onDestroy(()=>{
    cancelAnimationFrame(req)
  })

  function update(){
    let btn = joystick.buttons[0];
    if (btn?.pressed === true && isReady){
      gameState.value = 1
    }
    req = requestAnimationFrame(update)
  }

</script>

<div class="w-full h-full min-w-screen min-h-screen bg-gray-500 flex items-center justify-center flex-col">
  {#if isReady}
  <button class="w-1/2 h-1/2 bg-red-500 flex-1 hover:bg-green-200" onclick={()=> gameState.value = 1}>Start Game {gameState.value}</button>
  {:else}
  <p>loading</p>
  {/if}
</div>