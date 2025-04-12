<script>
  import {gameState} from "$lib/stores/gameState.svelte"
</script>

<div class="w-full h-full min-w-screen min-h-screen bg-gray-500 flex items-center justify-center flex-col">
  <button class="w-1/2 h-1/2 bg-red-500 flex-1 hover:bg-green-200" onclick={()=> gameState.value = 1}>Start Game {gameState.value}</button>
</div>