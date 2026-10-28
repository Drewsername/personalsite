import { buildSDFPixels } from './sdf.js';

self.onmessage = ({ data: { id, masks, width, height, spread } }) => {
  const fields = masks.map((mask) => buildSDFPixels(mask, width, height, spread));
  self.postMessage({ id, fields, width, height }, fields.map((field) => field.buffer));
};
