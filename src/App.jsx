import { useState } from 'react'
import Setup from './components/Setup'
import QuizCard from './components/QuizCard'

function App() {
  const [profile, setProfile] = useState(null);

  return (
    <>
      {!profile ? (
        <Setup onComplete={(p) => setProfile(p)} />
      ) : (
        <QuizCard profile={profile} onRestartProfile={() => setProfile(null)} />
      )}
    </>
  )
}

export default App
