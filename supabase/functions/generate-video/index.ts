import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface VideoGenerationRequest {
  prompt: string;
  model: string;
  storyboardImageUrls?: string[];
  moodboardImageUrls?: string[];
  storyboardPrompts?: string[];
  duration?: 5 | 10 | 15;
  userId: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body: VideoGenerationRequest = await req.json();
    const {
      prompt,
      model,
      storyboardImageUrls = [],
      moodboardImageUrls = [],
      storyboardPrompts = [],
      duration = 5,
      userId,
    } = body;

    if (!prompt || !model) {
      return new Response(
        JSON.stringify({ error: "Missing prompt or model" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let styleDescriptors: string[] = [];
    if (storyboardImageUrls.length > 0) {
      try {
        styleDescriptors = await extractImageStyles(storyboardImageUrls);
      } catch (err) {
        console.warn("Failed to extract image styles:", err);
      }
    }

    const enhancedPrompt = buildEnhancedPrompt(prompt, storyboardImageUrls, moodboardImageUrls, styleDescriptors, storyboardPrompts);
    const allImageUrls = [...storyboardImageUrls, ...moodboardImageUrls].filter(Boolean);

    let videoBuffer: Uint8Array;

    if (model === "ZeroScope v2 (FREE)") {
      videoBuffer = await fetchVideoFromZeroScope(enhancedPrompt);
    } else if (model === "Sora 2 (FREE)") {
      videoBuffer = await fetchVideoFromKieAi(enhancedPrompt, duration);
    } else if (model === "Seedance 1.5 Pro (FREE)") {
      const seedancePrompt = truncatePromptForSeedance(enhancedPrompt);
      videoBuffer = await fetchVideoFromSeedance(seedancePrompt);
    } else {
      videoBuffer = await fetchVideoFromPollinations(enhancedPrompt, duration, allImageUrls);
    }

    const fileName = `${userId}/${Date.now()}_clip_${duration}s.mp4`;
    const { error: uploadError } = await supabase.storage
      .from("generated-videos")
      .upload(fileName, videoBuffer, {
        contentType: "video/mp4",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    const { data: signedData, error: signedError } = await supabase.storage
      .from("generated-videos")
      .createSignedUrl(fileName, 60 * 60 * 24 * 7);

    if (signedError || !signedData?.signedUrl) {
      throw new Error(`Failed to create signed URL: ${signedError?.message}`);
    }

    return new Response(
      JSON.stringify({ videoUrl: signedData.signedUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Video generation error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function buildEnhancedPrompt(
  userPrompt: string,
  storyboardUrls: string[],
  moodboardUrls: string[],
  styleDescriptors: string[] = [],
  storyboardPrompts: string[] = []
): string {
  let enhancedPrompt = userPrompt;

  const styleDetails = styleDescriptors.length > 0
    ? styleDescriptors.join("; ")
    : "professional animation style with consistent visual design";

  const originalImageContext = storyboardPrompts.length > 0
    ? `Original storyboard creative briefs: ${storyboardPrompts.join("; ")}. `
    : "";

  if (storyboardUrls.length > 0) {
    enhancedPrompt += `

MANDATORY STORYBOARD ADHERENCE REQUIREMENTS:
${originalImageContext}
You MUST generate video that EXACTLY matches the storyboard images provided. This is NON-NEGOTIABLE.

VISUAL CONSISTENCY REQUIREMENTS:
- EXACT character designs: Match every character's appearance, facial features, body proportions, clothing, and accessories EXACTLY as shown in storyboard
- EXACT backgrounds: Reproduce every background, environment, setting, and location IDENTICALLY to storyboard
- EXACT colors: Use the EXACT same color palette, color scheme, and color grading as the storyboard
- EXACT animation style: ${styleDetails}
- EXACT poses and positioning: Match character poses, positions, and spatial relationships EXACTLY
- EXACT props and objects: Include the EXACT same objects, props, and items in EXACT positions

DO NOT deviate from, improvise on, or alter ANY visual element from the storyboard.
Every frame MUST authentically reflect the storyboard's exact creative vision.
Maintain 100% visual consistency with storyboard images throughout the entire video.`;
  }

  if (moodboardUrls.length > 0) {
    enhancedPrompt += `

MOOD BOARD USAGE (SECONDARY):
Use mood board images ONLY to enhance atmosphere, lighting, and emotional tone.
CRITICAL: Do NOT alter characters, backgrounds, or objects from the storyboard.
Apply mood board atmosphere while maintaining ALL storyboard visual elements unchanged.`;
  }

  enhancedPrompt += `

QUALITY REQUIREMENTS:
- High-quality animation with cinematic production value
- Smooth motion and seamless transitions
- Professional polish and detail
- Consistent frame quality throughout`;

  return enhancedPrompt;
}

function truncatePromptForSeedance(prompt: string): string {
  const maxLength = 500;
  if (prompt.length <= maxLength) {
    return prompt;
  }

  const truncated = prompt.substring(0, maxLength).trim();
  const lastSpace = truncated.lastIndexOf(' ');
  return lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated;
}

async function extractImageStyles(imageUrls: string[]): Promise<string[]> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const response = await fetch(
      `${supabaseUrl}/functions/v1/analyze-image-style`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseAnonKey}`,
          "Apikey": supabaseAnonKey,
        },
        body: JSON.stringify({ imageUrls: imageUrls.slice(0, 3) }),
      }
    );

    if (!response.ok) {
      console.warn("Image analysis API returned non-OK status:", response.status);
      return [];
    }

    const data = await response.json() as any;
    return data.styleDescriptors || [];
  } catch (err) {
    console.warn("Error calling image analysis API:", err);
    return [];
  }
}

async function fetchVideoFromZeroScope(prompt: string): Promise<Uint8Array> {
  const SPACE_BASE = "https://hysts-zeroscope-v2.hf.space";
  const API_PREFIX = "/gradio_api";

  const submitController = new AbortController();
  const submitTimeout = setTimeout(() => submitController.abort(), 30000);

  let eventId: string;
  try {
    console.log("Submitting to ZeroScope with prompt:", prompt);
    const submitRes = await fetch(`${SPACE_BASE}${API_PREFIX}/call/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: [prompt, 24, 25],
      }),
      signal: submitController.signal,
    });

    if (!submitRes.ok) {
      const errText = await submitRes.text();
      if (submitRes.status === 503 || submitRes.status === 502) {
        throw new Error("ZeroScope Space is currently unavailable. Please try again later or use a different model.");
      }
      throw new Error(`ZeroScope submit failed (${submitRes.status}): ${errText.slice(0, 200)}`);
    }

    const submitData = await submitRes.json();
    eventId = submitData.event_id;
    if (!eventId) {
      throw new Error("ZeroScope did not return an event_id");
    }
    console.log("ZeroScope event ID:", eventId);
  } finally {
    clearTimeout(submitTimeout);
  }

  const pollController = new AbortController();
  const pollTimeout = setTimeout(() => pollController.abort(), 300000);

  try {
    const pollRes = await fetch(`${SPACE_BASE}${API_PREFIX}/call/run/${eventId}`, {
      signal: pollController.signal,
    });

    if (!pollRes.ok || !pollRes.body) {
      throw new Error(`ZeroScope polling failed (${pollRes.status})`);
    }

    const reader = pollRes.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let videoUrl: string | null = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      if (buffer.includes("event: error")) {
        const dataLine = buffer.split("\n").find((l) => l.startsWith("data:"));
        throw new Error(`ZeroScope generation error: ${dataLine || "unknown"}`);
      }

      if (buffer.includes("event: complete")) {
        const lines = buffer.split("\n");
        const dataLine = lines.find((l) => l.startsWith("data:"));
        if (dataLine) {
          const jsonStr = dataLine.replace(/^data:\s*/, "");
          try {
            const parsed = JSON.parse(jsonStr);
            const item = Array.isArray(parsed) ? parsed[0] : parsed;
            const fileData = item?.video ?? item;
            const rawUrl: string = fileData?.url || fileData?.path || "";
            console.log("ZeroScope response:", { parsed, fileData, rawUrl });
            if (rawUrl.startsWith("http")) {
              videoUrl = rawUrl;
            } else if (rawUrl.startsWith("/file")) {
              videoUrl = `${SPACE_BASE}${rawUrl}`;
            } else {
              videoUrl = `${SPACE_BASE}/file=${rawUrl}`;
            }
            console.log("Constructed video URL:", videoUrl);
          } catch (err) {
            console.error("Failed to parse ZeroScope result:", err);
            throw new Error("Failed to parse ZeroScope result");
          }
        }
        break;
      }
    }

    if (!videoUrl) {
      throw new Error("ZeroScope did not return a video URL");
    }

    const videoRes = await fetch(videoUrl);
    if (!videoRes.ok) {
      throw new Error(`Failed to download ZeroScope video (${videoRes.status})`);
    }

    const arrayBuf = await videoRes.arrayBuffer();
    console.log(`Downloaded video: ${arrayBuf.byteLength} bytes`);
    if (arrayBuf.byteLength < 5000) {
      console.warn(`Warning: Video appears small (${arrayBuf.byteLength} bytes), may be corrupted or 0 seconds`);
    }

    return new Uint8Array(arrayBuf);
  } finally {
    clearTimeout(pollTimeout);
  }
}

async function fetchVideoFromPollinations(
  prompt: string,
  duration: number,
  imageUrls: string[]
): Promise<Uint8Array> {
  const apiKey = Deno.env.get("POLLINATIONS_API_KEY");
  if (!apiKey) {
    throw new Error("Video generation requires a Pollinations API key. Please configure POLLINATIONS_API_KEY in your project secrets.");
  }

  const clampedDuration = Math.max(2, Math.min(15, duration));
  const encodedPrompt = encodeURIComponent(prompt);

  const params = new URLSearchParams({
    model: "wan",
    duration: String(clampedDuration),
    aspectRatio: "16:9",
    enhance: "true",
    nologo: "true",
    private: "true",
  });

  if (imageUrls.length > 0) {
    params.set("image", imageUrls.slice(0, 4).join("|"));
  }

  const url = `https://gen.pollinations.ai/video/${encodedPrompt}?${params.toString()}`;
  console.log("Fetching video from Pollinations:", url);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 300000);

  try {
    console.log("Using API key:", apiKey.substring(0, 10) + "...");
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "User-Agent": "AnimationStudio/1.0",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Pollinations response status:", response.status);
      console.error("Pollinations error:", errorText);
      if (response.status === 401) {
        throw new Error("Video generation API key is invalid or expired. Please verify your POLLINATIONS_API_KEY is correct and has available credits.");
      }
      if (response.status === 402) {
        throw new Error("Insufficient Pollinations credits to generate video. Please top up your account at pollinations.ai.");
      }
      throw new Error(`Video generation failed (${response.status}): ${errorText.slice(0, 300)}`);
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("video")) {
      const body = await response.text();
      throw new Error(`Expected video response but got ${contentType}: ${body.slice(0, 200)}`);
    }

    const buffer = await response.arrayBuffer();
    if (buffer.byteLength < 1000) {
      throw new Error(`Video too small (${buffer.byteLength} bytes) — generation may have failed`);
    }

    return new Uint8Array(buffer);
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchVideoFromKieAi(
  prompt: string,
  duration: number
): Promise<Uint8Array> {
  const kieApiKey = Deno.env.get("KIE_AI_API_KEY");
  if (!kieApiKey) {
    throw new Error("Sora 2 video generation requires KIE_AI_API_KEY configuration");
  }

  const nFrames = duration >= 15 ? "15" : "10";

  const taskResponse = await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${kieApiKey}`,
    },
    body: JSON.stringify({
      model: "sora-2-pro-text-to-video",
      input: {
        prompt: prompt,
        aspect_ratio: "landscape",
        n_frames: nFrames,
        size: "standard",
        remove_watermark: true,
      },
    }),
  });

  const taskData = await taskResponse.json() as any;

  if (!taskResponse.ok || taskData.code !== 200) {
    throw new Error(`KIE.AI API error: ${taskData.msg || JSON.stringify(taskData)}`);
  }

  const taskId = taskData.data?.taskId;

  if (!taskId) {
    throw new Error(`No task ID returned from KIE.AI. Response: ${JSON.stringify(taskData)}`);
  }

  let videoUrl: string | null = null;
  const maxRetries = 120;
  let retryCount = 0;

  while (retryCount < maxRetries && !videoUrl) {
    await new Promise(resolve => setTimeout(resolve, 5000));

    const statusResponse = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${kieApiKey}`,
      },
    });

    if (statusResponse.ok) {
      const statusData = await statusResponse.json() as any;
      const state = statusData.data?.state;

      if (state === "success") {
        const resultJson = statusData.data?.resultJson;
        if (resultJson) {
          const parsed = JSON.parse(resultJson);
          videoUrl = parsed.resultUrls?.[0] || null;
        }
        if (!videoUrl) {
          throw new Error("Task succeeded but no video URL found in result");
        }
        break;
      } else if (state === "fail") {
        throw new Error(`KIE.AI task failed: ${statusData.data?.failMsg || "Unknown error"}`);
      }
    }

    retryCount++;
  }

  if (!videoUrl) {
    throw new Error("Video generation timed out after 10 minutes");
  }

  const videoRes = await fetch(videoUrl);
  if (!videoRes.ok) {
    throw new Error(`Failed to download video from KIE.AI: ${videoRes.status}`);
  }

  const buffer = await videoRes.arrayBuffer();
  if (buffer.byteLength < 1000) {
    throw new Error(`Video too small (${buffer.byteLength} bytes) — generation may have failed`);
  }

  return new Uint8Array(buffer);
}

async function fetchVideoFromSeedance(prompt: string): Promise<Uint8Array> {
  const kieApiKey = Deno.env.get("KIE_AI_API_KEY");
  if (!kieApiKey) {
    throw new Error("Seedance 1.5 Pro requires KIE_AI_API_KEY configuration");
  }

  const taskResponse = await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${kieApiKey}`,
    },
    body: JSON.stringify({
      model: "bytedance/seedance-1.5-pro",
      input: {
        prompt: prompt,
        aspect_ratio: "16:9",
        resolution: "720p",
        duration: "4",
        fixed_lens: false,
        generate_audio: true,
      },
    }),
  });

  const taskData = await taskResponse.json() as any;

  if (!taskResponse.ok || taskData.code !== 200) {
    throw new Error(`Seedance API error: ${taskData.msg || JSON.stringify(taskData)}`);
  }

  const taskId = taskData.data?.taskId;
  if (!taskId) {
    throw new Error(`No task ID returned from Seedance. Response: ${JSON.stringify(taskData)}`);
  }

  let videoUrl: string | null = null;
  const maxRetries = 120;
  let retryCount = 0;

  while (retryCount < maxRetries && !videoUrl) {
    await new Promise(resolve => setTimeout(resolve, 5000));

    const statusResponse = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${kieApiKey}`,
      },
    });

    if (statusResponse.ok) {
      const statusData = await statusResponse.json() as any;
      const state = statusData.data?.state;

      if (state === "success") {
        const resultJson = statusData.data?.resultJson;
        if (resultJson) {
          const parsed = JSON.parse(resultJson);
          videoUrl = parsed.resultUrls?.[0] || null;
        }
        if (!videoUrl) {
          throw new Error("Seedance task succeeded but no video URL found in result");
        }
        break;
      } else if (state === "fail") {
        throw new Error(`Seedance task failed: ${statusData.data?.failMsg || "Unknown error"}`);
      }
    }

    retryCount++;
  }

  if (!videoUrl) {
    throw new Error("Seedance video generation timed out after 10 minutes");
  }

  const videoRes = await fetch(videoUrl);
  if (!videoRes.ok) {
    throw new Error(`Failed to download Seedance video: ${videoRes.status}`);
  }

  const buffer = await videoRes.arrayBuffer();
  if (buffer.byteLength < 1000) {
    throw new Error(`Video too small (${buffer.byteLength} bytes) — generation may have failed`);
  }

  return new Uint8Array(buffer);
}
