import { useState, useCallback } from 'react'
import axios from 'axios'

export default function useConversation({
  studentId,
  grade,
  apprehensionFlags,
  onNewTurn,
  onStudentMessage,
  externalSessionId
}) {
  const [sessionId, setSessionId] = useState(null)
  const activeSessionId = externalSessionId || sessionId
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [pendingErrors, setPendingErrors] = useState([])
  const [disputedError, setDisputedError] = useState(null)
  const [stageComplete, setStageComplete] = useState(false)

  // ── Submit initial paragraph ───────────────────────────────────
  const submitParagraph = useCallback(async ({
    paragraph,
    taskType,
    mode,
    unitTopic
  }) => {
    if (!paragraph.trim()) return
    setIsLoading(true)
    setError(null)

    try {
      const { data } = await axios.post(`${import.meta.env.VITE_API_URL || ''}/api/conversation`, {
        studentId,
        studentMessage: 'Here is my paragraph',
        currentParagraph: paragraph,
        grade,
        taskType,
        mode,
        unitTopic,
        apprehensionFlags,
        sessionId: null,
        pendingErrors: []
      })

      if (data.success) {
        setSessionId(data.data.sessionId)
        setPendingErrors(data.data.socraticQuestions || [])
        setStageComplete(data.data.stageComplete || false)
        onNewTurn(data.data)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [studentId, grade, apprehensionFlags, sessionId, onNewTurn])

  // ── Send a reply in the dialogue ───────────────────────────────
  const sendReply = useCallback(async ({
    message,
    currentParagraph,
    taskType,
    mode,
    unitTopic
  }) => {
    if (!message.trim()) return
    setIsLoading(true)
    setError(null)
    console.log('sendReply called, sessionId:', activeSessionId)

    onStudentMessage(message)

    try {
      const { data } = await axios.post(`${import.meta.env.VITE_API_URL || ''}/api/conversation`, {
        studentId,
        studentMessage: message,
        currentParagraph,
        grade,
        taskType,
        mode,
        unitTopic,
        apprehensionFlags,
        sessionId: activeSessionId,
        pendingErrors,
        disputedError
      })
      console.log('sendReply response:', data)

      if (data.success) {
        setPendingErrors(data.data.socraticQuestions || [])
        setDisputedError(null)
        setStageComplete(data.data.stageComplete || false)
        onNewTurn(data.data)
      }
    } catch (err) {
      console.log('sendReply error:', err.response?.data || err.message)
      setError(err.response?.data?.error || 'Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [studentId, grade, apprehensionFlags, sessionId,
      pendingErrors, disputedError, onNewTurn, onStudentMessage])

  // ── Send pushback ──────────────────────────────────────────────
  const sendPushback = useCallback(async ({
    message,
    currentParagraph,
    taskType,
    mode,
    unitTopic,
    errorBeingDisputed
  }) => {
    if (!message.trim()) return
    setIsLoading(true)
    setError(null)
    setDisputedError(errorBeingDisputed || null)

    onStudentMessage(message)

    try {
      const { data } = await axios.post(`${import.meta.env.VITE_API_URL || ''}/api/conversation`, {
        studentId,
        studentMessage: message,
        currentParagraph,
        grade,
        taskType,
        mode,
        unitTopic,
        apprehensionFlags,
        sessionId: activeSessionId,
        pendingErrors,
        disputedError: errorBeingDisputed || null
      })

      if (data.success) {
        setPendingErrors(data.data.socraticQuestions || [])
        setDisputedError(null)
        setStageComplete(data.data.stageComplete || false)
        onNewTurn(data.data)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [studentId, grade, apprehensionFlags, sessionId,
      pendingErrors, disputedError, onNewTurn, onStudentMessage])

  // ── Keep original writing ──────────────────────────────────────
  const keepOriginal = useCallback(async ({
    currentParagraph,
    taskType,
    mode,
    unitTopic,
    errorBeingKept
  }) => {
    setIsLoading(true)
    setError(null)

    const message = "I'll keep it as is."
    onStudentMessage(message)

    try {
      const { data } = await axios.post(`${import.meta.env.VITE_API_URL || ''}/api/conversation`, {
        studentId,
        studentMessage: message,
        currentParagraph,
        grade,
        taskType,
        mode,
        unitTopic,
        apprehensionFlags,
        sessionId: activeSessionId,
        pendingErrors,
        disputedError: errorBeingKept || null
      })

      if (data.success) {
        setPendingErrors(data.data.socraticQuestions || [])
        setDisputedError(null)
        setStageComplete(data.data.stageComplete || false)
        onNewTurn(data.data)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [studentId, grade, apprehensionFlags, sessionId,
      pendingErrors, onNewTurn, onStudentMessage])

  // ── Reset for new task ─────────────────────────────────────────
  const reset = useCallback(() => {
    setSessionId(null)
    setIsLoading(false)
    setError(null)
    setPendingErrors([])
    setDisputedError(null)
    setStageComplete(false)
  }, [])

  return {
    sessionId,
    isLoading,
    error,
    pendingErrors,
    disputedError,
    stageComplete,
    submitParagraph,
    sendReply,
    sendPushback,
    keepOriginal,
    reset
  }
}
