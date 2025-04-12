<script>
    import { game } from "$lib/stores/gameController.svelte";
    import { onMount } from "svelte";

  let {weapon} = $props();


</script>

<div class="relative w-fit flex">
  {#key game.time}
    <div class="absolute bg-blue-500/50 h-full" style="width: {weapon.timeLeft*100/weapon.baseCooldown}%"></div>
  {/key}
  <p class="z-2">{weapon.name}</p>
</div>