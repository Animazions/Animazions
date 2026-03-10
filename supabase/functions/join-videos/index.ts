import "jsr:@supabase/functions-js/edge-runtime.d.ts";

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
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const body: JoinVideosRequest = await req.json();
    const { videoUrls = [] } = body;

    if (!videoUrls || videoUrls.length === 0) {
      return new Response(
        JSON.stringify({ error: "No video URLs provided" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (videoUrls.length === 1) {
      const response = await fetch(videoUrls[0]);
      if (!response.ok) {
        throw new Error("Failed to fetch single video");
      }
      const blob = await response.blob();
      return new Response(blob, {
        headers: { ...corsHeaders, "Content-Type": "video/mp4" },
      });
    }

    const videoBlob = await joinVideosWithWebCodecs(videoUrls);

    return new Response(videoBlob, {
      headers: { ...corsHeaders, "Content-Type": "video/mp4" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Video joining error:", errorMessage);

    return new Response(
      JSON.stringify({ error: errorMessage || "Video joining failed" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function joinVideosWithWebCodecs(videoUrls: string[]): Promise<Blob> {
  const chunks: Uint8Array[] = [];

  for (let i = 0; i < videoUrls.length; i++) {
    const videoUrl = videoUrls[i];

    try {
      const response = await fetch(videoUrl);
      if (!response.ok) {
        throw new Error(`Failed to download video ${i}: ${response.statusText}`);
      }

      const buffer = await response.arrayBuffer();
      chunks.push(new Uint8Array(buffer));
    } catch (error) {
      throw new Error(
        `Failed to fetch video ${i}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const combined = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.length;
  }

  const blob = new Blob([combined], { type: "video/mp4" });
  return blob;
}
