import React from 'react'
import { Link } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'

interface BreadcrumbsProps {
  items: { label: string; to?: string }[]
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  return (
    <nav
      aria-label="Trilha de navegação"
      className="page-breadcrumbs flex items-center gap-2 text-sm text-muted-foreground mb-6"
    >
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {item.to ? (
            <Link to={item.to} className="hover:text-foreground transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium">{item.label}</span>
          )}
          {index < items.length - 1 && <ChevronRight size={14} />}
        </React.Fragment>
      ))}
    </nav>
  )
}
