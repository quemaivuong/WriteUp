import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import WritePage from './pages/WritePage'
import PeerPage from './pages/PeerPage'
import './styles/global.css'
import './styles/components.css'
// import '@fontsource/dm-sans/400.css'
// import '@fontsource/dm-sans/500.css'
// import '@fontsource/lora/400.css'
// import '@fontsource/lora/600.css'

// ── Generate or retrieve persistent student ID ───────────────────
function getOrCreateStudentId() {
  let id = localStorage.getItem('writeup_student_id')
  if (!id) {
    id = 'student_' + Math.random().toString(36).slice(2, 11)
    localStorage.setItem('writeup_student_id', id)
  }
  return id
}

export default function App() {
  // ── Global state ───────────────────────────────────────────────
  const [studentId] = useState(getOrCreateStudentId)
  const [grade, setGrade] = useState(
    parseInt(localStorage.getItem('writeup_grade') || '8')
  )
  const [studentName, setStudentName] = useState(
    localStorage.getItem('writeup_name') || 'Student'
  )
  const [sessionId, setSessionId] = useState(null)
  const [conversationHistory, setConversationHistory] = useState([])
  const [pendingErrors, setPendingErrors] = useState([])
  const [disputedError, setDisputedError] = useState(null)
  const [apprehensionFlags, setApprehensionFlags] = useState([])
  const [draftSubmitted, setDraftSubmitted] = useState(false)
  const [selfCheckDone, setSelfCheckDone] = useState(false)

  // Persist grade to localStorage
  useEffect(() => {
    localStorage.setItem('writeup_grade', grade)
  }, [grade])

  // Persist name to localStorage
  useEffect(() => {
    localStorage.setItem('writeup_name', studentName)
  }, [studentName])

  // ── Shared handlers ────────────────────────────────────────────
  function handleNewTurn(systemResponse) {
    setSessionId(systemResponse.sessionId)

    // Add system message to display history
    setConversationHistory(prev => [
      ...prev,
      {
        role: 'system',
        content: systemResponse.systemMessage,
        whatIsStrong: systemResponse.whatIsStrong,
        directFeedback: systemResponse.directFeedback,
        socraticQuestions: systemResponse.socraticQuestions,
        invitation: systemResponse.invitation,
        stageComplete: systemResponse.stageComplete,
        options: systemResponse.options || [],
        formatCheck: systemResponse.formatCheck || null,
        topicCheck: systemResponse.topicCheck || null,
      }
    ])
    console.log('NEW TURN STORED:', systemResponse.systemMessage?.slice(0, 50))

    // Update pending errors — keep Socratic questions open
    if (systemResponse.socraticQuestions?.length > 0) {
      setPendingErrors(systemResponse.socraticQuestions.map(q => ({
        error_type: q.error_type,
        surface: q.surface,
        track: q.track,
        question: q.question
      })))
    } else {
      setPendingErrors([])
    }

    setDisputedError(null)
  }

  function handleStudentMessage(message) {
    setConversationHistory(prev => [
      ...prev,
      { role: 'student', content: message }
    ])
  }

  function handleDraftSubmitted() {
    setDraftSubmitted(true)
  }

  function handleNewSession() {
    setSessionId(null)
    setConversationHistory([])
    setPendingErrors([])
    setDisputedError(null)
    setSelfCheckDone(false)
  }

  function handleClearHistory() {
    setConversationHistory([])
    setPendingErrors([])
    setDisputedError(null)
  }

  const sharedProps = {
    studentId,
    grade,
    setGrade,
    studentName,
    setStudentName,
    sessionId,
    conversationHistory,
    pendingErrors,
    disputedError,
    setDisputedError,
    apprehensionFlags,
    setApprehensionFlags,
    selfCheckDone,
    setSelfCheckDone,
    draftSubmitted,
    handleNewTurn,
    handleStudentMessage,
    handleDraftSubmitted,
    handleNewSession,
    handleClearHistory
  }

  return (
    <BrowserRouter>
      <Navbar
        studentName={studentName}
        grade={grade}
        draftSubmitted={draftSubmitted}
      />
      <Routes>
        <Route path="/" element={<Navigate to="/write" replace />} />
        <Route path="/write" element={<WritePage {...sharedProps} />} />
        <Route
          path="/peer"
          element={
            draftSubmitted
              ? <PeerPage studentId={studentId} grade={grade} />
              : <Navigate to="/write" replace />
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
