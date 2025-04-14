<script>
    import { onMount } from "svelte";


  let {restartGame} = $props();

  onMount(()=>{

  })
</script>

<div>
  <button class="text-5xl" onclick={restartGame}>Restart Game</button>

</div>