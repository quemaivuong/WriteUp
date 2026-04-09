// ── TASK DATA ─────────────────────────────────────────────────────
// Confirmed from textbook review for grades 6, 7, 8.
// Grades 9-12 use Grade 8 tasks as placeholders.

const TASKS = {
  6: {
    modes: {
      descriptive: {
        label: 'Descriptive paragraph',
        units: [
          { unit: 1, topic: 'My school', task: 'Write a paragraph about your school' },
          { unit: 2, topic: 'My house', task: 'Write an email to a penfriend about your house' },
          { unit: 3, topic: 'My best friend', task: 'Write a diary entry about your best friend' },
          { unit: 4, topic: 'My neighbourhood', task: 'Write a paragraph about your neighbourhood' },
          { unit: 5, topic: 'A natural wonder', task: 'Write a paragraph about a travel attraction' },
          { unit: 6, topic: 'Tet holiday', task: 'Write an email about Tet activities' },
          { unit: 7, topic: 'Television', task: 'Write a paragraph about your TV-viewing habits' },
          { unit: 8, topic: 'Sports and games', task: 'Write a paragraph about a sport or game you like' },
          { unit: 9, topic: 'Cities', task: 'Write a postcard about a city' },
          { unit: 10, topic: 'Future houses', task: 'Write a paragraph about your dream house' },
          { unit: 12, topic: 'Robots', task: 'Write a paragraph about a robot you would like' }
        ]
      },
      emergingOpinion: {
        label: 'Opinion paragraph',
        units: [
          { unit: 11, topic: 'Environment', task: 'Write a paragraph about improving the environment' }
        ]
      }
    }
  },
  7: {
    modes: {
      descriptive: {
        label: 'Descriptive paragraph',
        units: [
          { unit: 1, topic: 'Hobbies', task: 'Write a paragraph about your hobby' },
          { unit: 2, topic: 'Healthy living', task: 'Write a passage giving advice on avoiding viruses' },
          { unit: 3, topic: 'Community service', task: 'Write an email about school activities last summer' },
          { unit: 4, topic: 'Music and arts', task: 'Write an informal letter of invitation' },
          { unit: 5, topic: 'Food and drink', task: 'Write a paragraph about eating habits in your area' },
          { unit: 6, topic: 'A visit to a school', task: 'Write a paragraph about an outdoor activity' },
          { unit: 8, topic: 'Films', task: 'Write a paragraph about your favourite film' },
          { unit: 9, topic: 'Festivals', task: 'Write an email about a festival your family celebrates' },
          { unit: 12, topic: 'English-speaking countries', task: 'Write a diary entry about a tour' }
        ]
      },
      problemSolution: {
        label: 'Problem-solution paragraph',
        units: [
          { unit: 7, topic: 'Traffic', task: 'Write a paragraph about traffic problems in your city' }
        ]
      },
      opinionAdvantages: {
        label: 'Opinion paragraph',
        units: [
          { unit: 10, topic: 'Energy sources', task: 'Write a paragraph about how you save energy at home' },
          { unit: 11, topic: 'Travelling in the future', task: 'Write a paragraph about advantages of a transport type' }
        ]
      }
    }
  },
  8: {
    modes: {
      descriptive: {
        label: 'Descriptive paragraph',
        units: [
          { unit: 1, topic: 'Leisure time', task: 'Write an email to a penfriend about free time activities' },
          { unit: 4, topic: 'Ethnic groups', task: 'Write a paragraph about helping your family' },
          { unit: 5, topic: 'Customs and traditions', task: 'Write an advice email about festival dos and don\'ts' },
          { unit: 9, topic: 'Natural disasters', task: 'Write instructions for before, during, and after a flood' },
          { unit: 12, topic: 'Life on other planets', task: 'Write a paragraph about imaginary aliens' }
        ]
      },
      advantagesDisadvantages: {
        label: 'Advantages / disadvantages paragraph',
        units: [
          { unit: 2, topic: 'Life in the countryside', task: 'Write about what you like or dislike about countryside life' },
          { unit: 6, topic: 'Lifestyles', task: 'Write about the advantages or disadvantages of online learning' },
          { unit: 8, topic: 'Shopping', task: 'Write about the advantages or disadvantages of a type of shopping' },
          { unit: 10, topic: 'Communication in the future', task: 'Write a paragraph about a modern communication tool' }
        ]
      },
      agreeDisagree: {
        label: 'Opinion paragraph',
        units: [
          { unit: 3, topic: 'Teenagers', task: 'Write a paragraph about the cause of your stress and solutions' },
          { unit: 11, topic: 'Science and technology', task: 'Write a paragraph: do you agree robots will replace teachers?' }
        ]
      },
      noticeWriting: {
        label: 'Notice writing',
        units: [
          { unit: 7, topic: 'Environmental protection', task: 'Write a notice about a school event' }
        ]
      }
    }
  }
}

// Fill grades 9-12 with Grade 8 tasks as placeholders
for (let g = 9; g <= 12; g++) {
  TASKS[g] = TASKS[8]
}

export default function TaskSelector({ grade, onSelect, disabled }) {
  const gradeTasks = TASKS[grade] || TASKS[8]
  const modes = Object.entries(gradeTasks.modes)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {modes.map(([modeKey, modeData]) => (
        <div key={modeKey}>
          <div style={{
            fontSize: '11px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.6px',
            color: 'var(--ink3)',
            marginBottom: '6px'
          }}>
            {modeData.label}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {modeData.units.map(u => (
              <button
                key={`${modeKey}-${u.unit}`}
                onClick={() => onSelect({
                  mode: modeKey,
                  type: modeKey,
                  unit: u.unit,
                  topic: u.topic,
                  task: u.task,
                  title: u.task
                })}
                disabled={disabled}
                style={{
                  textAlign: 'left',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1.5px solid var(--line)',
                  background: 'white',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s',
                  opacity: disabled ? 0.5 : 1
                }}
                onMouseEnter={e => {
                  if (!disabled) {
                    e.currentTarget.style.borderColor = 'var(--teal-mid)'
                    e.currentTarget.style.background = 'var(--teal-light)'
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--line)'
                  e.currentTarget.style.background = 'white'
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--ink)' }}>
                  Unit {u.unit} — {u.topic}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--ink3)', marginTop: '2px' }}>
                  {u.task}
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
