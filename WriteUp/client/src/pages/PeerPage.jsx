import { useState } from 'react'
import CompletionTracker from '../components/CompletionTracker'
import usePeer from '../hooks/usePeer'

function Avatar({ name, color, size = 32 }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2)
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: '700', color: 'white',
      flexShrink: 0
    }}>
      {initials}
    </div>
  )
}

function PointsBadge({ points }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '6px',
      padding: '6px 12px',
      background: 'var(--teal-light)',
      border: '1px solid var(--teal-mid)',
      borderRadius: '99px',
      fontSize: '13px', fontWeight: '600',
      color: 'var(--teal)'
    }}>
      ⭐ {points} points
    </div>
  )
}

const LEADERBOARD_MOCK = [
  { name: 'Sleepy Panda', color: '#5b8fa0', points: 38 },
  { name: 'Bouncy Frog', color: '#7a6fa0', points: 31 },
  { name: 'Fluffy Cloud', color: '#6fa08a', points: 28 },
  { name: 'Grumpy Crab', color: '#a07a6f', points: 23 },
  { name: 'Dizzy Owl', color: '#8a6fa0', points: 18 },
]

export default function PeerPage({ studentId, grade, draftSubmitted }) {
  const {
    drafts, selectedDraft, selectedDraftId, setSelectedDraftId,
    activeTab, setActiveTab,
    draftComments, draftQuestions,
    commentInputs, setCommentInputs,
    questionInputs, setQuestionInputs,
    answerInputs, setAnswerInputs,
    learningQuestions, learningQuestionInput, setLearningQuestionInput,
    learningAnswerInputs, setLearningAnswerInputs,
    completionSteps, hasInteracted,
    postComment, postQuestion, postAnswer,
    postLearningQuestion, postLearningAnswer,
    guidingPrompts, anonymousName, avatarColor,
    points, POINTS_CONFIG
  } = usePeer({ studentId, grade, draftSubmitted })

  const [peerTab, setPeerTab] = useState('drafts') // drafts | struggles | leaderboard
  const [draftSubTab, setDraftSubTab] = useState('read') // read | comments | qa

  const myLeaderboardEntry = { name: 'You', color: '#2a7c6f', points }
  const fullLeaderboard = [...LEADERBOARD_MOCK, myLeaderboardEntry]
    .sort((a, b) => b.points - a.points)

  return (
    <main style={{
      maxWidth: '1100px', margin: '0 auto',
      padding: '24px 22px',
      display: 'grid',
      gridTemplateColumns: '260px 1fr',
      gap: '24px', alignItems: 'start'
    }}>

      {/* ── LEFT SIDEBAR ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

        {/* Points */}
        <div style={{
          background: 'white', border: '1px solid var(--line)',
          borderRadius: 'var(--radius)', padding: '14px 16px'
        }}>
          <div style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--ink3)', marginBottom: '8px' }}>
            Your points
          </div>
          <PointsBadge points={points} />
          <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {[
              { label: 'Share your draft', pts: POINTS_CONFIG.shareDraft, done: draftSubmitted },
              { label: 'Post a comment', pts: POINTS_CONFIG.postComment, done: Object.values({}).some(i => i?.commented) },
              { label: 'Ask a question', pts: POINTS_CONFIG.askQuestion },
              { label: 'Post a struggle', pts: POINTS_CONFIG.postLearningQuestion },
              { label: 'Answer a struggle', pts: POINTS_CONFIG.answerLearningQuestion }
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between',
                fontSize: '12px', color: 'var(--ink3)'
              }}>
                <span>{item.label}</span>
                <span style={{ fontWeight: '600', color: 'var(--teal)' }}>+{item.pts}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Completion */}
        <CompletionTracker steps={completionSteps} />

        {/* Navigation */}
        <div style={{
          background: 'white', border: '1px solid var(--line)',
          borderRadius: 'var(--radius)', overflow: 'hidden'
        }}>
          {[
            { key: 'drafts', label: '📄 Read classmates', count: drafts.length },
            { key: 'struggles', label: '🤔 Learning questions', count: learningQuestions.length },
            { key: 'leaderboard', label: '🏆 Leaderboard', count: null }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setPeerTab(tab.key)}
              style={{
                width: '100%', textAlign: 'left',
                padding: '10px 14px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: peerTab === tab.key ? 'var(--teal-light)' : 'white',
                borderBottom: '1px solid var(--line)',
                border: 'none',
                borderLeft: peerTab === tab.key ? '3px solid var(--teal)' : '3px solid transparent',
                fontSize: '13px', fontWeight: peerTab === tab.key ? '600' : '400',
                color: peerTab === tab.key ? 'var(--teal)' : 'var(--ink)',
                cursor: 'pointer'
              }}
            >
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span style={{
                  fontSize: '11px', padding: '1px 7px',
                  borderRadius: '99px',
                  background: 'var(--paper2)',
                  color: 'var(--ink3)'
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Draft list when on drafts tab */}
        {peerTab === 'drafts' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {drafts.map(d => (
              <button
                key={d.id}
                onClick={() => { setSelectedDraftId(d.id); setDraftSubTab('read') }}
                style={{
                  textAlign: 'left', padding: '10px 12px',
                  borderRadius: 'var(--radius)',
                  border: `1.5px solid ${selectedDraftId === d.id ? 'var(--teal)' : 'var(--line)'}`,
                  background: selectedDraftId === d.id ? 'var(--teal-light)' : 'white',
                  cursor: 'pointer', display: 'flex', gap: '10px', alignItems: 'center'
                }}
              >
                <Avatar name={d.student_name} color={d.color} size={28} />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--ink)' }}>
                    {d.student_name}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--ink3)' }}>
                    Unit {d.unit} — {d.topic}
                  </div>
                </div>
                {hasInteracted(d.id) && (
                  <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--teal)', fontWeight: '600' }}>
                    ✓
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── RIGHT PANEL ── */}
      <div>

        {/* ── DRAFTS TAB ── */}
        {peerTab === 'drafts' && (
          !selectedDraft ? (
            <div style={{
              background: 'white', border: '1px solid var(--line)',
              borderRadius: 'var(--radius)', padding: '60px 24px',
              textAlign: 'center', color: 'var(--ink3)'
            }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>👆</div>
              <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--ink)', marginBottom: '6px' }}>
                Choose a paragraph to read
              </div>
              <div style={{ fontSize: '13px' }}>
                Click a classmate's name on the left to get started.
              </div>
            </div>
          ) : (
            <div style={{
              background: 'white', border: '1px solid var(--line)',
              borderRadius: 'var(--radius)', overflow: 'hidden'
            }}>
              {/* Header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '14px 18px',
                borderBottom: '1px solid var(--line)',
                background: 'var(--paper2)'
              }}>
                <Avatar name={selectedDraft.student_name} color={selectedDraft.color} size={36} />
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--ink)' }}>
                    {selectedDraft.student_name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--ink3)' }}>
                    Unit {selectedDraft.unit} — {selectedDraft.topic} · Grade {selectedDraft.grade}
                  </div>
                </div>
              </div>

              {/* Sub-tabs */}
              <div style={{ display: 'flex', borderBottom: '1px solid var(--line)', background: 'var(--paper2)' }}>
                {[
                  { key: 'read', label: 'Read' },
                  { key: 'comments', label: `Comments (${(draftComments[selectedDraft.id] || []).length})` },
                  { key: 'qa', label: `Questions (${(draftQuestions[selectedDraft.id] || []).length})` }
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setDraftSubTab(tab.key)}
                    style={{
                      padding: '10px 18px', fontSize: '13px', fontWeight: '500',
                      color: draftSubTab === tab.key ? 'var(--ink)' : 'var(--ink3)',
                      borderBottom: `2px solid ${draftSubTab === tab.key ? 'var(--teal)' : 'transparent'}`,
                      background: draftSubTab === tab.key ? 'white' : 'transparent',
                      border: 'none', cursor: 'pointer'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div style={{ padding: '20px' }}>
                {/* READ */}
                {draftSubTab === 'read' && (
                  <div>
                    <div style={{
                      fontFamily: 'Georgia, serif', fontSize: '15px',
                      lineHeight: '1.9', color: 'var(--ink)',
                      marginBottom: '20px', whiteSpace: 'pre-wrap'
                    }}>
                      {selectedDraft.paragraph}
                    </div>

                    {/* Guiding prompts */}
                    <div style={{
                      padding: '14px 16px',
                      background: 'var(--paper2)', border: '1px solid var(--line)',
                      borderRadius: 'var(--radius)', marginBottom: '16px'
                    }}>
                      <div style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--ink3)', marginBottom: '10px' }}>
                        Things to think about
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {guidingPrompts.map((q, i) => (
                          <div key={i} style={{ display: 'flex', gap: '10px' }}>
                            <div style={{
                              width: '18px', height: '18px', borderRadius: '50%',
                              background: 'var(--teal-light)', border: '1px solid var(--teal-mid)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '11px', fontWeight: '600', color: 'var(--teal)', flexShrink: 0
                            }}>
                              {i + 1}
                            </div>
                            <div style={{ fontSize: '13px', color: 'var(--ink2)', lineHeight: '1.6' }}>
                              {q}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--ink3)', fontStyle: 'italic' }}>
                        Use these to help you write a comment or question below.
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--line)' }}>
                      <button onClick={() => setDraftSubTab('comments')} style={{ fontSize: '13px', padding: '7px 16px', borderRadius: '8px', border: '1.5px solid var(--line)', background: 'white', color: 'var(--ink)', cursor: 'pointer' }}>
                        Leave a comment
                      </button>
                      <button onClick={() => setDraftSubTab('qa')} style={{ fontSize: '13px', padding: '7px 16px', borderRadius: '8px', border: '1.5px solid var(--line)', background: 'white', color: 'var(--ink3)', cursor: 'pointer' }}>
                        Ask a question
                      </button>
                    </div>
                  </div>
                )}

                {/* COMMENTS */}
                {draftSubTab === 'comments' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ fontSize: '13px', color: 'var(--ink3)', padding: '10px 12px', background: 'var(--paper2)', borderRadius: '8px', marginBottom: '4px' }}>
                      Write about the IDEAS in this paragraph — what you liked, what you noticed, or what you thought about.
                    </div>
                    {(draftComments[selectedDraft.id] || []).length === 0 && (
                      <div style={{ fontSize: '13px', color: 'var(--ink3)', padding: '8px 0' }}>No comments yet. Be the first to respond.</div>
                    )}
                    {(draftComments[selectedDraft.id] || []).map(c => (
                      <div key={c.id} style={{ display: 'flex', gap: '10px' }}>
                        <Avatar name={c.isOwn ? 'You' : c.author} color={c.isOwn ? '#2a7c6f' : (c.color || '#5b8fa0')} size={28} />
                        <div style={{ flex: 1, background: 'var(--paper2)', border: '1px solid var(--line)', borderRadius: '8px', padding: '10px 13px' }}>
                          <div style={{ fontSize: '11px', color: 'var(--ink3)', marginBottom: '4px' }}>
                            <strong style={{ color: 'var(--ink)' }}>{c.isOwn ? 'You' : c.author}</strong> · {c.created_at}
                          </div>
                          <div style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--ink)' }}>{c.text}</div>
                        </div>
                      </div>
                    ))}
                    <div style={{ display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid var(--line)' }}>
                      <textarea
                        value={commentInputs[selectedDraft.id] || ''}
                        onChange={e => setCommentInputs(prev => ({ ...prev, [selectedDraft.id]: e.target.value }))}
                        placeholder="Write your comment here…"
                        rows={3}
                        onFocus={e => e.target.style.borderColor = 'var(--teal-mid)'}
                        onBlur={e => e.target.style.borderColor = 'var(--line)'}
                        style={{ flex: 1, fontSize: '13px', padding: '8px 12px', borderRadius: '8px', border: '1.5px solid var(--line)', background: 'white', color: 'var(--ink)', resize: 'none', fontFamily: 'var(--font-sans)' }}
                      />
                      <button
                        onClick={() => postComment(selectedDraft.id, commentInputs[selectedDraft.id] || '')}
                        disabled={!(commentInputs[selectedDraft.id] || '').trim()}
                        style={{ fontSize: '13px', padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'var(--teal)', color: 'white', cursor: 'pointer', alignSelf: 'flex-end', opacity: !(commentInputs[selectedDraft.id] || '').trim() ? 0.4 : 1, fontWeight: '500' }}
                      >
                        Post +{POINTS_CONFIG.postComment}⭐
                      </button>
                    </div>
                  </div>
                )}

                {/* Q&A */}
                {draftSubTab === 'qa' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ fontSize: '13px', color: 'var(--ink3)', padding: '10px 12px', background: 'var(--paper2)', borderRadius: '8px', marginBottom: '4px' }}>
                      Ask the writer a question about their paragraph.
                    </div>
                    {(draftQuestions[selectedDraft.id] || []).map(q => (
                      <div key={q.id} style={{ border: '1px solid var(--line)', borderRadius: '10px', overflow: 'hidden' }}>
                        <div style={{ padding: '12px 14px', background: 'var(--paper2)', display: 'flex', gap: '10px' }}>
                          <Avatar name={q.isOwn ? 'You' : q.asker} color={q.isOwn ? '#2a7c6f' : (q.color || '#b87d2a')} size={22} />
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--ink)' }}>{q.text}</div>
                            <div style={{ fontSize: '11px', color: 'var(--ink3)', marginTop: '3px' }}>— {q.isOwn ? 'You' : q.asker}</div>
                          </div>
                        </div>
                        {q.answers.map(a => (
                          <div key={a.id} style={{ display: 'flex', gap: '8px', padding: '10px 14px 10px 46px', borderTop: '1px solid var(--line)' }}>
                            <Avatar name={a.isOwn ? 'You' : a.author} color={a.isOwn ? '#2a7c6f' : (a.color || '#5b8fa0')} size={20} />
                            <div>
                              <div style={{ fontSize: '13px', color: 'var(--ink)' }}>{a.text}</div>
                              <div style={{ fontSize: '11px', color: 'var(--ink3)' }}>{a.isOwn ? 'You' : a.author}</div>
                            </div>
                          </div>
                        ))}
                        <div style={{ padding: '10px 14px 10px 46px', borderTop: '1px solid var(--line)', background: 'var(--paper2)', display: 'flex', gap: '8px' }}>
                          <textarea
                            value={answerInputs[`${selectedDraft.id}_${q.id}`] || ''}
                            onChange={e => setAnswerInputs(prev => ({ ...prev, [`${selectedDraft.id}_${q.id}`]: e.target.value }))}
                            placeholder="Write an answer…"
                            rows={1}
                            onFocus={e => e.target.style.borderColor = 'var(--teal-mid)'}
                            onBlur={e => e.target.style.borderColor = 'var(--line)'}
                            style={{ flex: 1, fontSize: '12px', padding: '6px 10px', borderRadius: '8px', border: '1.5px solid var(--line)', background: 'white', color: 'var(--ink)', resize: 'none', fontFamily: 'var(--font-sans)' }}
                          />
                          <button
                            onClick={() => postAnswer(selectedDraft.id, q.id, answerInputs[`${selectedDraft.id}_${q.id}`] || '')}
                            disabled={!(answerInputs[`${selectedDraft.id}_${q.id}`] || '').trim()}
                            style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '8px', border: 'none', background: 'var(--teal)', color: 'white', cursor: 'pointer', alignSelf: 'flex-end', opacity: !(answerInputs[`${selectedDraft.id}_${q.id}`] || '').trim() ? 0.4 : 1 }}
                          >
                            Reply
                          </button>
                        </div>
                      </div>
                    ))}
                    <div style={{ paddingTop: '12px', borderTop: '1px solid var(--line)', display: 'flex', gap: '8px' }}>
                      <textarea
                        value={questionInputs[selectedDraft.id] || ''}
                        onChange={e => setQuestionInputs(prev => ({ ...prev, [selectedDraft.id]: e.target.value }))}
                        placeholder="Ask the writer a question about their paragraph…"
                        rows={2}
                        onFocus={e => e.target.style.borderColor = 'var(--teal-mid)'}
                        onBlur={e => e.target.style.borderColor = 'var(--line)'}
                        style={{ flex: 1, fontSize: '13px', padding: '8px 12px', borderRadius: '8px', border: '1.5px solid var(--line)', background: 'white', color: 'var(--ink)', resize: 'none', fontFamily: 'var(--font-sans)' }}
                      />
                      <button
                        onClick={() => postQuestion(selectedDraft.id, questionInputs[selectedDraft.id] || '')}
                        disabled={!(questionInputs[selectedDraft.id] || '').trim()}
                        style={{ fontSize: '13px', padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'var(--teal)', color: 'white', cursor: 'pointer', alignSelf: 'flex-end', opacity: !(questionInputs[selectedDraft.id] || '').trim() ? 0.4 : 1, fontWeight: '500' }}
                      >
                        Ask +{POINTS_CONFIG.askQuestion}⭐
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        )}

        {/* ── STRUGGLES TAB ── */}
        {peerTab === 'struggles' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              background: 'white', border: '1px solid var(--line)',
              borderRadius: 'var(--radius)', padding: '16px 18px'
            }}>
              <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--ink)', marginBottom: '4px' }}>
                Learning questions
              </div>
              <div style={{ fontSize: '13px', color: 'var(--ink3)', marginBottom: '14px' }}>
                Is there something about English or this writing task that confuses you? Ask here — others in your grade might have the same question or can help.
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <textarea
                  value={learningQuestionInput}
                  onChange={e => setLearningQuestionInput(e.target.value)}
                  placeholder="What are you finding difficult? Ask your classmates…"
                  rows={2}
                  onFocus={e => e.target.style.borderColor = 'var(--teal-mid)'}
                  onBlur={e => e.target.style.borderColor = 'var(--line)'}
                  style={{ flex: 1, fontSize: '13px', padding: '8px 12px', borderRadius: '8px', border: '1.5px solid var(--line)', background: 'white', color: 'var(--ink)', resize: 'none', fontFamily: 'var(--font-sans)' }}
                />
                <button
                  onClick={() => postLearningQuestion(learningQuestionInput)}
                  disabled={!learningQuestionInput.trim()}
                  style={{ fontSize: '13px', padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'var(--teal)', color: 'white', cursor: 'pointer', alignSelf: 'flex-end', opacity: !learningQuestionInput.trim() ? 0.4 : 1, fontWeight: '500' }}
                >
                  Post +{POINTS_CONFIG.postLearningQuestion}⭐
                </button>
              </div>
            </div>

            {learningQuestions.map(q => (
              <div key={q.id} style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                <div style={{ padding: '14px 16px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <Avatar name={q.isOwn ? 'You' : q.author} color={q.isOwn ? '#2a7c6f' : q.color} size={30} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '11px', color: 'var(--ink3)', marginBottom: '4px', fontWeight: '600' }}>
                      {q.isOwn ? 'You' : q.author}
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--ink)', lineHeight: '1.6', fontWeight: '500' }}>
                      {q.text}
                    </div>
                  </div>
                </div>

                {q.answers.map(a => (
                  <div key={a.id} style={{ display: 'flex', gap: '10px', padding: '12px 16px 12px 58px', borderTop: '1px solid var(--line)', background: 'var(--paper2)' }}>
                    <Avatar name={a.isOwn ? 'You' : a.author} color={a.isOwn ? '#2a7c6f' : a.color} size={24} />
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--ink3)', marginBottom: '3px', fontWeight: '600' }}>
                        {a.isOwn ? 'You' : a.author}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--ink)', lineHeight: '1.6' }}>{a.text}</div>
                    </div>
                  </div>
                ))}

                <div style={{ padding: '10px 16px 12px 58px', borderTop: '1px solid var(--line)', display: 'flex', gap: '8px' }}>
                  <textarea
                    value={learningAnswerInputs[q.id] || ''}
                    onChange={e => setLearningAnswerInputs(prev => ({ ...prev, [q.id]: e.target.value }))}
                    placeholder="Share your experience or answer…"
                    rows={1}
                    onFocus={e => e.target.style.borderColor = 'var(--teal-mid)'}
                    onBlur={e => e.target.style.borderColor = 'var(--line)'}
                    style={{ flex: 1, fontSize: '12px', padding: '6px 10px', borderRadius: '8px', border: '1.5px solid var(--line)', background: 'white', color: 'var(--ink)', resize: 'none', fontFamily: 'var(--font-sans)' }}
                  />
                  <button
                    onClick={() => postLearningAnswer(q.id, learningAnswerInputs[q.id] || '')}
                    disabled={!(learningAnswerInputs[q.id] || '').trim()}
                    style={{ fontSize: '12px', padding: '6px 14px', borderRadius: '8px', border: 'none', background: 'var(--teal)', color: 'white', cursor: 'pointer', alignSelf: 'flex-end', opacity: !(learningAnswerInputs[q.id] || '').trim() ? 0.4 : 1 }}
                  >
                    Answer +{POINTS_CONFIG.answerLearningQuestion}⭐
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── LEADERBOARD TAB ── */}
        {peerTab === 'leaderboard' && (
          <div style={{
            background: 'white', border: '1px solid var(--line)',
            borderRadius: 'var(--radius)', overflow: 'hidden'
          }}>
            <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--line)', background: 'var(--paper2)' }}>
              <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--ink)' }}>🏆 Leaderboard — Grade {grade}</div>
              <div style={{ fontSize: '13px', color: 'var(--ink3)', marginTop: '3px' }}>Points earned this week</div>
            </div>
            <div style={{ padding: '8px 0' }}>
              {fullLeaderboard.map((entry, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '10px 18px',
                    background: entry.name === 'You' ? 'var(--teal-light)' : 'white',
                    borderBottom: '1px solid var(--line)'
                  }}
                >
                  <div style={{
                    width: '24px', fontSize: '14px', fontWeight: '700',
                    color: i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#b87d2a' : 'var(--ink3)',
                    textAlign: 'center'
                  }}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                  </div>
                  <Avatar name={entry.name} color={entry.color} size={30} />
                  <div style={{ flex: 1, fontSize: '14px', fontWeight: entry.name === 'You' ? '600' : '400', color: 'var(--ink)' }}>
                    {entry.name}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--teal)' }}>
                    ⭐ {entry.points}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
