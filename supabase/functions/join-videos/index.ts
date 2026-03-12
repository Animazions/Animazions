import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import MP4Box from "npm:mp4box@0.5.2";
import { Muxer, ArrayBufferTarget } from "npm:mp4-muxer@5.1.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface JoinVideosRequest {
  videoUrls: string[];
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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const buffers: ArrayBuffer[] = [];
    for (let i = 0; i < videoUrls.length; i++) {
      const url = videoUrls[i];
      const pathMatch = url.match(/\/storage\/v1\/object\/(?:sign|public)\/generated-videos\/(.+?)(?:\?|$)/);
      if (pathMatch) {
        const filePath = decodeURIComponent(pathMatch[1]);
        const { data, error } = await supabase.storage
          .from("generated-videos")
          .download(filePath);
        if (error) throw new Error(`Failed to download clip ${i + 1}: ${error.message}`);
        buffers.push(await data.arrayBuffer());
      } else {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to fetch clip ${i + 1}: ${res.status}`);
        buffers.push(await res.arrayBuffer());
      }
    }

    if (buffers.length === 1) {
      return new Response(buffers[0], {
        headers: { ...corsHeaders, "Content-Type": "video/mp4" },
      });
    }

    const joined = await concatenateMP4s(buffers);

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

interface MP4Sample {
  data: ArrayBuffer;
  dts: number;
  cts: number;
  duration: number;
  is_rap: boolean;
  timescale: number;
}

interface ClipData {
  videoTrackId: number;
  audioTrackId: number | null;
  videoSamples: MP4Sample[];
  audioSamples: MP4Sample[];
  videoTimescale: number;
  audioTimescale: number;
  videoWidth: number;
  videoHeight: number;
  audioSampleRate: number;
  audioChannelCount: number;
  avcConfig: ArrayBuffer | undefined;
  durationUs: number;
}

function demuxMP4(buffer: ArrayBuffer): Promise<ClipData> {
  return new Promise((resolve, reject) => {
    const file = MP4Box.createFile();
    const videoSamples: MP4Sample[] = [];
    const audioSamples: MP4Sample[] = [];
    let videoTrackId = -1;
    let audioTrackId = -1;
    let videoTimescale = 90000;
    let audioTimescale = 44100;
    let videoWidth = 0;
    let videoHeight = 0;
    let audioSampleRate = 44100;
    let audioChannelCount = 2;
    let avcConfig: ArrayBuffer | undefined;
    let durationUs = 0;

    file.onError = (e: unknown) => reject(new Error(String(e)));

    file.onReady = (info: any) => {
      durationUs = Math.round((info.duration / info.timescale) * 1_000_000);

      for (const track of info.tracks) {
        if (track.video && videoTrackId === -1) {
          videoTrackId = track.id;
          videoTimescale = track.timescale;
          videoWidth = track.video.width;
          videoHeight = track.video.height;
          avcConfig = track.avcDecoderConfigRecord;
          file.setExtractionOptions(track.id, null, { nbSamples: Infinity });
        }
        if (track.audio && audioTrackId === -1) {
          audioTrackId = track.id;
          audioTimescale = track.timescale;
          audioSampleRate = track.audio.sample_rate;
          audioChannelCount = track.audio.channel_count;
          file.setExtractionOptions(track.id, null, { nbSamples: Infinity });
        }
      }

      file.start();
    };

    file.onSamples = (trackId: number, _user: unknown, samples: MP4Sample[]) => {
      if (trackId === videoTrackId) {
        for (const s of samples) videoSamples.push(s);
      } else if (trackId === audioTrackId) {
        for (const s of samples) audioSamples.push(s);
      }
    };

    file.onFlush = () => {
      resolve({
        videoTrackId,
        audioTrackId,
        videoSamples,
        audioSamples,
        videoTimescale,
        audioTimescale,
        videoWidth,
        videoHeight,
        audioSampleRate,
        audioChannelCount,
        avcConfig,
        durationUs,
      });
    };

    const buf = buffer as ArrayBuffer & { fileStart: number };
    buf.fileStart = 0;
    file.appendBuffer(buf);
    file.flush();
  });
}

async function concatenateMP4s(inputs: ArrayBuffer[]): Promise<ArrayBuffer> {
  const clips = await Promise.all(inputs.map(demuxMP4));
  const first = clips[0];

  const hasAudio = clips.every(c => c.audioTrackId !== -1 && c.audioSamples.length > 0);

  const muxerOptions: any = {
    target: new ArrayBufferTarget(),
    video: {
      codec: "avc",
      width: first.videoWidth,
      height: first.videoHeight,
    },
    fastStart: "in-memory",
    firstTimestampBehavior: "offset",
  };

  if (hasAudio) {
    muxerOptions.audio = {
      codec: "aac",
      numberOfChannels: first.audioChannelCount,
      sampleRate: first.audioSampleRate,
    };
  }

  const muxer = new Muxer(muxerOptions);

  let videoOffsetUs = 0;
  let audioOffsetUs = 0;

  for (let clipIdx = 0; clipIdx < clips.length; clipIdx++) {
    const clip = clips[clipIdx];

    for (let i = 0; i < clip.videoSamples.length; i++) {
      const s = clip.videoSamples[i];
      const tsUs = Math.round((s.dts / clip.videoTimescale) * 1_000_000);
      const durUs = Math.round((s.duration / clip.videoTimescale) * 1_000_000);

      const isFirstKeyframe = clipIdx === 0 && i === 0 && s.is_rap;
      const meta = isFirstKeyframe && clip.avcConfig
        ? { decoderConfig: { description: new Uint8Array(clip.avcConfig) } }
        : undefined;

      muxer.addVideoChunkRaw(
        new Uint8Array(s.data),
        s.is_rap ? "key" : "delta",
        tsUs + videoOffsetUs,
        durUs,
        meta,
      );
    }

    if (hasAudio) {
      for (const s of clip.audioSamples) {
        const tsUs = Math.round((s.dts / clip.audioTimescale) * 1_000_000);
        const durUs = Math.round((s.duration / clip.audioTimescale) * 1_000_000);

        muxer.addAudioChunkRaw(
          new Uint8Array(s.data),
          "key",
          tsUs + audioOffsetUs,
          durUs,
        );
      }
    }

    videoOffsetUs += clip.durationUs;
    audioOffsetUs += clip.durationUs;
  }

  muxer.finalize();
  return (muxer.target as ArrayBufferTarget).buffer;
}
