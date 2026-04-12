import { useState, useCallback } from 'react'

const MOCK_DRAFTS = [
  {
    id: 'mock_1',
    student_name: 'Minh Tú',
    initials: 'MT',
    color: '#5b6fa0',
    topic: 'My best friend',
    task: 'Write a diary entry about your best friend',
    grade: 6,
    unit: 3,
    paragraph: 'Dear Diary, My best friend is Lan. She has long black hair and big brown eyes. She is very kind and funny. She always help me when I have problems at school. Yesterday we go to the park together and eat ice cream. I like her because she make me happy every day.',
    comments: [
      { id: 'c1', author: 'Duc Anh', initials: 'DA', color: '#2a7c6f', text: 'I like how you described what Lan looks like. I can picture her!', created_at: '10 minutes ago' }
    ],
    questions: [
      { id: 'q1', asker: 'Thu Ha', initials: 'TH', color: '#c9533a', text: 'What do you and Lan like to do together most?', answers: [] }
    ]
  },
  {
    id: 'mock_2',
    student_name: 'Bảo Châu',
    initials: 'BC',
    color: '#b87d2a',
    topic: 'My neighbourhood',
    task: 'Write a paragraph about your neighbourhood',
    grade: 7,
    unit: 4,
    paragraph: 'I live in a small town near Ha Noi. There are many things I like about my neighbourhood. It has a big park where children play after school. The people here are very friendly and helpful. However, there are some things I dislike. The roads are narrow and there is not much entertainment for young people. I hope my neighbourhood will get better in the future.',
    comments: [],
    questions: [
      { id: 'q2', asker: 'Ngoc Linh', initials: 'NL', color: '#6b4fa0', text: 'What is your favourite place in your neighbourhood?', answers: [{ id: 'a1', author: 'Bảo Châu', initials: 'BC', color: '#b87d2a', text: 'My favourite place is the park because I can play badminton there with my friends.' }] }
    ]
  },
  {
    id: 'mock_3',
    student_name: 'Đức Anh',
    initials: 'DA',
    color: '#c9533a',
    topic: 'Robots will replace teachers',
    task: 'Write a paragraph: do you agree robots will replace teachers?',
    grade: 8,
    unit: 11,
    paragraph: 'I disagree that robots will soon replace teachers at school. First, robots cannot understand how students feel. When a student is sad or worried, a teacher can see this and help. This means students feel safe at school. Second, robots cannot build real relationships with students. A good teacher knows each student well and remembers what they find difficult. Therefore, teachers are more than just information machines — they care about students as people.',
    comments: [
      { id: 'c2', author: 'Bảo Châu', initials: 'BC', color: '#b87d2a', text: 'I agree with you. Your second reason about relationships is very strong.', created_at: '1 hour ago' }
    ],
    questions: []
  },
  {
    id: 'mock_4',
    student_name: 'Ngọc Linh',
    initials: 'NL',
    color: '#3a7a4a',
    topic: 'Saving energy at home',
    task: 'Write a paragraph about how you save energy at home',
    grade: 7,
    unit: 10,
    paragraph: 'We use a lot of energy at home and it costs us a lot. To save energy, we should do some simple things. Firstly, we should turn off the lights when we leave a room. This is easy to do and it helps save electricity every day. Secondly, we should not leave the TV on when nobody is watching. In my family, we also use fans instead of air conditioning when the weather is not too hot.',
    comments: [],
    questions: []
  }
]

export default function usePeer({ studentId, grade, draftSubmitted }) {
  const [drafts] = useState(MOCK_DRAFTS)
  const [selectedDraftId, setSelectedDraftId] = useState(null)
  const [activeTab, setActiveTab] = useState('read')
  const [interactions, setInteractions] = useState({})
  const [commentInputs, setCommentInputs] = useState({})
  const [questionInputs, setQuestionInputs] = useState({})
  const [answerInputs, setAnswerInputs] = useState({})
  const [draftComments, setDraftComments] = useState(
    Object.fromEntries(MOCK_DRAFTS.map(d => [d.id, d.comments]))
  )
  const [draftQuestions, setDraftQuestions] = useState(
    Object.fromEntries(MOCK_DRAFTS.map(d => [d.id, d.questions]))
  )

  const selectedDraft = drafts.find(d => d.id === selectedDraftId) || null

  const hasInteracted = (draftId) => {
    return interactions[draftId]?.commented || interactions[draftId]?.questioned
  }

  const completionSteps = [
    { label: 'Write your paragraph', done: true },
    { label: 'Share your draft with the class', done: draftSubmitted },
    { label: 'Read a classmate\'s paragraph', done: !!selectedDraftId },
    { label: 'Post a comment or question', done: Object.values(interactions).some(i => i.commented || i.questioned) }
  ]

  const isComplete = completionSteps.every(s => s.done)

  const postComment = useCallback((draftId, text) => {
    if (!text.trim()) return
    const newComment = {
      id: `c_${Date.now()}`,
      author: 'You',
      initials: 'YO',
      color: '#2a7c6f',
      text: text.trim(),
      created_at: 'just now'
    }
    setDraftComments(prev => ({
      ...prev,
      [draftId]: [...(prev[draftId] || []), newComment]
    }))
    setInteractions(prev => ({
      ...prev,
      [draftId]: { ...prev[draftId], commented: true }
    }))
    setCommentInputs(prev => ({ ...prev, [draftId]: '' }))
  }, [])

  const postQuestion = useCallback((draftId, text) => {
    if (!text.trim()) return
    const newQuestion = {
      id: `q_${Date.now()}`,
      asker: 'You',
      initials: 'YO',
      color: '#2a7c6f',
      text: text.trim(),
      answers: []
    }
    setDraftQuestions(prev => ({
      ...prev,
      [draftId]: [...(prev[draftId] || []), newQuestion]
    }))
    setInteractions(prev => ({
      ...prev,
      [draftId]: { ...prev[draftId], questioned: true }
    }))
    setQuestionInputs(prev => ({ ...prev, [draftId]: '' }))
  }, [])

  const postAnswer = useCallback((draftId, questionId, text) => {
    if (!text.trim()) return
    setDraftQuestions(prev => ({
      ...prev,
      [draftId]: (prev[draftId] || []).map(q =>
        q.id !== questionId ? q : {
          ...q,
          answers: [...q.answers, {
            id: `a_${Date.now()}`,
            author: 'You',
            initials: 'YO',
            color: '#2a7c6f',
            text: text.trim()
          }]
        }
      )
    }))
    setAnswerInputs(prev => ({ ...prev, [`${draftId}_${questionId}`]: '' }))
  }, [])

  return {
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
  }
}
