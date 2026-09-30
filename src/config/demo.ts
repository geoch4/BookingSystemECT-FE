const demoFlag = import.meta.env.VITE_ENABLE_DEMO_DATA;

export const DEMO_MODE = demoFlag === 'true' || (import.meta.env.DEV && demoFlag !== 'false');
