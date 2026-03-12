import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { videoUrls = [] } = body as { videoUrls: string[] };

    if (!videoUrls || videoUrls.length === 0) {
      return new Response(
        JSON.stringify({ error: "No video URLs provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const buffers: Uint8Array[] = [];

    for (let i = 0; i < videoUrls.length; i++) {
      const url = videoUrls[i];
      const pathMatch = url.match(/\/storage\/v1\/object\/(?:sign|public)\/generated-videos\/(.+?)(?:\?|$)/);

      if (pathMatch) {
        const filePath = decodeURIComponent(pathMatch[1]);
        const { data, error } = await supabase.storage
          .from("generated-videos")
          .download(filePath);
        if (error) throw new Error(`Failed to download clip ${i + 1}: ${error.message}`);
        buffers.push(new Uint8Array(await data.arrayBuffer()));
      } else {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to fetch clip ${i + 1}: ${res.status} ${res.statusText}`);
        buffers.push(new Uint8Array(await res.arrayBuffer()));
      }
    }

    if (buffers.length === 1) {
      return new Response(buffers[0], {
        headers: { ...corsHeaders, "Content-Type": "video/mp4" },
      });
    }

    const joined = mergeMP4s(buffers);

    return new Response(joined, {
      headers: { ...corsHeaders, "Content-Type": "video/mp4" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Video joining error:", msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function readUint32BE(buf: Uint8Array, offset: number): number {
  return ((buf[offset] << 24) | (buf[offset + 1] << 16) | (buf[offset + 2] << 8) | buf[offset + 3]) >>> 0;
}

function writeUint32BE(buf: Uint8Array, offset: number, value: number): void {
  buf[offset] = (value >>> 24) & 0xff;
  buf[offset + 1] = (value >>> 16) & 0xff;
  buf[offset + 2] = (value >>> 8) & 0xff;
  buf[offset + 3] = value & 0xff;
}

function readUint64BE(buf: Uint8Array, offset: number): number {
  const hi = readUint32BE(buf, offset);
  const lo = readUint32BE(buf, offset + 4);
  return hi * 0x100000000 + lo;
}

function boxName(buf: Uint8Array, offset: number): string {
  return String.fromCharCode(buf[offset + 4], buf[offset + 5], buf[offset + 6], buf[offset + 7]);
}

function boxSize(buf: Uint8Array, offset: number): number {
  const s = readUint32BE(buf, offset);
  if (s === 1) return readUint64BE(buf, offset + 8);
  if (s === 0) return buf.length - offset;
  return s;
}

interface Box {
  name: string;
  start: number;
  size: number;
  data: Uint8Array;
}

function parseTopLevelBoxes(buf: Uint8Array): Box[] {
  const boxes: Box[] = [];
  let offset = 0;
  while (offset < buf.length) {
    if (offset + 8 > buf.length) break;
    const name = boxName(buf, offset);
    const size = boxSize(buf, offset);
    if (size < 8 || offset + size > buf.length) break;
    boxes.push({ name, start: offset, size, data: buf.slice(offset, offset + size) });
    offset += size;
  }
  return boxes;
}

function findBox(buf: Uint8Array, ...path: string[]): Uint8Array | null {
  let current = buf;
  for (const name of path) {
    let found = false;
    let offset = 0;
    while (offset + 8 <= current.length) {
      const bName = boxName(current, offset);
      const bSize = boxSize(current, offset);
      if (bSize < 8 || offset + bSize > current.length) break;
      if (bName === name) {
        const headerSize = readUint32BE(current, offset) === 1 ? 16 : 8;
        current = current.slice(offset + headerSize, offset + bSize);
        found = true;
        break;
      }
      offset += bSize;
    }
    if (!found) return null;
  }
  return current;
}

function findBoxRaw(buf: Uint8Array, name: string): Uint8Array | null {
  let offset = 0;
  while (offset + 8 <= buf.length) {
    const bName = boxName(buf, offset);
    const bSize = boxSize(buf, offset);
    if (bSize < 8 || offset + bSize > buf.length) break;
    if (bName === name) return buf.slice(offset, offset + bSize);
    offset += bSize;
  }
  return null;
}

function getMvhdTimescale(moov: Uint8Array): number {
  const mvhd = findBox(moov, "mvhd");
  if (!mvhd) return 1000;
  const version = mvhd[0];
  return version === 1 ? readUint32BE(mvhd, 20) : readUint32BE(mvhd, 12);
}

function getMvhdDuration(moov: Uint8Array): number {
  const mvhd = findBox(moov, "mvhd");
  if (!mvhd) return 0;
  const version = mvhd[0];
  if (version === 1) {
    return readUint32BE(mvhd, 24) * 0x100000000 + readUint32BE(mvhd, 28);
  }
  return readUint32BE(mvhd, 16);
}

function getMdhdTimescaleAndDuration(trak: Uint8Array): { timescale: number; duration: number } {
  const mdhd = findBox(trak, "mdia", "mdhd");
  if (!mdhd) return { timescale: 1000, duration: 0 };
  const version = mdhd[0];
  if (version === 1) {
    return { timescale: readUint32BE(mdhd, 20), duration: readUint32BE(mdhd, 24) * 0x100000000 + readUint32BE(mdhd, 28) };
  }
  return { timescale: readUint32BE(mdhd, 12), duration: readUint32BE(mdhd, 16) };
}

function getTrackType(trak: Uint8Array): string {
  const hdlr = findBox(trak, "mdia", "hdlr");
  if (!hdlr || hdlr.length < 12) return "unknown";
  return String.fromCharCode(hdlr[8], hdlr[9], hdlr[10], hdlr[11]);
}

function cloneWithUint32(src: Uint8Array, offset: number, value: number): Uint8Array {
  const out = new Uint8Array(src);
  writeUint32BE(out, offset, value);
  return out;
}

function uint32ToBytes(v: number): Uint8Array {
  const b = new Uint8Array(4);
  writeUint32BE(b, 0, v);
  return b;
}

function concat(...arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((s, a) => s + a.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const a of arrays) { out.set(a, offset); offset += a.length; }
  return out;
}

function makeBox(name: string, ...children: Uint8Array[]): Uint8Array {
  const payload = concat(...children);
  const size = 8 + payload.length;
  const out = new Uint8Array(size);
  writeUint32BE(out, 0, size);
  out[4] = name.charCodeAt(0); out[5] = name.charCodeAt(1);
  out[6] = name.charCodeAt(2); out[7] = name.charCodeAt(3);
  out.set(payload, 8);
  return out;
}

function patchTkhdDuration(tkhd: Uint8Array, durationInMovieTimescale: number): Uint8Array {
  const out = new Uint8Array(tkhd);
  const version = out[8];
  if (version === 1) {
    writeUint32BE(out, 8 + 28, Math.floor(durationInMovieTimescale / 0x100000000));
    writeUint32BE(out, 8 + 32, durationInMovieTimescale >>> 0);
  } else {
    writeUint32BE(out, 8 + 20, durationInMovieTimescale >>> 0);
  }
  return out;
}

function patchMvhdDuration(mvhd: Uint8Array, duration: number): Uint8Array {
  const out = new Uint8Array(mvhd);
  const version = out[8];
  if (version === 1) {
    writeUint32BE(out, 8 + 24, Math.floor(duration / 0x100000000));
    writeUint32BE(out, 8 + 28, duration >>> 0);
  } else {
    writeUint32BE(out, 8 + 16, duration >>> 0);
  }
  return out;
}

function getSttsEntries(trak: Uint8Array): Array<{ count: number; delta: number }> {
  const stts = findBox(trak, "mdia", "minf", "stbl", "stts");
  if (!stts) return [];
  const entryCount = readUint32BE(stts, 4);
  const entries = [];
  for (let i = 0; i < entryCount; i++) {
    entries.push({ count: readUint32BE(stts, 8 + i * 8), delta: readUint32BE(stts, 12 + i * 8) });
  }
  return entries;
}

function totalSamplesFromStts(entries: Array<{ count: number; delta: number }>): number {
  return entries.reduce((s, e) => s + e.count, 0);
}

function totalDurationFromStts(entries: Array<{ count: number; delta: number }>): number {
  return entries.reduce((s, e) => s + e.count * e.delta, 0);
}

function getCttsEntries(trak: Uint8Array): Array<{ count: number; offset: number }> | null {
  const ctts = findBox(trak, "mdia", "minf", "stbl", "ctts");
  if (!ctts) return null;
  const entryCount = readUint32BE(ctts, 4);
  const entries = [];
  for (let i = 0; i < entryCount; i++) {
    entries.push({ count: readUint32BE(ctts, 8 + i * 8), offset: readUint32BE(ctts, 12 + i * 8) });
  }
  return entries;
}

function getStszSamples(trak: Uint8Array): number[] {
  const stsz = findBox(trak, "mdia", "minf", "stbl", "stsz");
  if (!stsz) return [];
  const defaultSize = readUint32BE(stsz, 4);
  const count = readUint32BE(stsz, 8);
  if (defaultSize !== 0) return new Array(count).fill(defaultSize);
  const sizes = [];
  for (let i = 0; i < count; i++) sizes.push(readUint32BE(stsz, 12 + i * 4));
  return sizes;
}

function getStscEntries(trak: Uint8Array): Array<{ firstChunk: number; samplesPerChunk: number; descIndex: number }> {
  const stsc = findBox(trak, "mdia", "minf", "stbl", "stsc");
  if (!stsc) return [];
  const count = readUint32BE(stsc, 4);
  const entries = [];
  for (let i = 0; i < count; i++) {
    entries.push({
      firstChunk: readUint32BE(stsc, 8 + i * 12),
      samplesPerChunk: readUint32BE(stsc, 12 + i * 12),
      descIndex: readUint32BE(stsc, 16 + i * 12),
    });
  }
  return entries;
}

function getStcoOffsets(trak: Uint8Array): number[] {
  const stco = findBox(trak, "mdia", "minf", "stbl", "stco");
  if (stco) {
    const count = readUint32BE(stco, 4);
    const offsets = [];
    for (let i = 0; i < count; i++) offsets.push(readUint32BE(stco, 8 + i * 4));
    return offsets;
  }
  const co64 = findBox(trak, "mdia", "minf", "stbl", "co64");
  if (co64) {
    const count = readUint32BE(co64, 4);
    const offsets = [];
    for (let i = 0; i < count; i++) offsets.push(readUint64BE(co64, 8 + i * 8));
    return offsets;
  }
  return [];
}

function buildStts(entries: Array<{ count: number; delta: number }>): Uint8Array {
  const out = new Uint8Array(8 + entries.length * 8);
  writeUint32BE(out, 0, 0);
  writeUint32BE(out, 4, entries.length);
  for (let i = 0; i < entries.length; i++) {
    writeUint32BE(out, 8 + i * 8, entries[i].count);
    writeUint32BE(out, 12 + i * 8, entries[i].delta);
  }
  return makeBox("stts", out);
}

function buildCtts(entries: Array<{ count: number; offset: number }>): Uint8Array {
  const out = new Uint8Array(8 + entries.length * 8);
  writeUint32BE(out, 0, 0);
  writeUint32BE(out, 4, entries.length);
  for (let i = 0; i < entries.length; i++) {
    writeUint32BE(out, 8 + i * 8, entries[i].count);
    writeUint32BE(out, 12 + i * 8, entries[i].offset);
  }
  return makeBox("ctts", out);
}

function buildStsz(sizes: number[]): Uint8Array {
  const out = new Uint8Array(12 + sizes.length * 4);
  writeUint32BE(out, 0, 0);
  writeUint32BE(out, 4, 0);
  writeUint32BE(out, 8, sizes.length);
  for (let i = 0; i < sizes.length; i++) writeUint32BE(out, 12 + i * 4, sizes[i]);
  return makeBox("stsz", out);
}

function buildStsc(entries: Array<{ firstChunk: number; samplesPerChunk: number; descIndex: number }>): Uint8Array {
  const out = new Uint8Array(8 + entries.length * 12);
  writeUint32BE(out, 0, 0);
  writeUint32BE(out, 4, entries.length);
  for (let i = 0; i < entries.length; i++) {
    writeUint32BE(out, 8 + i * 12, entries[i].firstChunk);
    writeUint32BE(out, 12 + i * 12, entries[i].samplesPerChunk);
    writeUint32BE(out, 16 + i * 12, entries[i].descIndex);
  }
  return makeBox("stsc", out);
}

function buildStco(offsets: number[]): Uint8Array {
  const out = new Uint8Array(8 + offsets.length * 4);
  writeUint32BE(out, 0, 0);
  writeUint32BE(out, 4, offsets.length);
  for (let i = 0; i < offsets.length; i++) writeUint32BE(out, 8 + i * 4, offsets[i]);
  return makeBox("stco", out);
}

function buildMdhd(timescale: number, duration: number): Uint8Array {
  const payload = new Uint8Array(24);
  writeUint32BE(payload, 0, 0);
  writeUint32BE(payload, 4, 0);
  writeUint32BE(payload, 8, 0);
  writeUint32BE(payload, 12, timescale);
  writeUint32BE(payload, 16, duration >>> 0);
  writeUint32BE(payload, 20, 0x55c40000);
  return makeBox("mdhd", payload);
}

interface TrackInfo {
  trak: Uint8Array;
  moovBuf: Uint8Array;
  mdatBuf: Uint8Array;
  moovStart: number;
  stszSizes: number[];
  stscEntries: Array<{ firstChunk: number; samplesPerChunk: number; descIndex: number }>;
  stcoOffsets: number[];
  sttsEntries: Array<{ count: number; delta: number }>;
  cttsEntries: Array<{ count: number; offset: number }> | null;
  mdatOffset: number;
  timescale: number;
  duration: number;
  movieTimescale: number;
  movieDuration: number;
  type: string;
}

function extractTrackInfo(buf: Uint8Array, trak: Uint8Array, moovBuf: Uint8Array, moovStart: number): TrackInfo {
  const boxes = parseTopLevelBoxes(buf);
  const mdatBox = boxes.find(b => b.name === "mdat");
  const mdatBuf = mdatBox ? mdatBox.data : new Uint8Array(0);
  const mdatOffset = mdatBox ? mdatBox.start : 0;

  const { timescale, duration } = getMdhdTimescaleAndDuration(trak);
  const movieTimescale = getMvhdTimescale(moovBuf);
  const movieDuration = getMvhdDuration(moovBuf);

  return {
    trak,
    moovBuf,
    mdatBuf,
    moovStart,
    stszSizes: getStszSamples(trak),
    stscEntries: getStscEntries(trak),
    stcoOffsets: getStcoOffsets(trak),
    sttsEntries: getSttsEntries(trak),
    cttsEntries: getCttsEntries(trak),
    mdatOffset,
    timescale,
    duration,
    movieTimescale,
    movieDuration,
    type: getTrackType(trak),
  };
}

function getTracks(buf: Uint8Array, moovBuf: Uint8Array, moovStart: number): TrackInfo[] {
  const tracks: TrackInfo[] = [];
  let offset = 0;
  while (offset + 8 <= moovBuf.length) {
    const name = boxName(moovBuf, offset);
    const size = boxSize(moovBuf, offset);
    if (size < 8 || offset + size > moovBuf.length) break;
    if (name === "trak") {
      const trakData = moovBuf.slice(offset, offset + size);
      tracks.push(extractTrackInfo(buf, trakData, moovBuf, moovStart));
    }
    offset += size;
  }
  return tracks;
}

function rebuildStbl(
  track: TrackInfo,
  newStcoOffsets: number[],
  mergedSttsEntries: Array<{ count: number; delta: number }>,
  mergedCttsEntries: Array<{ count: number; offset: number }> | null,
  mergedStszSizes: number[],
  mergedStscEntries: Array<{ firstChunk: number; samplesPerChunk: number; descIndex: number }>
): Uint8Array {
  const origStbl = findBox(track.trak, "mdia", "minf", "stbl");
  if (!origStbl) throw new Error("No stbl box");

  const stts = buildStts(mergedSttsEntries);
  const ctts = mergedCttsEntries ? buildCtts(mergedCttsEntries) : null;
  const stsz = buildStsz(mergedStszSizes);
  const stsc = buildStsc(mergedStscEntries);
  const stco = buildStco(newStcoOffsets);

  const stsd = findBoxRaw(origStbl, "stsd");
  const stss = findBoxRaw(origStbl, "stss");

  const children: Uint8Array[] = [stts];
  if (ctts) children.push(ctts);
  if (stsd) children.push(stsd);
  if (stss) children.push(stss);
  children.push(stsz, stsc, stco);

  return makeBox("stbl", ...children);
}

function rebuildTrak(
  origTrak: Uint8Array,
  newStbl: Uint8Array,
  newMdhdTimescale: number,
  newMdhdDuration: number,
  newTkhdDurationInMovieTs: number
): Uint8Array {
  const tkhd = findBoxRaw(origTrak.slice(8), "tkhd");
  const mdia = origTrak.slice(8 + (tkhd ? tkhd.length : 0));

  const mdiaContent = origTrak.slice(8);
  let mdiaBox: Uint8Array | null = null;
  let offset = 0;
  while (offset + 8 <= mdiaContent.length) {
    const name = boxName(mdiaContent, offset);
    const size = boxSize(mdiaContent, offset);
    if (name === "mdia") { mdiaBox = mdiaContent.slice(offset, offset + size); break; }
    offset += size;
  }
  if (!mdiaBox) throw new Error("No mdia box in trak");

  const mdhd = buildMdhd(newMdhdTimescale, newMdhdDuration);
  const hdlr = findBoxRaw(mdiaBox.slice(8), "hdlr");
  const minf = (() => {
    let o = 0;
    const mc = mdiaBox.slice(8);
    while (o + 8 <= mc.length) {
      const n = boxName(mc, o);
      const s = boxSize(mc, o);
      if (n === "minf") return mc.slice(o, o + s);
      o += s;
    }
    return null;
  })();
  if (!minf) throw new Error("No minf in mdia");

  const minfContent = minf.slice(8);
  const stblBox = (() => {
    let o = 0;
    while (o + 8 <= minfContent.length) {
      const n = boxName(minfContent, o);
      const s = boxSize(minfContent, o);
      if (n === "stbl") return minfContent.slice(o, o + s);
      o += s;
    }
    return null;
  })();
  if (!stblBox) throw new Error("No stbl in minf");

  const minfChildren: Uint8Array[] = [];
  let minfOffset = 0;
  while (minfOffset + 8 <= minfContent.length) {
    const n = boxName(minfContent, minfOffset);
    const s = boxSize(minfContent, minfOffset);
    if (n === "stbl") { minfChildren.push(newStbl); }
    else { minfChildren.push(minfContent.slice(minfOffset, minfOffset + s)); }
    minfOffset += s;
  }
  const newMinf = makeBox("minf", ...minfChildren);

  const newMdia = makeBox("mdia", mdhd, ...(hdlr ? [hdlr] : []), newMinf);

  const newTkhd = tkhd ? patchTkhdDuration(tkhd, newTkhdDurationInMovieTs) : null;
  const trakChildren: Uint8Array[] = [];
  if (newTkhd) trakChildren.push(newTkhd);
  trakChildren.push(newMdia);

  return makeBox("trak", ...trakChildren);
}

function mergeMP4s(inputs: Uint8Array[]): Uint8Array {
  interface ClipData {
    buf: Uint8Array;
    moovBuf: Uint8Array;
    moovStart: number;
    tracks: TrackInfo[];
  }

  const clips: ClipData[] = inputs.map(buf => {
    const boxes = parseTopLevelBoxes(buf);
    const moovBox = boxes.find(b => b.name === "moov");
    if (!moovBox) throw new Error("No moov box found in clip");
    const moovBuf = moovBox.data.slice(8);
    return { buf, moovBuf, moovStart: moovBox.start, tracks: getTracks(buf, moovBuf, moovBox.start) };
  });

  const clip0 = clips[0];
  const movieTimescale = getMvhdTimescale(clip0.moovBuf);

  const trackTypes = clip0.tracks.map(t => t.type);

  const mergedMdats: Uint8Array[] = [];
  let currentMdatOffset = 0;

  const mergedTrackData: Array<{
    sttsEntries: Array<{ count: number; delta: number }>;
    cttsEntries: Array<{ count: number; offset: number }> | null;
    stszSizes: number[];
    stscEntries: Array<{ firstChunk: number; samplesPerChunk: number; descIndex: number }>;
    chunkOffsets: number[];
    totalDuration: number;
    timescale: number;
    type: string;
  }> = trackTypes.map((type, ti) => ({
    sttsEntries: [],
    cttsEntries: clip0.tracks[ti].cttsEntries !== null ? [] : null,
    stszSizes: [],
    stscEntries: [],
    chunkOffsets: [],
    totalDuration: 0,
    timescale: clip0.tracks[ti].timescale,
    type,
  }));

  let moovSize = 0;
  const ftyp = parseTopLevelBoxes(clip0.buf).find(b => b.name === "ftyp");

  {
    const tempNewTraks: Uint8Array[] = clip0.tracks.map((t, ti) => {
      return rebuildTrak(t.trak, makeBox("stbl"), t.timescale, 0, 0);
    });
    const tempMvhd = patchMvhdDuration(findBoxRaw(clip0.moovBuf, "mvhd")!, 0);
    moovSize = makeBox("moov", tempMvhd, ...tempNewTraks).length;
  }

  const mdatDataStart = (ftyp ? ftyp.size : 0) + moovSize + 8;
  currentMdatOffset = mdatDataStart;

  for (const clip of clips) {
    const boxes = parseTopLevelBoxes(clip.buf);
    const mdatBox = boxes.find(b => b.name === "mdat");
    if (!mdatBox) throw new Error("No mdat box in clip");

    const mdatPayload = clip.buf.slice(mdatBox.start + 8, mdatBox.start + mdatBox.size);
    mergedMdats.push(mdatPayload);

    for (let ti = 0; ti < clip.tracks.length && ti < mergedTrackData.length; ti++) {
      const track = clip.tracks[ti];
      const merged = mergedTrackData[ti];

      const dtsDeltaInMediaTs = Math.round(merged.totalDuration);

      for (const entry of track.sttsEntries) {
        if (merged.sttsEntries.length > 0) {
          const last = merged.sttsEntries[merged.sttsEntries.length - 1];
          if (last.delta === entry.delta) { last.count += entry.count; continue; }
        }
        merged.sttsEntries.push({ ...entry });
      }

      if (merged.cttsEntries !== null && track.cttsEntries !== null) {
        for (const entry of track.cttsEntries) {
          merged.cttsEntries!.push({ ...entry });
        }
      }

      merged.stszSizes.push(...track.stszSizes);

      const stscEntries = track.stscEntries;
      const stcoOffsets = track.stcoOffsets;
      const currentChunkBase = merged.chunkOffsets.length;

      const numChunks = stcoOffsets.length;
      let sampleIdx = 0;
      const sizes = track.stszSizes;

      for (let ci = 0; ci < numChunks; ci++) {
        const origOffset = stcoOffsets[ci];
        const relativeOffset = origOffset - (mdatBox.start + 8);
        merged.chunkOffsets.push(currentMdatOffset + relativeOffset);
      }

      const adjustedStsc = stscEntries.map(e => ({
        firstChunk: e.firstChunk + currentChunkBase,
        samplesPerChunk: e.samplesPerChunk,
        descIndex: e.descIndex,
      }));
      merged.stscEntries.push(...adjustedStsc);

      merged.totalDuration += totalDurationFromStts(track.sttsEntries);
    }

    currentMdatOffset += mdatPayload.length;
  }

  let totalMovieDuration = 0;
  const newTraks: Uint8Array[] = [];

  for (let ti = 0; ti < mergedTrackData.length; ti++) {
    const merged = mergedTrackData[ti];
    const origTrack = clip0.tracks[ti];

    const newStbl = rebuildStbl(
      origTrack,
      merged.chunkOffsets,
      merged.sttsEntries,
      merged.cttsEntries,
      merged.stszSizes,
      merged.stscEntries
    );

    const durationInMovieTs = Math.round((merged.totalDuration / merged.timescale) * movieTimescale);
    if (durationInMovieTs > totalMovieDuration) totalMovieDuration = durationInMovieTs;

    const newTrak = rebuildTrak(
      origTrack.trak,
      newStbl,
      merged.timescale,
      merged.totalDuration,
      durationInMovieTs
    );
    newTraks.push(newTrak);
  }

  const origMvhd = findBoxRaw(clip0.moovBuf, "mvhd");
  if (!origMvhd) throw new Error("No mvhd found");
  const newMvhd = patchMvhdDuration(origMvhd, totalMovieDuration);

  const newMoov = makeBox("moov", newMvhd, ...newTraks);

  const allMdatPayload = concat(...mergedMdats);
  const mdatSizeBytes = new Uint8Array(4);
  writeUint32BE(mdatSizeBytes, 0, allMdatPayload.length + 8);
  const mdatHeader = concat(mdatSizeBytes, new TextEncoder().encode("mdat"));
  const newMdat = concat(mdatHeader, allMdatPayload);

  const parts: Uint8Array[] = [];
  if (ftyp) parts.push(ftyp.data);
  parts.push(newMoov);
  parts.push(newMdat);

  return concat(...parts);
}
