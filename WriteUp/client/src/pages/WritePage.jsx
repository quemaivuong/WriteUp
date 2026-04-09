import { useState, useRef, useEffect, useCallback } from 'react'
import TaskSelector from '../components/TaskSelector'
import WritingArea from '../components/WritingArea'
import ActionButtons from '../components/ActionButtons'
import DialogueBubble from '../components/DialogueBubble'
import FeedbackCard from '../components/FeedbackCard'
import SocraticCard from '../components/SocraticCard'
import StudentReplyInput from '../components/StudentReplyInput'
import useConversation from '../hooks/useConversation'

const WORD_TARGETS = {
  6: '50–80',
  7: '60–80',
  8: '80–100',
  9: '100–120',
  10: '120–150',
  11: '120–150',
  12: '150–200'
}

export default function WritePage({
  studentId,
  grade,
  studentName,
  apprehensionFlags,
  onDraftSubmitted,
  onNewSession
}) {
  const [selectedTask, setSelectedTask] = useState(null)
  const [paragraph, setParagraph] = useState('')
  const [conversationHistory, setConversationHistory] = useState([])
  const [stageComplete, setStageComplete] = useState(false)
  const [draftShared, setDraftShared] = useState(false)

  const dialogueEndRef = useRef(null)

  const handleNewTurn = useCallback((data) => {
    setConversationHistory(prev => [
      ...prev,
      {
        role: 'system',
        text: data.systemMessageText,
        errors: data.errors || [],
        socraticQuestions: data.socraticQuestions || [],
        stageComplete: data.stageComplete || false
      }
    ])
    setStageComplete(data.stageComplete || false)
  }, [])

  const handleStudentMessage = useCallback((message) => {
    setConversationHistory(prev => [
      ...prev,
      { role: 'student', text: message }
    ])
  }, [])

  const {
    sessionId,
    isLoading,
    error,
    pendingErrors,
    submitParagraph,
    sendReply,
    sendPushback,
    keepOriginal,
    reset
  } = useConversation({
    studentId,
    grade,
    apprehensionFlags,
    onNewTurn: handleNewTurn,
    onStudentMessage: handleStudentMessage,
    externalSessionId: sessionId
  })

  // Scroll to bottom of dialogue on new messages
  useEffect(() => {
    dialogueEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversationHistory])

  function handleTaskSelect(task) {
    setSelectedTask(task)
    setParagraph('')
    setConversationHistory([])
    setStageComplete(false)
    setDraftShared(false)
    reset()
  }

  async function handleSubmit() {
    if (!selectedTask || !paragraph.trim()) return
    await submitParagraph({
      paragraph,
      taskType: selectedTask.type,
      mode: selectedTask.mode,
      unitTopic: selectedTask.topic
    })
  }

  async function handleReply(message) {
    if (!selectedTask) return
    await sendReply({
      message,
      currentParagraph: paragraph,
      taskType: selectedTask.type,
      mode: selectedTask.mode,
      unitTopic: selectedTask.topic
    })
  }

  async function handlePushback(message, errorBeingDisputed) {
    if (!selectedTask) return
    await sendPushback({
      message,
      currentParagraph: paragraph,
      taskType: selectedTask.type,
      mode: selectedTask.mode,
      unitTopic: selectedTask.topic,
      errorBeingDisputed
    })
  }

  async function handleKeep(errorBeingKept) {
    if (!selectedTask) return
    await keepOriginal({
      currentParagraph: paragraph,
      taskType: selectedTask.type,
      mode: selectedTask.mode,
      unitTopic: selectedTask.topic,
      errorBeingKept
    })
  }

  function handleShare() {
    setDraftShared(true)
    onDraftSubmitted && onDraftSubmitted({
      paragraph,
      task: selectedTask,
      sessionId
    })
  }

  function handleNewTask() {
    setSelectedTask(null)
    setParagraph('')
    setConversationHistory([])
    setStageComplete(false)
    setDraftShared(false)
    reset()
    onNewSession && onNewSession()
  }

  const hasSession = conversationHistory.length > 0
  const lastSystemTurn = [...conversationHistory].reverse().find(t => t.role === 'system')
  const showReplyInput = hasSession && !stageComplete
  const showKeepOption = showReplyInput && pendingErrors.length > 0
  const showPushbackOption = showReplyInput && pendingErrors.length > 0

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '24px',
      padding: '24px',
      maxWidth: '1200px',
      margin: '0 auto',
      alignItems: 'start'
    }}>
      {/* ── Left panel: writing area ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {!selectedTask ? (
          <div className="card">
            <div className="card-header">
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
                Choose a writing task
              </h2>
            </div>
            <div className="card-body">
              <TaskSelector
                grade={grade}
                onSelect={handleTaskSelect}
              />
            </div>
          </div>
        ) : (
          <>
            <div className="card">
              <div className="card-header" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--ink3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>
                    {selectedTask.mode} · {selectedTask.topic}
                  </div>
                  <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>
                    {selectedTask.title}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="btn btn-ghost btn-sm"
                  style={{ flexShrink: 0 }}
                >
                  Change task
                </button>
              </div>
              <div className="card-body">
                {selectedTask.prompt && (
                  <p style={{
                    margin: '0 0 12px',
                    fontSize: '13px',
                    color: 'var(--ink2)',
                    lineHeight: '1.7',
                    background: 'var(--paper2)',
                    padding: '10px 14px',
                    borderRadius: '8px'
                  }}>
                    {selectedTask.prompt}
                  </p>
                )}
                <WritingArea
                  value={paragraph}
                  onChange={setParagraph}
                  disabled={isLoading}
                  wordTarget={WORD_TARGETS[grade] || '80–100'}
                  placeholder={`Write your ${selectedTask.mode} paragraph here…`}
                />
              </div>
            </div>

            <ActionButtons
              onSubmitParagraph={handleSubmit}
              onShareDraft={handleShare}
              onNewTask={handleNewTask}
              canSubmit={paragraph.trim().length > 0 && !!selectedTask}
              canShare={stageComplete && !draftShared}
              isLoading={isLoading}
            />

            {error && (
              <div style={{
                padding: '10px 14px',
                background: 'rgba(201,83,58,0.08)',
                border: '1px solid rgba(201,83,58,0.2)',
                borderRadius: '8px',
                fontSize: '13px',
                color: 'var(--coral)'
              }}>
                {error}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Right panel: dialogue ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div className="card" style={{ position: 'sticky', top: '80px' }}>
          <div className="card-header">
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
              Feedback dialogue
            </h2>
          </div>
          <div className="card-body" style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            maxHeight: '65vh',
            overflowY: 'auto'
          }}>
            {conversationHistory.length === 0 ? (
              <div className="empty-state">
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>✍️</div>
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--ink3)' }}>
                  {selectedTask
                    ? 'Write your paragraph and click Get Feedback to start.'
                    : 'Select a task on the left to begin.'}
                </p>
              </div>
            ) : (
              conversationHistory.map((turn, i) => (
                <div key={i}>
                  <DialogueBubble
                    role={turn.role}
                    text={turn.text}
                    isLoading={false}
                  />
                  {turn.role === 'system' && (
                    <>
                      <FeedbackCard errors={turn.errors} />
                      <SocraticCard questions={turn.socraticQuestions} />
                    </>
                  )}
                </div>
              ))
            )}

            {isLoading && conversationHistory.length > 0 && (
              <DialogueBubble role="system" text="" isLoading={true} />
            )}

            <div ref={dialogueEndRef} />
          </div>

          {showReplyInput && (
            <div style={{
              padding: '12px 16px',
              borderTop: '1px solid var(--line)'
            }}>
              <StudentReplyInput
                onSend={handleReply}
                onKeep={() => handleKeep(pendingErrors[0])}
                onPushback={(msg) => handlePushback(msg, pendingErrors[0])}
                disabled={isLoading}
                showKeepOption={showKeepOption}
                showPushbackOption={showPushbackOption}
                placeholder="Respond to the feedback… (Cmd+Enter to send)"
              />
            </div>
          )}

          {stageComplete && (
            <div style={{
              padding: '12px 16px',
              borderTop: '1px solid var(--line)',
              background: 'rgba(42,157,143,0.06)',
              borderRadius: '0 0 12px 12px',
              textAlign: 'center',
              fontSize: '13px',
              color: 'var(--teal-dark)',
              fontWeight: 500
            }}>
              Great work! Your paragraph is ready.{!draftShared && ' Share it with the class or start a new task.'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
