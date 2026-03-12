import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Image as ImageIcon, Film, Sparkles, Plus, X, GripVertical, FolderOpen, CreditCard, BookOpen, Play, Pause, AlertCircle, Loader, ChevronLeft, ChevronUp, ChevronDown, Download, Maximize } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { enhancePromptWithAnimationStyle } from '../utils/animationStyles';

interface AIAnimationProps {
  onNavigate: (page: string, projectId?: string) => void;
  projectId?: string;
}

type AuthView = 'login' | 'signup' | 'reset';

export function AIAnimation({ onNavigate, projectId }: AIAnimationProps) {
  const { user, signIn, signUp, resetPassword, signOut } = useAuth();
  const [authView, setAuthView] = useState<AuthView>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [selectedImageModel, setSelectedImageModel] = useState('');
  const [selectedVideoModel, setSelectedVideoModel] = useState('');
  const [imagePrompt, setImagePrompt] = useState('');
  const [videoPrompt, setVideoPrompt] = useState('');
  const [clipDuration, setClipDuration] = useState<5 | 10 | 15>(5);
  const [storyboardImages, setStoryboardImages] = useState<string[]>([]);
  const [storyboardImagePrompts, setStoryboardImagePrompts] = useState<string[]>([]);
  const [moodboardImages, setMoodboardImages] = useState<string[]>([]);
  const [generatedVideos, setGeneratedVideos] = useState<string[]>([]);
  const [videoSequence, setVideoSequence] = useState<string[]>([]);
  const [playingVideos, setPlayingVideos] = useState<boolean[]>([false, false, false, false]);
  const [hoveredVideo, setHoveredVideo] = useState<number | null>(null);
  const [videoPosters, setVideoPosters] = useState<(string | null)[]>([null, null, null, null]);
  const [fullscreenVideoIndex, setFullscreenVideoIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [lastSaved, setLastSaved] = useState<string>('');
  const [generatingImage, setGeneratingImage] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [imageGenError, setImageGenError] = useState<string>('');
  const [generatingVideo, setGeneratingVideo] = useState(false);
  const [videoGenError, setVideoGenError] = useState<string>('');
  const [draggedVideoIndex, setDraggedVideoIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string>('');
  const [customPanels, setCustomPanels] = useState<number | null>(null);
  const [showImageWaitMessage, setShowImageWaitMessage] = useState(false);
  const [showVideoWaitMessage, setShowVideoWaitMessage] = useState(false);
  const [klingTaskId, setKlingTaskId] = useState<string | null>(null);
  const [klingPollStatus, setKlingPollStatus] = useState<string>('');
  const [klingPolling, setKlingPolling] = useState(false);
  const [seedanceTaskIds, setSeedanceTaskIds] = useState<string[]>([]);
  const [seedancePollStatus, setSeedancePollStatus] = useState<string>('');
  const [showSignUpNudge, setShowSignUpNudge] = useState(false);
  const [nudgeAuthView, setNudgeAuthView] = useState<'prompt' | 'login' | 'signup'>('prompt');
  const [showNameProjectModal, setShowNameProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [creatingProject, setCreatingProject] = useState(false);
  const [createProjectError, setCreateProjectError] = useState('');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<'image' | 'video' | null>(null);
  const [selectedReferencePanel, setSelectedReferencePanel] = useState<number | null>(null);
  const cancelImageRef = useRef(false);
  const cancelVideoRef = useRef(false);
  const pendingImageTaskIdRef = useRef<string | null>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const generatedImagesSectionRef = useRef<HTMLDivElement>(null);
  const generatedVideosSectionRef = useRef<HTMLDivElement>(null);

  const saveProject = useCallback(async () => {
    if (!user || !projectId) return;

    setSaving(true);
    setSaveError('');

    try {
      const { error } = await supabase
        .from('projects')
        .update({
          state: {
            selectedImageModel,
            selectedVideoModel,
            imagePrompt,
            videoPrompt,
            clipDuration,
            storyboardImages,
            storyboardImagePrompts,
            moodboardImages,
            generatedVideos,
            videoSequence,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', projectId);

      if (error) throw error;

      setLastSaved(new Date().toLocaleTimeString());
    } catch (err) {
      setSaveError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }, [user, projectId, selectedImageModel, selectedVideoModel, imagePrompt, videoPrompt, clipDuration, storyboardImages, moodboardImages, generatedVideos, videoSequence]);

  const loadProject = useCallback(async () => {
    if (!user || !projectId) return;

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('state')
        .eq('id', projectId)
        .single();

      if (error) throw error;

      if (data?.state) {
        const state = data.state;
        setSelectedImageModel(state.selectedImageModel || '');
        setSelectedVideoModel(state.selectedVideoModel || '');
        setImagePrompt(state.imagePrompt || '');
        setVideoPrompt(state.videoPrompt || '');
        setClipDuration(state.clipDuration || 5);
        setStoryboardImages(state.storyboardImages || []);
        setStoryboardImagePrompts(state.storyboardImagePrompts || []);
        setMoodboardImages(state.moodboardImages || []);
        setGeneratedVideos(state.generatedVideos || []);
        setVideoSequence(state.videoSequence || []);
      }
    } catch (err) {
      setSaveError((err as Error).message);
    }
  }, [user, projectId]);

  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId, loadProject]);

  useEffect(() => {
    if (!projectId) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveProject();
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [projectId, saveProject]);

  useEffect(() => {
    if (!user) return;

    const resumePendingTasks = async () => {
      const { data: pendingTasks } = await supabase
        .from('pending_video_tasks')
        .select('task_id, model')
        .eq('user_id', user.id)
        .eq('status', 'pending');

      if (!pendingTasks || pendingTasks.length === 0) return;

      const seedancePending = pendingTasks.filter(t => t.model === 'seedance').map(t => t.task_id);
      const klingPending = pendingTasks.filter(t => t.model === 'kling').map(t => t.task_id);

      if (seedancePending.length > 0) {
        cancelVideoRef.current = false;
        setSeedanceTaskIds(seedancePending);
        setSeedancePollStatus(`Resuming ${seedancePending.length} pending clip${seedancePending.length > 1 ? 's' : ''}...`);
        setGeneratingVideo(true);
        setShowVideoWaitMessage(true);
        pollSeedanceTasks(seedancePending);
      }

      if (klingPending.length > 0) {
        cancelVideoRef.current = false;
        const taskId = klingPending[0];
        setKlingTaskId(taskId);
        setKlingPolling(true);
        setKlingPollStatus('Resuming Kling AI video generation...');
        setGeneratingVideo(true);
        pollKlingTaskStatus(taskId);
      }
    };

    resumePendingTasks();
  }, [user]);

  const captureFrame = useCallback((index: number) => {
    const video = videoRefs.current[index];
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 360;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setVideoPosters(prev => { const n = [...prev]; n[index] = dataUrl; return n; });
  }, []);

  useEffect(() => {
    [0, 1, 2, 3].forEach((index) => {
      const video = videoRefs.current[index];
      if (!video) return;
      const onLoaded = () => {
        video.currentTime = 0.5;
      };
      const onSeeked = () => {
        captureFrame(index);
      };
      video.addEventListener('loadeddata', onLoaded);
      video.addEventListener('seeked', onSeeked);
      return () => {
        video.removeEventListener('loadeddata', onLoaded);
        video.removeEventListener('seeked', onSeeked);
      };
    });
  }, [captureFrame]);

  const imageModels = [
    { name: 'Nano Banana Pro', free: true },
    { name: 'Seedream 5.0 Lite', free: true },
    { name: 'DALL-E 3', free: false },
    { name: 'Midjourney', free: false },
    { name: 'Stable Diffusion XL', free: false },
    { name: 'Leonardo AI', free: false },
    { name: 'Ideogram', free: false },
    { name: 'Flux Pro', free: false },
    { name: 'Adobe Firefly', free: false },
    { name: 'DreamStudio', free: false },
    { name: 'Playground AI', free: false },
    { name: 'Bing Image Creator', free: false },
  ];

  const videoModels = [
    { name: 'Seedance 1.5 Pro (FREE)', free: true, imageToVideo: true },
    { name: 'Kling 3.0', free: false, imageToVideo: true },
    { name: 'Runway Gen-3', free: false, imageToVideo: false },
    { name: 'Pika Labs', free: false, imageToVideo: false },
    { name: 'Stable Video Diffusion', free: false, imageToVideo: false },
    { name: 'Synthesia', free: false, imageToVideo: false },
    { name: 'Kaiber AI', free: false, imageToVideo: false },
    { name: 'Neural Frames', free: false, imageToVideo: false },
    { name: 'Domo AI', free: false, imageToVideo: false },
    { name: 'Moonvalley', free: false, imageToVideo: false },
    { name: 'Genmo', free: false, imageToVideo: false },
    { name: 'AnimateDiff', free: false, imageToVideo: false }
  ];

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    setAuthLoading(true);

    const hasUnsavedWork = !projectId && (
      storyboardImages.length > 0 || !!imagePrompt || !!videoPrompt || generatedVideos.length > 0
    );

    if (authView === 'login') {
      const { error } = await signIn(authEmail, authPassword);
      if (error) {
        setAuthError(error);
      } else {
        setAuthEmail('');
        setAuthPassword('');
        setShowSignUpNudge(false);
        setNudgeAuthView('prompt');
        if (hasUnsavedWork) {
          setNewProjectName('');
          setCreateProjectError('');
          setShowNameProjectModal(true);
        }
      }
    } else if (authView === 'signup') {
      if (authPassword !== authConfirmPassword) {
        setAuthError('Passwords do not match');
        setAuthLoading(false);
        return;
      }
      if (authPassword.length < 8) {
        setAuthError('Password must be at least 8 characters');
        setAuthLoading(false);
        return;
      }
      const { error } = await signUp(authEmail, authPassword);
      if (error) {
        setAuthError(error);
      } else {
        const emailForLogin = authEmail;
        const passForLogin = authPassword;
        setAuthEmail('');
        setAuthPassword('');
        setAuthConfirmPassword('');
        setShowSignUpNudge(false);
        setNudgeAuthView('prompt');
        const { error: loginError } = await signIn(emailForLogin, passForLogin);
        if (!loginError) {
          setNewProjectName('');
          setCreateProjectError('');
          setShowNameProjectModal(true);
        } else {
          setAuthSuccess('Account created! You can now log in.');
        }
      }
    } else if (authView === 'reset') {
      const { error } = await resetPassword(authEmail);
      if (error) {
        setAuthError(error);
      } else {
        setAuthSuccess('Reset link sent! Check your email.');
        setTimeout(() => {
          setAuthView('login');
          setAuthSuccess('');
          setAuthEmail('');
        }, 3000);
      }
    }

    setAuthLoading(false);
  };

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      const { error } = await signOut();
      if (error) {
        setAuthError(error);
      }
    } catch (err) {
      setAuthError((err as Error).message);
    } finally {
      setLoggingOut(false);
    }
  };

  const handleCreateNamedProject = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newProjectName.trim();
    if (!trimmedName) {
      setCreateProjectError('Please enter a project name');
      return;
    }
    setCreatingProject(true);
    setCreateProjectError('');
    try {
      const { data: existing } = await supabase
        .from('projects')
        .select('id')
        .eq('user_id', user?.id)
        .ilike('name', trimmedName)
        .maybeSingle();

      if (existing) {
        setCreateProjectError(`You already have a project named "${trimmedName}". Please choose a different name.`);
        setCreatingProject(false);
        return;
      }

      const currentState = projectId ? {} : {
        selectedImageModel,
        selectedVideoModel,
        imagePrompt,
        videoPrompt,
        clipDuration,
        storyboardImages,
        storyboardImagePrompts,
        moodboardImages,
        generatedVideos,
        videoSequence,
      };

      const { data, error } = await supabase
        .from('projects')
        .insert([{ name: trimmedName, user_id: user?.id, state: currentState }])
        .select()
        .single();
      if (error) throw error;
      setShowNameProjectModal(false);
      setNewProjectName('');
      onNavigate('create', data.id);
    } catch (err) {
      setCreateProjectError((err as Error).message);
    } finally {
      setCreatingProject(false);
    }
  };

  const switchAuthView = (view: AuthView) => {
    setAuthView(view);
    setAuthError('');
    setAuthSuccess('');
    setAuthEmail('');
    setAuthPassword('');
    setAuthConfirmPassword('');
  };

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) {
      setImageGenError('Please enter a prompt first.');
      return;
    }
    if (!selectedImageModel) {
      setImageGenError('Please select an AI model first.');
      return;
    }
    const model = imageModels.find(m => m.name === selectedImageModel);
    if (!model?.free) {
      setImageGenError(`${selectedImageModel} requires a paid subscription. Please select a free model (marked FREE).`);
      return;
    }

    cancelImageRef.current = false;
    setGeneratingImage(true);
    setShowImageWaitMessage(true);
    setImageGenError('');
    setGeneratedImage(null);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
        'Apikey': supabaseKey,
      };

      let imageAnalysis = null;
      let referenceImageUrl: string | null = null;

      const parsePanelIndex = (text: string): number | null => {
        const patterns = [
          /(?:panel|image|img)\s*#?\s*(\d+)/i,
          /(\d+)(?:st|nd|rd|th)?\s+(?:panel|image|img)/i,
        ];
        for (const pattern of patterns) {
          const match = text.match(pattern);
          if (match) {
            const num = parseInt(match[1], 10);
            if (num >= 1) return num - 1;
          }
        }
        return null;
      };

      const promptLower = imagePrompt.toLowerCase();
      const mentionsReference = promptLower.includes('panel') || promptLower.includes('image') || promptLower.includes('img') || promptLower.includes('same style') || promptLower.includes('like') || selectedReferencePanel !== null;

      if (mentionsReference && storyboardImages.length > 0) {
        let targetIndex: number | null = null;

        if (selectedReferencePanel !== null) {
          targetIndex = selectedReferencePanel;
        } else {
          targetIndex = parsePanelIndex(imagePrompt);
          if (targetIndex === null) targetIndex = 0;
        }

        const clampedIndex = Math.min(targetIndex, storyboardImages.length - 1);
        const targetImage = storyboardImages[clampedIndex];

        if (targetImage) {
          referenceImageUrl = targetImage;
          try {
            const analysisRes = await fetch(`${supabaseUrl}/functions/v1/analyze-image-style`, {
              method: 'POST',
              headers,
              body: JSON.stringify({ imageUrl: targetImage }),
            });
            if (analysisRes.ok) {
              imageAnalysis = await analysisRes.json();
            }
          } catch (err) {
            console.warn('Image analysis failed, continuing without it:', err);
          }
        }
      }

      const enhancedPrompt = enhancePromptWithAnimationStyle(imagePrompt);
      const res = await fetch(`${supabaseUrl}/functions/v1/generate-image`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ prompt: enhancedPrompt, model: selectedImageModel, imageAnalysis, referenceImageUrl }),
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Generation failed');

      if (data.imageUrl) {
        setGeneratedImage(data.imageUrl);
        setShowImageWaitMessage(false);
        if (!user) setShowSignUpNudge(true);
        setTimeout(() => {
          generatedImagesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
        return;
      }

      setStoryboardImagePrompts(prev => [...prev, imagePrompt]);

      if (data.taskId) {
        const taskId = data.taskId;
        pendingImageTaskIdRef.current = taskId;
        const maxAttempts = 60;
        let attempts = 0;

        while (attempts < maxAttempts) {
          await new Promise(r => setTimeout(r, 3000));
          if (cancelImageRef.current) {
            pendingImageTaskIdRef.current = null;
            return;
          }
          attempts++;

          const statusRes = await fetch(`${supabaseUrl}/functions/v1/check-image-status`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ taskId }),
          });

          const statusData = await statusRes.json();

          if (!statusRes.ok || statusData.error) {
            throw new Error(statusData.error || 'Status check failed');
          }

          if (statusData.status === 'success' && statusData.imageUrl) {
            pendingImageTaskIdRef.current = null;
            setGeneratedImage(statusData.imageUrl);
            setShowImageWaitMessage(false);
            if (!user) setShowSignUpNudge(true);
            setTimeout(() => {
              generatedImagesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
            return;
          }

          if (statusData.status === 'failed') {
            pendingImageTaskIdRef.current = null;
            throw new Error(statusData.error || 'Image generation failed on the server.');
          }
        }

        pendingImageTaskIdRef.current = null;
        throw new Error('Image generation timed out. The image may still be processing — please try again shortly.');
      }

      throw new Error('Unexpected response from generation service.');
    } catch (err: any) {
      setImageGenError(err?.message || 'Image generation failed. Please try again.');
      setShowImageWaitMessage(false);
    } finally {
      pendingImageTaskIdRef.current = null;
      setGeneratingImage(false);
    }
  };

  const uploadImageToStorage = async (imageUrl: string, folder: string, index: number): Promise<string | null> => {
    try {
      if (!imageUrl.startsWith('data:') && !imageUrl.startsWith('blob:')) {
        return imageUrl;
      }

      if (!user) {
        if (imageUrl.startsWith('blob:')) {
          return imageUrl;
        }
        return imageUrl;
      }

      let blob: Blob;

      if (imageUrl.startsWith('data:')) {
        const [header, base64Data] = imageUrl.split(',');
        const mimeMatch = header.match(/data:([^;]+)/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        const byteString = atob(base64Data);
        const byteArray = new Uint8Array(byteString.length);
        for (let i = 0; i < byteString.length; i++) {
          byteArray[i] = byteString.charCodeAt(i);
        }
        blob = new Blob([byteArray], { type: mimeType });
      } else {
        const response = await fetch(imageUrl);
        blob = await response.blob();
      }

      const ext = blob.type.split('/')[1]?.split('+')[0] || 'jpg';
      const fileName = `${user.id}/${folder}_${Date.now()}_${index}.${ext}`;

      const { error } = await supabase.storage
        .from('reference-images')
        .upload(fileName, blob, { contentType: blob.type, upsert: true });

      if (error) throw error;

      const { data } = supabase.storage
        .from('reference-images')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch {
      return null;
    }
  };

  const pollKlingTaskStatus = async (taskId: string) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseKey}`,
      'Apikey': supabaseKey,
    };

    setKlingPolling(true);
    const maxAttempts = 72;
    let attempts = 0;

    while (attempts < maxAttempts) {
      await new Promise(r => setTimeout(r, 5000));
      if (cancelVideoRef.current) {
        setKlingPolling(false);
        setKlingPollStatus('');
        setShowVideoWaitMessage(false);
        setGeneratingVideo(false);
        return;
      }
      attempts++;

      setKlingPollStatus(`Checking status... (attempt ${attempts}/${maxAttempts})`);

      try {
        const statusRes = await fetch(`${supabaseUrl}/functions/v1/check-video-status`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ taskId, userId: user!.id }),
        });

        const statusData = await statusRes.json();

        if (statusData.status === 'success' && statusData.videoUrl) {
          setGeneratedVideos(prev => prev.includes(statusData.videoUrl) ? prev : [...prev, statusData.videoUrl]);
          setKlingTaskId(null);
          setKlingPollStatus('');
          setKlingPolling(false);
          setShowVideoWaitMessage(false);
          setGeneratingVideo(false);
          setTimeout(() => {
            generatedVideosSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 100);
          return;
        }

        if (statusData.status === 'failed') {
          throw new Error(statusData.error || 'Video generation failed');
        }
      } catch (err: any) {
        if (err.message && err.message !== 'failed') {
          setVideoGenError(err.message);
          setKlingTaskId(null);
          setKlingPollStatus('');
          setKlingPolling(false);
          setShowVideoWaitMessage(false);
          setGeneratingVideo(false);
          return;
        }
      }
    }

    setVideoGenError('Video generation timed out. Your video may still be processing on KIE.AI — use the button below to retrieve it.');
    setKlingPolling(false);
    setKlingPollStatus('');
    setShowVideoWaitMessage(false);
    setGeneratingVideo(false);
  };

  const pollSeedanceTasks = async (taskIds: string[]) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseKey}`,
      'Apikey': supabaseKey,
    };

    const pending = new Set(taskIds);
    const maxAttempts = 72;
    let attempts = 0;

    while (pending.size > 0 && attempts < maxAttempts) {
      await new Promise(r => setTimeout(r, 5000));
      if (cancelVideoRef.current) {
        setSeedanceTaskIds([]);
        setSeedancePollStatus('');
        setShowVideoWaitMessage(false);
        setGeneratingVideo(false);
        return;
      }
      attempts++;
      setSeedancePollStatus(`Generating clips from storyboard... (${taskIds.length - pending.size}/${taskIds.length} complete, attempt ${attempts})`);

      const toRemove: string[] = [];
      for (const taskId of Array.from(pending)) {
        try {
          const res = await fetch(`${supabaseUrl}/functions/v1/check-video-status`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ taskId, userId: user!.id }),
          });
          const data = await res.json();
          if (data.status === 'success' && data.videoUrl) {
            setGeneratedVideos(prev => {
              if (prev.includes(data.videoUrl)) return prev;
              return [...prev, data.videoUrl];
            });
            toRemove.push(taskId);
          } else if (data.status === 'failed') {
            toRemove.push(taskId);
          }
        } catch {
          // keep polling
        }
      }
      toRemove.forEach(id => pending.delete(id));
    }

    setSeedanceTaskIds([]);
    setSeedancePollStatus('');
    setShowVideoWaitMessage(false);
    setGeneratingVideo(false);

    setTimeout(() => {
      generatedVideosSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleRetrieveKlingVideo = async (taskId: string) => {
    if (!user) return;
    setGeneratingVideo(true);
    setVideoGenError('');
    setKlingPollStatus('Retrieving video...');

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    try {
      const statusRes = await fetch(`${supabaseUrl}/functions/v1/check-video-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
          'Apikey': supabaseKey,
        },
        body: JSON.stringify({ taskId, userId: user?.id ?? null }),
      });

      const statusData = await statusRes.json();

      if (statusData.status === 'success' && statusData.videoUrl) {
        setGeneratedVideos(prev => [...prev, statusData.videoUrl]);
        setKlingTaskId(null);
        setKlingPollStatus('');
        if (!user) setShowSignUpNudge(true);
        setTimeout(() => {
          generatedVideosSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      } else if (statusData.status === 'pending') {
        setVideoGenError('Video is still processing. Please try again in a moment.');
      } else {
        throw new Error(statusData.error || 'Failed to retrieve video');
      }
    } catch (err: any) {
      setVideoGenError(err?.message || 'Failed to retrieve video.');
    } finally {
      setGeneratingVideo(false);
      setKlingPollStatus('');
    }
  };

  const parsePanelPrompts = (rawPrompt: string, numPanels: number): string[] => {
    const panelMap: Record<number, string> = {};
    const regex = /(?:panel|image|img)\s*#?\s*(\d+)\s*[:\-]\s*([\s\S]*?)(?=(?:panel|image|img)\s*#?\s*\d+\s*[:\-]|$)/gi;
    let match;
    while ((match = regex.exec(rawPrompt)) !== null) {
      const num = parseInt(match[1], 10);
      const promptText = match[2].trim().replace(/,\s*$/, '').trim();
      if (num >= 1 && promptText) {
        panelMap[num] = promptText;
      }
    }
    const hasPanelPrompts = Object.keys(panelMap).length > 0;
    if (!hasPanelPrompts) {
      return Array(numPanels).fill(rawPrompt);
    }
    return Array.from({ length: numPanels }, (_, i) => {
      const panelNum = i + 1;
      return panelMap[panelNum] || rawPrompt;
    });
  };

  const handleGenerateVideo = async () => {
    if (!videoPrompt.trim()) {
      setVideoGenError('Please enter a video description first.');
      return;
    }
    if (!selectedVideoModel) {
      setVideoGenError('Please select an AI video model first.');
      return;
    }
    const model = videoModels.find(m => m.name === selectedVideoModel);
    if (!model?.free) {
      setVideoGenError(`${selectedVideoModel} requires a paid subscription. Please select a free model.`);
      return;
    }
    if (storyboardImages.length === 0) {
      setVideoGenError('Please add at least one image to your storyboard before generating a video.');
      return;
    }
    if (!user) {
      setShowSignUpNudge(true);
    }

    cancelVideoRef.current = false;
    setGeneratingVideo(true);
    setShowVideoWaitMessage(true);
    setVideoGenError('');
    setKlingTaskId(null);
    setKlingPollStatus('');
    setKlingPolling(false);
    setSeedanceTaskIds([]);
    setSeedancePollStatus('');

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const storyboardUploadPromises = storyboardImages.map((url, i) =>
        (url.startsWith('blob:') || url.startsWith('data:')) ? uploadImageToStorage(url, 'storyboard', i) : Promise.resolve(url)
      );
      const moodboardUploadPromises = moodboardImages.map((url, i) =>
        (url.startsWith('blob:') || url.startsWith('data:')) ? uploadImageToStorage(url, 'moodboard', i) : Promise.resolve(url)
      );

      const [storyboardPublicUrls, moodboardPublicUrls] = await Promise.all([
        Promise.all(storyboardUploadPromises),
        Promise.all(moodboardUploadPromises),
      ]);

      const validStoryboardUrls = storyboardPublicUrls.filter(Boolean) as string[];
      const validMoodboardUrls = moodboardPublicUrls.filter(Boolean) as string[];

      const perPanelPrompts = parsePanelPrompts(videoPrompt, validStoryboardUrls.length);

      const res = await fetch(`${supabaseUrl}/functions/v1/generate-video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
          'Apikey': supabaseKey,
        },
        body: JSON.stringify({
          prompt: videoPrompt,
          model: selectedVideoModel,
          storyboardImageUrls: validStoryboardUrls,
          moodboardImageUrls: validMoodboardUrls,
          storyboardPrompts: perPanelPrompts,
          duration: selectedVideoModel === 'Seedance 1.5 Pro (FREE)' ? 4 : clipDuration,
          userId: user?.id ?? null,
          projectId: projectId ?? null,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Video generation failed');

      if (data.taskId) {
        setKlingTaskId(data.taskId);
        setKlingPollStatus('Video submitted to Kling AI. Waiting for result...');
        pollKlingTaskStatus(data.taskId);
        return;
      }

      if (data.taskIds && Array.isArray(data.taskIds)) {
        setSeedanceTaskIds(data.taskIds);
        const imageCount = data.taskIds.length;
        setSeedancePollStatus(`Submitted ${imageCount} image-to-video clip${imageCount > 1 ? 's' : ''} to Seedance AI. Waiting for results...`);
        pollSeedanceTasks(data.taskIds);
        return;
      }

      if (data.videoUrl) {
        setGeneratedVideos(prev => [...prev, data.videoUrl]);
        setShowVideoWaitMessage(false);
        setGeneratingVideo(false);
        if (!user) setShowSignUpNudge(true);
        setTimeout(() => {
          generatedVideosSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      } else {
        throw new Error('No video URL returned from generation');
      }
    } catch (err: any) {
      setVideoGenError(err?.message || 'Video generation failed. Please try again.');
      setShowVideoWaitMessage(false);
      setGeneratingVideo(false);
    }
  };

  const getStoryboardSlots = () => {
    if (customPanels && customPanels > 0) return customPanels;
    if (clipDuration === 5) return 3;
    if (clipDuration === 15) return 5;
    return 9;
  };

  const handleImageUpload = async (type: 'storyboard' | 'moodboard') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        const uploadedUrls: string[] = [];
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const url = await uploadImageToStorage(URL.createObjectURL(file), type, i);
          if (url) uploadedUrls.push(url);
        }
        if (type === 'storyboard') {
          setStoryboardImages(prev => {
            const combined = [...prev, ...uploadedUrls];
            if (combined.length > getStoryboardSlots()) {
              setCustomPanels(combined.length);
            }
            return combined;
          });
        } else {
          setMoodboardImages(prev => [...prev, ...uploadedUrls]);
        }
        if (!user) {
          setShowSignUpNudge(true);
        }
      }
    };
    input.click();
  };

  const removeImage = (index: number, type: 'storyboard' | 'moodboard') => {
    if (type === 'storyboard') {
      setStoryboardImages(prev => prev.filter((_, i) => i !== index));
    } else {
      setMoodboardImages(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleDragStartVideo = (index: number, isFromGenerated: boolean) => {
    if (isFromGenerated) {
      setDraggedVideoIndex(index);
    }
  };

  const handleDragOverSequence = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDropVideo = (index: number) => {
    if (draggedVideoIndex === null) {
      setDraggedVideoIndex(null);
      setDragOverIndex(null);
      return;
    }

    const draggedVideo = generatedVideos[draggedVideoIndex];
    addVideoToSequence(draggedVideo);
    setDraggedVideoIndex(null);
    setDragOverIndex(null);
  };

  const handleDropInEmptyEditor = () => {
    if (draggedVideoIndex !== null) {
      const draggedVideo = generatedVideos[draggedVideoIndex];
      addVideoToSequence(draggedVideo);
      setDraggedVideoIndex(null);
    }
  };

  const addVideoToSequence = (videoUrl: string) => {
    setVideoSequence(prev => [...prev, videoUrl]);
  };

  const moveVideoUp = (index: number) => {
    if (index === 0) return;
    const newSequence = [...videoSequence];
    [newSequence[index - 1], newSequence[index]] = [newSequence[index], newSequence[index - 1]];
    setVideoSequence(newSequence);
  };

  const moveVideoDown = (index: number) => {
    if (index === videoSequence.length - 1) return;
    const newSequence = [...videoSequence];
    [newSequence[index], newSequence[index + 1]] = [newSequence[index + 1], newSequence[index]];
    setVideoSequence(newSequence);
  };

  const handleExportVideos = async () => {
    if (videoSequence.length === 0) {
      setExportError('No videos in sequence to export.');
      return;
    }

    setExporting(true);
    setExportError('');

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1280;
      canvas.height = 720;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get canvas context');

      const stream = canvas.captureStream(30);
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 2500000,
      });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);

      const videos: HTMLVideoElement[] = [];
      const videoDurations: number[] = [];

      for (const videoUrl of videoSequence) {
        const video = document.createElement('video');
        video.src = videoUrl;
        video.crossOrigin = 'anonymous';
        await new Promise<void>((resolve, reject) => {
          video.onloadedmetadata = () => {
            videoDurations.push(video.duration);
            videos.push(video);
            resolve();
          };
          video.onerror = () => reject(new Error(`Failed to load video: ${videoUrl}`));
        });
      }

      mediaRecorder.start();

      let currentTime = 0;
      const totalDuration = videoDurations.reduce((a, b) => a + b, 0);
      const startTime = Date.now();

      const renderFrame = () => {
        const elapsed = (Date.now() - startTime) / 1000;

        if (elapsed >= totalDuration) {
          mediaRecorder.stop();
          return;
        }

        let accumulatedTime = 0;
        for (let i = 0; i < videos.length; i++) {
          const videoDuration = videoDurations[i];
          if (elapsed >= accumulatedTime && elapsed < accumulatedTime + videoDuration) {
            const videoTime = elapsed - accumulatedTime;
            videos[i].currentTime = videoTime;
            ctx.drawImage(videos[i], 0, 0, canvas.width, canvas.height);
            break;
          }
          accumulatedTime += videoDuration;
        }

        requestAnimationFrame(renderFrame);
      };

      await new Promise<void>((resolve) => {
        mediaRecorder.onstop = () => resolve();
        renderFrame();
      });

      const blob = new Blob(chunks, { type: 'video/webm' });

      if (blob.size === 0) {
        throw new Error('Failed to create video');
      }

      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.download = `animation_${Date.now()}.webm`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setExportError(err?.message || 'Failed to export video. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const communityImages = [
    '/naruto.jpg',
    '/sonic.jpg',
    '/south-park.jpg',
    '/still27.jpg',
    '/still29.jpg',
    '/still_18.jpg'
  ];

  const communityVideos = [
    { src: '/vid4.mp4' },
    { src: '/vid2.mp4' },
    { src: '/vid3.mp4' },
    { src: '/vid1.mp4' }
  ];

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-20">

      {showSignUpNudge && !user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
          <div className="bg-gray-950 border border-gray-700 rounded-2xl p-8 max-w-md w-full shadow-2xl">
            {nudgeAuthView === 'prompt' ? (
              <>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-[#E70606] rounded-lg flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="font-krona text-xl text-white leading-tight">Save Your Work</h2>
                </div>
                <p className="text-gray-300 font-jost text-sm mt-4 leading-relaxed">
                  You're creating something great! Create a free account to save your project, access it anytime, and build your portfolio of AI animations.
                </p>
                <div className="mt-3 bg-yellow-900/30 border border-yellow-700/50 rounded-lg px-4 py-3">
                  <p className="text-yellow-300 font-jost text-sm font-semibold">
                    Projects are only saved when you are registered and logged in. Without an account, your work will be lost when you leave this page.
                  </p>
                </div>
                <div className="mt-6 flex flex-col gap-3">
                  <button
                    onClick={() => {
                      setNudgeAuthView('signup');
                      setAuthView('signup');
                      setAuthError('');
                      setAuthSuccess('');
                      setAuthEmail('');
                      setAuthPassword('');
                      setAuthConfirmPassword('');
                    }}
                    className="w-full bg-[#E70606] hover:bg-[#c00505] text-white font-chakra text-sm uppercase tracking-wider py-3 rounded-lg transition-all hover:scale-105"
                  >
                    Create Free Account
                  </button>
                  <button
                    onClick={() => {
                      setNudgeAuthView('login');
                      setAuthView('login');
                      setAuthError('');
                      setAuthSuccess('');
                      setAuthEmail('');
                      setAuthPassword('');
                    }}
                    className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 font-chakra text-sm uppercase tracking-wider py-3 rounded-lg transition-colors border border-gray-700"
                  >
                    Log In
                  </button>
                  <button
                    onClick={() => { setShowSignUpNudge(false); setNudgeAuthView('prompt'); }}
                    className="text-center text-xs text-gray-500 hover:text-gray-400 transition underline underline-offset-2 font-jost"
                  >
                    Not yet — continue without saving
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-[#E70606] rounded-lg flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <h2 className="font-krona text-lg text-white leading-tight">
                      {nudgeAuthView === 'signup' ? 'Create Account' : 'Log In'}
                    </h2>
                  </div>
                  <button
                    onClick={() => setNudgeAuthView('prompt')}
                    className="text-gray-500 hover:text-gray-300 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {authError && (
                  <div className="mb-3 p-2.5 bg-red-900/20 border border-red-500/50 rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-red-300 text-xs">{authError}</p>
                  </div>
                )}
                {authSuccess && (
                  <div className="mb-3 p-2.5 bg-green-900/20 border border-green-500/50 rounded-lg">
                    <p className="text-green-300 text-xs">{authSuccess}</p>
                  </div>
                )}

                <form onSubmit={handleAuthSubmit} className="space-y-3">
                  <div>
                    <label className="block text-gray-400 text-xs font-medium mb-1">Email</label>
                    <input
                      type="email"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#E70606] transition"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-xs font-medium mb-1">Password</label>
                    <input
                      type="password"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#E70606] transition"
                      required
                    />
                    {nudgeAuthView === 'signup' && (
                      <p className="text-xs text-gray-600 mt-1">Minimum 8 characters</p>
                    )}
                  </div>
                  {nudgeAuthView === 'signup' && (
                    <div>
                      <label className="block text-gray-400 text-xs font-medium mb-1">Confirm Password</label>
                      <input
                        type="password"
                        value={authConfirmPassword}
                        onChange={(e) => setAuthConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#E70606] transition"
                        required
                      />
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full bg-[#E70606] hover:bg-[#c00505] disabled:bg-gray-700 text-white font-chakra text-sm uppercase tracking-wider py-3 rounded-lg transition flex items-center justify-center gap-2 mt-1"
                  >
                    {authLoading && <Loader className="w-4 h-4 animate-spin" />}
                    {nudgeAuthView === 'login' ? (authLoading ? 'Logging in...' : 'Log In') : (authLoading ? 'Creating...' : 'Create Account')}
                  </button>
                </form>

                <div className="mt-4 text-center">
                  {nudgeAuthView === 'login' ? (
                    <button
                      onClick={() => { setNudgeAuthView('signup'); setAuthView('signup'); setAuthError(''); setAuthSuccess(''); }}
                      className="text-xs text-gray-500 hover:text-gray-300 transition"
                    >
                      Don't have an account? Sign up
                    </button>
                  ) : (
                    <button
                      onClick={() => { setNudgeAuthView('login'); setAuthView('login'); setAuthError(''); setAuthSuccess(''); }}
                      className="text-xs text-gray-500 hover:text-gray-300 transition"
                    >
                      Already have an account? Log in
                    </button>
                  )}
                </div>

                <button
                  onClick={() => { setShowSignUpNudge(false); setNudgeAuthView('prompt'); }}
                  className="mt-4 text-center text-xs text-gray-600 hover:text-gray-400 transition underline underline-offset-2 font-jost w-full"
                >
                  Not yet — continue without saving
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {showNameProjectModal && user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.80)' }}>
          <div className="bg-gray-950 border border-gray-700 rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-[#E70606] rounded-lg flex items-center justify-center shrink-0">
                <FolderOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-krona text-xl text-white leading-tight">Name Your Project</h2>
                <p className="text-gray-400 text-xs mt-0.5 font-jost">Give your animation project a name to get started</p>
              </div>
            </div>

            {createProjectError && (
              <div className="mb-4 p-3 bg-red-900/20 border border-red-500/50 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-300 text-xs">{createProjectError}</p>
              </div>
            )}

            <form onSubmit={handleCreateNamedProject} className="space-y-4">
              <div>
                <label className="block text-gray-400 text-xs font-medium mb-2">Project Name</label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g. My Anime Short Film"
                  className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#E70606] transition"
                  autoFocus
                  maxLength={80}
                />
              </div>
              <button
                type="submit"
                disabled={creatingProject || !newProjectName.trim()}
                className="w-full bg-[#E70606] hover:bg-[#c00505] disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-chakra text-sm uppercase tracking-wider py-3 rounded-lg transition-all hover:scale-105 flex items-center justify-center gap-2"
              >
                {creatingProject && <Loader className="w-4 h-4 animate-spin" />}
                {creatingProject ? 'Creating...' : 'Create Project'}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="flex gap-8 max-w-[1440px] mx-auto px-6 md:px-12 lg:px-24">

        {/* Left Sidebar */}
        <div className="hidden lg:flex flex-col w-64 gap-4 pt-8">
          {user ? (
            <>
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                <p className="text-xs text-gray-400 mb-1">Logged in as</p>
                <p className="text-sm font-semibold truncate">{user.email}</p>
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="mt-3 text-xs text-gray-500 hover:text-red-400 disabled:text-gray-600 disabled:cursor-not-allowed transition underline underline-offset-2"
                >
                  {loggingOut ? 'Logging out...' : 'Log out'}
                </button>
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => onNavigate('projects')}
                  className="w-full bg-gray-900 hover:bg-gray-800 px-6 py-3 rounded-lg font-chakra text-sm uppercase tracking-wider transition-all hover:scale-105 flex items-center justify-center gap-2 border border-gray-700 hover:border-[#E70606]"
                >
                  <FolderOpen className="w-4 h-4" />
                  My Projects
                </button>
                {!projectId && (storyboardImages.length > 0 || imagePrompt || videoPrompt || generatedVideos.length > 0) && (
                  <button
                    onClick={() => { setNewProjectName(''); setCreateProjectError(''); setShowNameProjectModal(true); }}
                    className="w-full bg-[#E70606] hover:bg-[#c00505] px-6 py-3 rounded-lg font-chakra text-sm uppercase tracking-wider transition-all hover:scale-105 flex items-center justify-center gap-2"
                  >
                    <FolderOpen className="w-4 h-4" />
                    Save My Work
                  </button>
                )}
              </div>
              {saveError && (
                <div className="p-3 bg-red-900/20 border border-red-500 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-red-300 text-xs">{saveError}</p>
                </div>
              )}
              {projectId && (
                <div className="p-3 bg-gray-900 border border-gray-700 rounded-lg text-xs text-gray-400">
                  {saving ? (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[#E70606] rounded-full animate-pulse"></div>
                      Saving...
                    </div>
                  ) : lastSaved ? (
                    <>Last saved {lastSaved}</>
                  ) : (
                    'Auto-saving enabled'
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
              <div className="mb-4 text-center">
                <h3 className="font-krona text-base text-white">
                  {authView === 'login' && 'Login'}
                  {authView === 'signup' && 'Create Account'}
                  {authView === 'reset' && 'Reset Password'}
                </h3>
                {authView !== 'reset' && (
                  <p className="text-xs text-gray-500 mt-1">Save and manage your projects</p>
                )}
              </div>

              {authError && (
                <div className="mb-3 p-2.5 bg-red-900/20 border border-red-500/50 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-red-300 text-xs">{authError}</p>
                </div>
              )}
              {authSuccess && (
                <div className="mb-3 p-2.5 bg-green-900/20 border border-green-500/50 rounded-lg">
                  <p className="text-green-300 text-xs">{authSuccess}</p>
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className="space-y-3">
                <div>
                  <label className="block text-gray-400 text-xs font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-3 py-2 bg-black border border-gray-700 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#E70606] transition"
                    required
                  />
                </div>

                {authView !== 'reset' && (
                  <div>
                    <label className="block text-gray-400 text-xs font-medium mb-1">Password</label>
                    <input
                      type="password"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 bg-black border border-gray-700 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#E70606] transition"
                      required
                    />
                    {authView === 'signup' && (
                      <p className="text-xs text-gray-600 mt-1">Minimum 8 characters</p>
                    )}
                  </div>
                )}

                {authView === 'signup' && (
                  <div>
                    <label className="block text-gray-400 text-xs font-medium mb-1">Confirm Password</label>
                    <input
                      type="password"
                      value={authConfirmPassword}
                      onChange={(e) => setAuthConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 bg-black border border-gray-700 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#E70606] transition"
                      required
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full bg-[#E70606] hover:bg-[#c00505] disabled:bg-gray-700 text-white font-chakra text-xs uppercase tracking-wider py-2.5 rounded-lg transition flex items-center justify-center gap-2"
                >
                  {authLoading && <Loader className="w-3.5 h-3.5 animate-spin" />}
                  {authView === 'login' && (authLoading ? 'Logging in...' : 'Login')}
                  {authView === 'signup' && (authLoading ? 'Creating...' : 'Sign Up')}
                  {authView === 'reset' && (authLoading ? 'Sending...' : 'Send Reset Link')}
                </button>
              </form>

              <div className="mt-3 space-y-1.5 text-center">
                {authView === 'login' && (
                  <>
                    <button
                      onClick={() => switchAuthView('reset')}
                      className="text-xs text-gray-500 hover:text-gray-300 transition block w-full"
                    >
                      Forgot password?
                    </button>
                    <p className="text-xs text-gray-500">
                      No account?{' '}
                      <button onClick={() => switchAuthView('signup')} className="text-[#E70606] hover:text-red-400 transition font-semibold">
                        Sign up
                      </button>
                    </p>
                  </>
                )}
                {authView === 'signup' && (
                  <p className="text-xs text-gray-500">
                    Have an account?{' '}
                    <button onClick={() => switchAuthView('login')} className="text-[#E70606] hover:text-red-400 transition font-semibold">
                      Login
                    </button>
                  </p>
                )}
                {authView === 'reset' && (
                  <button
                    onClick={() => switchAuthView('login')}
                    className="text-xs text-gray-500 hover:text-gray-300 transition flex items-center justify-center gap-1 w-full"
                  >
                    <ChevronLeft className="w-3 h-3" />
                    Back to login
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="border-t border-gray-800 pt-4">
            <button className="w-full bg-gray-900 hover:bg-gray-800 px-6 py-3 rounded-lg font-chakra text-sm uppercase tracking-wider transition-all hover:scale-105 flex items-center justify-center gap-2 border border-gray-700 hover:border-[#E70606]">
              <CreditCard className="w-4 h-4" />
              Subscriptions
            </button>
          </div>

          <div>
            <button className="w-full bg-gray-900 hover:bg-gray-800 px-6 py-3 rounded-lg font-chakra text-sm uppercase tracking-wider transition-all hover:scale-105 flex items-center justify-center gap-2 border border-gray-700 hover:border-[#E70606]">
              <BookOpen className="w-4 h-4" />
              Guides & Tutorials
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">

        {/* Header */}
        <div className="mb-12">
          <h1 className="font-krona text-4xl md:text-5xl mb-4">
            CREATE <span className="text-[#E70606]">AI ANIMATION</span>
          </h1>
          <p className="text-gray-400 font-jost text-lg max-w-3xl">
            Transform your ideas into stunning animations using cutting-edge AI technology. Create images, build storyboards, and generate professional-quality animated videos.
          </p>
        </div>

        {/* 1. Image Generation Section */}
        <section className="mb-16 bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#E70606] rounded-lg flex items-center justify-center">
              <ImageIcon className="w-5 h-5" />
            </div>
            <h2 className="font-krona text-2xl">1. IMAGE GENERATION</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block font-chakra text-sm uppercase tracking-wider text-gray-400 mb-2">
                Choose AI Model
              </label>
              <select
                value={selectedImageModel}
                onChange={(e) => setSelectedImageModel(e.target.value)}
                className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 font-jost text-white focus:outline-none focus:border-[#E70606] transition-colors"
              >
                <option value="">Select an AI image generator</option>
                <optgroup label="-- FREE --">
                  {imageModels.filter(m => m.free).map(model => (
                    <option key={model.name} value={model.name}>{model.name} — FREE</option>
                  ))}
                </optgroup>
                <optgroup label="-- Paid / Subscription Required --">
                  {imageModels.filter(m => !m.free).map(model => (
                    <option key={model.name} value={model.name}>{model.name}</option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div>
              <label className="block font-chakra text-sm uppercase tracking-wider text-gray-400 mb-2">
                Upload Image If You Don't Want to Use AI
              </label>
              <button
                onClick={() => handleImageUpload('storyboard')}
                className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 font-jost hover:border-[#E70606] transition-colors flex items-center justify-center gap-2"
              >
                <Upload className="w-5 h-5" />
                Upload Image
              </button>
              <p className="mt-2 text-xs font-jost text-gray-400">All uploaded images are saved in the storyboard below</p>
            </div>
          </div>

          <div className="mt-6">
            <label className="block font-chakra text-sm uppercase tracking-wider text-gray-400 mb-2">
              Describe Your Image
            </label>
            <textarea
              value={imagePrompt}
              onChange={(e) => setImagePrompt(e.target.value)}
              placeholder="Describe the image you want to generate... Reference specific storyboard images if you want to match their style, characters, colors, and characteristics exactly (e.g., 'Same style as panel 1, with the red car but in a sunset scene')"
              className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 font-jost text-white placeholder:text-gray-600 focus:outline-none focus:border-[#E70606] transition-colors resize-none h-32"
            />
          </div>

          {storyboardImages.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block font-chakra text-sm uppercase tracking-wider text-gray-400">
                  Reference Panel for Style Consistency
                </label>
                {selectedReferencePanel !== null && (
                  <button
                    onClick={() => setSelectedReferencePanel(null)}
                    className="text-xs font-chakra uppercase tracking-wider text-gray-500 hover:text-red-400 transition flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    Clear
                  </button>
                )}
              </div>
              <p className="text-xs font-jost text-gray-500 mb-3">
                Select a storyboard panel to use as a visual reference. The AI will strictly match its art style, colors, and character design.
              </p>
              <div className="flex flex-wrap gap-3">
                {storyboardImages.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedReferencePanel(selectedReferencePanel === index ? null : index)}
                    className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedReferencePanel === index
                        ? 'border-[#E70606] ring-2 ring-[#E70606]/40 scale-105'
                        : 'border-gray-700 hover:border-gray-500'
                    }`}
                    title={`Use Panel ${index + 1} as reference`}
                  >
                    <img src={img} alt={`Panel ${index + 1}`} className="w-full h-full object-cover" />
                    <div className={`absolute inset-0 flex items-end justify-start p-1 ${selectedReferencePanel === index ? 'bg-[#E70606]/20' : 'bg-black/30'}`}>
                      <span className="font-krona text-white text-[9px] leading-none drop-shadow">{index + 1}</span>
                    </div>
                    {selectedReferencePanel === index && (
                      <div className="absolute top-1 right-1 w-3.5 h-3.5 bg-[#E70606] rounded-full flex items-center justify-center">
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                          <path d="M1.5 4L3.5 6L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
              {selectedReferencePanel !== null && (
                <div className="mt-3 bg-[#E70606]/10 border border-[#E70606]/30 rounded-lg px-3 py-2 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#E70606] shrink-0" />
                  <p className="text-xs font-jost text-gray-300">
                    Panel {selectedReferencePanel + 1} will be used as the style reference. The AI will strictly replicate its visual characteristics.
                  </p>
                </div>
              )}
            </div>
          )}

          {selectedImageModel && !imageModels.find(m => m.name === selectedImageModel)?.free && (
            <div className="mt-4 bg-blue-900/30 border border-blue-700 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <p className="text-blue-300 text-sm font-jost">This is a paid model. You'll need a subscription to use it.</p>
            </div>
          )}

          {selectedImageModel && imageModels.find(m => m.name === selectedImageModel)?.free && (
            <div className="mt-4 bg-yellow-900/30 border border-yellow-700 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
              <p className="text-yellow-300 text-sm font-jost">Free models have a higher failure rate. If generation fails, please try again.</p>
            </div>
          )}

          {imageGenError && (
            <div className="mt-4 bg-red-900/30 border border-red-700 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-red-300 text-sm font-jost">{imageGenError}</p>
            </div>
          )}

          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={handleGenerateImage}
              disabled={generatingImage}
              className="bg-[#E70606] hover:bg-[#c00505] disabled:bg-gray-700 disabled:cursor-not-allowed px-8 py-3 rounded-lg font-chakra text-sm uppercase tracking-wider transition-all hover:scale-105 disabled:hover:scale-100 flex items-center gap-2"
            >
              {generatingImage ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Image
                </>
              )}
            </button>
            {generatingImage && (
              <button
                onClick={() => { setCancelTarget('image'); setShowCancelConfirm(true); }}
                className="px-5 py-3 rounded-lg font-chakra text-sm uppercase tracking-wider border border-gray-600 hover:border-red-500 text-gray-300 hover:text-red-400 transition-all flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            )}
          </div>

          {showImageWaitMessage && (
            <div className="mt-4 bg-blue-900/30 border border-blue-700 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <p className="text-blue-300 text-sm font-jost">Please be patient. Generating an image can take a minute or 2.</p>
            </div>
          )}

          {generatedImage && (
            <div ref={generatedImagesSectionRef} className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <p className="font-chakra text-sm uppercase tracking-wider text-gray-400">Generated Image</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setStoryboardImages(prev => [...prev, generatedImage].slice(0, getStoryboardSlots()));
                      setStoryboardImagePrompts(prev => [...prev, imagePrompt]);
                    }}
                    className="text-xs font-chakra uppercase tracking-wider text-[#E70606] hover:text-red-400 transition border border-[#E70606] hover:border-red-400 px-3 py-1.5 rounded-lg"
                  >
                    + Add to Storyboard
                  </button>
                  <button
                    onClick={() => {
                      setMoodboardImages(prev => [...prev, generatedImage]);
                    }}
                    className="text-xs font-chakra uppercase tracking-wider text-[#E70606] hover:text-red-400 transition border border-[#E70606] hover:border-red-400 px-3 py-1.5 rounded-lg"
                  >
                    + Add to Mood Board
                  </button>
                </div>
              </div>
              <div className="relative rounded-xl overflow-hidden border border-gray-700 max-w-lg">
                <img
                  src={generatedImage}
                  alt="AI Generated"
                  className="w-full object-contain"
                />
              </div>
            </div>
          )}
        </section>

        {/* 2. Storyboard Section */}
        <section className="mb-16 bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#E70606] rounded-lg flex items-center justify-center">
              <Film className="w-5 h-5" />
            </div>
            <h2 className="font-krona text-2xl">2. STORYBOARD</h2>
          </div>

          <div className="mb-6">
            <label className="block font-chakra text-sm uppercase tracking-wider text-gray-400 mb-3">
              Select Number of Panels
            </label>
            <div className="flex gap-4">
              {[5, 15, 30].map((duration) => (
                <button
                  key={duration}
                  onClick={() => {
                    setClipDuration(duration as 5 | 15 | 30);
                    setCustomPanels(null);
                  }}
                  className={`px-6 py-2 rounded-lg font-chakra text-sm uppercase tracking-wider transition-all border ${
                    clipDuration === duration && customPanels === null
                      ? 'bg-[#E70606] border-[#E70606]'
                      : 'bg-black border-gray-700 hover:border-[#E70606]'
                  }`}
                >
                  {duration === 5 ? '3 Panels' : duration === 15 ? '5 Panels' : '9 Panels'}
                </button>
              ))}
              <input
                type="number"
                min="1"
                max="20"
                placeholder="Custom"
                value={customPanels || ''}
                onChange={(e) => {
                  const value = e.target.value ? parseInt(e.target.value, 10) : null;
                  setCustomPanels(value);
                }}
                className="px-4 py-2 rounded-lg font-chakra text-sm bg-black border border-gray-700 text-white placeholder-gray-600 focus:outline-none focus:border-[#E70606] transition-colors w-24"
              />
            </div>
          </div>

          <p className="text-gray-400 font-jost mb-4 text-sm">
            AI Video models will generate videos per image in the order you place your images in the storyboard. It is recommended to use 5 to 10 seconds video duration generation per image whilst you improve your prompting skills. It is recommended to ensure your storyboard images flow well so when you join your videos together it will create a fluid and consistent long form video. As a beginner it is best to start with 1 image only.
          </p>

          <div
            className="grid gap-4 mb-4"
            style={{ gridTemplateColumns: `repeat(${Math.min(customPanels || getStoryboardSlots(), 4)}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: getStoryboardSlots() }).map((_, index) => (
              <div
                key={index}
                className="relative aspect-square bg-black border-2 border-dashed border-gray-700 rounded-lg overflow-hidden group hover:border-[#E70606] transition-colors"
              >
                {storyboardImages[index] ? (
                  <>
                    <img
                      src={storyboardImages[index]}
                      alt={`Storyboard ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => removeImage(index, 'storyboard')}
                      className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="font-krona text-gray-600 text-lg">{index + 1}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={() => handleImageUpload('storyboard')}
            className="bg-black border border-gray-700 hover:border-[#E70606] px-6 py-3 rounded-lg font-chakra text-sm uppercase tracking-wider transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Images to Storyboard
          </button>
        </section>

        {/* 3. Mood Board Section */}
        <section className="mb-16 bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#E70606] rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <h2 className="font-krona text-2xl">3. MOOD BOARD</h2>
          </div>

          <p className="text-gray-400 font-jost mb-6">
            Add reference images to guide the AI on specific styles, colors, characters, backgrounds, or animation styles you prefer.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-4">
            {moodboardImages.map((image, index) => (
              <div
                key={index}
                className="relative aspect-square bg-black border border-gray-700 rounded-lg overflow-hidden group"
              >
                <img
                  src={image}
                  alt={`Mood ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => removeImage(index, 'moodboard')}
                  className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            {moodboardImages.length < 12 && (
              <button
                onClick={() => handleImageUpload('moodboard')}
                className="aspect-square bg-black border-2 border-dashed border-gray-700 rounded-lg hover:border-[#E70606] transition-colors flex items-center justify-center"
              >
                <Plus className="w-6 h-6 text-gray-600" />
              </button>
            )}
          </div>
        </section>

        {/* 4. Video Generation Section */}
        <section className="mb-16 bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#E70606] rounded-lg flex items-center justify-center">
              <Film className="w-5 h-5" />
            </div>
            <h2 className="font-krona text-2xl">4. VIDEO GENERATION</h2>
          </div>

          <div className="grid md:grid-cols-1 gap-6 mb-6">
            <div>
              <label className="block font-chakra text-sm uppercase tracking-wider text-gray-400 mb-2">
                Choose AI Video Model
              </label>
              <select
                value={selectedVideoModel}
                onChange={(e) => setSelectedVideoModel(e.target.value)}
                className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 font-jost text-white focus:outline-none focus:border-[#E70606] transition-colors"
              >
                <option value="">Select an AI video generator</option>
                <optgroup label="-- FREE (Image-to-Video) --">
                  {videoModels.filter(m => m.free && m.imageToVideo).map(model => (
                    <option key={model.name} value={model.name}>{model.name}</option>
                  ))}
                </optgroup>
                <optgroup label="-- Paid / Subscription Required --">
                  {videoModels.filter(m => !m.free).map(model => (
                    <option key={model.name} value={model.name}>{model.name}</option>
                  ))}
                </optgroup>
              </select>
              {selectedVideoModel && videoModels.find(m => m.name === selectedVideoModel)?.imageToVideo && storyboardImages.length > 0 && (
                <div className="mt-3 bg-green-900/30 border border-green-700 rounded-lg p-3 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                  <p className="text-green-300 text-sm font-jost">
                    Image-to-video mode active — will generate <strong>{storyboardImages.length} clip{storyboardImages.length > 1 ? 's' : ''}</strong>, one per storyboard image.
                  </p>
                </div>
              )}
              {selectedVideoModel && videoModels.find(m => m.name === selectedVideoModel)?.free && (
                <div className="mt-3 bg-yellow-900/30 border border-yellow-700 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                  <p className="text-yellow-300 text-sm font-jost">Free models have a higher failure rate. If generation fails, please try again.</p>
                </div>
              )}
            </div>
          </div>

          <div className="mb-6">
            <label className="block font-chakra text-sm uppercase tracking-wider text-gray-400 mb-2">
              Describe Your Video
            </label>
            <p className="font-jost text-xs text-gray-500 mb-3 leading-relaxed">
              The AI Video model animates one image/panel at a time. You can write a single prompt for all panels, or target individual panels by number.
              For example: <span className="text-gray-400 font-medium">"Panel 1: slow zoom in on the hero, Panel 2: the city erupts in flames, Panel 3: wide aerial shot"</span>.
              Any panel without a specific prompt will use the general description. Tutorials are in the <span className="text-[#E70606] font-medium">'Guides and Tutorials'</span> page.
            </p>
            <textarea
              value={videoPrompt}
              onChange={(e) => setVideoPrompt(e.target.value)}
              placeholder={storyboardImages.length > 1 ? `Describe each panel's animation (e.g. "Panel 1: slow zoom on character, Panel 2: city erupts in flames, Panel 3: hero runs left") — or write one description for all panels.` : "Describe the video animation you want to generate... (e.g., 'Smooth camera pan across a cyberpunk city with animated characters walking')"}
              className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 font-jost text-white placeholder:text-gray-600 focus:outline-none focus:border-[#E70606] transition-colors resize-none h-36"
            />
            {storyboardImages.length > 1 && videoPrompt.trim() && (() => {
              const parsed = parsePanelPrompts(videoPrompt, storyboardImages.length);
              const hasCustom = parsed.some((p, i) => i > 0 && p !== parsed[0]);
              if (!hasCustom) return null;
              return (
                <div className="mt-3 bg-gray-900 border border-gray-700 rounded-lg p-4">
                  <p className="font-chakra text-xs uppercase tracking-wider text-gray-400 mb-3">Panel Prompts Preview</p>
                  <div className="space-y-2">
                    {parsed.map((panelPrompt, i) => (
                      <div key={i} className="flex gap-3 items-start">
                        <div className="flex-shrink-0 w-16 h-10 rounded overflow-hidden border border-gray-700">
                          {storyboardImages[i] ? (
                            <img src={storyboardImages[i]} alt={`Panel ${i + 1}`} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                              <span className="font-krona text-gray-600 text-xs">{i + 1}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-chakra text-xs text-[#E70606] mb-0.5">Panel {i + 1}</p>
                          <p className="font-jost text-xs text-gray-300 leading-relaxed truncate">{panelPrompt}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="mb-6">
            <label className="block font-chakra text-sm uppercase tracking-wider text-gray-400 mb-3">
              Video Duration
            </label>
            {selectedVideoModel === 'Seedance 1.5 Pro (FREE)' ? (
              <div className="flex gap-3">
                <button
                  disabled
                  className="px-6 py-2 rounded-lg font-chakra text-sm uppercase tracking-wider bg-[#E70606] text-white cursor-default"
                >
                  4s
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                {[5, 10, 15].map((duration) => {
                  const isKling = selectedVideoModel === 'Kling 3.0';
                  const isDisabled = isKling && duration === 15;
                  return (
                    <button
                      key={duration}
                      onClick={() => !isDisabled && setClipDuration(duration as 5 | 10 | 15)}
                      disabled={isDisabled}
                      className={`px-6 py-2 rounded-lg font-chakra text-sm uppercase tracking-wider transition-all ${
                        isDisabled
                          ? 'bg-gray-900 text-gray-600 border border-gray-700 cursor-not-allowed opacity-50'
                          : clipDuration === duration
                          ? 'bg-[#E70606] text-white'
                          : 'bg-gray-900 text-gray-400 border border-gray-700 hover:border-[#E70606]'
                      }`}
                      title={isDisabled ? 'Kling 3.0 supports up to 10s duration' : ''}
                    >
                      {duration}s
                    </button>
                  );
                })}
              </div>
            )}
            {selectedVideoModel === 'Seedance 1.5 Pro (FREE)' && (
              <p className="text-xs text-gray-500 mt-2">Seedance 1.5 Pro generates 4 second videos with audio</p>
            )}
            {selectedVideoModel === 'Kling 3.0' && (
              <p className="text-xs text-gray-500 mt-2">Kling 3.0 supports up to 10 second videos</p>
            )}
          </div>

          {videoGenError && (
            <div className="mb-4 bg-red-900/30 border border-red-700 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-red-300 text-sm font-jost">{videoGenError}</p>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={handleGenerateVideo}
              disabled={generatingVideo}
              className="bg-[#E70606] hover:bg-[#c00505] disabled:bg-gray-700 disabled:cursor-not-allowed px-8 py-3 rounded-lg font-chakra text-sm uppercase tracking-wider transition-all hover:scale-105 disabled:hover:scale-100 flex items-center gap-2"
            >
              {generatingVideo ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Generating Video...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Video
                </>
              )}
            </button>
            {generatingVideo && (
              <button
                onClick={() => { setCancelTarget('video'); setShowCancelConfirm(true); }}
                className="px-5 py-3 rounded-lg font-chakra text-sm uppercase tracking-wider border border-gray-600 hover:border-red-500 text-gray-300 hover:text-red-400 transition-all flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            )}
          </div>

          {showVideoWaitMessage && !klingTaskId && (
            <div className="mt-4 bg-blue-900/30 border border-blue-700 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <p className="text-blue-300 text-sm font-jost">Please be patient. Generating a video can take a minute or 2.</p>
            </div>
          )}

          {klingTaskId && klingPolling && (
            <div className="mt-4 bg-blue-900/30 border border-blue-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Loader className="w-4 h-4 text-blue-400 animate-spin shrink-0" />
                <p className="text-blue-300 text-sm font-jost font-semibold">Kling AI is generating your video...</p>
              </div>
              {klingPollStatus && (
                <p className="text-blue-400 text-xs font-jost">{klingPollStatus}</p>
              )}
              <p className="text-gray-500 text-xs font-jost mt-2">Task ID: <span className="text-gray-400 font-mono">{klingTaskId}</span></p>
            </div>
          )}

          {klingTaskId && !klingPolling && (
            <div className="mt-4 space-y-3">
              <p className="text-gray-500 text-xs font-jost">Task ID: <span className="text-gray-400 font-mono">{klingTaskId}</span></p>
              <button
                onClick={() => handleRetrieveKlingVideo(klingTaskId)}
                disabled={generatingVideo}
                className="bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-600 hover:border-[#E70606] text-white px-5 py-2 rounded-lg font-chakra text-xs uppercase tracking-wider transition-all flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Check & Retrieve Video
              </button>
            </div>
          )}

          {seedanceTaskIds.length > 0 && (
            <div className="mt-4 bg-blue-900/30 border border-blue-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Loader className="w-4 h-4 text-blue-400 animate-spin shrink-0" />
                <p className="text-blue-300 text-sm font-jost font-semibold">
                  Seedance AI is animating your storyboard images...
                </p>
              </div>
              {seedancePollStatus && (
                <p className="text-blue-400 text-xs font-jost">{seedancePollStatus}</p>
              )}
              <p className="text-gray-500 text-xs font-jost mt-2">
                Generating {seedanceTaskIds.length} clip{seedanceTaskIds.length > 1 ? 's' : ''} — one per storyboard image. Each clip will appear as it completes.
              </p>
            </div>
          )}
        </section>

        {/* Generated Videos Display */}
        {generatedVideos.length > 0 && (
          <section ref={generatedVideosSectionRef} className="mb-16">
            <h3 className="font-krona text-2xl mb-6">GENERATED VIDEOS</h3>
            <p className="text-gray-400 font-jost mb-6">Drag videos below into the Video Editor to add them to your sequence.</p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {generatedVideos.map((video, index) => (
                <div
                  key={index}
                  draggable
                  onDragStart={() => handleDragStartVideo(index, true)}
                  onDragEnd={() => setDraggedVideoIndex(null)}
                  className="relative aspect-video bg-gray-900 border border-gray-800 rounded-lg overflow-hidden group cursor-grab active:cursor-grabbing hover:border-[#E70606] transition-colors"
                >
                  <video
                    src={video}
                    className="w-full h-full object-cover"
                    controls
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <p className="text-white font-chakra text-sm uppercase">Drag to Editor</p>
                  </div>
                  <button
                    onClick={() => setGeneratedVideos(prev => prev.filter((_, i) => i !== index))}
                    className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Video Editor Section */}
        <section className="mb-16 bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-2xl p-8">
          <h2 className="font-krona text-2xl mb-6">VIDEO EDITOR</h2>
          <p className="text-gray-400 font-jost mb-6">
            Drag and drop your generated videos to arrange them into a long-form animation.
          </p>

          <div className="space-y-4">
            {videoSequence.length === 0 ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.add('border-[#E70606]');
                }}
                onDragLeave={(e) => {
                  e.currentTarget.classList.remove('border-[#E70606]');
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('border-[#E70606]');
                  handleDropInEmptyEditor();
                }}
                className="border-2 border-dashed border-gray-700 rounded-lg p-12 text-center transition-colors cursor-drop"
              >
                <Film className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 font-jost mb-2">
                  Drop videos here to start your sequence
                </p>
                <p className="text-gray-600 text-sm font-jost">
                  or drag from the Generated Videos section above
                </p>
              </div>
            ) : (
              videoSequence.map((video, index) => (
                <div
                  key={index}
                  draggable
                  onDragStart={() => handleDragStartVideo(index)}
                  onDragOver={(e) => handleDragOverSequence(e, index)}
                  onDrop={() => handleDropVideo(index)}
                  onDragLeave={() => setDragOverIndex(null)}
                  className={`bg-black border rounded-lg p-4 flex items-center gap-4 transition-all cursor-move ${
                    dragOverIndex === index
                      ? 'border-[#E70606] bg-gray-800/50'
                      : 'border-gray-700 hover:border-[#E70606]'
                  }`}
                >
                  <GripVertical className="w-5 h-5 text-gray-600" />
                  <div className="flex-1 flex items-center gap-4">
                    <div className="w-32 h-20 bg-gray-900 rounded overflow-hidden flex-shrink-0">
                      <video src={video} className="w-full h-full object-cover" />
                    </div>
                    <span className="font-chakra text-sm uppercase">Clip {index + 1}</span>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => moveVideoUp(index)}
                      disabled={index === 0}
                      className="bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed rounded-full p-2 transition-colors"
                      title="Move up"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveVideoDown(index)}
                      disabled={index === videoSequence.length - 1}
                      className="bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed rounded-full p-2 transition-colors"
                      title="Move down"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => setVideoSequence(prev => prev.filter((_, i) => i !== index))}
                    className="bg-red-600 hover:bg-red-700 rounded-full p-2 transition-colors flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {exportError && (
            <div className="mt-4 bg-red-900/30 border border-red-700 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-red-300 text-sm font-jost">{exportError}</p>
            </div>
          )}

          {videoSequence.length > 0 && (
            <button
              onClick={handleExportVideos}
              disabled={exporting}
              className="mt-6 bg-[#E70606] hover:bg-[#c00505] disabled:bg-gray-700 disabled:cursor-not-allowed px-8 py-3 rounded-lg font-chakra text-sm uppercase tracking-wider transition-all hover:scale-105 disabled:hover:scale-100 flex items-center gap-2"
            >
              {exporting ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Joining Videos...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Join and Export Video
                </>
              )}
            </button>
          )}
        </section>

        {/* Community Images Gallery */}
        <section className="mb-16">
          <h2 className="font-krona text-2xl mb-6">COMMUNITY CREATED IMAGES</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {communityImages.map((image, index) => (
              <div
                key={index}
                className="relative aspect-square bg-gray-900 border border-gray-800 rounded-lg overflow-hidden group cursor-pointer hover:border-[#E70606] transition-all"
              >
                <img
                  src={image}
                  alt={`Community ${index + 1}`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="font-chakra text-xs uppercase text-white">AI Generated</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Community Videos Gallery */}
        <section className="mb-16">
          <h2 className="font-krona text-2xl mb-6">COMMUNITY CREATED VIDEOS</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {communityVideos.map((video, index) => (
              <div
                key={index}
                className="relative aspect-video bg-gray-900 border border-gray-800 rounded-lg overflow-hidden hover:border-[#E70606] transition-all group"
                onMouseEnter={() => setHoveredVideo(index)}
                onMouseLeave={() => setHoveredVideo(null)}
              >
                <video
                  ref={(el) => (videoRefs.current[index] = el)}
                  src={video.src}
                  poster={videoPosters[index] ?? undefined}
                  className="w-full h-full object-cover"
                  preload="metadata"
                  onEnded={() => setPlayingVideos(prev => { const n = [...prev]; n[index] = false; return n; })}
                  onPause={() => setPlayingVideos(prev => { const n = [...prev]; n[index] = false; return n; })}
                  onPlay={() => setPlayingVideos(prev => { const n = [...prev]; n[index] = true; return n; })}
                />

                {/* Play button — shown when not playing */}
                {!playingVideos[index] && (
                  <button
                    onClick={() => videoRefs.current[index]?.play()}
                    className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-all"
                  >
                    <div className="w-16 h-16 bg-[#E70606] rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg">
                      <Play className="w-8 h-8 fill-white text-white ml-1" />
                    </div>
                  </button>
                )}

                {/* Pause button — shown only on hover while playing */}
                {playingVideos[index] && hoveredVideo === index && (
                  <button
                    onClick={() => videoRefs.current[index]?.pause()}
                    className="absolute inset-0 flex items-center justify-center bg-black/20 transition-all"
                  >
                    <div className="w-14 h-14 bg-black/60 rounded-full flex items-center justify-center hover:bg-black/80 hover:scale-110 transition-all shadow-lg backdrop-blur-sm">
                      <Pause className="w-7 h-7 fill-white text-white" />
                    </div>
                  </button>
                )}

                {/* Fullscreen button — shown on hover */}
                <button
                  onClick={() => setFullscreenVideoIndex(index)}
                  className="absolute top-3 right-3 bg-black/60 hover:bg-[#E70606] rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-all shadow-lg backdrop-blur-sm"
                  title="Fullscreen"
                >
                  <Maximize className="w-4 h-4 text-white" />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Fullscreen Video Modal */}
        {fullscreenVideoIndex !== null && (
          <div
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setFullscreenVideoIndex(null)}
          >
            <div
              className="relative w-full h-full max-w-6xl max-h-[90vh] flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <video
                key={`fullscreen-${fullscreenVideoIndex}`}
                src={communityVideos[fullscreenVideoIndex].src}
                className="w-full h-full object-contain"
                autoPlay
                controls
                preload="metadata"
              />
              <button
                onClick={() => setFullscreenVideoIndex(null)}
                className="absolute top-6 right-6 bg-black/60 hover:bg-[#E70606] rounded-lg p-3 transition-all shadow-lg backdrop-blur-sm"
                title="Close fullscreen"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        )}

        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-sm w-full shadow-2xl">
            <h3 className="font-krona text-lg mb-3 text-white">Cancel Generation?</h3>
            <p className="text-gray-400 font-jost text-sm mb-6">
              The {cancelTarget === 'image' ? 'image' : 'video'} generation will be cancelled and your prompt will be cleared.
            </p>
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  if (cancelTarget === 'image') {
                    cancelImageRef.current = true;
                    const imageTaskId = pendingImageTaskIdRef.current;
                    if (imageTaskId && user) {
                      try {
                        await supabase.from('pending_video_tasks').update({ status: 'failed', updated_at: new Date().toISOString() }).eq('task_id', imageTaskId).eq('user_id', user.id);
                      } catch {}
                    }
                    pendingImageTaskIdRef.current = null;
                    setGeneratingImage(false);
                    setShowImageWaitMessage(false);
                    setImageGenError('');
                    setImagePrompt('');
                  } else if (cancelTarget === 'video') {
                    cancelVideoRef.current = true;
                    if (user) {
                      const taskIdsToCancel = [
                        ...(klingTaskId ? [klingTaskId] : []),
                        ...seedanceTaskIds,
                      ];
                      if (taskIdsToCancel.length > 0) {
                        try {
                          await supabase.from('pending_video_tasks').update({ status: 'failed', updated_at: new Date().toISOString() }).in('task_id', taskIdsToCancel).eq('user_id', user.id);
                        } catch {}
                      }
                    }
                    setGeneratingVideo(false);
                    setShowVideoWaitMessage(false);
                    setKlingPolling(false);
                    setKlingPollStatus('');
                    setKlingTaskId(null);
                    setSeedancePollStatus('');
                    setSeedanceTaskIds([]);
                    setVideoGenError('');
                    setVideoPrompt('');
                  }
                  setShowCancelConfirm(false);
                  setCancelTarget(null);
                }}
                className="flex-1 bg-[#E70606] hover:bg-[#c00505] px-4 py-3 rounded-lg font-chakra text-sm uppercase tracking-wider transition-all"
              >
                Yes, Cancel
              </button>
              <button
                onClick={() => { setShowCancelConfirm(false); setCancelTarget(null); }}
                className="flex-1 bg-gray-800 hover:bg-gray-700 border border-gray-600 px-4 py-3 rounded-lg font-chakra text-sm uppercase tracking-wider transition-all"
              >
                Keep Waiting
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
