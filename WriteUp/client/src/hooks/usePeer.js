import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'

// Mock peer drafts — used until real student drafts accumulate
const MOCK_DRAFTS = [
  {
    id: 'mock_1',
    student_name: 'Minh Tú',
    initials: 'MT',
    color: '#5b6fa0',
    topic: 'Should schools use smartphones?',
    task: 'Opinion paragraph',
    grade: 8,
    paragraph: `I disagree that students should use smartphones in class because they cause many distractions. Firstly, students often check social media instead of listening to the teacher. This means they miss important information and their grades go down. Secondly, smartphones make students less able to focus for long periods. If students always look at their phones, they cannot develop the concentration skills they need for exams.`,
    comments: [
      { id: 'c1', author: 'Lan Nguyen', initials: 'LN', color: '#2a7c6f', text: 'Your first reason is very clear! The connection to grades makes it convincing.', created_at: '10 minutes ago' }
    ],
    questions: [
      { id: 'q1', asker: 'Duc Anh', initials: 'DA', color: '#c9533a', text: 'You say smartphones cause distraction — but what about when teachers ask students to look things up? How would you handle that?', answers: [] }
    ]
  },
  {
    id: 'mock_2',
    student_name: 'Bảo Châu',
    initials: 'BC',
    color: '#b87d2a',
    topic: 'Describe your hometown',
    task: 'Descriptive paragraph',
    grade: 7,
    paragraph: `My hometown is Hội An, a small and beautiful city in central Vietnam. It is famous for the Ancient Town, where the houses are very old and the streets are very narrow. Every night, people hang colourful lanterns and the whole town looks like a fairy tale. I love the food in Hội An very much. The most famous dish is Cao Lầu, which uses special water from ancient wells.`,
    comments: [],
    questions: [
      { id: 'q2', asker: 'Thu Ha', initials: 'TH', color: '#6b4fa0', text: 'Your description is very vivid! What makes Cao Lầu different from other noodle dishes?', answers: [{ id: 'a1', author: 'Bảo Châu', initials: 'BC', color: '#b87d2a', text: 'The water comes from special ancient wells and gives it a unique taste — you cannot make real Cao Lầu anywhere else!' }] }
    ]
  },
  {
    id: 'mock_3',
    student_name: 'Đức Anh',
    initials: 'DA',
    color: '#c9533a',
    topic: 'Should students wear uniforms?',
    task: 'Opinion paragraph',
    grade: 8,
    paragraph: `I agree that students should wear uniforms at school for two main reasons. Firstly, uniforms create a sense of equality because no student feels embarrassed about their family's financial situation. This means students can focus on their studies rather than comparing clothes. Secondly, uniforms save time in the morning because students do not need to choose what to wear. Therefore, they arrive at school more prepared and on time.`,
    comments: [
      { id: 'c2', author: 'Bảo Châu', initials: 'BC', color: '#b87d2a', text: 'Your analytical link after the first reason is excellent — "This means students can focus" connects perfectly back to your position.', created_at: '1 hour ago' }
    ],
    questions: []
  },
  {
    id: 'mock_4',
    student_name: 'Ngọc Linh',
    initials: 'NL',
    color: '#3a7a4a',
    topic: 'A memorable moment',
    task: 'Narrative paragraph',
    grade: 7,
    paragraph: `The most memorable moment of my life was when I received my exam results. I woke up very early that morning and my heart was beating so fast. My mother held my hand while my father looked at the screen. When we saw my score, I could not believe my eyes. I had passed and earned a place at the best school in our province. My father, who is usually very serious, had tears in his eyes.`,
    comments: [],
    questions: []
  }
]

export default function usePeer({ studentId, grade }) {
  const [drafts, setDrafts] = useState(MOCK_DRAFTS)
  const [selectedDraftId, setSelectedDraftId] = useState(null)
  const [activeTab, setActiveTab] = useState('read')
  const [isLoading, setIsLoading] = useState(false)

  const selectedDraft = drafts.find(d => d.id === selectedDraftId) || null

  // Post a comment
  const postComment = useCallback((draftId, text) => {
    if (!text.trim()) return
    setDrafts(prev => prev.map(d => {
      if (d.id !== draftId) return d
      return {
        ...d,
        comments: [
          ...d.comments,
          {
            id: `c_${Date.now()}`,
            author: 'You',
            initials: 'YO',
            color: '#2a7c6f',
            text: text.trim(),
            created_at: 'just now'
          }
        ]
      }
    }))
  }, [])

  // Post a question
  const postQuestion = useCallback((draftId, text) => {
    if (!text.trim()) return
    setDrafts(prev => prev.map(d => {
      if (d.id !== draftId) return d
      return {
        ...d,
        questions: [
          ...d.questions,
          {
            id: `q_${Date.now()}`,
            asker: 'You',
            initials: 'YO',
            color: '#2a7c6f',
            text: text.trim(),
            answers: []
          }
        ]
      }
    }))
  }, [])

  // Post an answer
  const postAnswer = useCallback((draftId, questionId, text) => {
    if (!text.trim()) return
    setDrafts(prev => prev.map(d => {
      if (d.id !== draftId) return d
      return {
        ...d,
        questions: d.questions.map(q => {
          if (q.id !== questionId) return q
          return {
            ...q,
            answers: [
              ...q.answers,
              {
                id: `a_${Date.now()}`,
                author: 'You',
                initials: 'YO',
                color: '#2a7c6f',
                text: text.trim()
              }
            ]
          }
        })
      }
    }))
  }, [])

  return {
    drafts,
    selectedDraft,
    selectedDraftId,
    setSelectedDraftId,
    activeTab,
    setActiveTab,
    isLoading,
    postComment,
    postQuestion,
    postAnswer
  }
}
