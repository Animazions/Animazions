import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface JoinVideosRequest {
  videoUrls: string[];
  outputName?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body: JoinVideosRequest = await req.json();
    const { videoUrls = [] } = body;

    if (!videoUrls || videoUrls.length === 0) {
      return new Response(
        JSON.stringify({ error: "No video URLs provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authHeader = req.headers.get("Authorization") || "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (videoUrls.length === 1) {
      const response = await fetch(videoUrls[0], {
        headers: { Authorization: authHeader },
      });
      if (!response.ok) throw new Error("Failed to fetch single video");
      const data = await response.arrayBuffer();
      return new Response(data, {
        headers: { ...corsHeaders, "Content-Type": "video/mp4" },
      });
    }

    const buffers: ArrayBuffer[] = [];
    for (let i = 0; i < videoUrls.length; i++) {
      const url = videoUrls[i];
      let fetchUrl = url;

      if (url.includes("/storage/v1/object/sign/") || url.includes("/storage/v1/object/public/")) {
        const pathMatch = url.match(/\/storage\/v1\/object\/(?:sign|public)\/generated-videos\/(.+?)(?:\?|$)/);
        if (pathMatch) {
          const filePath = decodeURIComponent(pathMatch[1]);
          const { data, error } = await supabase.storage
            .from("generated-videos")
            .download(filePath);
          if (error) throw new Error(`Failed to download clip ${i + 1}: ${error.message}`);
          buffers.push(await data.arrayBuffer());
          continue;
        }
      }

      const res = await fetch(fetchUrl);
      if (!res.ok) throw new Error(`Failed to fetch clip ${i + 1}: ${res.status}`);
      buffers.push(await res.arrayBuffer());
    }

    const joined = joinMp4Buffers(buffers);

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

function readUint32(buf: Uint8Array, offset: number): number {
  return ((buf[offset] << 24) | (buf[offset + 1] << 16) | (buf[offset + 2] << 8) | buf[offset + 3]) >>> 0;
}

function writeUint32(buf: Uint8Array, offset: number, value: number) {
  buf[offset] = (value >>> 24) & 0xff;
  buf[offset + 1] = (value >>> 16) & 0xff;
  buf[offset + 2] = (value >>> 8) & 0xff;
  buf[offset + 3] = value & 0xff;
}

function boxName(buf: Uint8Array, offset: number): string {
  return String.fromCharCode(buf[offset + 4], buf[offset + 5], buf[offset + 6], buf[offset + 7]);
}

interface Mp4Box {
  name: string;
  offset: number;
  size: number;
  data: Uint8Array;
}

function parseBoxes(buf: Uint8Array): Mp4Box[] {
  const boxes: Mp4Box[] = [];
  let offset = 0;
  while (offset + 8 <= buf.length) {
    const size = readUint32(buf, offset);
    if (size < 8 || offset + size > buf.length) break;
    const name = boxName(buf, offset);
    boxes.push({ name, offset, size, data: buf.slice(offset, offset + size) });
    offset += size;
  }
  return boxes;
}

function joinMp4Buffers(buffers: ArrayBuffer[]): ArrayBuffer {
  if (buffers.length === 1) return buffers[0];

  const arrays = buffers.map(b => new Uint8Array(b));
  const parsed = arrays.map(parseBoxes);

  const firstBoxes = parsed[0];
  const ftypBox = firstBoxes.find(b => b.name === "ftyp");
  const moovBox = firstBoxes.find(b => b.name === "moov");

  if (!moovBox) {
    const total = arrays.reduce((s, a) => s + a.length, 0);
    const out = new Uint8Array(total);
    let off = 0;
    for (const a of arrays) { out.set(a, off); off += a.length; }
    return out.buffer;
  }

  const mdatChunks: Uint8Array[] = [];
  let totalMdatSize = 0;
  for (const boxes of parsed) {
    for (const box of boxes) {
      if (box.name === "mdat") {
        mdatChunks.push(box.data);
        totalMdatSize += box.data.length;
      }
    }
  }

  const moovSize = moovBox.size;
  const ftypSize = ftypBox ? ftypBox.size : 0;
  const totalSize = ftypSize + moovSize + totalMdatSize;
  const output = new Uint8Array(totalSize);
  let writeOffset = 0;

  if (ftypBox) {
    output.set(ftypBox.data, writeOffset);
    writeOffset += ftypBox.size;
  }

  output.set(moovBox.data, writeOffset);
  writeOffset += moovBox.size;

  for (const chunk of mdatChunks) {
    output.set(chunk, writeOffset);
    writeOffset += chunk.length;
  }

  return output.buffer;
}
