import { useState, useRef, useEffect } from 'react'
import TaskSelector from '../components/TaskSelector'
import WritingArea from '../components/WritingArea'
import ActionButtons from '../components/ActionButtons'
import DialogueBubble from '../components/DialogueBubble'
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
  handleDraftSubmitted, handleNewSession, handleClearHistory
}) {
  const [selectedTask, setSelectedTask] = useState(null)
  const [paragraph, setParagraph] = useState('')
  const [draftShared, setDraftShared] = useState(false)
  const [lastSubmittedParagraph, setLastSubmittedParagraph] = useState('')
  const [awaitingRewrite, setAwaitingRewrite] = useState(false)
  const [feedbackFocus, setFeedbackFocus] = useState(null)
  const [replyPreFill, setReplyPreFill] = useState('')
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
    setFeedbackFocus(null)
  }

  function handleSubmit() {
    if (!selectedTask || !paragraph.trim()) return

    if (awaitingRewrite && paragraph.trim() === lastSubmittedParagraph.trim()) {
      handleStudentMessage('I submitted without changing my paragraph.')
      handleNewTurn({
        sessionId,
        systemMessage: "Your paragraph looks the same as before. Go back to the writing box, write your new paragraph on the correct topic, then click Get Feedback.",
        whatIsStrong: null,
        directFeedback: [],
        socraticQuestions: [],
        invitation: null,
        stageComplete: false,
        formatCheck: null,
        topicCheck: null,
        options: []
      })
      return
    }

    setLastSubmittedParagraph(paragraph)
    setAwaitingRewrite(false)
    setFeedbackFocus(null)
    submitParagraph({
      paragraph,
      taskType: selectedTask.task,
      mode: selectedTask.mode,
      unitTopic: selectedTask.topic,
      feedbackFocus: 'analyze'
    })
  }

  function handleReply(message) {
    setReplyPreFill('')
    sendReply({
      message,
      currentParagraph: paragraph,
      taskType: selectedTask?.task,
      mode: selectedTask?.mode,
      unitTopic: selectedTask?.topic
    })
  }

  function handlePushback(message) {
    setReplyPreFill('')
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

    // If this is a rewrite confirmation, clear history first
    if (message.startsWith('I will rewrite my paragraph')) {
      handleClearHistory()
      handleStudentMessage('— Starting over with new paragraph —')
      setAwaitingRewrite(true)
      setLastSubmittedParagraph(paragraph)
    }
    sendReply({
      message,
      currentParagraph: paragraph,
      taskType: selectedTask?.task,
      mode: selectedTask?.mode,
      unitTopic: selectedTask?.topic
    })
  }

  function handleFeedbackFocusSelect(focus) {
    setFeedbackFocus(focus)
    sendReply({
      message: `I want feedback on: ${focus}`,
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
    setFeedbackFocus(null)
  }

  const hasConversation = conversationHistory.length > 0
  const wordTarget = WORD_TARGETS[grade]

  const studentReplies = conversationHistory.filter(t => t.role === 'student' && t.content !== '— Starting over with new paragraph —').length
  const lastSystemTurn = [...conversationHistory].reverse().find(t => t.role === 'system')
  const canShare = studentReplies >= 1 &&
    lastSystemTurn &&
    (!lastSystemTurn.directFeedback || lastSystemTurn.directFeedback.length === 0) &&
    (!lastSystemTurn.socraticQuestions || lastSystemTurn.socraticQuestions.length === 0) &&
    (!lastSystemTurn.topicCheck || lastSystemTurn.topicCheck.on_topic) &&
    (!lastSystemTurn.formatCheck || lastSystemTurn.formatCheck.correct_format_used) &&
    !draftShared

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
              canShare={canShare}
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

              {conversationHistory.map((turn, i) => {
                const isLastSystemTurn = turn.role === 'system' && turn === lastSystemTurn
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {turn.content === '— Starting over with new paragraph —' ? (
                      <div style={{
                        textAlign: 'center',
                        fontSize: '11px',
                        color: 'var(--color-text-secondary)',
                        padding: '8px 0',
                        borderTop: '0.5px solid var(--color-border-tertiary)',
                        borderBottom: '0.5px solid var(--color-border-tertiary)',
                        margin: '4px 0'
                      }}>
                        Starting fresh — new paragraph below
                      </div>
                    ) : (
                      <DialogueBubble role={turn.role} content={turn.content} />
                    )}
                    {isLastSystemTurn && !isLoading && (
                      <>
                        {turn.hasStructureIssue && i === conversationHistory.length - 1 && (
                          <div style={{ display: 'flex', gap: '8px', paddingTop: '4px' }}>
                            <button
                              onClick={() => setReplyPreFill(
                                turn.structureIssueType === 'topic'
                                  ? 'I disagree — I think my paragraph is on topic because '
                                  : 'I disagree — I think my format is correct because '
                              )}
                              disabled={isLoading}
                              style={{
                                padding: '6px 14px',
                                borderRadius: '7px',
                                border: '1.5px solid var(--teal-mid)',
                                background: 'white',
                                color: 'var(--teal)',
                                fontSize: '12px',
                                fontWeight: '500',
                                cursor: 'pointer'
                              }}
                            >
                              I disagree with this
                            </button>
                          </div>
                        )}
                        {turn.showFocusChoice && !feedbackFocus && !turn.hasStructureIssue && (
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                            {(turn.focusOptions || []).map(opt => (
                              <button
                                key={opt.key}
                                onClick={() => handleFeedbackFocusSelect(opt.key)}
                                disabled={opt.disabled}
                                style={{
                                  fontSize: '12px', padding: '5px 14px',
                                  borderRadius: '7px',
                                  border: 'none',
                                  background: opt.disabled ? 'var(--paper2)' : '#2a7c6f',
                                  color: opt.disabled ? 'var(--ink3)' : 'white',
                                  cursor: opt.disabled ? 'not-allowed' : 'pointer',
                                  fontWeight: '500'
                                }}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )
              })}

              {isLoading && <DialogueBubble role="system" isLoading />}
              <div ref={dialogueEndRef} />
            </div>

            {hasConversation && !isLoading && (
              <div style={{ padding: '12px 16px', borderTop: '1px solid var(--line)' }}>
                <StudentReplyInput
                  onSend={(msg) => {
                    setReplyPreFill('')
                    handleReply(msg)
                  }}
                  onPushback={(msg) => {
                    setReplyPreFill('')
                    handlePushback(msg)
                  }}
                  disabled={isLoading}
                  placeholder="Reply here… (Ctrl+Enter to send)"
                  showKeepOption={false}
                  showPushbackOption={false}
                  initialValue={replyPreFill}
                />
              </div>
            )}

            {hasConversation && !canShare && !isLoading && (
              <div style={{
                padding: '10px 16px',
                borderTop: '0.5px solid var(--color-border-tertiary)',
                background: 'var(--color-background-secondary)',
                fontSize: '12px',
                color: 'var(--color-text-secondary)',
                lineHeight: '1.6'
              }}>
                <strong style={{ color: 'var(--color-text-primary)', fontWeight: '500' }}>
                  What to do next:
                </strong>{' '}
                Revise your paragraph in the writing box and click{' '}
                <strong style={{ color: 'var(--color-text-primary)', fontWeight: '500' }}>
                  Get Feedback
                </strong>{' '}
                to check your revision — or type your answer to the question above and click{' '}
                <strong style={{ color: 'var(--color-text-primary)', fontWeight: '500' }}>
                  Send
                </strong>.
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
