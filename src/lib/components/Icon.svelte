<script>
    import { game } from "$lib/stores/gameController.svelte";
    import { onMount } from "svelte";

  let {weapon} = $props();

  let img = $derived(weapon.imgSrc)


</script>

<div class="relative w-8 h-8 flex bg-[url(/items/{img})] bg-cover bg-center">
<!-- <div class="relative w-fit flex bg-[url(/items/{img})] bg-cover bg-center"> -->
  {#key game.time}
    <div class="absolute bg-blue-500/50 h-full" style="width: {weapon.timeLeft*100/weapon.baseCooldown}%"></div>
  {/key}
  <!-- <p class="z-2">{weapon.name} {weapon.level}</p> -->
   <p class="absolute right-0 bottom-0 text-gray-400 text-xs">{weapon.level}</p>
</div>