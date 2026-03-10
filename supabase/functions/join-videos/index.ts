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

    const videoBlob = await joinVideosWithFFmpeg(videoUrls);

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

async function joinVideosWithFFmpeg(videoUrls: string[]): Promise<Blob> {
  const tmpDir = "/tmp";
  const timestamp = Date.now();
  const outputFileName = `joined_video_${timestamp}.mp4`;
  const outputPath = `${tmpDir}/${outputFileName}`;

  try {
    const fileListPath = `${tmpDir}/filelist_${timestamp}.txt`;

    const downloadedFiles: string[] = [];
    for (let i = 0; i < videoUrls.length; i++) {
      const videoUrl = videoUrls[i];
      const videoPath = `${tmpDir}/video_${i}_${timestamp}.mp4`;

      const response = await fetch(videoUrl);
      if (!response.ok) {
        throw new Error(`Failed to download video ${i}: ${response.statusText}`);
      }

      const buffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(buffer);
      await Deno.writeFile(videoPath, uint8Array);
      downloadedFiles.push(videoPath);
    }

    const fileListContent = downloadedFiles
      .map(file => `file '${file}'`)
      .join('\n');

    await Deno.writeTextFile(fileListPath, fileListContent);

    const command = new Deno.Command("ffmpeg", {
      args: [
        "-f", "concat",
        "-safe", "0",
        "-i", fileListPath,
        "-c", "copy",
        "-y",
        outputPath,
      ],
    });

    const process = command.spawn();
    const { success, stderr } = await process.output();

    if (!success) {
      const errorText = new TextDecoder().decode(stderr);
      throw new Error(`FFmpeg failed: ${errorText}`);
    }

    const fileContent = await Deno.readFile(outputPath);
    const blob = new Blob([fileContent], { type: "video/mp4" });

    await Promise.all(downloadedFiles.map(file => Deno.remove(file).catch(() => {})));
    await Deno.remove(fileListPath).catch(() => {});
    await Deno.remove(outputPath).catch(() => {});

    return blob;
  } catch (error) {
    throw error;
  }
}
