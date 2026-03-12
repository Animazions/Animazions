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

    const hasStoryboardImages = storyboardImageUrls.length > 0;

    if (model === "Kling 3.0") {
      const enhancedPrompt = buildEnhancedPrompt(prompt, storyboardImageUrls, moodboardImageUrls, storyboardPrompts);
      const klingTaskId = await startKlingTask(enhancedPrompt, duration, storyboardImageUrls, storyboardPrompts);
      return new Response(
        JSON.stringify({ taskId: klingTaskId }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (model === "Seedance 1.5 Pro (FREE)") {
      if (hasStoryboardImages) {
        const taskIds = await startSeedanceTasksPerImage(prompt, storyboardImageUrls, storyboardPrompts);
        return new Response(
          JSON.stringify({ taskIds, model: "seedance" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        const taskId = await startSeedanceTask(prompt, null);
        return new Response(
          JSON.stringify({ taskIds: [taskId], model: "seedance" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const enhancedPrompt = buildEnhancedPrompt(prompt, storyboardImageUrls, moodboardImageUrls, storyboardPrompts);
    const allImageUrls = [...storyboardImageUrls, ...moodboardImageUrls].filter(Boolean);

    let videoBuffer: Uint8Array;

    if (model === "ZeroScope v2 (FREE)") {
      videoBuffer = await fetchVideoFromZeroScope(enhancedPrompt);
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

const ANIMATION_MANDATE = "animated cartoon style, 2D or 3D animation only, NOT photorealistic, NOT live-action, NOT cinematic film, animated movie quality";

function buildEnhancedPrompt(
  userPrompt: string,
  storyboardUrls: string[],
  moodboardUrls: string[],
  storyboardPrompts: string[] = []
): string {
  let enhancedPrompt = `${ANIMATION_MANDATE}. ${userPrompt}.`;

  if (storyboardUrls.length > 0) {
    enhancedPrompt += ` Animate EXACTLY from the provided storyboard image: match every character design, pose, expression, clothing, background, color palette, and composition precisely.`;
    if (storyboardPrompts.length > 0) {
      enhancedPrompt += ` Creative direction: ${storyboardPrompts.join("; ")}.`;
    }
  }

  if (moodboardUrls.length > 0) {
    enhancedPrompt += ` Use mood reference images to guide atmosphere and emotional tone only.`;
  }

  return enhancedPrompt;
}

function buildImageAnchoredPrompt(userDirection: string, shotPrompt: string): string {
  const direction = shotPrompt || userDirection || "animate the scene";

  return [
    "Image-to-video animation.",
    "Use the provided reference image as the ONLY visual source.",
    "ALL characters, their designs, faces, clothing, colours, and proportions must be taken EXACTLY from the image.",
    "ALL backgrounds, environments, settings, colours, and lighting must be taken EXACTLY from the image.",
    "ALL art style, line style, shading, and visual aesthetic must match the image precisely.",
    "Do NOT invent new characters, new environments, new colours, or any element not present in the image.",
    "Do NOT change any visual element — animate only: add motion, camera movement, and life to what is already shown.",
    `Animation direction: ${direction}.`,
    "Output must feel like the image is coming alive, not a new scene.",
  ].join(" ");
}

function truncatePrompt(prompt: string, maxLength = 500): string {
  if (prompt.length <= maxLength) return prompt;
  const truncated = prompt.substring(0, maxLength).trim();
  const lastSpace = truncated.lastIndexOf(" ");
  return lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated;
}

async function startSeedanceTask(prompt: string, imageUrl: string | null): Promise<string> {
  const kieApiKey = Deno.env.get("KIE_AI_API_KEY");
  if (!kieApiKey) {
    throw new Error("Seedance 1.5 Pro requires KIE_AI_API_KEY configuration");
  }

  const inputPayload: Record<string, unknown> = {
    prompt: truncatePrompt(prompt),
    aspect_ratio: "16:9",
    resolution: "720p",
    duration: "8",
    fixed_lens: false,
    generate_audio: true,
  };

  if (imageUrl) {
    inputPayload.input_urls = [imageUrl];
  }

  console.log("Seedance task payload:", JSON.stringify({ model: "bytedance/seedance-1.5-pro", input: inputPayload }, null, 2));

  const taskResponse = await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${kieApiKey}`,
    },
    body: JSON.stringify({
      model: "bytedance/seedance-1.5-pro",
      input: inputPayload,
    }),
  });

  const taskData = await taskResponse.json() as any;
  console.log("Seedance task response:", JSON.stringify(taskData));

  if (!taskResponse.ok || taskData.code !== 200) {
    throw new Error(`Seedance API error: ${taskData.msg || JSON.stringify(taskData)}`);
  }

  const taskId = taskData.data?.taskId;
  if (!taskId) {
    throw new Error(`No task ID returned from Seedance. Response: ${JSON.stringify(taskData)}`);
  }

  return taskId;
}

async function startSeedanceTasksPerImage(
  basePrompt: string,
  imageUrls: string[],
  shotPrompts: string[]
): Promise<string[]> {
  const taskIds: string[] = [];

  for (let i = 0; i < imageUrls.length; i++) {
    const imageUrl = imageUrls[i];
    const anchoredPrompt = buildImageAnchoredPrompt(basePrompt, shotPrompts[i] || "");
    const taskId = await startSeedanceTask(anchoredPrompt, imageUrl);
    taskIds.push(taskId);
    if (i < imageUrls.length - 1) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  return taskIds;
}

async function startKlingTask(
  prompt: string,
  duration: number,
  storyboardImageUrls: string[] = [],
  storyboardPrompts: string[] = []
): Promise<string> {
  const kieApiKey = Deno.env.get("KIE_AI_API_KEY");
  if (!kieApiKey) {
    throw new Error("Kling 3.0 requires KIE_AI_API_KEY configuration");
  }

  const clampedDuration = duration >= 10 ? "10" : "5";
  const hasImages = storyboardImageUrls.length > 0;

  let inputPayload: Record<string, unknown>;

  if (hasImages) {
    const numShots = storyboardImageUrls.length;
    const perShotDuration = Math.max(5, Math.floor(Number(clampedDuration) / numShots));
    const shots = storyboardImageUrls.map((imgUrl, i) => ({
      prompt: buildShotPrompt(prompt, storyboardPrompts[i] || ""),
      duration: perShotDuration,
      image_list: [{ url: imgUrl }],
    }));

    inputPayload = {
      multi_shots: true,
      multi_prompt: shots,
      aspect_ratio: "16:9",
      duration: clampedDuration,
      mode: "pro",
      sound: true,
    };
  } else {
    inputPayload = {
      multi_shots: false,
      prompt: prompt,
      aspect_ratio: "16:9",
      duration: clampedDuration,
      mode: "pro",
      sound: true,
    };
  }

  const taskResponse = await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${kieApiKey}`,
    },
    body: JSON.stringify({
      model: "kling-3.0/video",
      input: inputPayload,
    }),
  });

  const taskData = await taskResponse.json() as any;

  if (!taskResponse.ok || taskData.code !== 200) {
    throw new Error(`Kling API error: ${taskData.msg || JSON.stringify(taskData)}`);
  }

  const taskId = taskData.data?.taskId;
  if (!taskId) {
    throw new Error(`No task ID returned from Kling. Response: ${JSON.stringify(taskData)}`);
  }

  return taskId;
}

async function fetchVideoFromZeroScope(prompt: string): Promise<Uint8Array> {
  const SPACE_BASE = "https://hysts-zeroscope-v2.hf.space";
  const API_PREFIX = "/gradio_api";

  const submitController = new AbortController();
  const submitTimeout = setTimeout(() => submitController.abort(), 30000);

  let eventId: string;
  try {
    const submitRes = await fetch(`${SPACE_BASE}${API_PREFIX}/call/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: [prompt, 24, 25] }),
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
    if (!eventId) throw new Error("ZeroScope did not return an event_id");
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
            if (rawUrl.startsWith("http")) {
              videoUrl = rawUrl;
            } else if (rawUrl.startsWith("/file")) {
              videoUrl = `${SPACE_BASE}${rawUrl}`;
            } else {
              videoUrl = `${SPACE_BASE}/file=${rawUrl}`;
            }
          } catch {
            throw new Error("Failed to parse ZeroScope result");
          }
        }
        break;
      }
    }

    if (!videoUrl) throw new Error("ZeroScope did not return a video URL");

    const videoRes = await fetch(videoUrl);
    if (!videoRes.ok) throw new Error(`Failed to download ZeroScope video (${videoRes.status})`);

    const arrayBuf = await videoRes.arrayBuffer();
    if (arrayBuf.byteLength < 5000) {
      console.warn(`Warning: Video appears small (${arrayBuf.byteLength} bytes)`);
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
    throw new Error("Video generation requires a Pollinations API key.");
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

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 300000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "User-Agent": "AnimationStudio/1.0",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 401) {
        throw new Error("Video generation API key is invalid or expired.");
      }
      if (response.status === 402) {
        throw new Error("Insufficient Pollinations credits. Please top up your account at pollinations.ai.");
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
