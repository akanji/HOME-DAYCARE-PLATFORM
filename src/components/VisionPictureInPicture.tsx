import React, { useState } from 'react';
import {
  Eye,
  Maximize2,
  X,
  Volume2,
  VolumeX,
  ShieldCheck,
  AlertTriangle,
  Layers,
  ChevronDown,
  ChevronUp,
  Camera,
  Play,
  Sparkles,
} from 'lucide-react';
import { audioAlertService } from '../services/audioAlertService';

export interface ScenePreset {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  hint: string;
}

interface VisionPictureInPictureProps {
  isOpen: boolean;
  onClose: () => void;
  onMaximizeToVision: () => void;
  currentScene: ScenePreset;
  allScenes: ScenePreset[];
  onSelectScene: (scene: ScenePreset) => void;
  isAudioMuted: boolean;
  onToggleAudioMute: () => void;
  activeHazardCount?: number;
}

export const VisionPictureInPicture: React.FC<VisionPictureInPictureProps> = ({
  isOpen,
  onClose,
  onMaximizeToVision,
  currentScene,
  allScenes,
  onSelectScene,
  isAudioMuted,
  onToggleAudioMute,
  activeHazardCount = 1,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [showSceneMenu, setShowSceneMenu] = useState(false);
  const [lastAlertFlash, setLastAlertFlash] = useState(false);

  if (!isOpen) return null;

  const handleTestChime = (e: React.MouseEvent) => {
    e.stopPropagation();
    audioAlertService.playHazardAlert('medium');
    setLastAlertFlash(true);
    setTimeout(() => setLastAlertFlash(false), 1200);
  };

  return (
    <div
      id="vision-picture-in-picture-overlay"
      className="fixed bottom-4 right-4 z-50 flex flex-col items-end animate-fade-in pointer-events-auto"
    >
      <div className="w-80 sm:w-96 bg-neutral-900/95 text-white rounded-xl shadow-2xl border border-neutral-700/80 backdrop-blur-md overflow-hidden transition-all duration-200">
        {/* Header Bar */}
        <div className="px-3 py-2 bg-neutral-800/90 border-b border-neutral-700 flex items-center justify-between text-xs font-mono select-none">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span className="font-bold text-neutral-200 uppercase tracking-tight flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-[#E5A910]" /> PiP Vision Feed
            </span>
            <span className="text-[9px] bg-red-950/80 text-red-300 px-1.5 py-0.2 rounded border border-red-800/60 font-bold uppercase">
              1080p LIVE
            </span>
          </div>

          <div className="flex items-center gap-1 text-neutral-400">
            {/* Audio alert toggle */}
            <button
              id="pip-toggle-sound-button"
              onClick={onToggleAudioMute}
              title={isAudioMuted ? 'Unmute Audio Alert' : 'Mute Audio Alert'}
              className={`p-1 rounded hover:text-white transition-colors ${
                isAudioMuted ? 'text-neutral-500' : 'text-emerald-400'
              }`}
            >
              {isAudioMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>

            {/* Test sound */}
            <button
              id="pip-test-sound-button"
              onClick={handleTestChime}
              title="Test Non-Intrusive Audio Alert"
              className="p-1 rounded hover:text-amber-300 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </button>

            {/* Minimize / Expand */}
            <button
              id="pip-minimize-button"
              onClick={() => setIsMinimized(!isMinimized)}
              title={isMinimized ? 'Expand PiP' : 'Minimize PiP'}
              className="p-1 rounded hover:text-white transition-colors"
            >
              {isMinimized ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {/* Maximize to full Vision tab */}
            <button
              id="pip-maximize-button"
              onClick={onMaximizeToVision}
              title="Open Full Vision Module"
              className="p-1 rounded hover:text-white transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>

            {/* Close PiP */}
            <button
              id="pip-close-button"
              onClick={onClose}
              title="Close PiP"
              className="p-1 rounded hover:text-red-400 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Video / Camera Feed Body (Hidden when collapsed) */}
        {!isMinimized && (
          <div className="relative">
            {/* Feed Image */}
            <div className="relative aspect-16/10 w-full bg-black overflow-hidden select-none">
              <img
                src={currentScene.imageUrl}
                alt={currentScene.name}
                className="w-full h-full object-cover"
                crossOrigin="anonymous"
              />

              {/* Timestamp & Cam Name Overlay */}
              <div className="absolute top-2 left-2 bg-black/70 px-2 py-0.5 rounded text-[9px] font-mono text-neutral-300 border border-white/10 flex items-center gap-1.5">
                <span className="text-emerald-400 font-bold">REC</span>
                <span>{currentScene.name.split('&')[0]}</span>
              </div>

              {/* Active Hazard HUD Alert */}
              {activeHazardCount > 0 && (
                <div
                  className={`absolute top-2 right-2 px-2 py-0.5 rounded text-[9px] font-mono font-bold flex items-center gap-1 shadow-md transition-all duration-300 ${
                    lastAlertFlash
                      ? 'bg-red-600 text-white ring-2 ring-red-400 animate-pulse'
                      : 'bg-[#52632B]/95 text-white border border-[#E5A910]/60'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3 text-[#E5A910]" />
                  <span>HAZARD FLAGGED</span>
                </div>
              )}

              {/* Simulated visual bounding box on the PiP feed */}
              <div
                style={{
                  left: '32%',
                  top: '64%',
                  width: '26%',
                  height: '24%',
                }}
                className="absolute border-2 border-dashed border-[#E5A910] bg-[#E5A910]/20 rounded-xs pointer-events-none"
              >
                <span className="absolute -top-4 left-0 bg-black/80 text-[8px] font-mono text-[#E5A910] px-1 py-0.2 rounded font-bold">
                  Obstacle // 92%
                </span>
              </div>

              {/* Ratio Monitor Ribbon */}
              <div className="absolute bottom-2 left-2 bg-black/75 px-2 py-0.5 rounded text-[9px] font-mono text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>Ratio: 1:2 (Compliant)</span>
              </div>

              {/* Return to Vision CTA button overlay */}
              <button
                id="pip-open-vision-button"
                onClick={onMaximizeToVision}
                className="absolute bottom-2 right-2 bg-[#52632B]/90 hover:bg-[#52632B] text-white px-2 py-1 rounded text-[10px] font-mono font-bold flex items-center gap-1 shadow-sm transition-all uppercase tracking-tight border border-[#E5A910]/30"
              >
                <span>Full Module</span>
                <Maximize2 className="w-3 h-3" />
              </button>
            </div>

            {/* Quick Camera Preset Switcher in PiP */}
            <div className="p-2 bg-neutral-900 border-t border-neutral-800 flex items-center justify-between text-[10px] font-mono">
              <span className="text-neutral-400">Switch Camera Feed:</span>
              <div className="flex items-center gap-1">
                {allScenes.map((scene) => {
                  const isSelected = scene.id === currentScene.id;
                  const shortName = scene.id === 'playroom' ? 'Play' : scene.id === 'snack_table' ? 'Snack' : scene.id === 'nap_room' ? 'Nap' : 'Yard';
                  return (
                    <button
                      key={scene.id}
                      onClick={() => onSelectScene(scene)}
                      className={`px-1.5 py-0.5 rounded uppercase font-bold transition-colors ${
                        isSelected
                          ? 'bg-[#52632B] text-white border border-[#E5A910]/40'
                          : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                      }`}
                    >
                      {shortName}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Collapsed Pill View Details */}
        {isMinimized && (
          <div
            onClick={() => setIsMinimized(false)}
            className="p-2 text-center text-xs font-mono text-neutral-300 cursor-pointer hover:bg-neutral-800 transition-colors flex items-center justify-between px-3"
          >
            <span className="flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-[#E5A910]" />
              <span>{currentScene.name.split('&')[0]} (Monitoring Active)</span>
            </span>
            <span className="text-[10px] text-[#E5A910] font-bold">Click to Expand</span>
          </div>
        )}
      </div>
    </div>
  );
};
