const demoFlag = import.meta.env.VITE_ENABLE_DEMO_DATA;

// Demo data and demo login accounts are only allowed during local development.
// Production builds must never enable frontend-created demo tokens.
export const DEMO_MODE = import.meta.env.DEV && demoFlag !== 'false';
