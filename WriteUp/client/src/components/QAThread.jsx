import { useState } from 'react'

function AnswerItem({ answer }) {
  return (
    <div style={{
      display: 'flex', gap: '8px',
      padding: '10px 14px 10px 46px',
      borderTop: '1px solid var(--paper2)',
      alignItems: 'flex-start'
    }}>
      <div style={{
        width: '20px', height: '20px',
        borderRadius: '50%',
        background: answer.color || '#2a7c6f',
        display: 'flex', alignItems: 'center',
        justifyContent: 'center',
        fontSize: '9px', fontWeight: 700,
        color: 'white', flexShrink: 0, marginTop: '2px'
      }}>
        {answer.initials}
      </div>
      <div>
        <div style={{ fontSize: '13px', lineHeight: '1.55', color: 'var(--ink)' }}>
          {answer.text}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--ink3)', marginTop: '2px' }}>
          {answer.author}
        </div>
      </div>
    </div>
  )
}

function QuestionItem({ question, onAnswer }) {
  const [value, setValue] = useState('')

  function handleAnswer() {
    if (!value.trim()) return
    onAnswer(question.id, value.trim())
    setValue('')
  }

  return (
    <div style={{
      border: '1px solid var(--line)',
      borderRadius: 'var(--radius)',
      overflow: 'hidden'
    }}>
      {/* Question */}
      <div style={{
        padding: '12px 14px',
        background: 'var(--amber-light)',
        display: 'flex', gap: '10px'
      }}>
        <div style={{
          width: '22px', height: '22px',
          borderRadius: '50%',
          background: 'var(--amber)',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center',
          fontSize: '11px', fontWeight: 700,
          color: 'white', flexShrink: 0, marginTop: '1px'
        }}>
          Q
        </div>
        <div>
          <div style={{
            fontSize: '13px', fontWeight: 500,
            lineHeight: '1.5', color: 'var(--ink)'
          }}>
            {question.text}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--amber)', marginTop: '3px' }}>
            — {question.asker}
          </div>
        </div>
      </div>

      {/* Answers */}
      <div style={{ background: 'white' }}>
        {question.answers.map(a => (
          <AnswerItem key={a.id} answer={a} />
        ))}

        {/* Answer input */}
        <div style={{
          padding: '10px 14px 10px 46px',
          borderTop: '1px solid var(--paper2)',
          display: 'flex', gap: '8px',
          background: 'var(--paper)'
        }}>
          <textarea
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="Answer this question…"
            rows={1}
            className="textarea"
            style={{ flex: 1, fontSize: '12px', padding: '7px 10px' }}
          />
          <button
            onClick={handleAnswer}
            disabled={!value.trim()}
            className="btn btn-outline btn-sm"
            style={{ alignSelf: 'flex-end' }}
          >
            Reply
          </button>
        </div>
      </div>
    </div>
  )
}

export default function QAThread({ questions, onAsk, onAnswer }) {
  const [value, setValue] = useState('')

  function handleAsk() {
    if (!value.trim()) return
    onAsk(value.trim())
    setValue('')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {questions.length === 0 ? (
        <div style={{ fontSize: '13px', color: 'var(--ink3)', padding: '8px 0' }}>
          No questions yet. Ask the author something about their writing.
        </div>
      ) : (
        questions.map(q => (
          <QuestionItem
            key={q.id}
            question={q}
            onAnswer={(qId, text) => onAnswer(qId, text)}
          />
        ))
      )}

      {/* Ask a question */}
      <div style={{
        paddingTop: '12px',
        borderTop: '1px solid var(--line)',
        marginTop: '4px',
        display: 'flex', gap: '8px'
      }}>
        <textarea
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="Ask the author a question about their writing…"
          rows={2}
          className="textarea"
          style={{ flex: 1, fontSize: '13px' }}
        />
        <button
          onClick={handleAsk}
          disabled={!value.trim()}
          className="btn btn-outline btn-sm"
          style={{ alignSelf: 'flex-end' }}
        >
          Ask
        </button>
      </div>
    </div>
  )
}
