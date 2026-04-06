export default function ActionButtons({
  onSubmitParagraph,
  onShareDraft,
  onNewTask,
  canSubmit,
  canShare,
  isLoading
}) {
  return (
    <div style={{
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap',
      alignItems: 'center'
    }}>
      <button
        onClick={onSubmitParagraph}
        disabled={!canSubmit || isLoading}
        className="btn btn-primary"
      >
        {isLoading ? 'Analysing…' : 'Get Feedback'}
      </button>

      {canShare && (
        <button
          onClick={onShareDraft}
          className="btn btn-amber"
          title="Share this draft to the peer workshop"
        >
          Share with Class →
        </button>
      )}

      <button
        onClick={onNewTask}
        className="btn btn-outline"
        style={{ marginLeft: 'auto' }}
      >
        New Task
      </button>
    </div>
  )
}
