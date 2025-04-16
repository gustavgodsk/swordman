<script>
  
  let {chooseSkill, skill, i, chosenI, hoveredI} = $props();

</script>

<button 
  class="cursor-pointer w-full h-full flex flex-col justify-evenly {chosenI == i ? "scale-125 transition-all" : ""} {hoveredI == i ? "border-10 border-blue-500" : ""}"
  onclick={()=>{chooseSkill(i)}}
  class:bg-green-500={skill.upgradeType === 'Player'}
  class:bg-red-500={skill.upgradeType === 'Weapon'}
  class:bg-purple-500={skill.upgradeType === 'Augment'}
>

  <h2 class="text-xl">{skill.name}</h2>
  <div>
    <img src={skill.img} alt="">
  </div>
  <p class="text-sm">
    {skill.description}
  </p>
  <div class="flex flex-col">

  <p class="text-sm">
    Upgrade type: {skill.upgradeType}
  </p>
  <p class="text-sm">
    Upgrade target: {skill.target.name}
  </p>
</div>

</button>