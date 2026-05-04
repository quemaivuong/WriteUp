import { useState, useCallback } from 'react'

// ── Anonymous name generator ──────────────────────────────────────
const FUNNY_NAMES = [
  'Sleepy Panda', 'Bouncy Frog', 'Grumpy Crab', 'Dizzy Owl',
  'Fluffy Cloud', 'Sneaky Fox', 'Wobbly Duck', 'Spiky Hedgehog',
  'Lazy Koala', 'Hungry Bear', 'Silly Penguin', 'Tiny Elephant',
  'Happy Turtle', 'Clumsy Giraffe', 'Brave Hamster', 'Quiet Dragon',
  'Jumpy Rabbit', 'Curious Cat', 'Fancy Flamingo', 'Speedy Snail'
]

function getAnonymousName(id) {
  const index = Math.abs(
    id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  ) % FUNNY_NAMES.length
  return FUNNY_NAMES[index]
}

const AVATAR_COLORS = [
  '#5b8fa0', '#7a6fa0', '#a07a6f', '#6fa08a',
  '#a09a6f', '#8a6fa0', '#6f8aa0', '#a06f7a'
]

function getAvatarColor(id) {
  const index = Math.abs(
    id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  ) % AVATAR_COLORS.length
  return AVATAR_COLORS[index]
}

// ── Grade-differentiated guiding prompts ─────────────────────────
const GRADE_GUIDING_PROMPTS = {
  6: [
    "What did the writer talk about?",
    "What word or sentence did you like?",
    "Is there anything you did not understand?",
    "Do you have a question for the writer?"
  ],
  7: [
    "Did the writer answer the task question?",
    "What detail helped you understand the topic better?",
    "What would you like to know more about?",
    "Do you agree with what the writer said? Why?"
  ],
  8: [
    "Is the writer's opinion clear?",
    "Did the writer give good reasons for their ideas?",
    "Do you agree or disagree with the writer?",
    "What is one thing the paragraph did not explain?"
  ],
  9: [
    "Is the argument convincing? What makes it strong or weak?",
    "What evidence did the writer use?",
    "What question does this paragraph leave unanswered?",
    "What counter-argument could someone make?"
  ],
  10: [
    "Is the position well-supported with evidence?",
    "How could the writer make their argument stronger?",
    "What assumptions does the writer make?",
    "What is the most convincing part of this paragraph?"
  ],
  11: [
    "How effectively does the writer address the complexity of this topic?",
    "Does the writer acknowledge other points of view?",
    "What evidence would make this argument more persuasive?",
    "What is the strongest and weakest part of the paragraph?"
  ],
  12: [
    "How sophisticated is the writer's argument?",
    "Does the paragraph show a nuanced understanding of the topic?",
    "What would you add or change to make this more convincing?",
    "How does this compare to your own approach to the task?"
  ]
}

// ── Mock drafts by grade ──────────────────────────────────────────
const ALL_MOCK_DRAFTS = {
  6: [
    {
      id: 'g6_1',
      topic: 'My New School',
      task: 'Write a paragraph about your school',
      unit: 1,
      paragraph: 'My school is Nguyen Du Primary School. It is in District 3. My school have five buildings and thirty classes. Students study many subject like Math, English, and Art. I like my school because the teachers are very kind and the library have many books. Every morning we do exercise in the yard together.'
    },
    {
      id: 'g6_2',
      topic: 'My Friends',
      task: 'Write a diary entry about your best friend',
      unit: 3,
      paragraph: 'Dear Diary, My best friend is Lan. She have long black hair and big eyes. She is very kind and funny. She always help me when I have problem at school. Yesterday we go to the park and eat ice cream together. I like her because she make me happy every day and she never angry with me.'
    },
    {
      id: 'g6_3',
      topic: 'My Neighbourhood',
      task: 'Write a paragraph about your neighbourhood',
      unit: 4,
      paragraph: 'I live in a small street near the market. There are many things I like about my neighbourhood. It have a big park where children play after school. The people here are very friendly. However, there are some things I dislike. The road is narrow and sometimes it is noisy at night because of the market.'
    }
  ],
  7: [
    {
      id: 'g7_1',
      topic: 'Hobbies',
      task: 'Write a paragraph about your hobby',
      unit: 1,
      paragraph: 'My hobby is collecting stamps. I started this hobby two years ago when my uncle give me his old stamp collection. I collect stamps from many countries. I need a special album to keep them safe. This hobby help me learn about different countries and cultures. I usually spend one hour every weekend looking at my collection and I feel very happy.'
    },
    {
      id: 'g7_2',
      topic: 'Films',
      task: 'Write a paragraph about a film',
      unit: 8,
      paragraph: 'My favourite film is Doraemon: Nobita and the Steel Troops. It is an animation film from Japan. The story is about Nobita who find a robot in a field and they become friends. Although the robot cannot speak at first, Nobita teach it many things. I like this film because it show that friendship is important. I recommend this film to everyone who like adventure and friendship.'
    },
    {
      id: 'g7_3',
      topic: 'Energy Sources',
      task: 'Write a paragraph about how to save energy at home',
      unit: 10,
      paragraph: 'Energy is very important in our life but we are using too much of it. To save energy at home, we should do some simple things. Firstly, we should turn off the lights when we leave a room because it waste electricity. Secondly, we should not leave the television on when nobody is watching. Finally, we can use a fan instead of air conditioning when the weather is not too hot. If everyone do these things, we can save a lot of energy.'
    }
  ],
  8: [
    {
      id: 'g8_1',
      topic: 'Life in the Countryside',
      task: 'Write about what you like or dislike about countryside life',
      unit: 2,
      paragraph: 'Life in the countryside has both advantages and disadvantages. I like the fresh air and peaceful environment because it helps me feel relaxed after studying. The people are also friendlier than in the city. However, there are some things I dislike. There is not much entertainment for young people and the transportation is inconvenient. Overall, I prefer living in the city because I need access to good schools and hospitals, but I enjoy visiting the countryside on holidays.'
    },
    {
      id: 'g8_2',
      topic: 'Science and Technology',
      task: 'Write a paragraph about the benefits of an invention',
      unit: 11,
      paragraph: 'The smartphone is one of the most important inventions of the modern age. First, it helps people communicate instantly with friends and family anywhere in the world. Second, it provides access to information through the internet, which makes learning more convenient. Third, smartphones have many useful applications for studying, working, and entertainment. However, some people use their phones too much and this can affect their health and relationships. Despite this, I believe the smartphone has changed our lives in mostly positive ways.'
    },
    {
      id: 'g8_3',
      topic: 'Online Learning',
      task: 'Write about the advantages or disadvantages of online learning',
      unit: 6,
      paragraph: 'Online learning has become popular in recent years, especially after the pandemic. There are several advantages to studying online. It is flexible because students can learn at any time and in any place. It also saves time and money on transportation. On the other hand, online learning has some serious disadvantages. Students cannot interact with their teachers and classmates in person, which makes it harder to ask questions and stay motivated. In conclusion, online learning is useful but it works best when combined with traditional classroom learning.'
    }
  ]
}

// ── Mock learning questions (Struggles space) ─────────────────────
const INITIAL_LEARNING_QUESTIONS = {
  6: [
    {
      id: 'lq6_1',
      author: 'Bouncy Frog',
      color: '#5b8fa0',
      text: 'When do I use "a" and when do I use "an"? I always get confused.',
      answers: [
        { id: 'la6_1', author: 'Sleepy Panda', color: '#7a6fa0', text: 'Use "a" before words that start with a consonant sound, like "a book" or "a cat". Use "an" before words that start with a vowel sound, like "an apple" or "an umbrella". I used to get confused too!' }
      ]
    },
    {
      id: 'lq6_2',
      author: 'Grumpy Crab',
      color: '#a07a6f',
      text: 'My sentences are too short. How do I make them longer?',
      answers: []
    }
  ],
  7: [
    {
      id: 'lq7_1',
      author: 'Fluffy Cloud',
      color: '#6fa08a',
      text: 'I never know how to start my paragraph. What is a good topic sentence?',
      answers: [
        { id: 'la7_1', author: 'Wobbly Duck', color: '#a09a6f', text: 'A topic sentence usually says what the whole paragraph is about. For example if you write about your hobby, start with: "My favourite hobby is ____." Then explain more in the next sentences.' }
      ]
    },
    {
      id: 'lq7_2',
      author: 'Dizzy Owl',
      color: '#8a6fa0',
      text: 'Is it normal to forget English words when I am writing? It happens to me all the time.',
      answers: [
        { id: 'la7_2', author: 'Fluffy Cloud', color: '#6fa08a', text: 'Yes! This happens to everyone. When I forget a word, I write a simpler word I know instead and keep going. You can always improve it later.' }
      ]
    }
  ],
  8: [
    {
      id: 'lq8_1',
      author: 'Spiky Hedgehog',
      color: '#5b8fa0',
      text: 'How do I know when to use "however" and when to use "although"?',
      answers: [
        { id: 'la8_1', author: 'Lazy Koala', color: '#7a6fa0', text: '"However" goes at the start of a new sentence to show contrast: "It is convenient. However, it is expensive." "Although" connects two ideas in one sentence: "Although it is convenient, it is expensive." Both show contrast but in different ways.' }
      ]
    },
    {
      id: 'lq8_2',
      author: 'Hungry Bear',
      color: '#a07a6f',
      text: 'My opinion paragraphs always sound the same. How can I make them more interesting?',
      answers: []
    }
  ]
}

// ── Points config ─────────────────────────────────────────────────
const POINTS_CONFIG = {
  shareDraft: 10,
  postComment: 5,
  askQuestion: 5,
  postLearningQuestion: 3,
  answerLearningQuestion: 10
}

export default function usePeer({ studentId, grade, draftSubmitted }) {
  const rawDrafts = ALL_MOCK_DRAFTS[grade] || ALL_MOCK_DRAFTS[8]
  const gradeDrafts = rawDrafts.map(d => ({
    ...d,
    student_name: getAnonymousName(d.id),
    initials: getAnonymousName(d.id).split(' ').map(w => w[0]).join(''),
    color: getAvatarColor(d.id),
    grade
  }))

  const [selectedDraftId, setSelectedDraftId] = useState(null)
  const [activeTab, setActiveTab] = useState('drafts')
  const [interactions, setInteractions] = useState({})
  const [commentInputs, setCommentInputs] = useState({})
  const [questionInputs, setQuestionInputs] = useState({})
  const [answerInputs, setAnswerInputs] = useState({})
  const [draftComments, setDraftComments] = useState(
    Object.fromEntries(gradeDrafts.map(d => [d.id, []]))
  )
  const [draftQuestions, setDraftQuestions] = useState(
    Object.fromEntries(gradeDrafts.map(d => [d.id, []]))
  )
  const [learningQuestions, setLearningQuestions] = useState(
    INITIAL_LEARNING_QUESTIONS[grade] || []
  )
  const [learningQuestionInput, setLearningQuestionInput] = useState('')
  const [learningAnswerInputs, setLearningAnswerInputs] = useState({})
  const [points, setPoints] = useState(draftSubmitted ? POINTS_CONFIG.shareDraft : 0)

  const selectedDraft = gradeDrafts.find(d => d.id === selectedDraftId) || null

  const anonymousName = (id) => getAnonymousName(id)
  const avatarColor = (id) => getAvatarColor(id)
  const guidingPrompts = GRADE_GUIDING_PROMPTS[grade] || GRADE_GUIDING_PROMPTS[8]

  const hasInteracted = (draftId) =>
    interactions[draftId]?.commented || interactions[draftId]?.questioned

  const hasPostedLearningQuestion = learningQuestions.some(
    q => q.isOwn
  )

  const completionSteps = [
    { label: 'Write your paragraph', done: true },
    { label: 'Share your draft', done: draftSubmitted },
    { label: 'Read a classmate\'s paragraph', done: !!selectedDraftId },
    { label: 'Post a comment or question', done: Object.values(interactions).some(i => i.commented || i.questioned) }
  ]

  const addPoints = useCallback((amount) => {
    setPoints(prev => prev + amount)
  }, [])

  const postComment = useCallback((draftId, text) => {
    if (!text.trim()) return
    const newComment = {
      id: `c_${Date.now()}`,
      author: 'You',
      color: '#2a7c6f',
      text: text.trim(),
      created_at: 'just now',
      isOwn: true
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
    addPoints(POINTS_CONFIG.postComment)
  }, [addPoints])

  const postQuestion = useCallback((draftId, text) => {
    if (!text.trim()) return
    const newQuestion = {
      id: `q_${Date.now()}`,
      asker: 'You',
      color: '#2a7c6f',
      text: text.trim(),
      answers: [],
      isOwn: true
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
    addPoints(POINTS_CONFIG.askQuestion)
  }, [addPoints])

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
            color: '#2a7c6f',
            text: text.trim(),
            isOwn: true
          }]
        }
      )
    }))
    setAnswerInputs(prev => ({
      ...prev,
      [`${draftId}_${questionId}`]: ''
    }))
  }, [])

  const postLearningQuestion = useCallback((text) => {
    if (!text.trim()) return
    const newQ = {
      id: `lq_${Date.now()}`,
      author: 'You',
      color: '#2a7c6f',
      text: text.trim(),
      answers: [],
      isOwn: true
    }
    setLearningQuestions(prev => [newQ, ...prev])
    setLearningQuestionInput('')
    addPoints(POINTS_CONFIG.postLearningQuestion)
  }, [addPoints])

  const postLearningAnswer = useCallback((questionId, text) => {
    if (!text.trim()) return
    setLearningQuestions(prev =>
      prev.map(q =>
        q.id !== questionId ? q : {
          ...q,
          answers: [...q.answers, {
            id: `la_${Date.now()}`,
            author: 'You',
            color: '#2a7c6f',
            text: text.trim(),
            isOwn: true
          }]
        }
      )
    )
    setLearningAnswerInputs(prev => ({ ...prev, [questionId]: '' }))
    addPoints(POINTS_CONFIG.answerLearningQuestion)
  }, [addPoints])

  return {
    drafts: gradeDrafts,
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
    learningQuestions,
    learningQuestionInput,
    setLearningQuestionInput,
    learningAnswerInputs,
    setLearningAnswerInputs,
    completionSteps,
    hasInteracted,
    postComment,
    postQuestion,
    postAnswer,
    postLearningQuestion,
    postLearningAnswer,
    guidingPrompts,
    anonymousName,
    avatarColor,
    points,
    hasPostedLearningQuestion,
    POINTS_CONFIG
  }
}
