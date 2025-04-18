<script>
    import { game } from "$lib/stores/gameController.svelte";
    import { onMount } from "svelte";

  let {weapon} = $props();

  let img = $derived(weapon.imgSrc)


</script>

<div class="flex flex-row">
<div 
  class="relative w-8 h-8 flex bg-cover bg-center overflow-hidden"
  style="background-image: url('/items/{img}');"
>
<!-- <div class="relative w-fit flex bg-[url(/items/{img})] bg-cover bg-center"> -->
  {#key game.time}
    <div class="absolute bg-blue-500/50 h-full" style="width: {weapon.timeLeft*100/weapon.baseCooldown}%"></div>
  {/key}
  <!-- <p class="z-2">{weapon.name} {weapon.level}</p> -->
   <p class="absolute right-0 bottom-0 text-gray-400 text-xs">{weapon.level}</p>
</div>

{#each weapon.augments as augment}
  
{#if augment.level > 0}
<div 
  class="relative w-8 h-8 flex bg-cover bg-center overflow-hidden"
  style="background-image: url('/items/{augment.imgSrc}');"
>
   <p class="absolute right-0 bottom-0 text-gray-400 text-xs">{augment.level}</p>
</div>
{/if}
{/each}

</div>