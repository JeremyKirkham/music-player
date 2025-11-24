import './Flag.css'

interface FlagProps {
  count: 1 | 2 // Number of flags (1 for eighth, 2 for sixteenth)
  stemDirection: 'up' | 'down'
}

const Flag = ({ count, stemDirection }: FlagProps) => {
  const flagWidth = 12
  const flagHeight = 4
  const flagSpacing = 5

  return (
    <div className={`note-flags ${stemDirection === 'down' ? 'flags-down' : ''}`}>
      <svg
        width="16"
        height={count === 2 ? "14" : "8"}
        viewBox={stemDirection === 'up' ? "0 0 16 14" : "-16 0 16 14"}
        className="flag"
        style={{ overflow: 'visible' }}
      >
        {/* First flag */}
        <rect
          x={stemDirection === 'up' ? 0 : -flagWidth}
          y={0}
          width={flagWidth}
          height={flagHeight}
          fill="#61dafb"
        />

        {/* Second flag for sixteenth notes */}
        {count === 2 && (
          <rect
            x={stemDirection === 'up' ? 0 : -flagWidth}
            y={flagHeight + flagSpacing}
            width={flagWidth}
            height={flagHeight}
            fill="#61dafb"
          />
        )}
      </svg>
    </div>
  )
}

export default Flag
