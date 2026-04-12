import { useState } from 'react'
import DraftCard from '../components/DraftCard'
import CompletionTracker from '../components/CompletionTracker'
import GuidingQuestion from '../components/GuidingQuestion'
import usePeer from '../hooks/usePeer'

export default function PeerPage({ studentId, grade, draftSubmitted }) {
  const {
    drafts,
    selectedDraft,
    selectedDraftId,
    setSelectedDraftId,
    activeTab,
    setActiveTab,
    draftComments,
    draftQuestions,
    commentInputs,
    setCommentInputs,
    questionInputs,
    setQuestionInputs,
    answerInputs,
    setAnswerInputs,
    completionSteps,
    isComplete,
    hasInteracted,
    postComment,
    postQuestion,
    postAnswer
  } = usePeer({ studentId, grade, draftSubmitted })

  const [guidingQuestionText, setGuidingQuestionText] = useState('')

  function handleUseQuestion(question) {
    setActiveTab('qa')
    setQuestionInputs(prev => ({
      ...prev,
      [selectedDraft.id]: question
    }))
  }

  return (
    <main style={{
      maxWidth: '1100px',
      margin: '0 auto',
      padding: '24px 22px',
      display: 'grid',
      gridTemplateColumns: '280px 1fr',
      gap: '24px',
      alignItems: 'start'
    }}>

      {/* ── LEFT — completion + draft list ── */}
      <div>
        <CompletionTracker steps={completionSteps} />

        <div style={{
          fontSize: '11px', fontWeight: '500',
          textTransform: 'uppercase', letterSpacing: '0.06em',
          color: 'var(--color-text-secondary)',
          marginBottom: '10px'
        }}>
          Classmates' drafts ({drafts.length})
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {drafts.map(d => (
            <DraftCard
              key={d.id}
              draft={{
                ...d,
                comments: draftComments[d.id] || [],
                questions: draftQuestions[d.id] || []
              }}
              isSelected={selectedDraftId === d.id}
              hasInteracted={hasInteracted(d.id)}
              onClick={() => {
                setSelectedDraftId(d.id)
                setActiveTab('read')
              }}
            />
          ))}
        </div>

        <div style={{
          marginTop: '16px',
          padding: '10px 13px',
          background: 'var(--color-background-warning)',
          border: '0.5px solid var(--color-border-warning)',
          borderRadius: 'var(--border-radius-md)',
          fontSize: '12px',
          color: 'var(--color-text-warning)',
          lineHeight: '1.6'
        }}>
          You must read and respond to at least one classmate's paragraph to finish this task.
        </div>
      </div>

      {/* ── RIGHT — review area ── */}
      {!selectedDraft ? (
        <div style={{
          background: 'var(--color-background-primary)',
          border: '0.5px solid var(--color-border-tertiary)',
          borderRadius: 'var(--border-radius-lg)',
          padding: '60px 24px',
          textAlign: 'center',
          color: 'var(--color-text-secondary)'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>👆</div>
          <div style={{
            fontSize: '16px', fontWeight: '500',
            color: 'var(--color-text-primary)', marginBottom: '6px'
          }}>
            Choose a paragraph to read
          </div>
          <div style={{ fontSize: '13px' }}>
            Click a classmate's name on the left to read their paragraph.
          </div>
        </div>
      ) : (
        <div style={{
          background: 'var(--color-background-primary)',
          border: '0.5px solid var(--color-border-tertiary)',
          borderRadius: 'var(--border-radius-lg)',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '14px 18px',
            borderBottom: '0.5px solid var(--color-border-tertiary)',
            background: 'var(--color-background-secondary)'
          }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: selectedDraft.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '13px', fontWeight: '600', color: 'white', flexShrink: 0
            }}>
              {selectedDraft.initials}
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--color-text-primary)' }}>
                {selectedDraft.student_name}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                Unit {selectedDraft.unit} — {selectedDraft.topic} · Grade {selectedDraft.grade}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{
            display: 'flex',
            borderBottom: '0.5px solid var(--color-border-tertiary)',
            background: 'var(--color-background-secondary)'
          }}>
            {[
              { key: 'read', label: 'Read' },
              { key: 'comments', label: `Comments (${(draftComments[selectedDraft.id] || []).length})` },
              { key: 'qa', label: `Questions (${(draftQuestions[selectedDraft.id] || []).length})` }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '10px 18px',
                  fontSize: '13px', fontWeight: '500',
                  color: activeTab === tab.key
                    ? 'var(--color-text-primary)'
                    : 'var(--color-text-secondary)',
                  borderBottom: `2px solid ${activeTab === tab.key
                    ? 'var(--color-border-primary)'
                    : 'transparent'}`,
                  background: activeTab === tab.key
                    ? 'var(--color-background-primary)'
                    : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ padding: '20px' }}>

            {/* ── READ ── */}
            {activeTab === 'read' && (
              <div>
                <div style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '15px', lineHeight: '1.9',
                  color: 'var(--color-text-primary)',
                  whiteSpace: 'pre-wrap',
                  marginBottom: '16px'
                }}>
                  {selectedDraft.paragraph}
                </div>

                <GuidingQuestion
                  draft={selectedDraft}
                  grade={grade}
                  onUseQuestion={handleUseQuestion}
                />

                <div style={{
                  display: 'flex', gap: '8px', marginTop: '16px',
                  paddingTop: '16px',
                  borderTop: '0.5px solid var(--color-border-tertiary)'
                }}>
                  <button
                    onClick={() => setActiveTab('comments')}
                    style={{
                      fontSize: '13px', padding: '7px 16px',
                      borderRadius: 'var(--border-radius-md)',
                      border: '0.5px solid var(--color-border-secondary)',
                      background: 'var(--color-background-primary)',
                      color: 'var(--color-text-primary)',
                      cursor: 'pointer'
                    }}
                  >
                    Leave a comment
                  </button>
                  <button
                    onClick={() => setActiveTab('qa')}
                    style={{
                      fontSize: '13px', padding: '7px 16px',
                      borderRadius: 'var(--border-radius-md)',
                      border: '0.5px solid var(--color-border-secondary)',
                      background: 'var(--color-background-primary)',
                      color: 'var(--color-text-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    Ask a question
                  </button>
                </div>
              </div>
            )}

            {/* ── COMMENTS ── */}
            {activeTab === 'comments' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{
                  fontSize: '13px', color: 'var(--color-text-secondary)',
                  lineHeight: '1.6',
                  padding: '10px 12px',
                  background: 'var(--color-background-secondary)',
                  borderRadius: 'var(--border-radius-md)',
                  marginBottom: '4px'
                }}>
                  Write about the IDEAS in this paragraph — what you liked, what you noticed, or what you thought about.
                </div>

                {(draftComments[selectedDraft.id] || []).length === 0 ? (
                  <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', padding: '8px 0' }}>
                    No comments yet. Be the first to respond.
                  </div>
                ) : (
                  (draftComments[selectedDraft.id] || []).map(c => (
                    <div key={c.id} style={{ display: 'flex', gap: '10px' }}>
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '50%',
                        background: c.color || '#5b6fa0',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '10px', fontWeight: '600', color: 'white',
                        flexShrink: 0, marginTop: '2px'
                      }}>
                        {c.initials}
                      </div>
                      <div style={{
                        flex: 1,
                        background: 'var(--color-background-secondary)',
                        border: '0.5px solid var(--color-border-tertiary)',
                        borderRadius: 'var(--border-radius-md)',
                        padding: '10px 13px'
                      }}>
                        <div style={{
                          fontSize: '11px', color: 'var(--color-text-secondary)',
                          marginBottom: '4px', display: 'flex', gap: '8px'
                        }}>
                          <strong style={{ color: 'var(--color-text-primary)' }}>{c.author}</strong>
                          <span>{c.created_at}</span>
                        </div>
                        <div style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--color-text-primary)' }}>
                          {c.text}
                        </div>
                      </div>
                    </div>
                  ))
                )}

                <div style={{
                  display: 'flex', gap: '8px',
                  paddingTop: '12px',
                  borderTop: '0.5px solid var(--color-border-tertiary)'
                }}>
                  <textarea
                    value={commentInputs[selectedDraft.id] || ''}
                    onChange={e => setCommentInputs(prev => ({
                      ...prev, [selectedDraft.id]: e.target.value
                    }))}
                    placeholder="Write your comment here…"
                    rows={3}
                    style={{
                      flex: 1, fontSize: '13px',
                      padding: '8px 12px',
                      borderRadius: 'var(--border-radius-md)',
                      border: '0.5px solid var(--color-border-secondary)',
                      background: 'var(--color-background-secondary)',
                      color: 'var(--color-text-primary)',
                      resize: 'none', fontFamily: 'var(--font-sans)'
                    }}
                  />
                  <button
                    onClick={() => postComment(
                      selectedDraft.id,
                      commentInputs[selectedDraft.id] || ''
                    )}
                    disabled={!(commentInputs[selectedDraft.id] || '').trim()}
                    style={{
                      fontSize: '13px', padding: '8px 16px',
                      borderRadius: 'var(--border-radius-md)',
                      border: '0.5px solid var(--color-border-secondary)',
                      background: 'var(--color-background-primary)',
                      color: 'var(--color-text-primary)',
                      cursor: 'pointer', alignSelf: 'flex-end',
                      opacity: !(commentInputs[selectedDraft.id] || '').trim() ? 0.4 : 1
                    }}
                  >
                    Post
                  </button>
                </div>
              </div>
            )}

            {/* ── Q&A ── */}
            {activeTab === 'qa' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{
                  fontSize: '13px', color: 'var(--color-text-secondary)',
                  lineHeight: '1.6',
                  padding: '10px 12px',
                  background: 'var(--color-background-secondary)',
                  borderRadius: 'var(--border-radius-md)',
                  marginBottom: '4px'
                }}>
                  Ask the writer a question about their paragraph. Other students can also answer.
                </div>

                {(draftQuestions[selectedDraft.id] || []).map(q => (
                  <div key={q.id} style={{
                    border: '0.5px solid var(--color-border-tertiary)',
                    borderRadius: 'var(--border-radius-lg)',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      padding: '12px 14px',
                      background: 'var(--color-background-warning)',
                      display: 'flex', gap: '10px'
                    }}>
                      <div style={{
                        width: '22px', height: '22px', borderRadius: '50%',
                        background: q.asker === 'You' ? '#2a7c6f' : (q.color || '#b87d2a'),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '10px', fontWeight: '700', color: 'white', flexShrink: 0
                      }}>
                        {q.initials || 'Q'}
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '500', lineHeight: '1.5', color: 'var(--color-text-primary)' }}>
                          {q.text}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-warning)', marginTop: '3px' }}>
                          — {q.asker}
                        </div>
                      </div>
                    </div>

                    <div style={{ background: 'var(--color-background-primary)' }}>
                      {q.answers.map(a => (
                        <div key={a.id} style={{
                          display: 'flex', gap: '8px',
                          padding: '10px 14px 10px 46px',
                          borderTop: '0.5px solid var(--color-border-tertiary)'
                        }}>
                          <div style={{
                            width: '20px', height: '20px', borderRadius: '50%',
                            background: a.color || '#2a7c6f',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '9px', fontWeight: '700', color: 'white', flexShrink: 0
                          }}>
                            {a.initials}
                          </div>
                          <div>
                            <div style={{ fontSize: '13px', lineHeight: '1.55', color: 'var(--color-text-primary)' }}>
                              {a.text}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                              {a.author}
                            </div>
                          </div>
                        </div>
                      ))}

                      <div style={{
                        padding: '10px 14px 10px 46px',
                        borderTop: '0.5px solid var(--color-border-tertiary)',
                        display: 'flex', gap: '8px',
                        background: 'var(--color-background-secondary)'
                      }}>
                        <textarea
                          value={answerInputs[`${selectedDraft.id}_${q.id}`] || ''}
                          onChange={e => setAnswerInputs(prev => ({
                            ...prev,
                            [`${selectedDraft.id}_${q.id}`]: e.target.value
                          }))}
                          placeholder="Write an answer…"
                          rows={1}
                          style={{
                            flex: 1, fontSize: '12px',
                            padding: '6px 10px',
                            borderRadius: 'var(--border-radius-md)',
                            border: '0.5px solid var(--color-border-secondary)',
                            background: 'var(--color-background-primary)',
                            color: 'var(--color-text-primary)',
                            resize: 'none', fontFamily: 'var(--font-sans)'
                          }}
                        />
                        <button
                          onClick={() => postAnswer(
                            selectedDraft.id, q.id,
                            answerInputs[`${selectedDraft.id}_${q.id}`] || ''
                          )}
                          disabled={!(answerInputs[`${selectedDraft.id}_${q.id}`] || '').trim()}
                          style={{
                            fontSize: '12px', padding: '6px 12px',
                            borderRadius: 'var(--border-radius-md)',
                            border: '0.5px solid var(--color-border-secondary)',
                            background: 'var(--color-background-primary)',
                            color: 'var(--color-text-primary)',
                            cursor: 'pointer', alignSelf: 'flex-end',
                            opacity: !(answerInputs[`${selectedDraft.id}_${q.id}`] || '').trim() ? 0.4 : 1
                          }}
                        >
                          Reply
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                <div style={{
                  paddingTop: '12px',
                  borderTop: '0.5px solid var(--color-border-tertiary)',
                  display: 'flex', gap: '8px'
                }}>
                  <textarea
                    value={questionInputs[selectedDraft.id] || ''}
                    onChange={e => setQuestionInputs(prev => ({
                      ...prev, [selectedDraft.id]: e.target.value
                    }))}
                    placeholder="Ask the writer a question about their paragraph…"
                    rows={2}
                    style={{
                      flex: 1, fontSize: '13px',
                      padding: '8px 12px',
                      borderRadius: 'var(--border-radius-md)',
                      border: '0.5px solid var(--color-border-secondary)',
                      background: 'var(--color-background-secondary)',
                      color: 'var(--color-text-primary)',
                      resize: 'none', fontFamily: 'var(--font-sans)'
                    }}
                  />
                  <button
                    onClick={() => postQuestion(
                      selectedDraft.id,
                      questionInputs[selectedDraft.id] || ''
                    )}
                    disabled={!(questionInputs[selectedDraft.id] || '').trim()}
                    style={{
                      fontSize: '13px', padding: '8px 16px',
                      borderRadius: 'var(--border-radius-md)',
                      border: '0.5px solid var(--color-border-secondary)',
                      background: 'var(--color-background-primary)',
                      color: 'var(--color-text-primary)',
                      cursor: 'pointer', alignSelf: 'flex-end',
                      opacity: !(questionInputs[selectedDraft.id] || '').trim() ? 0.4 : 1
                    }}
                  >
                    Ask
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
