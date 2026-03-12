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
    const { taskId, userId } = await req.json();

    if (!taskId || !userId) {
      return new Response(
        JSON.stringify({ error: "Missing taskId or userId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const kieApiKey = Deno.env.get("KIE_AI_API_KEY");
    if (!kieApiKey) {
      return new Response(
        JSON.stringify({ error: "KIE_AI_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const statusResponse = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${kieApiKey}`,
      },
    });

    if (!statusResponse.ok) {
      return new Response(
        JSON.stringify({ status: "pending" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const statusData = await statusResponse.json() as any;
    const state = statusData.data?.state;

    if (state === "fail") {
      await supabase
        .from("pending_video_tasks")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("task_id", taskId)
        .eq("user_id", userId);

      return new Response(
        JSON.stringify({ status: "failed", error: statusData.data?.failMsg || "Task failed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (state !== "success") {
      return new Response(
        JSON.stringify({ status: "pending" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resultJson = statusData.data?.resultJson;
    if (!resultJson) {
      return new Response(
        JSON.stringify({ status: "failed", error: "No result data found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const parsed = JSON.parse(resultJson);
    const videoUrl = parsed.resultUrls?.[0] || null;

    if (!videoUrl) {
      return new Response(
        JSON.stringify({ status: "failed", error: "No video URL in result" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const videoRes = await fetch(videoUrl);
    if (!videoRes.ok) {
      return new Response(
        JSON.stringify({ status: "failed", error: `Failed to download video: ${videoRes.status}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const buffer = await videoRes.arrayBuffer();
    if (buffer.byteLength < 1000) {
      return new Response(
        JSON.stringify({ status: "failed", error: "Video too small, generation may have failed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: taskRow } = await supabase
      .from("pending_video_tasks")
      .select("model, project_id")
      .eq("task_id", taskId)
      .eq("user_id", userId)
      .maybeSingle();

    const modelLabel = taskRow?.model || "clip";
    const fileName = `${userId}/${Date.now()}_clip_${modelLabel}.mp4`;

    const { error: uploadError } = await supabase.storage
      .from("generated-videos")
      .upload(fileName, new Uint8Array(buffer), {
        contentType: "video/mp4",
        upsert: false,
      });

    if (uploadError) {
      return new Response(
        JSON.stringify({ status: "failed", error: `Storage upload failed: ${uploadError.message}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: signedData, error: signedError } = await supabase.storage
      .from("generated-videos")
      .createSignedUrl(fileName, 60 * 60 * 24 * 7);

    if (signedError || !signedData?.signedUrl) {
      return new Response(
        JSON.stringify({ status: "failed", error: `Failed to create signed URL: ${signedError?.message}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const signedUrl = signedData.signedUrl;

    await supabase
      .from("pending_video_tasks")
      .update({ status: "success", video_url: signedUrl, updated_at: new Date().toISOString() })
      .eq("task_id", taskId)
      .eq("user_id", userId);

    const projectId = taskRow?.project_id;
    if (projectId) {
      const { data: projectData } = await supabase
        .from("projects")
        .select("state")
        .eq("id", projectId)
        .maybeSingle();

      if (projectData?.state) {
        const existingVideos: string[] = projectData.state.generatedVideos || [];
        if (!existingVideos.includes(signedUrl)) {
          await supabase
            .from("projects")
            .update({
              state: { ...projectData.state, generatedVideos: [...existingVideos, signedUrl] },
              updated_at: new Date().toISOString(),
            })
            .eq("id", projectId);
        }
      }
    }

    return new Response(
      JSON.stringify({ status: "success", videoUrl: signedUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("check-video-status error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
