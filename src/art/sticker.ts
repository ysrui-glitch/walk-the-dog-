// The sticker look, drawn in code: flat fills with a dark ink outline, then a white die-cut border and a soft drop
// shadow from one SVG filter. Every piece of art is an SVG string rasterised into a texture at boot.
export const INK = '#2b2118';
// Textures are rasterised at this multiple of their display size so they stay crisp on phone screens.
export const RES = 2;
export const ART_SCALE = 1 / RES;

export interface Art {
  readonly svg: string;
  readonly w: number;
  readonly h: number;
}

export const paint = (fill: string, width = 2.4): string => `fill="${fill}" stroke="${INK}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round"`;
export const line = (color = INK, width = 2.4): string => `fill="none" stroke="${color}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round"`;
export const dot = (x: number, y: number, r: number, fill = INK): string => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`;

// `w` x `h` is the display size, centred on (0, 0); the drawing must leave ~5 units for the border and shadow.
export function sticker(w: number, h: number, body: string, border = 2.6): Art {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w * RES}" height="${h * RES}" viewBox="${-w / 2} ${-h / 2} ${w} ${h}">
<defs><filter id="s" x="-30%" y="-30%" width="160%" height="160%">
<feMorphology in="SourceAlpha" operator="dilate" radius="${border}" result="grow"/>
<feFlood flood-color="#ffffff"/><feComposite in2="grow" operator="in" result="white"/>
<feOffset in="grow" dy="2" result="drop"/><feFlood flood-color="#000000" flood-opacity="0.22"/><feComposite in2="drop" operator="in" result="shadow"/>
<feMerge><feMergeNode in="shadow"/><feMergeNode in="white"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter></defs><g filter="url(#s)">${body}</g></svg>`;
  return { svg, w, h };
}
