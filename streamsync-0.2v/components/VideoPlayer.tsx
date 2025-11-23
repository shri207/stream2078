import React, { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, SkipForward, SkipBack } from 'lucide-react';
import { VideoState } from '../types';

interface VideoPlayerProps {
  src?: string; // For Host (Local File)
  stream?: MediaStream; // For Guest (WebRTC Stream)
  onStateChange?: (state: Partial<VideoState>) => void;
  remoteState?: Partial<VideoState> | null; // State received from host
  isHost: boolean;
}

export interface VideoPlayerHandle {
  captureStream: () => MediaStream | null;
  getVideoElement: () => HTMLVideoElement | null;
}

const formatTime = (time: number) => {
  if (isNaN(time)) return "0:00";
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

export const VideoPlayer = forwardRef<VideoPlayerHandle, VideoPlayerProps>(({ src, stream, onStateChange, remoteState, isHost }, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const controlsTimeoutRef = useRef<number | null>(null);

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    captureStream: () => {
      const video = videoRef.current as any;
      if (video) {
        if (video.captureStream) return video.captureStream();
        if (video.mozCaptureStream) return video.mozCaptureStream(); // Firefox support
      }
      return null;
    },
    getVideoElement: () => videoRef.current
  }));

  // Handle Stream for Guest
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(e => console.log("Autoplay blocked", e));
    }
  }, [stream]);

  // Handle Remote State Sync (Guest follows Host)
  useEffect(() => {
    if (!isHost && remoteState && videoRef.current) {
      const video = videoRef.current;
      
      // Sync Play/Pause
      if (remoteState.isPlaying !== undefined && remoteState.isPlaying !== !video.paused) {
        if (remoteState.isPlaying) video.play().catch(() => {});
        else video.pause();
      }

      // Sync Time (only if drift is > 2 seconds)
      if (remoteState.currentTime !== undefined && Math.abs(video.currentTime - remoteState.currentTime) > 2) {
        video.currentTime = remoteState.currentTime;
      }
    }
  }, [remoteState, isHost]);

  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      window.clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = window.setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 2500);
  }, [isPlaying]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setProgress(video.currentTime);
    const updateDuration = () => setDuration(video.duration);
    const onPlay = () => {
      setIsPlaying(true);
      if (isHost) onStateChange?.({ isPlaying: true, currentTime: video.currentTime });
    };
    const onPause = () => {
      setIsPlaying(false);
      if (isHost) onStateChange?.({ isPlaying: false, currentTime: video.currentTime });
    };
    
    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
    };
  }, [isHost, onStateChange]);

  const togglePlay = () => {
    // Only host can control playback via UI
    if (!isHost) return;

    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setIsMuted(newVolume === 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isHost) return;
    
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setProgress(time);
      onStateChange?.({ currentTime: time });
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const skip = (amount: number) => {
    if (!isHost) return;
    if (videoRef.current) {
      videoRef.current.currentTime += amount;
      onStateChange?.({ currentTime: videoRef.current.currentTime });
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full bg-black group overflow-hidden rounded-xl shadow-2xl ring-1 ring-white/10 flex items-center justify-center"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={isHost ? src : undefined}
        className="w-full h-full object-contain"
        onClick={togglePlay}
        playsInline
      />

      {/* Overlay Gradient */}
      <div 
        className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-300 pointer-events-none ${showControls ? 'opacity-100' : 'opacity-0'}`} 
      />

      {/* Controls Container */}
      <div className={`absolute bottom-0 left-0 right-0 p-4 transition-all duration-300 ${showControls ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
        
        {/* Progress Bar */}
        <div className={`relative group/slider w-full h-1 mb-4 ${isHost ? 'cursor-pointer' : 'cursor-default'} bg-white/20 rounded-full`}>
          <div 
            className="absolute h-full bg-brand-500 rounded-full" 
            style={{ width: `${(progress / (duration || 1)) * 100}%` }}
          />
          {isHost && (
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={progress}
              onChange={handleSeek}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          )}
        </div>

        {/* Buttons Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={togglePlay}
              disabled={!isHost}
              className={`${isHost ? 'text-white hover:text-brand-400' : 'text-white/50 cursor-not-allowed'} transition-colors p-2 rounded-full hover:bg-white/10`}
            >
              {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
            </button>

            {isHost && (
              <>
                <button onClick={() => skip(-10)} className="text-white/70 hover:text-white transition-colors">
                  <SkipBack size={20} />
                </button>
                <button onClick={() => skip(10)} className="text-white/70 hover:text-white transition-colors">
                  <SkipForward size={20} />
                </button>
              </>
            )}

            <div className="flex items-center space-x-2 group/volume">
              <button onClick={toggleMute} className="text-white hover:text-brand-400 transition-colors">
                {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={handleVolumeChange}
                className="w-0 overflow-hidden group-hover/volume:w-24 transition-all duration-300 h-1 bg-white/20 rounded-lg appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-500"
              />
            </div>

            <span className="text-xs text-white/70 font-mono">
              {formatTime(progress)} / {formatTime(duration)}
            </span>
            
            {!isHost && (
                <span className="text-xs text-brand-400 font-medium px-2 py-1 bg-brand-900/50 rounded border border-brand-500/30">
                    LIVE
                </span>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <button 
              onClick={toggleFullscreen}
              className="text-white hover:text-brand-400 transition-colors"
            >
              {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

VideoPlayer.displayName = 'VideoPlayer';