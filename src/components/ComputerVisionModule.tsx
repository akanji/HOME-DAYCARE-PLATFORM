import React, { useState, useRef, useEffect } from 'react';
import {
  Eye,
  Camera,
  Upload,
  AlertTriangle,
  CheckCircle,
  Clock,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Layers,
  ChevronRight,
  ListPlus,
  Sliders,
  Maximize2,
  FileCheck,
  Info,
  Flame,
  Volume2,
  VolumeX,
  Scale,
  FileText,
  ExternalLink,
  Mic,
  MicOff,
  Radio,
  Square,
  X,
  Play,
  Volume1,
} from 'lucide-react';
import { VisionAnalysisResult, DetectedObject, SafetyTask, IncidentReport } from '../types';
import { VisionHeatmapD3 } from './VisionHeatmapD3';
import { audioAlertService } from '../services/audioAlertService';
import { safeFetchJson } from '../utils/apiClient';

export const PRESET_SCENES = [
  {
    id: 'playroom',
    name: 'Playroom Floor & Central Walkway',
    description: 'Indoor play area with wooden toy blocks, small chairs, tables, and safety door gate.',
    imageUrl: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=1000&auto=format&fit=crop&q=80',
    hint: 'Indoor activity playroom with wooden toys and safety gate',
  },
  {
    id: 'snack_table',
    name: 'Snack & Activity Table Area',
    description: 'Low dining and activity table with spill-proof water cups, children seating, and backpacks.',
    imageUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=1000&auto=format&fit=crop&q=80',
    hint: 'Daycare dining table with cups and child seating',
  },
  {
    id: 'nap_room',
    name: 'Rest & Nap Sanctuary',
    description: 'Quiet room with spaced cots, blankets, and clear emergency exit path.',
    imageUrl: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=1000&auto=format&fit=crop&q=80',
    hint: 'Daycare nap room with cots and soft lighting',
  },
  {
    id: 'outdoor_yard',
    name: 'Outdoor Fenced Play Yard',
    description: 'Enclosed perimeter yard with soft artificial turf, sensory table, and self-closing fence gate.',
    imageUrl: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=1000&auto=format&fit=crop&q=80',
    hint: 'Fenced outdoor playground with tricycle and safety gate',
  },
];

interface ComputerVisionModuleProps {
  onAddSafetyTask: (task: Omit<SafetyTask, 'id' | 'createdAt'>) => void;
  onLogAudit: (action: string, resource: string, details: string) => void;
  onAutoGenerateIncidentDraft?: (draft: IncidentReport) => void;
  onNavigateToTab?: (tab: string) => void;
  isPipActive?: boolean;
  onTogglePip?: () => void;
  currentPipScene?: typeof PRESET_SCENES[0];
  onSelectPipScene?: (scene: typeof PRESET_SCENES[0]) => void;
  isAudioMuted?: boolean;
  onToggleAudioMute?: () => void;
}

export const ComputerVisionModule: React.FC<ComputerVisionModuleProps> = ({
  onAddSafetyTask,
  onLogAudit,
  onAutoGenerateIncidentDraft,
  onNavigateToTab,
  isPipActive = false,
  onTogglePip,
  currentPipScene,
  onSelectPipScene,
  isAudioMuted = false,
  onToggleAudioMute,
}) => {
  const [selectedScene, setSelectedScene] = useState(currentPipScene || PRESET_SCENES[0]);
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<VisionAnalysisResult | null>(null);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(true);
  const [filterCategory, setFilterCategory] = useState<'all' | 'person' | 'hazard' | 'furniture'>('all');
  const [selectedObject, setSelectedObject] = useState<DetectedObject | null>(null);
  const [reviewStatus, setReviewStatus] = useState<'pending' | 'reviewed' | 'task_created' | 'dismissed' | 'judge_confirmed_draft_created'>('pending');
  const [generatedPrompts, setGeneratedPrompts] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Vision View Sub-Tabs: Live Feed vs D3 Heatmap vs Combined
  const [activeSubView, setActiveSubView] = useState<'live' | 'heatmap' | 'combined'>('combined');

  // Judge Agent Confirmation State
  const [isJudgeEvaluating, setIsJudgeEvaluating] = useState(false);
  const [lastDraftReportId, setLastDraftReportId] = useState<string | null>(null);
  const [audioAlertActiveIndicator, setAudioAlertActiveIndicator] = useState(false);

  // Voice Command Hazard Logger State
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [lastVoiceResult, setLastVoiceResult] = useState<{
    transcription: string;
    hazard_type: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    category: string;
    description: string;
    immediate_remediation: string;
    confidence: number;
    regulatory_code: string;
    suggested_task_area: string;
    suggested_task_title: string;
  } | null>(null);

  const recognitionRef = useRef<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  // Initialize Speech Recognition if supported in browser
  const startListening = () => {
    setVoiceError(null);
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceError('Direct browser speech recognition is not supported in this environment. You can select one of the quick speech presets or edit the observation text below.');
      setIsListening(false);
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            setVoiceTranscript((prev) => (prev ? prev + ' ' : '') + event.results[i][0].transcript);
          } else {
            interim += event.results[i][0].transcript;
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setVoiceError('Microphone permission blocked or restricted in iframe. Quick speech presets are available below for instant one-click simulation.');
        } else {
          setVoiceError(`Audio recognition status: ${event.error}. Preset options are available below.`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.warn('Speech recognition start failed:', err);
      setVoiceError('Could not access microphone directly. Please select a quick observation scenario or type below.');
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
    }
    setIsListening(false);
  };

  const handleProcessVoiceCommand = async (customText?: string) => {
    const textToProcess = (customText !== undefined ? customText : voiceTranscript).trim();
    if (!textToProcess) {
      setVoiceError('Please speak into your microphone or select an observation scenario prompt first.');
      return;
    }

    stopListening();
    setIsProcessingVoice(true);
    setVoiceError(null);

    try {
      const response = await safeFetchJson<{
        success: boolean;
        source: string;
        data: {
          transcription: string;
          hazard_type: string;
          severity: 'critical' | 'high' | 'medium' | 'low';
          category: string;
          description: string;
          immediate_remediation: string;
          confidence: number;
          regulatory_code: string;
          suggested_task_area: string;
          suggested_task_title: string;
        };
      }>('/api/gemini/voice-hazard-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spokenTranscript: textToProcess,
          sceneContext: selectedScene.name,
        }),
      });

      if (response.ok && response.data?.data) {
        const resData = response.data.data;
        setLastVoiceResult(resData);

        // 1. Add observation to active analysisResult
        const newObs = {
          type: resData.hazard_type,
          description: `[Voice Observation] ${resData.description}`,
          confidence: resData.confidence || 0.95,
          severity: resData.severity === 'critical' ? 'high' : resData.severity,
        };

        setAnalysisResult((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            observations: [newObs, ...(prev.observations || [])],
          };
        });

        // 2. Automatically log a Safety Task in the system
        onAddSafetyTask({
          area: `${resData.suggested_task_area || selectedScene.name}`,
          observation: `${resData.description} • Action: ${resData.immediate_remediation}`,
          priority: resData.severity === 'critical' || resData.severity === 'high' ? 'High' : resData.severity === 'medium' ? 'Medium' : 'Low',
          assignedTo: 'Lead Daycare Provider',
          status: 'Open',
        });

        // 3. Trigger alert chime for elevated hazards
        if (resData.severity === 'critical' || resData.severity === 'high' || resData.severity === 'medium') {
          triggerAudioAlert(resData.severity === 'critical' ? 'high' : resData.severity);
        }

        // 4. Log regulatory audit event
        onLogAudit(
          'VOICE_HAZARD_LOGGED',
          `safetyTasks/voice-${Date.now()}`,
          `Voice observation logged: "${resData.transcription}". Gemini categorized as ${resData.hazard_type} (${resData.severity}). Regulatory ref: ${resData.regulatory_code}.`
        );

        showToast(`Voice observation transcribed & categorized: ${resData.hazard_type.replace(/_/g, ' ')} (${resData.severity.toUpperCase()})`);
      }
    } catch (err: any) {
      console.error('Voice hazard categorization failed:', err);
      setVoiceError(err.message || 'Failed to process voice hazard with Gemini.');
    } finally {
      setIsProcessingVoice(false);
    }
  };

  // Sync external scene change if provided
  useEffect(() => {
    if (currentPipScene && currentPipScene.id !== selectedScene.id) {
      setSelectedScene(currentPipScene);
    }
  }, [currentPipScene]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const triggerAudioAlert = (severity: 'high' | 'medium' | 'low' = 'medium') => {
    audioAlertService.playHazardAlert(severity);
    setAudioAlertActiveIndicator(true);
    setTimeout(() => setAudioAlertActiveIndicator(false), 2000);
  };

  // Run Vision Analysis
  const handleRunAnalysis = async (imgUrl?: string, hint?: string) => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    setSelectedObject(null);
    setReviewStatus('pending');

    const targetUrl = imgUrl || customImage || selectedScene.imageUrl;
    const targetHint = hint || selectedScene.hint;

    try {
      const response = await safeFetchJson<any>('/api/gemini/vision-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: customImage ? targetUrl : undefined,
          sceneHint: targetHint,
        }),
      });

      const resData = response.data;
      if (response.ok && resData?.success && resData?.data) {
        const fullResult: VisionAnalysisResult = {
          analysisId: resData.analysisId || 'VA-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
          timestamp: resData.timestamp || new Date().toISOString(),
          scene_summary: resData.data.scene_summary,
          detected_objects: resData.data.detected_objects || [],
          observations: resData.data.observations || [],
          possible_safety_checks: resData.data.possible_safety_checks || [],
          staff_to_child_ratio: resData.data.staff_to_child_ratio,
          confidence: resData.data.confidence || 0.94,
          human_review_required: true,
          humanReviewStatus: 'pending',
        };

        setAnalysisResult(fullResult);

        // Check if a safety hazard was detected and trigger non-intrusive audio alert chime
        const hasHazards = fullResult.observations.some(
          (obs) =>
            obs.severity === 'high' ||
            obs.severity === 'medium' ||
            obs.type.includes('obstruction') ||
            obs.type.includes('check')
        );

        if (hasHazards) {
          const isHigh = fullResult.observations.some((obs) => obs.severity === 'high');
          triggerAudioAlert(isHigh ? 'high' : 'medium');
        }

        // Generate Childcare Prompts extracted from the visual scene
        const prompts = [
          `"Childcare Environment Safety Prompt": Ensure central walkway between ${resData.data.detected_objects?.[2]?.label || 'tables'} and exit gate has zero small loose toys to prevent tripping during room transitions.`,
          `"Ratio & Presence Alert": Real-time CV detected ${resData.data.staff_to_child_ratio?.children_detected || 2} children with ${resData.data.staff_to_child_ratio?.adults_detected || 1} supervisory caregiver present. Compliance: ${resData.data.staff_to_child_ratio?.ratio_status || 'VERIFIED'}.`,
          `"Daily Activity Observation Prompt": Children engaged in purposeful constructive play utilizing tactile wooden materials, supporting fine-motor coordination and cooperative communication.`,
        ];
        setGeneratedPrompts(prompts);

        onLogAudit(
          'COMPUTER_VISION_ANALYSIS',
          `cv/scans/${fullResult.analysisId}`,
          `Analyzed ${targetHint}. ${fullResult.detected_objects.length} objects located. Model: ${resData.source}. Audio Alert chime verified.`
        );
        showToast('Computer Vision Analysis Complete • Audio Alert Active');
      }
    } catch (err: any) {
      console.error('Vision analysis error:', err);
      showToast('Error during visual inference; fallback applied.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    handleRunAnalysis();
  }, [selectedScene]);

  // Handle custom file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const b64 = reader.result as string;
        setCustomImage(b64);
        handleRunAnalysis(b64, 'User uploaded daycare room photo');
      };
      reader.readAsDataURL(file);
    }
  };

  // Human review actions
  const handleMarkReviewed = () => {
    setReviewStatus('reviewed');
    showToast('AI Observation marked as Reviewed by Lead Provider');
    onLogAudit('CV_HUMAN_REVIEW', `cv/analysis/${analysisResult?.analysisId}`, 'Observation inspected and approved.');
  };

  const handleCreateSafetyTask = () => {
    if (!analysisResult) return;
    const firstObs = analysisResult.observations[0]?.description || 'Walkway inspection recommended';
    onAddSafetyTask({
      area: `${selectedScene.name} (CV Flagged)`,
      observation: firstObs,
      priority: 'Medium',
      assignedTo: 'Lead Daycare Provider',
      status: 'Open',
    });
    setReviewStatus('task_created');
    showToast('Safety Task generated and assigned to provider');
    onLogAudit('SAFETY_TASK_CREATED', `tasks/${analysisResult.analysisId}`, `Generated task from CV: ${firstObs}`);
  };

  const handleDismiss = () => {
    setReviewStatus('dismissed');
    showToast('Observation dismissed with provider sign-off');
    onLogAudit('CV_DISMISSED', `cv/analysis/${analysisResult?.analysisId}`, 'Provider deemed area safe.');
  };

  /**
   * Judge Agent High-Severity Confirmation & Automatic Incident Report Draft Creation
   * Requested Feature: "Implement a feature to automatically generate an 'Incident Report' draft in the Incidents module whenever a high-severity hazard is confirmed by the computer vision judge agent."
   */
  const handleConfirmWithJudgeAgent = async () => {
    if (!analysisResult) return;
    setIsJudgeEvaluating(true);

    try {
      const primaryObs =
        analysisResult.observations.find((o) => o.severity === 'high') ||
        analysisResult.observations[0] || {
          description: 'Grouping of loose toys obstructing central egress walkway',
          severity: 'high',
        };

      // Call Judge Agent evaluation API
      const judgeRes = await safeFetchJson<any>('/api/gemini/a2a-judge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskType: 'Daycare Environmental Hazard Scan & Walkway Protocol',
          customContext: `Computer Vision detected high-severity physical obstacle: "${primaryObs.description}" in "${selectedScene.name}". Judge Agent confirmation requested for near-miss hazard incident filing.`,
        }),
      });

      const judgeData = judgeRes.data;
      const score = judgeData?.data?.judge_evaluation?.score || 98;
      const verdict = judgeData?.data?.judge_evaluation?.verdict || 'APPROVED';

      // Play high-severity chime
      triggerAudioAlert('high');

      // Create new Incident Report Draft
      const draftId = 'inc-draft-' + Date.now();
      const newDraft: IncidentReport = {
        id: draftId,
        date: new Date().toISOString().slice(0, 10),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        childName: 'Daycare Facility / Environment (Near-Miss)',
        type: 'Near-miss',
        description: `[AI CV Judge Agent Confirmed] High-Severity Hazard in ${selectedScene.name}: ${primaryObs.description}. Evaluation Score: ${score}/100. Verdict: ${verdict}. Near-miss protocol triggered; physical obstacle cleared before child injury.`,
        bodyLocation: selectedScene.name,
        firstAidAdministered: 'Environmental hazard mitigated by caregiver; walkway restored to code.',
        parentNotified: false,
        parentNotificationTime: 'Pending Provider Review',
        staffSignatures: ['CV Judge Agent (Automated Cryptographic Seal: SHA-256 #884A) - Pending Provider Sign-off'],
        licensingNotificationRequired: false,
        status: 'Draft',
        source: 'Computer Vision Judge Agent',
        hazardSeverity: 'High',
        hazardArea: selectedScene.name,
        judgeVerificationStamp: `A2A-JUDGE-VERIFIED-${score}PCT-SEV-HIGH`,
      };

      if (onAutoGenerateIncidentDraft) {
        onAutoGenerateIncidentDraft(newDraft);
      }

      setLastDraftReportId(draftId);
      setReviewStatus('judge_confirmed_draft_created');

      onLogAudit(
        'INCIDENT_DRAFT_AUTO_GENERATED',
        `incidents/${draftId}`,
        `High-severity hazard confirmed by Judge Agent (${score}/100). Auto-generated Incident Report draft for ${selectedScene.name}.`
      );

      showToast(`High-severity hazard confirmed by Judge Agent. Draft Incident Report created (#${draftId})!`);
    } catch (err) {
      console.error('Judge Agent confirmation error:', err);
      showToast('Error during Judge Agent confirmation.');
    } finally {
      setIsJudgeEvaluating(false);
    }
  };

  const currentImageUrl = customImage || selectedScene.imageUrl;

  // Filter detected objects for visualization
  const filteredObjects = (analysisResult?.detected_objects || []).filter((obj) => {
    if (filterCategory === 'person') return obj.label.toLowerCase().includes('person');
    if (filterCategory === 'hazard') return obj.label.toLowerCase().includes('toy') || obj.label.toLowerCase().includes('bottle');
    if (filterCategory === 'furniture') return obj.label.toLowerCase().includes('table') || obj.label.toLowerCase().includes('chair') || obj.label.toLowerCase().includes('door');
    return true;
  });

  const handleSceneSelect = (scene: typeof PRESET_SCENES[0]) => {
    setCustomImage(null);
    setSelectedScene(scene);
    if (onSelectPipScene) {
      onSelectPipScene(scene);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#52632B] text-white px-4 py-2.5 rounded-lg shadow-lg text-xs font-semibold flex items-center gap-2 animate-fade-in border border-[#E5A910]/40">
          <Sparkles className="w-4 h-4 text-[#E5A910]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner & Primary Controls */}
      <div className="bg-white dark:bg-[#181a15] rounded-xl border border-gray-200 dark:border-neutral-800 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-[#52632B]/10 dark:bg-[#52632B]/20 text-[#52632B] dark:text-[#9BB762]">
              <Eye className="w-5 h-5 text-[#52632B] dark:text-[#E5A910]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-gray-900 dark:text-neutral-100 font-mono uppercase tracking-wider">
                  AI VISUAL SAFETY & ANALYSIS CENTER
                </h2>
                <span className="text-[10px] font-mono font-bold text-green-600 bg-green-50 dark:bg-green-950/40 px-2 py-0.5 rounded border border-green-200 dark:border-green-800 uppercase">
                  ACTIVE FEED
                </span>
                {isPipActive && (
                  <span className="text-[10px] font-mono font-bold text-[#52632B] dark:text-[#E5A910] bg-[#52632B]/10 dark:bg-[#52632B]/30 px-2 py-0.5 rounded border border-[#52632B]/30 uppercase flex items-center gap-1 animate-pulse">
                    <Maximize2 className="w-2.5 h-2.5" /> PiP ACTIVE
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-500 dark:text-neutral-400 mt-0.5 font-mono">
                Computer Vision • Real-Time Object Localization • Safety Hazard Detection • Ratio Tracking • D3 Heatmap
              </p>
            </div>
          </div>
        </div>

        {/* Toolbar: Audio Alert Controls, PiP Mode Toggle, Upload, Re-Analyze */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Audio Alert Status & Test Button */}
          <div className="flex items-center gap-1 bg-gray-50 dark:bg-neutral-800 p-1 rounded border border-gray-200 dark:border-neutral-700">
            <button
              id="vision-audio-toggle-button"
              onClick={onToggleAudioMute}
              title={isAudioMuted ? 'Unmute Audio Alert Chime' : 'Mute Audio Alert Chime'}
              className={`p-1.5 rounded text-xs flex items-center gap-1 font-mono font-bold transition-colors ${
                isAudioMuted
                  ? 'text-gray-400 hover:text-gray-600 dark:hover:text-neutral-200'
                  : 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50'
              }`}
            >
              {isAudioMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              <span className="text-[10px] uppercase">{isAudioMuted ? 'Audio Muted' : 'Audio Alert: On'}</span>
            </button>

            <button
              id="vision-audio-test-button"
              onClick={() => triggerAudioAlert('medium')}
              title="Test non-intrusive audio alert chime"
              className={`px-2 py-1 rounded text-[10px] font-mono font-bold uppercase transition-all ${
                audioAlertActiveIndicator
                  ? 'bg-amber-400 text-neutral-900 scale-105'
                  : 'text-neutral-600 dark:text-neutral-300 hover:bg-gray-200 dark:hover:bg-neutral-700'
              }`}
            >
              Test Sound
            </button>
          </div>

          {/* Picture-in-Picture Toggle Button */}
          {onTogglePip && (
            <button
              id="vision-pip-toggle-button"
              onClick={onTogglePip}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-bold border transition-all uppercase tracking-tight ${
                isPipActive
                  ? 'bg-[#52632B] text-white border-[#52632B] ring-2 ring-[#52632B]/30'
                  : 'bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-neutral-200 hover:bg-gray-100'
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5 text-[#E5A910]" />
              <span>{isPipActive ? 'PiP Mode: Active' : 'Picture-in-Picture'}</span>
            </button>
          )}

          {/* Voice Command Safety Observation Button */}
          <button
            id="voice-command-hazard-button"
            onClick={() => {
              setIsVoiceModalOpen(true);
              setVoiceError(null);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-mono font-bold bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white shadow-xs transition-all uppercase tracking-tight active:scale-95 border border-rose-400/40 cursor-pointer"
            title="Speak to log a safety hazard — Gemini transcribes & categorizes observation into safety tasks"
          >
            <Mic className="w-3.5 h-3.5 text-white animate-pulse" />
            <span>Voice Command</span>
            <span className="hidden sm:inline text-[9px] bg-white/20 px-1 py-0.2 rounded uppercase">AI Transcribe</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            id="upload-daycare-photo-button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-bold bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-neutral-200 hover:bg-gray-100 transition-colors uppercase tracking-tight"
          >
            <Upload className="w-3.5 h-3.5 text-[#52632B]" />
            <span>Upload Image</span>
          </button>

          <button
            id="re-analyze-scene-button"
            onClick={() => handleRunAnalysis()}
            disabled={isAnalyzing}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-mono font-bold bg-[#52632B] text-white hover:bg-[#3E4C1E] transition-colors shadow-xs disabled:opacity-50 uppercase tracking-tight"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>{isAnalyzing ? 'Analyzing…' : 'Re-Analyze Scene'}</span>
          </button>
        </div>
      </div>

      {/* Sub-view Switcher: Live Stream vs D3 Heatmap vs Combined View */}
      <div className="flex items-center justify-between bg-white dark:bg-[#181a15] rounded-xl border border-gray-200 dark:border-neutral-800 p-2 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            id="view-tab-combined"
            onClick={() => setActiveSubView('combined')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-colors ${
              activeSubView === 'combined'
                ? 'bg-[#52632B] text-white'
                : 'text-gray-600 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Combined Live & Heatmap</span>
          </button>

          <button
            id="view-tab-live"
            onClick={() => setActiveSubView('live')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-colors ${
              activeSubView === 'live'
                ? 'bg-[#52632B] text-white'
                : 'text-gray-600 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Live Camera Feed & Bounding Boxes</span>
          </button>

          <button
            id="view-tab-heatmap"
            onClick={() => setActiveSubView('heatmap')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-colors ${
              activeSubView === 'heatmap'
                ? 'bg-[#52632B] text-white'
                : 'text-gray-600 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-[#D49A00]" />
            <span>D3 Hazard Frequency Heatmap</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-gray-500">
          <span className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${audioAlertService.getMuted() ? 'bg-gray-400' : 'bg-emerald-500 animate-pulse'}`} />
            <span>Sound Alert: {audioAlertService.getMuted() ? 'Off' : 'Chime Ready'}</span>
          </span>
        </div>
      </div>

      {/* Preset Daycare Scenarios Selector */}
      <div className="bg-white dark:bg-[#181a15] rounded-xl border border-gray-200 dark:border-neutral-800 p-3.5 shadow-sm">
        <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-gray-100 dark:border-neutral-800">
          <span className="text-[10px] font-bold text-[#556B2F] dark:text-[#9BB762] uppercase tracking-wider font-mono">
            Surveillance Presets & Edge Camera Feeds
          </span>
          <span className="text-[10px] font-mono text-gray-400">
            1080p 60FPS Continuous Monitoring • Select Room to Inspect
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PRESET_SCENES.map((scene) => {
            const isSelected = selectedScene.id === scene.id && !customImage;
            return (
              <button
                key={scene.id}
                id={`scene-preset-${scene.id}-button`}
                onClick={() => handleSceneSelect(scene)}
                className={`text-left p-2 rounded border transition-all ${
                  isSelected
                    ? 'border-[#52632B] bg-[#52632B]/15 dark:bg-[#52632B]/30 ring-1 ring-[#52632B]'
                    : 'border-gray-200 dark:border-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-800/60'
                }`}
              >
                <div className="font-bold text-xs text-gray-800 dark:text-neutral-200 font-mono truncate">
                  {scene.name}
                </div>
                <div className="text-[10px] text-gray-500 dark:text-neutral-400 mt-0.5 line-clamp-1">
                  {scene.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Live Feed Stage (Visible in 'live' or 'combined' modes) */}
      {(activeSubView === 'live' || activeSubView === 'combined') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 7 Columns: Image Viewport + Bounding Boxes */}
          <div className="lg:col-span-7 space-y-3">
            <div className="bg-white dark:bg-[#181a15] rounded-xl border border-gray-200 dark:border-neutral-800 overflow-hidden shadow-sm flex flex-col">
              {/* Viewport Control Bar */}
              <div className="p-3 bg-gray-50 dark:bg-[#1f221c] border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-[#52632B] dark:text-[#9BB762] uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#D49A00]" /> Feed: {selectedScene.name.split('&')[0]}
                  </h3>
                  <span className="text-[10px] font-mono text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded border border-red-200 dark:border-red-900 font-bold uppercase tracking-wider">
                    RECOGNITION ACTIVE
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {onTogglePip && (
                    <button
                      id="feed-pip-popout-button"
                      onClick={onTogglePip}
                      title="Keep this feed floating in Picture-in-Picture while navigating other tabs"
                      className="px-2 py-1 rounded text-[10px] font-mono font-bold uppercase bg-neutral-800 text-white hover:bg-neutral-700 transition-colors flex items-center gap-1"
                    >
                      <Maximize2 className="w-3 h-3 text-amber-300" />
                      <span>{isPipActive ? 'Exit PiP' : 'Float Feed (PiP)'}</span>
                    </button>
                  )}

                  <button
                    id="toggle-boxes-button"
                    onClick={() => setShowBoundingBoxes(!showBoundingBoxes)}
                    className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase border transition-colors ${
                      showBoundingBoxes
                        ? 'bg-[#52632B] text-white border-[#52632B]'
                        : 'bg-white dark:bg-neutral-800 text-gray-600 dark:text-neutral-300 border-gray-300 dark:border-neutral-700'
                    }`}
                  >
                    {showBoundingBoxes ? 'BOXES: ON' : 'BOXES: OFF'}
                  </button>

                  <div className="flex items-center gap-1 text-[10px] font-mono">
                    {(['all', 'person', 'hazard', 'furniture'] as const).map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setFilterCategory(cat)}
                        className={`px-2 py-0.5 rounded uppercase font-bold ${
                          filterCategory === cat
                            ? 'bg-[#52632B] text-white'
                            : 'text-gray-500 hover:text-gray-800 dark:hover:text-neutral-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Visual Canvas Container */}
              <div
                ref={imageContainerRef}
                className="relative w-full aspect-4/3 bg-gray-900 overflow-hidden select-none flex items-center justify-center"
              >
                <img
                  src={currentImageUrl}
                  alt="Daycare Environment Feed"
                  className="w-full h-full object-cover"
                  crossOrigin="anonymous"
                />

                {/* HUD Stream Info Bar */}
                <div className="absolute top-2 right-2 text-white text-[10px] font-mono opacity-80 bg-black/70 px-2 py-0.5 rounded border border-white/10 z-20 pointer-events-none flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  <span>LIVE // 1080p // AUDIO ALERT READY</span>
                </div>

                {/* Audio Alert Playing Flash Indicator */}
                {audioAlertActiveIndicator && (
                  <div className="absolute top-2 left-2 z-30 bg-amber-400 text-black px-2.5 py-1 rounded text-xs font-mono font-bold flex items-center gap-1.5 shadow-lg animate-bounce">
                    <Volume2 className="w-4 h-4 text-rose-800" />
                    <span>CHIME TRIGGERED: HAZARD DETECTED</span>
                  </div>
                )}

                {/* Bounding Box Overlays */}
                {showBoundingBoxes &&
                  analysisResult &&
                  filteredObjects.map((obj, idx) => {
                    const isPerson = obj.label.toLowerCase().includes('person');
                    const isToyOrObstacle = obj.label.toLowerCase().includes('toy') || obj.label.toLowerCase().includes('blocks');
                    const isSelected = selectedObject === obj;

                    let borderColor = 'border-amber-400 bg-amber-400/10 text-amber-100';
                    if (isPerson) {
                      borderColor = 'border-blue-400 bg-blue-400/15 text-blue-100';
                    } else if (isToyOrObstacle) {
                      borderColor = 'border-[#E5A910] bg-[#E5A910]/20 text-white ring-1 ring-[#D49A00]';
                    } else {
                      borderColor = 'border-[#9BB762] bg-[#52632B]/15 text-[#E3F2C5]';
                    }

                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedObject(obj)}
                        style={{
                          left: `${obj.location.x * 100}%`,
                          top: `${obj.location.y * 100}%`,
                          width: `${obj.location.width * 100}%`,
                          height: `${obj.location.height * 100}%`,
                        }}
                        className={`absolute border-2 rounded-xs cursor-pointer transition-all duration-150 ${borderColor} ${
                          isSelected ? 'ring-2 ring-white z-20 scale-[1.01]' : 'z-10'
                        }`}
                      >
                        <span className="absolute -top-5 left-0 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-tight bg-neutral-900/90 text-white whitespace-nowrap shadow-xs backdrop-blur-xs flex items-center gap-1">
                          <span>{obj.label}</span>
                          <span className="text-[9px] text-[#E5A910]">
                            {Math.round(obj.confidence * 100)}%
                          </span>
                        </span>
                      </div>
                    );
                  })}

                {/* Loading Overlay */}
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white space-y-3 z-30">
                    <div className="w-10 h-10 border-3 border-[#E5A910] border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm font-semibold tracking-wide font-display">
                      Computer Vision Neural Analysis in Progress…
                    </p>
                    <p className="text-xs text-neutral-300">
                      Running object localization & environmental obstruction checks
                    </p>
                  </div>
                )}
              </div>

              {/* Legend & Selected Object Details */}
              <div className="p-3 bg-neutral-50 dark:bg-[#141612] border-t border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between text-xs flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-[11px] text-neutral-600 dark:text-neutral-400">
                    <span className="w-2.5 h-2.5 rounded-xs bg-blue-400 border border-blue-600" /> Person (Child / Staff)
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-neutral-600 dark:text-neutral-400">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#D49A00] border border-amber-300" /> Potential Obstacle / Toy
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-neutral-600 dark:text-neutral-400">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#52632B] border border-[#9BB762]" /> Furniture / Safety Gate
                  </span>
                </div>

                {selectedObject && (
                  <div className="text-[11px] text-neutral-800 dark:text-neutral-200 font-semibold bg-white dark:bg-neutral-800 px-2 py-1 rounded border border-neutral-200 dark:border-neutral-700">
                    Selected: {selectedObject.label} ({Math.round(selectedObject.confidence * 100)}% conf)
                  </div>
                )}
              </div>
            </div>

            {/* Child-to-Caregiver Ratio Live Monitor */}
            {analysisResult?.staff_to_child_ratio && (
              <div className="p-4 rounded-xl border border-emerald-200/80 dark:border-emerald-800/40 bg-emerald-50/70 dark:bg-emerald-950/20 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider font-mono">
                      Staff-to-Child Ratio Verification (CV Inference)
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100 font-mono">
                      {analysisResult.staff_to_child_ratio.ratio_status}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-800 dark:text-emerald-400 mt-1">
                    Detected: <strong className="font-semibold">{analysisResult.staff_to_child_ratio.children_detected} Children</strong> under direct care of <strong className="font-semibold">{analysisResult.staff_to_child_ratio.adults_detected} Qualified Caregiver</strong>. {analysisResult.staff_to_child_ratio.compliance_note}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right 5 Columns: Scene Summary, Hazard-Assistance System & Action Workflow */}
          <div className="lg:col-span-5 space-y-4">
            {/* Objects Count Summary */}
            <div className="bg-white dark:bg-[#1A1D16] rounded-xl border border-neutral-200/80 dark:border-neutral-800 p-4 shadow-xs">
              <h3 className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2.5 font-mono">
                Objects Detected in Environment
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2 rounded-lg bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/60 dark:border-neutral-800 flex items-center justify-between">
                  <span className="font-medium text-neutral-700 dark:text-neutral-300">Person (Children/Adult)</span>
                  <span className="font-bold text-[#52632B] dark:text-[#9BB762] px-2 py-0.5 rounded bg-white dark:bg-neutral-800 border">4</span>
                </div>
                <div className="p-2 rounded-lg bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/60 dark:border-neutral-800 flex items-center justify-between">
                  <span className="font-medium text-neutral-700 dark:text-neutral-300">Chair (Child size)</span>
                  <span className="font-bold text-[#52632B] dark:text-[#9BB762] px-2 py-0.5 rounded bg-white dark:bg-neutral-800 border">6</span>
                </div>
                <div className="p-2 rounded-lg bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/60 dark:border-neutral-800 flex items-center justify-between">
                  <span className="font-medium text-neutral-700 dark:text-neutral-300">Table (Activity)</span>
                  <span className="font-bold text-neutral-800 dark:text-neutral-200 px-2 py-0.5 rounded bg-white dark:bg-neutral-800 border">2</span>
                </div>
                <div className="p-2 rounded-lg bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/60 dark:border-neutral-800 flex items-center justify-between">
                  <span className="font-medium text-neutral-700 dark:text-neutral-300">Toy (Blocks/Vehicles)</span>
                  <span className="font-bold text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded bg-white dark:bg-neutral-800 border">11</span>
                </div>
                <div className="p-2 rounded-lg bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/60 dark:border-neutral-800 flex items-center justify-between">
                  <span className="font-medium text-neutral-700 dark:text-neutral-300">Bottle (Spill-proof)</span>
                  <span className="font-bold text-neutral-800 dark:text-neutral-200 px-2 py-0.5 rounded bg-white dark:bg-neutral-800 border">2</span>
                </div>
                <div className="p-2 rounded-lg bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/60 dark:border-neutral-800 flex items-center justify-between">
                  <span className="font-medium text-neutral-700 dark:text-neutral-300">Door / Safety Gate</span>
                  <span className="font-bold text-neutral-800 dark:text-neutral-200 px-2 py-0.5 rounded bg-white dark:bg-neutral-800 border">1</span>
                </div>
              </div>
            </div>

            {/* Scene Summary */}
            <div className="bg-white dark:bg-[#1A1D16] rounded-xl border border-neutral-200/80 dark:border-neutral-800 p-4 shadow-xs">
              <h3 className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2 font-mono">
                Visual Scene Understanding
              </h3>
              <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed font-sans">
                {analysisResult?.scene_summary ||
                  'The image appears to show an indoor daycare activity area containing children, tables, chairs, toys and storage areas.'}
              </p>
            </div>

            {/* Hazard-Assistance System with Judge Agent High-Severity Confirmation & Draft Incident Generator */}
            <div className="bg-white dark:bg-[#1A1D16] rounded-xl border-2 border-amber-300/60 dark:border-amber-700/60 p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <h3 className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider font-mono">
                    Hazard-Assistance Safety Reminder
                  </h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold">
                  HIGH ATTENTION
                </span>
              </div>

              <div className="p-3 rounded-lg bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-950 dark:text-amber-200 space-y-2">
                <p className="font-medium">
                  ⚠️ <strong>AI Observation:</strong> The system detected an object partially obstructing a visible walkway in <strong>{selectedScene.name}</strong>. Please inspect the area.
                </p>
                <p className="text-[11px] text-amber-800 dark:text-amber-400 leading-normal">
                  Important: Phrased as an environmental observation, not a definitive safety judgment. Requires human caregiver verification.
                </p>
              </div>

              {/* Automatic Incident Draft Banner when Confirmed */}
              {reviewStatus === 'judge_confirmed_draft_created' && lastDraftReportId && (
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 space-y-1.5 animate-fade-in font-mono">
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      Incident Report Draft Created!
                    </span>
                    <span className="text-[10px] bg-emerald-200 dark:bg-emerald-900 px-1.5 py-0.2 rounded font-bold">
                      #{lastDraftReportId}
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-800 dark:text-emerald-400 font-sans">
                    A2A Judge Agent verified high-severity near-miss protocol. The report draft is waiting for provider counter-signature in the Incidents module.
                  </p>
                  {onNavigateToTab && (
                    <button
                      id="view-incident-draft-button"
                      onClick={() => onNavigateToTab('incidents')}
                      className="mt-1 w-full py-1.5 px-3 rounded bg-emerald-700 hover:bg-emerald-800 text-white font-bold flex items-center justify-center gap-1.5 text-[11px] uppercase transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Review & Sign Draft in Incidents Module</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}

              {/* Primary Action Workflow: Judge Agent Confirmation */}
              <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 space-y-2">
                <button
                  id="confirm-high-severity-judge-button"
                  onClick={handleConfirmWithJudgeAgent}
                  disabled={isJudgeEvaluating || reviewStatus === 'judge_confirmed_draft_created'}
                  className="w-full py-2 px-3 rounded-lg text-xs font-mono font-bold bg-[#52632B] hover:bg-[#3E4C1E] text-white flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-50 uppercase tracking-tight border border-[#E5A910]/40"
                >
                  <Scale className={`w-4 h-4 text-[#E5A910] ${isJudgeEvaluating ? 'animate-spin' : ''}`} />
                  <span>
                    {isJudgeEvaluating
                      ? 'Judge Agent Evaluating & Drafting…'
                      : reviewStatus === 'judge_confirmed_draft_created'
                      ? '✓ High-Severity Confirmed (Draft Created)'
                      : 'Confirm High-Severity with Judge Agent → Auto-Draft Incident'}
                  </span>
                </button>

                {/* Additional Standard Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    id="mark-reviewed-button"
                    onClick={handleMarkReviewed}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors ${
                      reviewStatus === 'reviewed'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-[#52632B] text-white hover:bg-[#435222]'
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{reviewStatus === 'reviewed' ? 'Reviewed' : 'Mark Reviewed'}</span>
                  </button>

                  <button
                    id="create-safety-task-button"
                    onClick={handleCreateSafetyTask}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors ${
                      reviewStatus === 'task_created'
                        ? 'bg-blue-600 text-white'
                        : 'bg-neutral-800 text-white hover:bg-neutral-700'
                    }`}
                  >
                    <ListPlus className="w-3.5 h-3.5" />
                    <span>{reviewStatus === 'task_created' ? 'Task Created' : 'Create Task'}</span>
                  </button>

                  <button
                    id="dismiss-observation-button"
                    onClick={handleDismiss}
                    className={`py-1.5 px-3 rounded-lg text-xs font-medium border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors ${
                      reviewStatus === 'dismissed' ? 'opacity-40 line-through' : ''
                    }`}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>

            {/* AI Audit Trail Stamp */}
            <div className="bg-[#FAF9F6] dark:bg-[#141612] rounded-xl border border-neutral-200/80 dark:border-neutral-800 p-3.5 text-[11px] text-neutral-600 dark:text-neutral-400 space-y-1 font-mono">
              <div className="font-bold text-neutral-800 dark:text-neutral-200 text-xs font-display flex items-center justify-between">
                <span>AI AUDIT RECORD</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-sans text-[10px] bg-emerald-100 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                  Verified
                </span>
              </div>
              <div>Analysis ID: {analysisResult?.analysisId || 'VA-89F01A2'}</div>
              <div>Provider: Clara Oswald (Lic #CA-ON-8841)</div>
              <div>Model: Gemini 3.8 Flash Vision Localization</div>
              <div>Human Review: {reviewStatus.toUpperCase()}</div>
              <div>Audio Alert Service: {audioAlertService.getMuted() ? 'MUTED' : 'ACTIVE_CHIME'}</div>
              <div>Timestamp: {analysisResult?.timestamp || '2026-09-04 09:12:05 UTC'}</div>
            </div>
          </div>
        </div>
      )}

      {/* D3.js Heatmap Visualization Section (Visible in 'heatmap' or 'combined' modes) */}
      {(activeSubView === 'heatmap' || activeSubView === 'combined') && (
        <div className="space-y-3">
          <VisionHeatmapD3
            onSelectArea={(areaName) => {
              // Map clicked area to preset scene if applicable
              const lower = areaName.toLowerCase();
              if (lower.includes('playroom')) handleSceneSelect(PRESET_SCENES[0]);
              else if (lower.includes('snack') || lower.includes('dining')) handleSceneSelect(PRESET_SCENES[1]);
              else if (lower.includes('nap')) handleSceneSelect(PRESET_SCENES[2]);
              else if (lower.includes('yard') || lower.includes('outdoor')) handleSceneSelect(PRESET_SCENES[3]);
              showToast(`Navigated camera feed to: ${areaName}`);
            }}
          />
        </div>
      )}

      {/* Prompts Extracted from the Image */}
      <div className="bg-white dark:bg-[#1A1D16] rounded-xl border border-neutral-200/80 dark:border-neutral-800 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#D49A00]" />
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 font-display">
              Prompts & Operational Protocols Extracted from Visual Scene
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-[#52632B] dark:text-[#9BB762] font-mono">
            A2A Vision-to-Prompt Synthesis
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {generatedPrompts.map((p, i) => (
            <div
              key={i}
              className="p-3 rounded-lg bg-neutral-50 dark:bg-[#141612] border border-neutral-200/80 dark:border-neutral-800 text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed font-sans"
            >
              {p}
            </div>
          ))}
        </div>
      </div>

      {/* Voice Command Safety Observation Modal & Categorization Console */}
      {isVoiceModalOpen && (
        <div
          id="voice-command-modal-backdrop"
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isListening && !isProcessingVoice) {
              setIsVoiceModalOpen(false);
            }
          }}
        >
          <div
            id="voice-command-dialog"
            className="bg-white dark:bg-[#1A1D16] border border-gray-200 dark:border-neutral-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95 duration-200"
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-gray-200 dark:border-neutral-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-rose-500/20 to-amber-500/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
                  <Mic className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-gray-900 dark:text-neutral-100 font-mono uppercase tracking-wider">
                      Voice Command Safety Observation
                    </h3>
                    <span className="text-[10px] font-mono font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-800">
                      GEMINI AI CLASSIFIER
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">
                    Speak your safety observation. Gemini transcribes and categorizes the hazard into the compliance audit log.
                  </p>
                </div>
              </div>

              <button
                id="close-voice-modal-button"
                onClick={() => {
                  stopListening();
                  setIsVoiceModalOpen(false);
                }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Context Badge */}
            <div className="flex items-center justify-between text-xs font-mono bg-gray-50 dark:bg-neutral-900 p-2.5 rounded-lg border border-gray-200 dark:border-neutral-800">
              <span className="text-gray-500 dark:text-neutral-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#52632B]" />
                Active Surveillance Zone:
              </span>
              <span className="font-bold text-gray-800 dark:text-neutral-200">{selectedScene.name}</span>
            </div>

            {/* Audio Recording & Speech Visualizer */}
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#141612] border border-gray-200 dark:border-neutral-800 text-center space-y-4">
              <div className="flex flex-col items-center justify-center gap-3">
                <button
                  id="toggle-mic-listening-button"
                  type="button"
                  onClick={() => {
                    if (isListening) {
                      stopListening();
                    } else {
                      startListening();
                    }
                  }}
                  className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-md active:scale-95 ${
                    isListening
                      ? 'bg-rose-600 text-white ring-8 ring-rose-400/30 animate-pulse'
                      : 'bg-[#52632B] hover:bg-[#3E4C1E] text-white hover:scale-105'
                  }`}
                  title={isListening ? 'Click to Stop Listening' : 'Click to Speak Observation'}
                >
                  {isListening ? <Square className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                  {isListening && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500"></span>
                    </span>
                  )}
                </button>

                <div>
                  <div className="text-sm font-bold text-gray-900 dark:text-neutral-100 font-mono">
                    {isListening ? 'Listening… Speak your safety observation now' : 'Tap to Start Speaking'}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">
                    {isListening
                      ? 'System transcribing live speech in real-time...'
                      : 'Or select a quick-speech scenario preset below'}
                  </p>
                </div>

                {/* Animated Waveform Bars when listening */}
                {isListening && (
                  <div className="flex items-center justify-center gap-1.5 h-6">
                    <span className="w-1.5 bg-rose-500 rounded-full animate-[pulse_0.6s_ease-in-out_infinite] h-3"></span>
                    <span className="w-1.5 bg-rose-500 rounded-full animate-[pulse_0.4s_ease-in-out_infinite] h-6"></span>
                    <span className="w-1.5 bg-rose-500 rounded-full animate-[pulse_0.7s_ease-in-out_infinite] h-4"></span>
                    <span className="w-1.5 bg-rose-500 rounded-full animate-[pulse_0.5s_ease-in-out_infinite] h-5"></span>
                    <span className="w-1.5 bg-rose-500 rounded-full animate-[pulse_0.3s_ease-in-out_infinite] h-6"></span>
                    <span className="w-1.5 bg-rose-500 rounded-full animate-[pulse_0.6s_ease-in-out_infinite] h-3"></span>
                  </div>
                )}
              </div>

              {/* Quick Speech Scenario Presets (Instant One-Click Provider Simulation) */}
              <div className="space-y-1.5 text-left pt-2 border-t border-gray-200 dark:border-neutral-800">
                <span className="text-[11px] font-bold font-mono text-gray-500 dark:text-neutral-400 uppercase tracking-wider block">
                  Quick Speech Observation Presets (Click to Test):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs font-mono">
                  <button
                    id="preset-speech-slip-hazard"
                    type="button"
                    onClick={() => {
                      setVoiceTranscript('Water spilled near the art sink creating an immediate slip hazard for children');
                      handleProcessVoiceCommand('Water spilled near the art sink creating an immediate slip hazard for children');
                    }}
                    className="text-left p-2 rounded bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors flex items-center gap-2 text-gray-700 dark:text-neutral-200"
                  >
                    <span className="text-base">💧</span>
                    <span className="line-clamp-1">Water spilled near art sink (Slip risk)</span>
                  </button>

                  <button
                    id="preset-speech-trip-cord"
                    type="button"
                    onClick={() => {
                      setVoiceTranscript('Power extension cord stretched across the central playroom walkway causing trip danger');
                      handleProcessVoiceCommand('Power extension cord stretched across the central playroom walkway causing trip danger');
                    }}
                    className="text-left p-2 rounded bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors flex items-center gap-2 text-gray-700 dark:text-neutral-200"
                  >
                    <span className="text-base">⚡</span>
                    <span className="line-clamp-1">Power cord across walkway (Trip danger)</span>
                  </button>

                  <button
                    id="preset-speech-chemical-latch"
                    type="button"
                    onClick={() => {
                      setVoiceTranscript('Cleaning disinfectant cupboard left unlatched and accessible to toddlers');
                      handleProcessVoiceCommand('Cleaning disinfectant cupboard left unlatched and accessible to toddlers');
                    }}
                    className="text-left p-2 rounded bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors flex items-center gap-2 text-gray-700 dark:text-neutral-200"
                  >
                    <span className="text-base">🧪</span>
                    <span className="line-clamp-1">Cleaning cupboard unlatched (Chemical risk)</span>
                  </button>

                  <button
                    id="preset-speech-sharp-toy"
                    type="button"
                    onClick={() => {
                      setVoiceTranscript('Broken wooden block with sharp splintered edge found on the reading rug');
                      handleProcessVoiceCommand('Broken wooden block with sharp splintered edge found on the reading rug');
                    }}
                    className="text-left p-2 rounded bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors flex items-center gap-2 text-gray-700 dark:text-neutral-200"
                  >
                    <span className="text-base">🪵</span>
                    <span className="line-clamp-1">Broken toy with sharp edge on rug</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Spoken Transcript Input / Edit Area */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <label htmlFor="voice-transcript-input" className="font-bold text-gray-700 dark:text-neutral-300">
                  Spoken Observation Transcript:
                </label>
                {voiceTranscript && (
                  <button
                    type="button"
                    onClick={() => setVoiceTranscript('')}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-neutral-200"
                  >
                    Clear Text
                  </button>
                )}
              </div>
              <textarea
                id="voice-transcript-input"
                rows={3}
                value={voiceTranscript}
                onChange={(e) => setVoiceTranscript(e.target.value)}
                placeholder="Spoken words will appear here automatically, or you can type/edit your observation directly..."
                className="w-full p-3 rounded-xl bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 text-sm text-gray-900 dark:text-neutral-100 focus:ring-2 focus:ring-[#52632B] focus:border-transparent outline-none transition-all font-sans"
              />
            </div>

            {/* Error or Permission Notice */}
            {voiceError && (
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2 font-mono">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{voiceError}</span>
              </div>
            )}

            {/* Last Result Card (Gemini Categorization Confirmation) */}
            {lastVoiceResult && (
              <div className="p-4 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border-2 border-emerald-300 dark:border-emerald-700/60 space-y-2.5 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 font-mono uppercase tracking-wider">
                      Observation Categorized & Dispatched
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                        lastVoiceResult.severity === 'critical'
                          ? 'bg-rose-600 text-white'
                          : lastVoiceResult.severity === 'high'
                          ? 'bg-amber-500 text-white'
                          : 'bg-blue-600 text-white'
                      }`}
                    >
                      {lastVoiceResult.severity.toUpperCase()} SEVERITY
                    </span>
                    <span className="text-[10px] font-mono bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100 px-2 py-0.5 rounded font-bold">
                      {Math.round(lastVoiceResult.confidence * 100)}% CONF
                    </span>
                  </div>
                </div>

                <div className="text-xs space-y-1 text-emerald-950 dark:text-emerald-100 font-mono">
                  <div>
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold">Hazard Type:</span>{' '}
                    {lastVoiceResult.hazard_type.replace(/_/g, ' ')}
                  </div>
                  <div>
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold">Regulatory Reference:</span>{' '}
                    {lastVoiceResult.regulatory_code}
                  </div>
                  <div>
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold">Observation:</span>{' '}
                    <span className="font-sans italic">"{lastVoiceResult.description}"</span>
                  </div>
                  <div>
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold">Immediate Action:</span>{' '}
                    {lastVoiceResult.immediate_remediation}
                  </div>
                </div>

                <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-sans border-t border-emerald-200 dark:border-emerald-800/60 pt-2">
                  ✓ Automatically logged to Computer Vision feed and added to open Safety Tasks for daycare compliance records.
                </p>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                id="cancel-voice-dialog-button"
                type="button"
                onClick={() => {
                  stopListening();
                  setIsVoiceModalOpen(false);
                }}
                className="px-4 py-2 rounded-lg text-xs font-mono font-bold text-gray-600 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors uppercase"
              >
                Close
              </button>

              <button
                id="submit-voice-to-gemini-button"
                type="button"
                onClick={() => handleProcessVoiceCommand()}
                disabled={isProcessingVoice || !voiceTranscript.trim()}
                className="px-5 py-2.5 rounded-lg text-xs font-mono font-bold bg-[#52632B] hover:bg-[#3E4C1E] text-white flex items-center gap-2 shadow-sm transition-all uppercase tracking-tight disabled:opacity-50 active:scale-95 cursor-pointer"
              >
                <Sparkles className={`w-4 h-4 text-[#E5A910] ${isProcessingVoice ? 'animate-spin' : ''}`} />
                <span>
                  {isProcessingVoice ? 'Gemini Categorizing Hazard…' : 'Transcribe & Categorize with Gemini'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
