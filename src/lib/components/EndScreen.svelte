<script>
  import {joystick} from "$lib/stores/joystick.svelte"
  import {onMount, onDestroy} from "svelte";

  let {restartGame} = $props();
  let req = null;

  onMount(()=>{
    req = requestAnimationFrame(update)
  })

  onDestroy(()=>{
    cancelAnimationFrame(req)
  })

  function update(){
    let btn = joystick.buttons[0];
    if (btn?.pressed === true){
      restartGame();
    }
    req = requestAnimationFrame(update)
  }

</script>

<div>
  <button class="text-5xl" onclick={restartGame}>Restart Game</button>

</div>