import { useState } from 'react'
import DraftCard from '../components/DraftCard'
import CommentThread from '../components/CommentThread'
import QAThread from '../components/QAThread'
import usePeer from '../hooks/usePeer'

export default function PeerPage({ studentId, grade }) {
  const {
    drafts,
    selectedDraft,
    selectedDraftId,
    setSelectedDraftId,
    activeTab,
    setActiveTab,
    postComment,
    postQuestion,
    postAnswer
  } = usePeer({ studentId, grade })

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

      {/* ── LEFT — Drafts list ── */}
      <div>
        <div style={{
          fontSize: '11px', fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: '0.8px',
          color: 'var(--ink3)', marginBottom: '10px'
        }}>
          Classmates' drafts ({drafts.length})
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {drafts.map(d => (
            <DraftCard
              key={d.id}
              draft={d}
              isSelected={selectedDraftId === d.id}
              onClick={() => {
                setSelectedDraftId(d.id)
                setActiveTab('read')
              }}
            />
          ))}
        </div>

        {/* Mandatory note */}
        <div style={{
          marginTop: '16px',
          padding: '10px 13px',
          background: 'var(--amber-light)',
          border: '1px solid rgba(184,125,42,0.25)',
          borderRadius: '8px',
          fontSize: '12px',
          color: 'var(--amber)',
          lineHeight: '1.6'
        }}>
          <strong>Required:</strong> Read and respond to at least one classmate's draft before your work is marked complete.
        </div>
      </div>

      {/* ── RIGHT — Review area ── */}
      {!selectedDraft ? (
        <div className="card">
          <div style={{
            padding: '60px 24px',
            textAlign: 'center',
            color: 'var(--ink3)'
          }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>👆</div>
            <div style={{
              fontSize: '16px', fontWeight: 500,
              color: 'var(--ink2)', marginBottom: '6px'
            }}>
              Select a draft to review
            </div>
            <div style={{ fontSize: '13px' }}>
              Click any classmate's draft on the left to read and respond.
            </div>
          </div>
        </div>
      ) : (
        <div className="card">
          {/* Draft header */}
          <div className="card-header" style={{ gap: '12px' }}>
            <div style={{
              width: '36px', height: '36px',
              borderRadius: '50%',
              background: selectedDraft.color,
              display: 'flex', alignItems: 'center',
              justifyContent: 'center',
              fontSize: '13px', fontWeight: 600,
              color: 'white', flexShrink: 0
            }}>
              {selectedDraft.initials}
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--ink)' }}>
                {selectedDraft.student_name}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--ink3)', fontWeight: 400 }}>
                {selectedDraft.topic} · {selectedDraft.task}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid var(--line)',
            background: 'var(--paper)'
          }}>
            {[
              { key: 'read', label: '📄 Read' },
              { key: 'comments', label: `💬 Comments (${selectedDraft.comments.length})` },
              { key: 'qa', label: `❓ Q&A (${selectedDraft.questions.length})` }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '10px 18px',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: activeTab === tab.key ? 'var(--teal)' : 'var(--ink3)',
                  background: activeTab === tab.key ? 'white' : 'transparent',
                  border: 'none',
                  borderBottom: `2px solid ${activeTab === tab.key ? 'var(--teal)' : 'transparent'}`,
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

            {/* Read tab */}
            {activeTab === 'read' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{
                  fontFamily: 'Lora, Georgia, serif',
                  fontSize: '15px',
                  lineHeight: '1.9',
                  color: 'var(--ink)',
                  whiteSpace: 'pre-wrap'
                }}>
                  {selectedDraft.paragraph}
                </div>
                <div style={{
                  paddingTop: '16px',
                  borderTop: '1px solid var(--line)',
                  display: 'flex',
                  gap: '8px'
                }}>
                  <button
                    onClick={() => setActiveTab('comments')}
                    className="btn btn-primary btn-sm"
                  >
                    Leave a comment
                  </button>
                  <button
                    onClick={() => setActiveTab('qa')}
                    className="btn btn-outline btn-sm"
                  >
                    Ask a question
                  </button>
                </div>
              </div>
            )}

            {/* Comments tab */}
            {activeTab === 'comments' && (
              <CommentThread
                comments={selectedDraft.comments}
                onPost={text => postComment(selectedDraft.id, text)}
              />
            )}

            {/* Q&A tab */}
            {activeTab === 'qa' && (
              <QAThread
                questions={selectedDraft.questions}
                onAsk={text => postQuestion(selectedDraft.id, text)}
                onAnswer={(qId, text) => postAnswer(selectedDraft.id, qId, text)}
              />
            )}
          </div>
        </div>
      )}
    </main>
  )
}
