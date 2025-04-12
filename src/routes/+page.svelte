<script>
  import StartMenu from "$lib/components/StartMenu.svelte";
  import Canvas from "$lib/components/Canvas.svelte";
  import Overlay from "$lib/components/Overlay.svelte";

  import {gameState} from "$lib/stores/gameState.svelte"
  import { fade } from "svelte/transition";


</script>

{#if gameState.value === 0}
<div>
  <StartMenu/>
</div>
{:else if gameState.value === 1}
  <div class="h-full w-full min-h-screen min-w-screen overflow-hidden relative bg-gray-700">
    <Canvas></Canvas>
  </div>
{:else}
  <p>game over</p>
{/if}


