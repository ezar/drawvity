// Haptic feedback — silently no-ops if not supported
export function hapticTap()    { navigator.vibrate?.([10]) }
export function hapticWin()    { navigator.vibrate?.([20, 50, 20, 50, 40]) }
export function hapticLoss()   { navigator.vibrate?.([30, 20, 30]) }
export function hapticLaunch() { navigator.vibrate?.([15]) }
