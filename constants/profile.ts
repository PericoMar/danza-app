export const PROFILE_ROUTE = '/profile';
export const DELETE_ACCOUNT_ROUTE = '/profile/delete-account';

// Vercel function that deletes the caller's auth user + owned rows (api/account/delete.mjs).
export const ACCOUNT_DELETE_API_PATH = '/api/account/delete';

// Floating save bubble timing (ms). The exit is deliberately slower than the entrance.
export const SAVE_SUCCESS_VISIBLE_MS = 2500; // how long the green "All changes saved" stays up
export const SAVE_BUBBLE_ENTER_MS = 280;
export const SAVE_BUBBLE_EXIT_MS = 700;
