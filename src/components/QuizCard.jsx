import React, { useState, useEffect, useRef } from 'react';
import { OpenEndedQuestions } from '../data/questions';
import { useSpeech } from '../hooks/useSpeech';
import { evaluateAnswer } from '../services/llmService';

export default function QuizCard({ profile, onRestartProfile }) {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameState, setGameState] = useState('playing'); // 'playing', 'evaluating', 'feedback', 'finished'
  
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isReading, setIsReading] = useState(false);
  
  const { isListening, transcript, setTranscript, speechError, setSpeechError, startListening, stopListening, speakText, stopSpeaking } = useSpeech();
  const timerRef = useRef(null);

  useEffect(() => {
    if (speechError) {
      alert(`Speech recognition failed: ${speechError}. Your browser might require HTTPS or have blocked the microphone.`);
      setSpeechError(''); // Clear error after showing
    }
  }, [speechError, setSpeechError]);

  useEffect(() => {
    // Select 5 random questions
    const shuffled = [...OpenEndedQuestions].sort(() => 0.5 - Math.random());
    setQuestions(shuffled.slice(0, 5));
    startQuestion();
  }, []);

  const previousAnswerRef = useRef('');

  useEffect(() => {
    if (isListening) {
      // Append transcript to whatever was already typed
      const baseText = previousAnswerRef.current ? previousAnswerRef.current + ' ' : '';
      setUserAnswer(baseText + transcript);
    }
  }, [transcript, isListening]);

  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (gameState === 'playing' && timeLeft === 0) {
      handleSubmit();
    }
    return () => clearTimeout(timerRef.current);
  }, [timeLeft, gameState]);

  const startQuestion = () => {
    setTimeLeft(60);
    setUserAnswer('');
    setFeedback('');
    setTranscript('');
    setGameState('playing');
    stopSpeaking();
    setIsReading(false);
  };

  const handleSubmit = async () => {
    if (isListening) stopListening();
    clearTimeout(timerRef.current);
    setGameState('evaluating');
    setFeedback('Feedback:\n');
    
    const finalAnswer = userAnswer || "(No answer provided)";
    
    await evaluateAnswer(profile, questions[currentIndex], finalAnswer, (chunk, fullText) => {
      setFeedback(`Feedback:\n${fullText}`);
    }).then(({ isCorrect }) => {
      if (isCorrect) setScore(s => s + 1);
      setGameState('feedback');
    });
  };

  const handleNext = () => {
    if (currentIndex < 4) {
      setCurrentIndex(i => i + 1);
      startQuestion();
    } else {
      setGameState('finished');
      stopSpeaking();
    }
  };

  const toggleReadAloud = () => {
    if (isReading) {
      stopSpeaking();
      setIsReading(false);
    } else {
      speakText(feedback.replace("Feedback:\n", ""));
      setIsReading(true);
    }
  };

  const handleRestartQuiz = () => {
    const shuffled = [...OpenEndedQuestions].sort(() => 0.5 - Math.random());
    setQuestions(shuffled.slice(0, 5));
    setCurrentIndex(0);
    setScore(0);
    startQuestion();
  };

  // Timer Colors
  let timerColor = '#50c878'; // Green
  if (timeLeft <= 15) timerColor = '#f05064'; // Red
  else if (timeLeft <= 30) timerColor = '#ffb43c'; // Orange

  if (questions.length === 0) return <div>Loading...</div>;

  if (gameState === 'finished') {
    const pct = (score / 5) * 100;
    let guidance = "";
    if (pct >= 80) guidance = "🌟 Outstanding! Expressing your own thoughts on the spot is tough, but you handled these social situations beautifully.";
    else if (pct >= 60) guidance = "👍 Great job! You have a solid grasp on how to communicate in these situations.";
    else if (pct >= 40) guidance = "🙂 Good effort! Finding the right words with a ticking timer can be stressful.";
    else guidance = "⚠️ Don't get discouraged! Social interactions are complicated, and answering on the spot takes practice.";

    return (
      <div className="card" style={{ textAlign: 'center' }}>
        <h1 className="header-title">🗣️ Quiz Complete!</h1>
        <div className="question-text" style={{ fontSize: '2rem' }}>Score: {score} / 5</div>
        <p style={{ fontSize: '1.2rem', margin: '20px 0', lineHeight: '1.6' }}>{guidance}</p>
        <div className="button-group">
          <button onClick={handleRestartQuiz}>🔄 Restart Quiz</button>
          <button className="btn-secondary" onClick={onRestartProfile}>👥 Change Profile</button>
        </div>
      </div>
    );
  }

  // Format feedback with colors for Correct/Incorrect
  const formattedFeedback = () => {
    if (!feedback) return null;
    const parts = feedback.split(/^(Feedback:\n(?:Correct|Incorrect))/);
    
    if (parts.length > 1) {
      const isCorrect = parts[1].includes('Correct') && !parts[1].includes('Incorrect');
      return (
        <>
          <span className={isCorrect ? 'correct-text' : 'incorrect-text'}>
            {parts[1].replace('Feedback:\n', '')}
          </span>
          {parts[2]}
        </>
      );
    }
    return feedback;
  };

  return (
    <div className="card">
      <h1 className="header-title">🗣️ Open-Ended Quiz</h1>
      
      {gameState === 'playing' && (
        <>
          <div className="timer-container">
            <div 
              className="timer-bar" 
              style={{ width: `${(timeLeft / 60) * 100}%`, backgroundColor: timerColor }} 
            />
          </div>
          <div className="timer-text" style={{ color: timerColor }}>
            {timeLeft} seconds remaining
          </div>
        </>
      )}

      <div className="question-text">
        Question {currentIndex + 1}: {questions[currentIndex]}
      </div>

      {(gameState === 'playing' || gameState === 'evaluating') && (
        <>
          <textarea
            value={userAnswer}
            onChange={(e) => {
              setUserAnswer(e.target.value);
              setTranscript(e.target.value);
            }}
            placeholder="💬 Type your response here..."
            disabled={gameState !== 'playing' || isListening}
          />
          <div className="mic-hint">Tip: Click 🎙 Speak Answer to say your response out loud!</div>
        </>
      )}

      {(gameState === 'evaluating' || gameState === 'feedback') && (
        <div className="feedback-box">
          {formattedFeedback()}
        </div>
      )}

      <div className="button-group">
        {gameState === 'playing' && (
          <>
            <button 
              onClick={() => {
                if (isListening) {
                  stopListening();
                } else {
                  previousAnswerRef.current = userAnswer;
                  startListening();
                }
              }}
              style={{ backgroundColor: isListening ? '#f05064' : 'var(--accent-color)' }}
            >
              {isListening ? '🛑 Stop Recording' : '🎙 Speak Answer'}
            </button>
            <button onClick={handleSubmit}>Submit ✅</button>
          </>
        )}

        {gameState === 'feedback' && (
          <>
            <button onClick={toggleReadAloud}>
              {isReading ? '🛑 Stop Reading' : '🔊 Read Feedback'}
            </button>
            <button onClick={handleNext}>Next ➡️</button>
          </>
        )}
      </div>
    </div>
  );
}
