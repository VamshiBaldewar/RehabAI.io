export type Keypoint2D = {
  x: number
  y: number
}

/**
 * Calculates the angle at keypoint B formed by points A-B-C.
 * Returns the smallest angle in degrees in the range [0, 180].
 */
export function calculateAngle(a: Keypoint2D, b: Keypoint2D, c: Keypoint2D): number {
  const v1x = a.x - b.x
  const v1y = a.y - b.y
  const v2x = c.x - b.x
  const v2y = c.y - b.y

  const dot = v1x * v2x + v1y * v2y
  const mag1 = Math.hypot(v1x, v1y)
  const mag2 = Math.hypot(v2x, v2y)

  if (mag1 === 0 || mag2 === 0) return 0

  let cosTheta = dot / (mag1 * mag2)
  // Clamp to handle floating point errors
  cosTheta = Math.max(-1, Math.min(1, cosTheta))
  const radians = Math.acos(cosTheta)
  const degrees = radians * (180 / Math.PI)
  return degrees
}


