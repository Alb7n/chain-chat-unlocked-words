
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Play, Pause, Square } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface VoiceMessageProps {
  onVoiceMessage: (audioBlob: Blob, duration: number) => void;
}

const VoiceMessage: React.FC<VoiceMessageProps> = ({ onVoiceMessage }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setRecordedBlob(blob);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      toast({
        title: "Recording Error",
        description: "Could not access microphone",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const playRecording = () => {
    if (recordedBlob && !isPlaying) {
      const url = URL.createObjectURL(recordedBlob);
      audioRef.current = new Audio(url);
      audioRef.current.play();
      setIsPlaying(true);
      
      audioRef.current.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(url);
      };
    }
  };

  const pauseRecording = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const sendVoiceMessage = () => {
    if (recordedBlob) {
      onVoiceMessage(recordedBlob, recordingTime);
      setRecordedBlob(null);
      setRecordingTime(0);
      toast({
        title: "Voice Message Sent",
        description: "Your voice message is being processed",
      });
    }
  };

  const discardRecording = () => {
    setRecordedBlob(null);
    setRecordingTime(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (recordedBlob) {
    return (
      <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <Button
          variant="ghost"
          size="sm"
          onClick={isPlaying ? pauseRecording : playRecording}
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </Button>
        <span className="text-sm font-mono">{formatTime(recordingTime)}</span>
        <Button variant="outline" size="sm" onClick={sendVoiceMessage}>
          Send
        </Button>
        <Button variant="ghost" size="sm" onClick={discardRecording}>
          <Square size={16} />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={isRecording ? "destructive" : "outline"}
        size="sm"
        onClick={isRecording ? stopRecording : startRecording}
      >
        {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
      </Button>
      {isRecording && (
        <span className="text-sm font-mono text-red-600">
          {formatTime(recordingTime)}
        </span>
      )}
    </div>
  );
};

export default VoiceMessage;
