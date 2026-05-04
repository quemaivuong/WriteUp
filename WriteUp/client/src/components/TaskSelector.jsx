import { useState } from 'react'

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
          { unit: 12, topic: 'Life on other planets', task: 'Write a paragraph about imaginary aliens', starter: 'Creatures living on __ are called __' }
        ]
      },
      advantagesDisadvantages: {
        label: 'Advantages / disadvantages paragraph',
        units: [
          { unit: 2, topic: 'Life in the countryside', task: 'Write about what you like or dislike about countryside life', starter: 'There are some things I like / dislike about life in the countryside.' },
          { unit: 6, topic: 'Lifestyles', task: 'Write about the advantages or disadvantages of online learning' },
          { unit: 8, topic: 'Shopping', task: 'Write about the advantages or disadvantages of a type of shopping', starter: 'Shopping ... is interesting / convenient / safe ...' },
          { unit: 10, topic: 'Communication in the future', task: 'Write a paragraph about a modern communication tool' }
        ]
      },
      agreeDisagree: {
        label: 'Opinion paragraph',
        units: [
          { unit: 3, topic: 'Teenagers', task: 'Write a paragraph about the cause of your stress and solutions', starter: 'I often feel stressed because of' },
          { unit: 11, topic: 'Science and technology', task: 'Write a paragraph: do you agree robots will replace teachers?', starter: 'I agree / disagree that robots will soon replace teachers at school. First, they' }
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

TASKS[9] = {
  modes: {
    descriptive: {
      label: 'Descriptive paragraph',
      units: [
        { unit: 1, topic: 'Local community', task: 'Write a paragraph about a community helper' },
        { unit: 4, topic: 'Remembering the past', task: 'Write a paragraph about old school days' },
        { unit: 5, topic: 'Our experiences', task: 'Write a paragraph about a memorable school experience' },
        { unit: 6, topic: 'Vietnamese lifestyle', task: 'Write an email about changes in your family life' },
        { unit: 7, topic: 'Natural wonders', task: 'Write a paragraph about a natural wonder' },
        { unit: 8, topic: 'Tourism', task: 'Write a paragraph introducing a tour' },
        { unit: 10, topic: 'Planet Earth', task: 'Write a summary about an environmental topic' },
        { unit: 12, topic: 'Career choices', task: 'Write an email about your future job' }
      ]
    },
    advantagesDisadvantages: {
      label: 'Opinion paragraph',
      units: [
        { unit: 2, topic: 'City life', task: 'Write a paragraph about what you like or dislike about city life' },
        { unit: 3, topic: 'Healthy living', task: 'Write a paragraph about how to manage time effectively' },
        { unit: 9, topic: 'World Englishes', task: 'Write a paragraph about ways to improve your English' },
        { unit: 11, topic: 'Electronic devices', task: 'Write about the current and future uses of a device you like' }
      ]
    }
  }
}

TASKS[10] = {
  modes: {
    descriptive: {
      label: 'Descriptive paragraph',
      units: [
        { unit: 1, topic: 'Family life', task: 'Write about your family routines' },
        { unit: 3, topic: 'Music', task: 'Write a blog about an experience at a music event' },
        { unit: 7, topic: 'Viet Nam and international organisations', task: 'Write about Viet Nam in an international organisation' },
        { unit: 9, topic: 'Protecting the environment', task: 'Write about a wildlife organisation' }
      ]
    },
    advantagesDisadvantages: {
      label: 'Opinion paragraph',
      units: [
        { unit: 2, topic: 'Humans and the environment', task: 'Write about ways to improve the environment' },
        { unit: 5, topic: 'Inventions', task: 'Write about the benefits of an invention' },
        { unit: 6, topic: 'Gender equality', task: 'Write about jobs for men and women' },
        { unit: 8, topic: 'New ways to learn', task: 'Write about the benefits of blended learning' }
      ]
    },
    noticeWriting: {
      label: 'Formal writing',
      units: [
        { unit: 4, topic: 'Community', task: 'Write an application letter for volunteer work' },
        { unit: 10, topic: 'Ecotourism', task: 'Write a website advertisement for an ecotour' }
      ]
    }
  }
}

TASKS[11] = {
  modes: {
    descriptive: {
      label: 'Descriptive paragraph',
      units: [
        { unit: 1, topic: 'A long and healthy life', task: 'Write a short message about a health topic' }
      ]
    },
    advantagesDisadvantages: {
      label: 'Opinion paragraph',
      units: [
        { unit: 3, topic: 'Cities of the future', task: 'Write about advantages and disadvantages of living in a smart city' },
        { unit: 8, topic: 'Becoming independent', task: 'Write an article about the pros and cons of self-study' }
      ]
    },
    agreeDisagree: {
      label: 'Argumentative essay',
      units: [
        { unit: 2, topic: 'The generation gap', task: 'Write an opinion essay about limiting screen time', starter: 'I believe that / I disagree that' },
        { unit: 10, topic: 'The ecosystem', task: 'Write an opinion essay about spending money on restoring ecosystems', starter: 'I believe that / I disagree that' }
      ]
    },
    noticeWriting: {
      label: 'Formal writing',
      units: [
        { unit: 4, topic: 'ASEAN and Viet Nam', task: 'Write a proposal for a welcome event' },
        { unit: 5, topic: 'Global warming', task: 'Write a leaflet to reduce carbon emissions' },
        { unit: 6, topic: 'Preserving our heritage', task: 'Write a leaflet about preserving a heritage site' },
        { unit: 7, topic: 'Education options', task: 'Write a request letter for information about vocational courses' },
        { unit: 9, topic: 'Social issues', task: 'Write a proposal for a campaign against cyberbullying' }
      ]
    }
  }
}

TASKS[12] = {
  modes: {
    descriptive: {
      label: 'Descriptive paragraph',
      units: [
        { unit: 1, topic: 'Life stories', task: 'Write a biography of someone you admire' },
        { unit: 4, topic: 'Urbanisation', task: 'Describe a graph about trends in urbanisation' },
        { unit: 9, topic: 'Career paths', task: 'Write about things to consider when choosing a career' }
      ]
    },
    advantagesDisadvantages: {
      label: 'Opinion paragraph',
      units: [
        { unit: 3, topic: 'Green living', task: 'Write a problem-solving report on green solutions' },
        { unit: 6, topic: 'Artificial intelligence', task: 'Write about AI applications in education' },
        { unit: 7, topic: 'Mass media', task: 'Write an article comparing digital and traditional media' },
        { unit: 8, topic: 'Wildlife conservation', task: 'Write about wildlife conservation efforts' }
      ]
    },
    agreeDisagree: {
      label: 'Argumentative essay',
      units: [
        { unit: 2, topic: 'A multicultural world', task: 'Write an essay about the impact of world festivals on young Vietnamese', starter: 'I believe that / I contend that' },
        { unit: 10, topic: 'Lifelong learning', task: 'Write about the value of lifelong learning', starter: 'I believe that / It can be argued that' }
      ]
    },
    noticeWriting: {
      label: 'Formal writing',
      units: [
        { unit: 5, topic: 'The world of work', task: 'Write a job application letter' }
      ]
    }
  }
}

export default function TaskSelector({ grade, onSelect, disabled }) {
  const gradeTasks = TASKS[grade] || TASKS[8]
  const modes = Object.entries(gradeTasks.modes)
  const [hoveredKey, setHoveredKey] = useState(null)

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
            {modeData.units.map(u => {
              const key = `${modeKey}-${u.unit}`
              const isHovered = hoveredKey === key
              return (
                <button
                  key={key}
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
                    border: `1.5px solid ${isHovered ? 'var(--teal-mid)' : 'var(--line)'}`,
                    background: isHovered ? 'var(--teal-light)' : 'white',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s',
                    opacity: disabled ? 0.5 : 1
                  }}
                  onMouseEnter={() => { if (!disabled) setHoveredKey(key) }}
                  onMouseLeave={() => setHoveredKey(null)}
                >
                  <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--ink)' }}>
                    Unit {u.unit} — {u.topic}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--ink3)', marginTop: '2px' }}>
                    {u.task}
                  </div>
                  {isHovered && u.starter && (
                    <div style={{
                      fontSize: '11px', color: 'var(--ink3)',
                      fontStyle: 'italic', marginTop: '6px'
                    }}>
                      Starter: {u.starter}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
