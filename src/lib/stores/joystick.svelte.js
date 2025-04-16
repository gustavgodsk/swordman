export const joystick = $state({
  req: null,
  x: 0,
  y: 0,
  buttons: [],
  reset: function(){
    this.req = null,
    this.x = 0,
    this.y = 0,
    this.buttons = []
  }
})

 /**
 * Set a value based on the deadzone
 */
 function setDeadzone(x, y, deadzone=0.2) {
  let m = Math.sqrt(x*x + y*y);

  if (m < deadzone)
      return [0, 0];

  let over = m - deadzone;  // 0 -> 1 - deadzone
  let nover = over / (1 - deadzone);  // 0 -> 1

  let nx = x / m;
  let ny = y / m;

  return [nx * nover, ny * nover];
}

export function handleControllers(){
  let gamepads = navigator.getGamepads();
  let gp = gamepads[0];

  if (gp !== null){
    updateControllers()
  };

  joystick.req = requestAnimationFrame(handleControllers)
}

function updateControllers(){
  let gamepads = navigator.getGamepads();
  let gp = gamepads[0];

  // Blindly assuming standard mapping
  let x = gp.axes[0];
  let y = gp.axes[1];
  [x, y] = setDeadzone(x, y);

  joystick.x = x;
  joystick.y = y;

  joystick.buttons = gp.buttons;
}