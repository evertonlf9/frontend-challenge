import { Link } from '@tanstack/react-router'
import { ChevronLeft } from 'lucide-react'

export function FlowPageHeading({ title, mobileTitle, backTo, backLabel }: { title: string; mobileTitle?: string; backTo: '/' | '/cart'; backLabel: string }) {
  return <div className="flow-heading"><Link to={backTo} hash={backTo === '/' ? 'catalogo' : undefined} className="flow-back" aria-label={backLabel}><ChevronLeft size={19} aria-hidden="true" /></Link><h1 className="page-title" aria-label={title}><span className="flow-desktop-title">{title}</span><span className="flow-mobile-title">{mobileTitle ?? title}</span></h1></div>
}
