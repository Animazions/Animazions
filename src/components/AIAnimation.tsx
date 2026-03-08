import { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Image as ImageIcon, Film, Sparkles, Plus, X, GripVertical, LogIn, FolderOpen, CreditCard, BookOpen, Play, Pause } from 'lucide-react';

interface AIAnimationProps {
  onNavigate: (page: string) => void;
}

export function AIAnimation({ onNavigate }: AIAnimationProps) {
  const [selectedImageModel, setSelectedImageModel] = useState('');
  const [selectedVideoModel, setSelectedVideoModel] = useState('');
  const [imagePrompt, setImagePrompt] = useState('');
  const [videoPrompt, setVideoPrompt] = useState('');
  const [clipDuration, setClipDuration] = useState<5 | 15 | 30>(5);
  const [storyboardImages, setStoryboardImages] = useState<string[]>([]);
  const [moodboardImages, setMoodboardImages] = useState<string[]>([]);
  const [generatedVideos, setGeneratedVideos] = useState<string[]>([]);
  const [videoSequence, setVideoSequence] = useState<string[]>([]);
  const [playingVideos, setPlayingVideos] = useState<boolean[]>([false, false, false, false]);
  const [hoveredVideo, setHoveredVideo] = useState<number | null>(null);
  const [videoPosters, setVideoPosters] = useState<(string | null)[]>([null, null, null, null]);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

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
    'DALL-E 3',
    'Midjourney',
    'Stable Diffusion XL',
    'Leonardo AI',
    'Ideogram',
    'Flux Pro',
    'Adobe Firefly',
    'DreamStudio',
    'Playground AI',
    'Bing Image Creator'
  ];

  const videoModels = [
    'Runway Gen-3',
    'Pika Labs',
    'Stable Video Diffusion',
    'Synthesia',
    'Kaiber AI',
    'Neural Frames',
    'Domo AI',
    'Moonvalley',
    'Genmo',
    'AnimateDiff'
  ];

  const getStoryboardSlots = () => {
    if (clipDuration === 5) return 3;
    if (clipDuration === 15) return 5;
    return 9;
  };

  const handleImageUpload = (type: 'storyboard' | 'moodboard') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) {
        const urls = Array.from(files).map(file => URL.createObjectURL(file));
        if (type === 'storyboard') {
          setStoryboardImages(prev => [...prev, ...urls].slice(0, getStoryboardSlots()));
        } else {
          setMoodboardImages(prev => [...prev, ...urls]);
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

  const communityImages = [
    '/naruto.jpg',
    '/sonic.jpg',
    '/south-park.jpg',
    '/still27.jpg',
    '/still29.jpg',
    '/still_18.jpg'
  ];

  const communityVideos = [
    { src: '/vid1.mp4' },
    { src: '/vid2.mp4' },
    { src: '/vid3.mp4' },
    { src: '/vid4.mp4' }
  ];

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-20">
      <div className="flex gap-8 max-w-[1440px] mx-auto px-6 md:px-12 lg:px-24">

        {/* Left Sidebar */}
        <div className="hidden lg:flex flex-col w-64 gap-4 pt-8">
          <div className="space-y-3">
            <button className="w-full bg-[#E70606] hover:bg-[#c00505] px-6 py-3 rounded-lg font-chakra text-sm uppercase tracking-wider transition-all hover:scale-105 flex items-center justify-center gap-2">
              <LogIn className="w-4 h-4" />
              Login
            </button>
            <button className="w-full border border-gray-700 hover:border-[#E70606] hover:text-[#E70606] px-6 py-3 rounded-lg font-chakra text-sm uppercase tracking-wider transition-all hover:scale-105">
              Sign Up
            </button>
          </div>

          <div className="border-t border-gray-800 pt-4">
            <button className="w-full bg-gray-900 hover:bg-gray-800 px-6 py-3 rounded-lg font-chakra text-sm uppercase tracking-wider transition-all hover:scale-105 flex items-center justify-center gap-2 border border-gray-700 hover:border-[#E70606]">
              <FolderOpen className="w-4 h-4" />
              My Projects
            </button>
          </div>

          <div>
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
                {imageModels.map(model => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-chakra text-sm uppercase tracking-wider text-gray-400 mb-2">
                Upload Image
              </label>
              <button
                onClick={() => handleImageUpload('storyboard')}
                className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 font-jost hover:border-[#E70606] transition-colors flex items-center justify-center gap-2"
              >
                <Upload className="w-5 h-5" />
                Upload Your Image
              </button>
            </div>
          </div>

          <div className="mt-6">
            <label className="block font-chakra text-sm uppercase tracking-wider text-gray-400 mb-2">
              Describe Your Image
            </label>
            <textarea
              value={imagePrompt}
              onChange={(e) => setImagePrompt(e.target.value)}
              placeholder="Describe the image you want to generate... (e.g., 'A futuristic cityscape at sunset with flying cars and neon lights')"
              className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 font-jost text-white placeholder:text-gray-600 focus:outline-none focus:border-[#E70606] transition-colors resize-none h-32"
            />
          </div>

          <button className="mt-6 bg-[#E70606] hover:bg-[#c00505] px-8 py-3 rounded-lg font-chakra text-sm uppercase tracking-wider transition-all hover:scale-105 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Generate Image
          </button>
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
              Select Clip Duration
            </label>
            <div className="flex gap-4">
              {[5, 15, 30].map((duration) => (
                <button
                  key={duration}
                  onClick={() => setClipDuration(duration as 5 | 15 | 30)}
                  className={`px-6 py-2 rounded-lg font-chakra text-sm uppercase tracking-wider transition-all border ${
                    clipDuration === duration
                      ? 'bg-[#E70606] border-[#E70606]'
                      : 'bg-black border-gray-700 hover:border-[#E70606]'
                  }`}
                >
                  {duration}s ({duration === 5 ? '3' : duration === 15 ? '5' : '9'} images)
                </button>
              ))}
            </div>
          </div>

          <p className="text-gray-400 font-jost mb-4 text-sm">
            Add {getStoryboardSlots()} images to create your {clipDuration}-second animation. Generated images from above can be added here.
          </p>

          <div className={`grid gap-4 mb-4 ${
            clipDuration === 5 ? 'grid-cols-3' :
            clipDuration === 15 ? 'grid-cols-5' :
            'grid-cols-3 md:grid-cols-5 lg:grid-cols-9'
          }`}>
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
                {videoModels.map(model => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-6">
            <label className="block font-chakra text-sm uppercase tracking-wider text-gray-400 mb-2">
              Describe Your Video
            </label>
            <textarea
              value={videoPrompt}
              onChange={(e) => setVideoPrompt(e.target.value)}
              placeholder="Describe the video animation you want to generate... (e.g., 'Smooth camera pan across a cyberpunk city with animated characters walking')"
              className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 font-jost text-white placeholder:text-gray-600 focus:outline-none focus:border-[#E70606] transition-colors resize-none h-32"
            />
          </div>

          <button className="bg-[#E70606] hover:bg-[#c00505] px-8 py-3 rounded-lg font-chakra text-sm uppercase tracking-wider transition-all hover:scale-105 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Generate Video
          </button>
        </section>

        {/* Generated Videos Display */}
        {generatedVideos.length > 0 && (
          <section className="mb-16">
            <h3 className="font-krona text-2xl mb-6">GENERATED VIDEOS</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {generatedVideos.map((video, index) => (
                <div
                  key={index}
                  className="relative aspect-video bg-gray-900 border border-gray-800 rounded-lg overflow-hidden group cursor-pointer"
                >
                  <video
                    src={video}
                    className="w-full h-full object-cover"
                    controls
                  />
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
              <div className="border-2 border-dashed border-gray-700 rounded-lg p-12 text-center">
                <Film className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 font-jost">
                  No videos in sequence yet. Generate videos above to start editing.
                </p>
              </div>
            ) : (
              videoSequence.map((video, index) => (
                <div
                  key={index}
                  className="bg-black border border-gray-700 rounded-lg p-4 flex items-center gap-4 hover:border-[#E70606] transition-colors cursor-move"
                >
                  <GripVertical className="w-5 h-5 text-gray-600" />
                  <div className="flex-1 flex items-center gap-4">
                    <div className="w-32 h-20 bg-gray-900 rounded overflow-hidden">
                      <video src={video} className="w-full h-full object-cover" />
                    </div>
                    <span className="font-chakra text-sm uppercase">Clip {index + 1}</span>
                  </div>
                  <button
                    onClick={() => setVideoSequence(prev => prev.filter((_, i) => i !== index))}
                    className="bg-red-600 hover:bg-red-700 rounded-full p-2 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {videoSequence.length > 0 && (
            <button className="mt-6 bg-[#E70606] hover:bg-[#c00505] px-8 py-3 rounded-lg font-chakra text-sm uppercase tracking-wider transition-all hover:scale-105">
              Export Final Video
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
                className="relative aspect-video bg-gray-900 border border-gray-800 rounded-lg overflow-hidden hover:border-[#E70606] transition-all"
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
              </div>
            ))}
          </div>
        </section>

        </div>
      </div>
    </div>
  );
}
