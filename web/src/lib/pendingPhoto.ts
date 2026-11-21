/** Hands a just-taken photo from one screen to the next without uploading it first (e.g. 📷 → "it's a receipt" → receipt reader). In memory only. */
let pending: File | null = null;
export function setPendingPhoto(f: File | null) { pending = f; }
export function takePendingPhoto(): File | null { const f = pending; pending = null; return f; }
