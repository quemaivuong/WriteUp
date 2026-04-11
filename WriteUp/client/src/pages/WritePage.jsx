import { useState, useRef, useEffect } from 'react'
import TaskSelector from '../components/TaskSelector'
import WritingArea from '../components/WritingArea'
import ActionButtons from '../components/ActionButtons'
import DialogueBubble from '../components/DialogueBubble'
import FeedbackCard from '../components/FeedbackCard'
import SocraticCard from '../components/SocraticCard'
import StudentReplyInput from '../components/StudentReplyInput'
import useConversation from '../hooks/useConversation'

const WORD_TARGETS = {
  6: '40–60', 7: '~70', 8: '80–100',
  9: '80–100', 10: '100–120', 11: '120–150', 12: '150–200'
}

export default function WritePage({
  studentId, grade, setGrade, studentName, setStudentName,
  sessionId, conversationHistory, apprehensionFlags,
  handleNewTurn, handleStudentMessage,
  handleDraftSubmitted, handleNewSession
}) {
  const [selectedTask, setSelectedTask] = useState(null)
  const [paragraph, setParagraph] = useState('')
  const [draftShared, setDraftShared] = useState(false)
  const dialogueEndRef = useRef(null)

  const {
    isLoading, error, pendingErrors, stageComplete,
    submitParagraph, sendReply, sendPushback, keepOriginal, reset
  } = useConversation({
    studentId,
    grade,
    apprehensionFlags,
    onNewTurn: handleNewTurn,
    onStudentMessage: handleStudentMessage,
    externalSessionId: sessionId
  })

  useEffect(() => {
    dialogueEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversationHistory, isLoading])

  function handleTaskSelect(task) {
    setSelectedTask(task)
    setParagraph('')
    reset()
    handleNewSession()
    setDraftShared(false)
  }

  function handleSubmit() {
    if (!selectedTask || !paragraph.trim()) return
    submitParagraph({
      paragraph,
      taskType: selectedTask.task,
      mode: selectedTask.mode,
      unitTopic: selectedTask.topic
    })
  }

  function handleReply(message) {
    sendReply({
      message,
      currentParagraph: paragraph,
      taskType: selectedTask?.task,
      mode: selectedTask?.mode,
      unitTopic: selectedTask?.topic
    })
  }

  function handlePushback(message) {
    sendPushback({
      message,
      currentParagraph: paragraph,
      taskType: selectedTask?.task,
      mode: selectedTask?.mode,
      unitTopic: selectedTask?.topic,
      errorBeingDisputed: pendingErrors[0] || null
    })
  }

  function handleKeep() {
    keepOriginal({
      currentParagraph: paragraph,
      taskType: selectedTask?.task,
      mode: selectedTask?.mode,
      unitTopic: selectedTask?.topic,
      errorBeingKept: pendingErrors[0] || null
    })
  }

  function handleCardAction(message, turnType, errorSurface) {
    handleStudentMessage(message)

    if (turnType === 'student_keeps') {
      keepOriginal({
        currentParagraph: paragraph,
        taskType: selectedTask?.task,
        mode: selectedTask?.mode,
        unitTopic: selectedTask?.topic,
        errorBeingKept: pendingErrors.find(e => e.surface === errorSurface) || pendingErrors[0] || null
      })
      return
    }

    if (turnType === 'student_pushback') {
      sendPushback({
        message,
        currentParagraph: paragraph,
        taskType: selectedTask?.task,
        mode: selectedTask?.mode,
        unitTopic: selectedTask?.topic,
        errorBeingDisputed: pendingErrors.find(e => e.surface === errorSurface) || pendingErrors[0] || null
      })
      return
    }

    sendReply({
      message,
      currentParagraph: paragraph,
      taskType: selectedTask?.task,
      mode: selectedTask?.mode,
      unitTopic: selectedTask?.topic
    })
  }

  function handleShare() {
    setDraftShared(true)
    handleDraftSubmitted()
  }

  function handleNewTask() {
    setSelectedTask(null)
    setParagraph('')
    reset()
    handleNewSession()
    setDraftShared(false)
  }

  const hasConversation = conversationHistory.length > 0
  const wordTarget = WORD_TARGETS[grade]

  return (
    <main style={{
      maxWidth: '1100px', margin: '0 auto', padding: '24px 22px',
      display: 'grid',
      gridTemplateColumns: selectedTask ? '1fr 420px' : '1fr',
      gap: '24px', alignItems: 'start'
    }}>

      {/* ── LEFT PANEL ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Name + grade row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '13px', color: 'var(--ink3)', fontWeight: 500 }}>Name</label>
            <input
              value={studentName}
              onChange={e => setStudentName(e.target.value)}
              className="input"
              style={{ width: '160px', padding: '6px 10px', fontSize: '13px' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '13px', color: 'var(--ink3)', fontWeight: 500 }}>Grade</label>
            <select
              value={grade}
              onChange={e => { setGrade(parseInt(e.target.value)); handleNewTask() }}
              className="select" style={{ fontSize: '13px' }}
            >
              {[6,7,8,9,10,11,12].map(g => (
                <option key={g} value={g}>Grade {g}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Task selector or writing area */}
        {!selectedTask ? (
          <div className="card">
            <div className="card-header">Choose a writing task — Grade {grade}</div>
            <div className="card-body">
              <TaskSelector grade={grade} onSelect={handleTaskSelect} disabled={false} />
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--teal)', marginBottom: '2px' }}>
                  Unit {selectedTask.unit} — {selectedTask.topic}
                </div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--ink)' }}>
                  {selectedTask.task}
                </div>
              </div>
              <button onClick={handleNewTask} className="btn btn-ghost btn-sm" style={{ flexShrink: 0 }}>
                ← Change task
              </button>
            </div>

            <WritingArea
              value={paragraph}
              onChange={setParagraph}
              placeholder={`Start writing here… (target: ${wordTarget} words)`}
              wordTarget={wordTarget}
              disabled={isLoading}
            />

            {error && (
              <div style={{
                padding: '10px 14px', background: 'var(--coral-light)',
                border: '1px solid rgba(201,83,58,0.2)',
                borderRadius: '8px', fontSize: '13px', color: 'var(--coral)'
              }}>
                {error}
              </div>
            )}

            <ActionButtons
              onSubmitParagraph={handleSubmit}
              onShareDraft={handleShare}
              onNewTask={handleNewTask}
              canSubmit={paragraph.trim().length > 20 && !isLoading}
              canShare={stageComplete && !draftShared}
              isLoading={isLoading}
            />

            {draftShared && (
              <div style={{
                padding: '10px 14px', background: 'var(--green-light)',
                border: '1px solid rgba(58,122,74,0.2)',
                borderRadius: '8px', fontSize: '13px', color: 'var(--green)'
              }}>
                ✓ Draft shared. Head to Peer Workshop to review a classmate's work.
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── RIGHT PANEL — Dialogue ── */}
      {selectedTask && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="card" style={{ position: 'sticky', top: '72px' }}>
            <div className="card-header">
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--teal)' }} />
              WriteUp — AI Writing Coach
            </div>

            <div style={{
              padding: '16px', display: 'flex', flexDirection: 'column',
              gap: '16px', maxHeight: '420px', overflowY: 'auto'
            }}>
              {conversationHistory.length === 0 && !isLoading && (
                <div className="empty-state" style={{ padding: '24px' }}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>✍️</div>
                  <div style={{ fontSize: '14px', color: 'var(--ink3)' }}>
                    Write your paragraph and click "Get Feedback" to start the dialogue.
                  </div>
                </div>
              )}

              {conversationHistory.map((turn, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <DialogueBubble role={turn.role} content={turn.content} />
                  {turn.role === 'system' && (
                    <>
                      <FeedbackCard
                        errors={turn.directFeedback}
                        onAction={handleCardAction}
                        disabled={isLoading}
                      />
                      <SocraticCard
                        questions={turn.socraticQuestions}
                        onAction={handleCardAction}
                        disabled={isLoading}
                      />
                      {turn.options && turn.options.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                          {turn.options.map((opt, j) => (
                            <span key={j} style={{
                              fontSize: '12px',
                              padding: '4px 12px',
                              borderRadius: '99px',
                              background: 'rgba(184,125,42,0.12)',
                              color: 'var(--amber)',
                              border: '1px solid rgba(184,125,42,0.25)'
                            }}>
                              {opt}
                            </span>
                          ))}
                        </div>
                      )}
                      {turn.invitation && (
                        <div style={{ fontSize: '13px', color: 'var(--ink2)', fontStyle: 'italic', padding: '4px 0' }}>
                          {turn.invitation}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}

              {isLoading && <DialogueBubble role="system" isLoading />}
              <div ref={dialogueEndRef} />
            </div>

            {hasConversation && !isLoading && !stageComplete && (
              <div style={{ padding: '12px 16px', borderTop: '1px solid var(--line)' }}>
                <StudentReplyInput
                  onSend={handleReply}
                  onKeep={handleKeep}
                  onPushback={handlePushback}
                  disabled={isLoading}
                  placeholder="Respond to the feedback… (Cmd+Enter to send)"
                  showKeepOption={pendingErrors.length > 0}
                  showPushbackOption={pendingErrors.length > 0}
                />
              </div>
            )}

            {stageComplete && (
              <div style={{
                padding: '14px 16px', borderTop: '1px solid var(--line)',
                background: 'var(--green-light)', fontSize: '13px',
                color: 'var(--green)', fontWeight: 500
              }}>
                ✓ Feedback complete. Share your draft to unlock peer review.
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
