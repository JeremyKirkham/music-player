import './Beam.css'

interface NotePosition {
  x: number
  y: number
}

interface BeamProps {
  beamCount: number // 1 for eighth, 2 for sixteenth
  stemDirection: 'up' | 'down'
  startX: number // Left position of first note
  endX: number // Right position of last note
  beamY: number // Vertical position of beam (at stem endpoint)
  notePositions: NotePosition[] // Position of each note in the group
  stemOffset: number // X offset to align with stems
}

const Beam = ({ beamCount, stemDirection, startX, endX, beamY, notePositions, stemOffset }: BeamProps) => {
  const beamThickness = 4 // px
  const beamSpacing = 8 // px between primary and secondary beams
  const beamWidth = endX - startX
  const stemWidth = 2 // px

  // For stem-down with double beams, we need to adjust positioning
  // so both beams are visible within the SVG
  const totalHeight = beamCount === 2 ? beamSpacing + beamThickness : beamThickness
  const bottomOffset = stemDirection === 'down' && beamCount === 2 ? -(beamSpacing + beamThickness) : 0

  return (
    <>
      {/* Draw stems from each note to the beam */}
      {notePositions.map((pos, i) => {
        const stemX = pos.x + stemOffset
        const stemHeight = stemDirection === 'up'
          ? beamY - pos.y  // Distance from note to beam (upward)
          : pos.y - beamY  // Distance from note to beam (downward)

        const stemBottom = stemDirection === 'up' ? pos.y : beamY

        return (
          <div
            key={`stem-${i}`}
            className="beam-stem"
            style={{
              position: 'absolute',
              left: `${stemX}px`,
              bottom: `${stemBottom}px`,
              width: `${stemWidth}px`,
              height: `${stemHeight}px`,
              backgroundColor: '#61dafb',
              pointerEvents: 'none',
            }}
          />
        )
      })}

      {/* Beam connector */}
      <svg
        className={`beam-connector ${stemDirection === 'down' ? 'beam-down' : 'beam-up'}`}
        style={{
          position: 'absolute',
          left: `${startX}px`,
          bottom: `${beamY + bottomOffset}px`,
          width: `${beamWidth}px`,
          height: `${totalHeight}px`,
          overflow: 'visible',
          pointerEvents: 'none',
        }}
      >
        {/* Primary beam (connects all notes) */}
        <rect
          x="0"
          y={stemDirection === 'down' && beamCount === 2 ? beamSpacing : 0}
          width={beamWidth}
          height={beamThickness}
          fill="#61dafb"
        />

        {/* Secondary beam for sixteenth notes */}
        {beamCount === 2 && (
          <rect
            x="0"
            y={stemDirection === 'up' ? beamSpacing : 0}
            width={beamWidth}
            height={beamThickness}
            fill="#61dafb"
          />
        )}
      </svg>
    </>
  )
}

export default Beam
