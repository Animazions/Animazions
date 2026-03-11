const ANIMATION_STYLES = [
  '2D animation style',
  '3D animation style',
  'Pixar style animation',
  'Disney style animation',
  'anime style animation',
  'studio ghibli animation style',
  'claymation style',
  'stop motion animation',
  'cel shading animation style',
  'cartoon animation style',
  'motion capture animation',
  'rotoscope animation style',
];

export function getRandomAnimationStyle(): string {
  return ANIMATION_STYLES[Math.floor(Math.random() * ANIMATION_STYLES.length)];
}

export function enhancePromptWithAnimationStyle(prompt: string): string {
  const userPrompt = prompt.trim();
  const animationStyle = getRandomAnimationStyle();

  return `${userPrompt}, high quality ${animationStyle}, professional animation, vibrant colors, smooth motion, polished artwork`;
}
