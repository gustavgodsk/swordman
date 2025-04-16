<script>
  import StartMenu from "$lib/components/StartMenu.svelte";
  import Canvas from "$lib/components/Canvas.svelte";
  import Overlay from "$lib/components/Overlay.svelte";

  import {gameState} from "$lib/stores/gameState.svelte"
  import { fade } from "svelte/transition";
  import { audio } from '$lib/audio/AudioManager.svelte';
  import { onMount, onDestroy } from "svelte";
  import {handleControllers, joystick} from "$lib/stores/joystick.svelte"

  // let audioManager = $state();
  let isReady = $state(false);


  onMount(async ()=>{
    // Initialize audio system
    // audioManager = new AudioManager();
    audio.init();
    await audio.soundManager.init();
    await audio.musicManager.init();

    joystick.req = requestAnimationFrame(handleControllers)

    isReady = true;
  })

  onDestroy(()=>{
    //Clean up audio resources
    if (audio.soundManager) {
      audio.soundManager.dispose();
    }
    if (audio.musicManager) {
      audio.musicManager.stop();
    }

    cancelAnimationFrame(joystick.req);

  })
</script>

{#if gameState.value === 0}
<div>
  <StartMenu {isReady}/>
</div>
{:else if gameState.value === 1}
  <div class="h-full w-full min-h-screen min-w-screen overflow-hidden relative bg-gray-700">
    <Canvas></Canvas>
  </div>
{:else}
  <p>game over</p>
{/if}


