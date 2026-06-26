import { useState, useEffect, useRef } from 'react';

let globalAudio = null;

export function useSpeech() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [speechError, setSpeechError] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (!globalAudio) {
      globalAudio = new Audio();
      const unlock = () => {
        if (globalAudio.src === '') {
          // Play a tiny silent wav to unlock the audio context
          globalAudio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
          globalAudio.play().then(() => {
            globalAudio.pause();
            globalAudio.currentTime = 0;
          }).catch(() => {});
        }
        window.removeEventListener('click', unlock);
        window.removeEventListener('touchstart', unlock);
      };
      window.addEventListener('click', unlock);
      window.addEventListener('touchstart', unlock);
    }
    
    // Setup Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setSpeechError(event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const startListening = () => {
    if (!recognitionRef.current) {
      alert("Microphone speech recognition is not supported in your current browser. Please try using Google Chrome or Microsoft Edge.");
      return;
    }
    if (!isListening) {
      setTranscript('');
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error("Error starting speech recognition", err);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const speakText = async (text) => {
    stopSpeaking();
    
    if (!text || text.trim() === '') return;

    try {
      const formData = new FormData();
      formData.append('text', text);
      formData.append('language', 'en-US');
      formData.append('voice', 'Magpie-Multilingual.EN-US.Aria');
      formData.append('encoding', 'LINEAR_PCM');
      formData.append('sample_rate_hz', '44100');

      const response = await fetch('/api/tts/v1/audio/synthesize', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        console.error("Failed to generate speech", response.status, response.statusText);
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      if (globalAudio) {
        globalAudio.src = url;
        globalAudio.play().catch(err => console.error("Autoplay prevented:", err));
        globalAudio.onended = () => {
          URL.revokeObjectURL(url);
        };
      }
    } catch (err) {
      console.error("Error in speech synthesis API", err);
    }
  };

  const stopSpeaking = () => {
    if (globalAudio) {
      globalAudio.pause();
      globalAudio.currentTime = 0;
    }
  };

  return {
    isListening,
    transcript,
    setTranscript,
    speechError,
    setSpeechError,
    startListening,
    stopListening,
    speakText,
    stopSpeaking
  };
}
