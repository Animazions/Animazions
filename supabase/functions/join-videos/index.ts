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

// ─── MP4 helpers ─────────────────────────────────────────────────────────────

function r32(b: Uint8Array, o: number): number {
  return ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0;
}

function w32(b: Uint8Array, o: number, v: number): void {
  b[o] = (v >>> 24) & 0xff;
  b[o + 1] = (v >>> 16) & 0xff;
  b[o + 2] = (v >>> 8) & 0xff;
  b[o + 3] = v & 0xff;
}

function r64(b: Uint8Array, o: number): number {
  return r32(b, o) * 0x100000000 + r32(b, o + 4);
}

function name4(b: Uint8Array, o: number): string {
  return String.fromCharCode(b[o], b[o + 1], b[o + 2], b[o + 3]);
}

function bsize(b: Uint8Array, o: number): number {
  const s = r32(b, o);
  if (s === 1) return r64(b, o + 8);
  if (s === 0) return b.length - o;
  return s;
}

function bheader(b: Uint8Array, o: number): number {
  return r32(b, o) === 1 ? 16 : 8;
}

function concat(...arrs: Uint8Array[]): Uint8Array {
  const total = arrs.reduce((s, a) => s + a.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const a of arrs) { out.set(a, off); off += a.length; }
  return out;
}

function makeBox(tag: string, payload: Uint8Array): Uint8Array {
  const out = new Uint8Array(8 + payload.length);
  w32(out, 0, 8 + payload.length);
  out[4] = tag.charCodeAt(0); out[5] = tag.charCodeAt(1);
  out[6] = tag.charCodeAt(2); out[7] = tag.charCodeAt(3);
  out.set(payload, 8);
  return out;
}

interface MP4Box {
  tag: string;
  start: number;
  size: number;
  headerSize: number;
  payload: Uint8Array;
  raw: Uint8Array;
}

function parseBoxes(buf: Uint8Array): MP4Box[] {
  const result: MP4Box[] = [];
  let o = 0;
  while (o + 8 <= buf.length) {
    const size = bsize(buf, o);
    const hdr = bheader(buf, o);
    const tag = name4(buf, o + 4);
    if (size < 8 || o + size > buf.length) break;
    result.push({
      tag,
      start: o,
      size,
      headerSize: hdr,
      payload: buf.slice(o + hdr, o + size),
      raw: buf.slice(o, o + size),
    });
    o += size;
  }
  return result;
}

function findFirst(buf: Uint8Array, ...path: string[]): MP4Box | null {
  let boxes = parseBoxes(buf);
  let found: MP4Box | null = null;
  for (let i = 0; i < path.length; i++) {
    found = boxes.find(b => b.tag === path[i]) ?? null;
    if (!found) return null;
    if (i < path.length - 1) boxes = parseBoxes(found.payload);
  }
  return found;
}

// ─── Track parsing ────────────────────────────────────────────────────────────

function getMvhdTimescale(moovPayload: Uint8Array): number {
  const mvhd = findFirst(moovPayload, "mvhd");
  if (!mvhd) return 1000;
  const v = mvhd.payload[0];
  return v === 1 ? r32(mvhd.payload, 20) : r32(mvhd.payload, 12);
}

function getMvhdDuration(moovPayload: Uint8Array): number {
  const mvhd = findFirst(moovPayload, "mvhd");
  if (!mvhd) return 0;
  const v = mvhd.payload[0];
  return v === 1 ? r64(mvhd.payload, 24) : r32(mvhd.payload, 16);
}

function getMdhdInfo(trakPayload: Uint8Array): { timescale: number; duration: number } {
  const mdhd = findFirst(trakPayload, "mdia", "mdhd");
  if (!mdhd) return { timescale: 1000, duration: 0 };
  const v = mdhd.payload[0];
  if (v === 1) return { timescale: r32(mdhd.payload, 20), duration: r64(mdhd.payload, 24) };
  return { timescale: r32(mdhd.payload, 12), duration: r32(mdhd.payload, 16) };
}

function getStts(trakPayload: Uint8Array): Array<{ count: number; delta: number }> {
  const stts = findFirst(trakPayload, "mdia", "minf", "stbl", "stts");
  if (!stts) return [];
  const n = r32(stts.payload, 4);
  const out = [];
  for (let i = 0; i < n; i++) out.push({ count: r32(stts.payload, 8 + i * 8), delta: r32(stts.payload, 12 + i * 8) });
  return out;
}

function getCtts(trakPayload: Uint8Array): Array<{ count: number; offset: number }> | null {
  const ctts = findFirst(trakPayload, "mdia", "minf", "stbl", "ctts");
  if (!ctts) return null;
  const n = r32(ctts.payload, 4);
  const out = [];
  for (let i = 0; i < n; i++) out.push({ count: r32(ctts.payload, 8 + i * 8), offset: r32(ctts.payload, 12 + i * 8) });
  return out;
}

function getStsz(trakPayload: Uint8Array): number[] {
  const stsz = findFirst(trakPayload, "mdia", "minf", "stbl", "stsz");
  if (!stsz) return [];
  const def = r32(stsz.payload, 4);
  const n = r32(stsz.payload, 8);
  if (def !== 0) return new Array(n).fill(def);
  const out = [];
  for (let i = 0; i < n; i++) out.push(r32(stsz.payload, 12 + i * 4));
  return out;
}

function getStsc(trakPayload: Uint8Array): Array<{ first: number; spc: number; desc: number }> {
  const stsc = findFirst(trakPayload, "mdia", "minf", "stbl", "stsc");
  if (!stsc) return [];
  const n = r32(stsc.payload, 4);
  const out = [];
  for (let i = 0; i < n; i++) out.push({ first: r32(stsc.payload, 8 + i * 12), spc: r32(stsc.payload, 12 + i * 12), desc: r32(stsc.payload, 16 + i * 12) });
  return out;
}

function getStco(trakPayload: Uint8Array): number[] {
  const stco = findFirst(trakPayload, "mdia", "minf", "stbl", "stco");
  if (stco) {
    const n = r32(stco.payload, 4);
    const out = [];
    for (let i = 0; i < n; i++) out.push(r32(stco.payload, 8 + i * 4));
    return out;
  }
  const co64 = findFirst(trakPayload, "mdia", "minf", "stbl", "co64");
  if (co64) {
    const n = r32(co64.payload, 4);
    const out = [];
    for (let i = 0; i < n; i++) out.push(r64(co64.payload, 8 + i * 8));
    return out;
  }
  return [];
}

function sttsTotal(entries: Array<{ count: number; delta: number }>): number {
  return entries.reduce((s, e) => s + e.count * e.delta, 0);
}

// ─── Box builders ─────────────────────────────────────────────────────────────

function buildStts(entries: Array<{ count: number; delta: number }>): Uint8Array {
  const p = new Uint8Array(8 + entries.length * 8);
  w32(p, 4, entries.length);
  for (let i = 0; i < entries.length; i++) { w32(p, 8 + i * 8, entries[i].count); w32(p, 12 + i * 8, entries[i].delta); }
  return makeBox("stts", p);
}

function buildCtts(entries: Array<{ count: number; offset: number }>): Uint8Array {
  const p = new Uint8Array(8 + entries.length * 8);
  w32(p, 4, entries.length);
  for (let i = 0; i < entries.length; i++) { w32(p, 8 + i * 8, entries[i].count); w32(p, 12 + i * 8, entries[i].offset); }
  return makeBox("ctts", p);
}

function buildStsz(sizes: number[]): Uint8Array {
  const p = new Uint8Array(12 + sizes.length * 4);
  w32(p, 8, sizes.length);
  for (let i = 0; i < sizes.length; i++) w32(p, 12 + i * 4, sizes[i]);
  return makeBox("stsz", p);
}

function buildStsc(entries: Array<{ first: number; spc: number; desc: number }>): Uint8Array {
  const p = new Uint8Array(8 + entries.length * 12);
  w32(p, 4, entries.length);
  for (let i = 0; i < entries.length; i++) { w32(p, 8 + i * 12, entries[i].first); w32(p, 12 + i * 12, entries[i].spc); w32(p, 16 + i * 12, entries[i].desc); }
  return makeBox("stsc", p);
}

function buildStco(offsets: number[]): Uint8Array {
  const p = new Uint8Array(8 + offsets.length * 4);
  w32(p, 4, offsets.length);
  for (let i = 0; i < offsets.length; i++) w32(p, 8 + i * 4, offsets[i]);
  return makeBox("stco", p);
}

function buildMdhd(timescale: number, duration: number): Uint8Array {
  const p = new Uint8Array(24);
  w32(p, 12, timescale);
  w32(p, 16, duration >>> 0);
  w32(p, 20, 0x55c40000);
  return makeBox("mdhd", p);
}

function rebuildMvhd(original: Uint8Array, duration: number): Uint8Array {
  const out = new Uint8Array(original);
  const v = out[8];
  if (v === 1) { w32(out, 8 + 24, 0); w32(out, 8 + 28, duration >>> 0); }
  else w32(out, 8 + 16, duration >>> 0);
  return out;
}

function rebuildTkhd(original: Uint8Array, duration: number): Uint8Array {
  const out = new Uint8Array(original);
  const v = out[8];
  if (v === 1) { w32(out, 8 + 28, 0); w32(out, 8 + 32, duration >>> 0); }
  else w32(out, 8 + 20, duration >>> 0);
  return out;
}

// ─── Trak rebuilder ───────────────────────────────────────────────────────────

function rebuildTrak(
  origTrakPayload: Uint8Array,
  newStts: Uint8Array,
  newCtts: Uint8Array | null,
  newStsz: Uint8Array,
  newStsc: Uint8Array,
  newStco: Uint8Array,
  newMdhdTimescale: number,
  newMdhdDuration: number,
  newTkhdDuration: number
): Uint8Array {
  const trakBoxes = parseBoxes(origTrakPayload);

  const tkhdBox = trakBoxes.find(b => b.tag === "tkhd");
  const mdiaBox = trakBoxes.find(b => b.tag === "mdia");
  if (!mdiaBox) throw new Error("No mdia in trak");

  const mdiaBoxes = parseBoxes(mdiaBox.payload);
  const hdlrBox = mdiaBoxes.find(b => b.tag === "hdlr");
  const minfBox = mdiaBoxes.find(b => b.tag === "minf");
  if (!minfBox) throw new Error("No minf in mdia");

  const minfBoxes = parseBoxes(minfBox.payload);
  const stblBox = minfBoxes.find(b => b.tag === "stbl");
  if (!stblBox) throw new Error("No stbl in minf");

  const stblBoxes = parseBoxes(stblBox.payload);
  const stsdBox = stblBoxes.find(b => b.tag === "stsd");
  const stssBox = stblBoxes.find(b => b.tag === "stss");

  const newStblChildren: Uint8Array[] = [newStts];
  if (newCtts) newStblChildren.push(newCtts);
  if (stsdBox) newStblChildren.push(stsdBox.raw);
  if (stssBox) newStblChildren.push(stssBox.raw);
  newStblChildren.push(newStsz, newStsc, newStco);
  const newStbl = makeBox("stbl", concat(...newStblChildren));

  const newMinfChildren: Uint8Array[] = [];
  for (const b of minfBoxes) {
    if (b.tag === "stbl") newMinfChildren.push(newStbl);
    else newMinfChildren.push(b.raw);
  }
  const newMinf = makeBox("minf", concat(...newMinfChildren));

  const newMdhd = buildMdhd(newMdhdTimescale, newMdhdDuration);

  const newMdiaChildren: Uint8Array[] = [newMdhd];
  if (hdlrBox) newMdiaChildren.push(hdlrBox.raw);
  newMdiaChildren.push(newMinf);
  const newMdia = makeBox("mdia", concat(...newMdiaChildren));

  const newTkhdRaw = tkhdBox ? rebuildTkhd(tkhdBox.raw, newTkhdDuration) : null;

  const trakChildren: Uint8Array[] = [];
  if (newTkhdRaw) trakChildren.push(newTkhdRaw);
  trakChildren.push(newMdia);
  return makeBox("trak", concat(...trakChildren));
}

// ─── Main merge ───────────────────────────────────────────────────────────────

function mergeMP4s(inputs: Uint8Array[]): Uint8Array {
  interface ClipInfo {
    buf: Uint8Array;
    moovPayload: Uint8Array;
    moovRaw: Uint8Array;
    mdatStart: number;
    mdatPayload: Uint8Array;
    trakPayloads: Uint8Array[];
    movieTimescale: number;
  }

  const clips: ClipInfo[] = inputs.map(buf => {
    const top = parseBoxes(buf);
    const moovBox = top.find(b => b.tag === "moov");
    if (!moovBox) throw new Error("No moov box in clip");
    const mdatBox = top.find(b => b.tag === "mdat");
    if (!mdatBox) throw new Error("No mdat box in clip");

    const moovBoxes = parseBoxes(moovBox.payload);
    const trakPayloads = moovBoxes.filter(b => b.tag === "trak").map(b => b.payload);

    return {
      buf,
      moovPayload: moovBox.payload,
      moovRaw: moovBox.raw,
      mdatStart: mdatBox.start,
      mdatPayload: mdatBox.payload,
      trakPayloads,
      movieTimescale: getMvhdTimescale(moovBox.payload),
    };
  });

  const clip0 = clips[0];
  const movieTimescale = clip0.movieTimescale;
  const numTracks = clip0.trakPayloads.length;

  interface TrackAccum {
    sttsEntries: Array<{ count: number; delta: number }>;
    cttsEntries: Array<{ count: number; offset: number }> | null;
    stszSizes: number[];
    stscEntries: Array<{ first: number; spc: number; desc: number }>;
    chunkOffsets: number[];
    totalMediaDuration: number;
    timescale: number;
  }

  const accums: TrackAccum[] = clip0.trakPayloads.map(tp => {
    const { timescale } = getMdhdInfo(tp);
    return {
      sttsEntries: [],
      cttsEntries: getCtts(tp) !== null ? [] : null,
      stszSizes: [],
      stscEntries: [],
      chunkOffsets: [],
      totalMediaDuration: 0,
      timescale,
    };
  });

  const allMdatPayloads: Uint8Array[] = [];
  let mdatWriteOffset = 0;

  for (const clip of clips) {
    const mdatPayloadOffset = clip.mdatStart + 8;

    for (let ti = 0; ti < numTracks && ti < clip.trakPayloads.length; ti++) {
      const tp = clip.trakPayloads[ti];
      const acc = accums[ti];

      const sttsEntries = getStts(tp);
      for (const e of sttsEntries) {
        const last = acc.sttsEntries[acc.sttsEntries.length - 1];
        if (last && last.delta === e.delta) last.count += e.count;
        else acc.sttsEntries.push({ ...e });
      }

      const cttsEntries = getCtts(tp);
      if (acc.cttsEntries !== null && cttsEntries !== null) {
        acc.cttsEntries.push(...cttsEntries);
      }

      acc.stszSizes.push(...getStsz(tp));

      const stcoOffsets = getStco(tp);
      const chunkBase = acc.chunkOffsets.length;

      for (const origOffset of stcoOffsets) {
        const relOffset = origOffset - mdatPayloadOffset;
        acc.chunkOffsets.push(mdatWriteOffset + relOffset);
      }

      const stscEntries = getStsc(tp);
      for (const e of stscEntries) {
        acc.stscEntries.push({ first: e.first + chunkBase, spc: e.spc, desc: e.desc });
      }

      acc.totalMediaDuration += sttsTotal(sttsEntries);
    }

    allMdatPayloads.push(clip.mdatPayload);
    mdatWriteOffset += clip.mdatPayload.length;
  }

  const ftypBox = parseBoxes(clip0.buf).find(b => b.tag === "ftyp");

  let estimatedMoovSize = 0;
  {
    const tempTraks: Uint8Array[] = clip0.trakPayloads.map((tp, ti) => {
      const acc = accums[ti];
      return rebuildTrak(tp,
        buildStts([{ count: 1, delta: 1 }]), null,
        buildStsz([]), buildStsc([]), buildStco([]),
        acc.timescale, 0, 0);
    });
    const mvhdBox = findFirst(clip0.moovPayload, "mvhd");
    const tempMoov = makeBox("moov", concat(mvhdBox!.raw, ...tempTraks));
    estimatedMoovSize = tempMoov.length + 512;
  }

  const ftypSize = ftypBox ? ftypBox.size : 0;
  const mdatDataOffset = ftypSize + estimatedMoovSize + 8;
  const offsetDelta = mdatDataOffset - (ftypSize + estimatedMoovSize + 8);

  const newTraks: Uint8Array[] = [];
  let totalMovieDuration = 0;

  for (let ti = 0; ti < numTracks; ti++) {
    const acc = accums[ti];
    const tp = clip0.trakPayloads[ti];

    const adjustedOffsets = acc.chunkOffsets.map(o => o + mdatDataOffset);

    const newTrak = rebuildTrak(
      tp,
      buildStts(acc.sttsEntries),
      acc.cttsEntries ? buildCtts(acc.cttsEntries) : null,
      buildStsz(acc.stszSizes),
      buildStsc(acc.stscEntries),
      buildStco(adjustedOffsets),
      acc.timescale,
      acc.totalMediaDuration,
      Math.round((acc.totalMediaDuration / acc.timescale) * movieTimescale)
    );
    newTraks.push(newTrak);

    const dur = Math.round((acc.totalMediaDuration / acc.timescale) * movieTimescale);
    if (dur > totalMovieDuration) totalMovieDuration = dur;
  }

  const mvhdBox = findFirst(clip0.moovPayload, "mvhd");
  if (!mvhdBox) throw new Error("No mvhd in moov");
  const newMvhd = rebuildMvhd(mvhdBox.raw, totalMovieDuration);

  const moovBoxes = parseBoxes(clip0.moovPayload);
  const extraMoovBoxes = moovBoxes.filter(b => b.tag !== "mvhd" && b.tag !== "trak");

  const moovChildren: Uint8Array[] = [newMvhd, ...newTraks, ...extraMoovBoxes.map(b => b.raw)];
  const newMoov = makeBox("moov", concat(...moovChildren));

  const actualMdatDataOffset = ftypSize + newMoov.length + 8;

  if (actualMdatDataOffset !== mdatDataOffset) {
    const diff = actualMdatDataOffset - mdatDataOffset;
    const fixedTraks: Uint8Array[] = [];
    for (let ti = 0; ti < numTracks; ti++) {
      const acc = accums[ti];
      const tp = clip0.trakPayloads[ti];
      const adjustedOffsets = acc.chunkOffsets.map(o => o + actualMdatDataOffset);
      const newTrak = rebuildTrak(
        tp,
        buildStts(acc.sttsEntries),
        acc.cttsEntries ? buildCtts(acc.cttsEntries) : null,
        buildStsz(acc.stszSizes),
        buildStsc(acc.stscEntries),
        buildStco(adjustedOffsets),
        acc.timescale,
        acc.totalMediaDuration,
        Math.round((acc.totalMediaDuration / acc.timescale) * movieTimescale)
      );
      fixedTraks.push(newTrak);
    }
    const fixedMoovChildren: Uint8Array[] = [newMvhd, ...fixedTraks, ...extraMoovBoxes.map(b => b.raw)];
    const fixedMoov = makeBox("moov", concat(...fixedMoovChildren));

    const allMdat = concat(...allMdatPayloads);
    const mdatHeader = new Uint8Array(8);
    w32(mdatHeader, 0, allMdat.length + 8);
    mdatHeader[4] = 109; mdatHeader[5] = 100; mdatHeader[6] = 97; mdatHeader[7] = 116;

    const parts: Uint8Array[] = [];
    if (ftypBox) parts.push(ftypBox.raw);
    parts.push(fixedMoov, mdatHeader, allMdat);
    return concat(...parts);
  }

  const allMdat = concat(...allMdatPayloads);
  const mdatHeader = new Uint8Array(8);
  w32(mdatHeader, 0, allMdat.length + 8);
  mdatHeader[4] = 109; mdatHeader[5] = 100; mdatHeader[6] = 97; mdatHeader[7] = 116;

  const parts: Uint8Array[] = [];
  if (ftypBox) parts.push(ftypBox.raw);
  parts.push(newMoov, mdatHeader, allMdat);
  return concat(...parts);
}
