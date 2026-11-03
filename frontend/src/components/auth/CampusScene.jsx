import { BookOpen, GraduationCap, UsersRound, Layers3, CalendarCheck2, ArrowUpRight, Check } from 'lucide-react'

// Original decorative artwork; no figures or service status are represented as live data.
export default function CampusScene() {
    return <div className="campus-scene" aria-hidden="true">
        <div className="scene-grid" />
        <div className="scene-ring scene-ring-one" /><div className="scene-ring scene-ring-two" />
        <svg className="scene-connections" viewBox="0 0 600 280" fill="none">
            <path d="M130 75C210 75 185 142 290 142M315 142C405 142 375 65 465 65M300 156C300 218 415 175 447 222M280 154C220 154 218 235 135 220" pathLength="1" />
        </svg>
        <div className="scene-building">
            <span className="scene-building-roof" /><span className="scene-building-mark"><BookOpen size={31} strokeWidth={1.35} /></span>
            <strong>AttendEase</strong><span className="scene-building-caption">YOUR CAMPUS, CONNECTED</span>
            <div className="scene-building-dots"><span /><span /><span /><span /></div>
        </div>
        <div className="scene-card scene-people"><div className="scene-card-heading"><span className="scene-icon"><UsersRound size={15} /></span><span>People, together</span><ArrowUpRight size={12} /></div><div className="scene-avatars"><span><GraduationCap /></span><span><UsersRound /></span><span><BookOpen /></span><small>Learners. Trainers. Teams.</small></div></div>
        <div className="scene-card scene-programs"><div className="scene-card-heading"><span className="scene-icon"><Layers3 size={15} /></span><span>Every learning journey</span></div><div className="scene-program-line"><span className="scene-course-icon"><BookOpen size={13} /></span><div><strong>Courses & curriculum</strong><span>A place for every program</span></div></div><div className="scene-track"><span /><span /><span /><span /></div></div>
        <div className="scene-card scene-attendance"><span className="scene-attendance-icon"><CalendarCheck2 size={18} /></span><div><strong>Every day, in focus.</strong><span>Attendance & daily updates</span></div><span className="scene-check"><Check size={12} /></span></div>
        <span className="scene-spark scene-spark-one">+</span><span className="scene-spark scene-spark-two">+</span><span className="scene-small-dot" />
    </div>
}
