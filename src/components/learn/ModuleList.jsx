import { SECTIONS } from '../../data/learnData'
import SectionCard from './SectionCard'

export default function ModuleList({ onStartLesson }) {
  return (
    <div className="module-list">
      {SECTIONS.map((section, i) => (
        <SectionCard key={section.id} section={section} sectionNumber={i + 1} onStartLesson={onStartLesson} />
      ))}
    </div>
  )
}
