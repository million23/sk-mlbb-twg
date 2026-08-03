import {
	PORTRAIT_ENC_B64,
	PORTRAIT_XOR_KEY,
} from "@/components/landing/gerald-portrait.enc";

let bitmapPromise: Promise<ImageBitmap> | null = null;

function decodePortraitBytes(): Uint8Array {
	const bin = atob(PORTRAIT_ENC_B64);
	const out = new Uint8Array(bin.length);
	for (let i = 0; i < bin.length; i++) {
		out[i] = bin.charCodeAt(i) ^ PORTRAIT_XOR_KEY;
	}
	return out;
}

/** Decode once; never expose a lasting object URL or <img src>. */
export function loadGeraldPortraitBitmap(): Promise<ImageBitmap> {
	if (!bitmapPromise) {
		bitmapPromise = (async () => {
			const bytes = decodePortraitBytes();
			const blob = new Blob([bytes.buffer as ArrayBuffer], {
				type: "image/png",
			});
			return createImageBitmap(blob);
		})();
	}
	return bitmapPromise;
}

export function paintCover(
	canvas: HTMLCanvasElement,
	bmp: ImageBitmap,
): void {
	const dpr = Math.min(window.devicePixelRatio || 1, 2);
	const cssW = canvas.clientWidth || canvas.offsetWidth || 480;
	const cssH = canvas.clientHeight || canvas.offsetHeight || 480;
	const w = Math.max(1, Math.round(cssW * dpr));
	const h = Math.max(1, Math.round(cssH * dpr));
	if (canvas.width !== w || canvas.height !== h) {
		canvas.width = w;
		canvas.height = h;
	}
	const ctx = canvas.getContext("2d", { alpha: false });
	if (!ctx) return;

	const scale = Math.max(w / bmp.width, h / bmp.height);
	const dw = bmp.width * scale;
	const dh = bmp.height * scale;
	const dx = (w - dw) / 2;
	const dy = (h - dh) / 2;
	ctx.clearRect(0, 0, w, h);
	ctx.drawImage(bmp, dx, dy, dw, dh);
}

/** Scrub pixel buffer so DevTools canvas preview is blank when idle. */
export function wipeCanvas(canvas: HTMLCanvasElement): void {
	const ctx = canvas.getContext("2d", { alpha: false });
	if (!ctx) return;
	ctx.fillStyle = "#000";
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	canvas.width = 1;
	canvas.height = 1;
}
