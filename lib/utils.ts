import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { subjectsColors } from "@/constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getSubjectColor = (subject: string) => {
  return subjectsColors[subject as keyof typeof subjectsColors];
};

// Gemini configuration for voice sessions
export interface GeminiVoiceConfig {
  voice: string;
  style: string;
  subject: string;
  topic: string;
  name: string;
}

// Generate system prompt for Gemini based on voice configuration
export const configureGeminiAssistant = (config: GeminiVoiceConfig) => {
  const { voice, style, subject, topic, name } = config;
  
  const systemPrompt = `You are ${name}, a highly knowledgeable and engaging AI tutor specializing in ${subject}. 
You are conducting a real-time voice session with a student about: ${topic}.

Your teaching approach should be ${style}.

Voice Session Guidelines:
- Keep responses conversational and concise (2-3 sentences maximum)
- Speak naturally as if having a real conversation
- Avoid special characters, formatting, or symbols in responses
- Break down complex topics into digestible parts
- Check student understanding regularly with questions like "Does that make sense?" or "Are you following so far?"
- Use encouraging language and maintain engagement
- Stay focused on the topic: ${topic}
- Adapt your explanations based on student responses
- Use examples and analogies when helpful
- If students ask unrelated questions, gently redirect to the topic

Voice Conversation Style:
- Use natural speech patterns and contractions
- Include brief pauses for student processing (use phrases like "let me explain" or "here's the key point")
- Ask engaging questions to maintain interaction
- Use transitional phrases like "Now," "Next," or "Building on that"
- Keep the energy positive and educational

Remember: This is a voice conversation, so speak as you would naturally talk to someone, not as you would write.`;

  return systemPrompt;
};

// Voice preference helpers for Web Speech API
export const getVoicePreferences = (voiceType: string) => {
  const voicePrefs = {
    professional: {
      rate: 0.9,
      pitch: 1.0,
      volume: 1.0,
      preferredNames: ['alex', 'daniel', 'karen', 'susan']
    },
    friendly: {
      rate: 1.0,
      pitch: 1.1,
      volume: 1.0,
      preferredNames: ['samantha', 'victoria', 'tom', 'matthew']
    },
    energetic: {
      rate: 1.1,
      pitch: 1.2,
      volume: 1.0,
      preferredNames: ['joanna', 'salli', 'joey', 'david']
    },
    calm: {
      rate: 0.8,
      pitch: 0.9,
      volume: 0.9,
      preferredNames: ['hazel', 'zira', 'mark', 'paul']
    }
  };

  return voicePrefs[voiceType as keyof typeof voicePrefs] || voicePrefs.friendly;
};

// Enhanced voice selection for better Gemini integration
export const selectOptimalVoice = (
  voices: SpeechSynthesisVoice[], 
  gender: 'male' | 'female', 
  voiceType: string = 'friendly'
): SpeechSynthesisVoice | null => {
  const prefs = getVoicePreferences(voiceType);
  
  // Filter voices by language first
  const englishVoices = voices.filter(voice => 
    voice.lang.includes('en') && voice.lang.includes('US')
  );
  
  if (englishVoices.length === 0) {
    return voices.find(v => v.lang.includes('en')) || voices[0] || null;
  }
  
  // Filter by gender
  const genderFilteredVoices = englishVoices.filter(voice => {
    const name = voice.name.toLowerCase();
    
    if (gender === 'female') {
      return prefs.preferredNames.some(prefName => name.includes(prefName)) ||
             name.includes('female') ||
             (!name.includes('male') && !name.includes('man'));
    } else {
      return prefs.preferredNames.some(prefName => name.includes(prefName)) ||
             name.includes('male') ||
             name.includes('man');
    }
  });
  
  // Return preferred voice or fallback
  return genderFilteredVoices[0] || englishVoices[0] || voices[0] || null;
};

// Generate conversation starters based on subject and topic
export const generateConversationStarters = (subject: string, topic: string) => {
  const starters = [
    `Let's dive into ${topic}. What's your current understanding of this area?`,
    `I'm excited to explore ${topic} with you today. Where would you like to start?`,
    `${topic} is a fascinating part of ${subject}. Have you encountered this before?`,
    `Ready to learn about ${topic}? I'll guide you through it step by step.`,
    `Let's make ${topic} easy to understand. What questions do you have to start?`
  ];
  
  return starters[Math.floor(Math.random() * starters.length)];
};

// Session management helpers
export const createSessionConfig = (
  companionId: string,
  subject: string,
  topic: string,
  name: string,
  style: string,
  voice: string
) => {
  return {
    companionId,
    subject,
    topic,
    name,
    style,
    voice,
    systemPrompt: configureGeminiAssistant({ voice, style, subject, topic, name }),
    conversationStarter: generateConversationStarters(subject, topic),
    timestamp: new Date().toISOString()
  };
};

// Error handling helpers for voice sessions
export const handleSpeechError = (error: any) => {
  const errorMessages = {
    'not-allowed': 'Microphone access denied. Please enable microphone permissions in your browser settings.',
    'no-speech': 'No speech detected. Please try speaking again.',
    'audio-capture': 'Audio capture failed. Please check your microphone connection.',
    'network': 'Network error occurred. Please check your internet connection.',
    'aborted': 'Speech recognition was interrupted.',
    'language-not-supported': 'Language not supported. Please ensure English is selected.'
  };
  
  return errorMessages[error as keyof typeof errorMessages] || 
         'An unexpected error occurred with speech recognition. Please try again.';
};

// Voice quality assessment
export const assessVoiceQuality = (voice: SpeechSynthesisVoice) => {
  const quality = {
    isLocal: voice.localService,
    isDefault: voice.default,
    language: voice.lang,
    name: voice.name,
    score: 0
  };
  
  // Calculate quality score
  if (voice.lang.includes('en-US')) quality.score += 3;
  else if (voice.lang.includes('en')) quality.score += 2;
  
  if (voice.localService) quality.score += 2;
  if (voice.default) quality.score += 1;
  
  return quality;
};