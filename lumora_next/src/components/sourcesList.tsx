"use client"

import { ScrollArea} from "@/components/ui/scroll-area"
import { Globe2, LinkIcon } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface Source {
  title: string
  url: string
}

interface SourcesListProps {
  sources: Source[]
}

function getFaviconUrl(url: string) {
  try {
    const domain = new URL(url).hostname
    return `https://www.google.com/s2/favicons?domain=${domain}&size=32`
  } catch {
    return null
  }
}

export function SourcesList({ sources }: SourcesListProps) {
  const [failedFavicons, setFailedFavicons] = useState<Set<string>>(new Set())

  const truncateTitle = (title: string) => {
    const displayTitle = title.replace(/^(https?:\/\/)?(www\.)?/, "")
    return displayTitle.length > 40 ? displayTitle.substring(0, 37) + "..." : displayTitle
  }

  const handleFaviconError = (url: string) => {
    setFailedFavicons((prev) => new Set(prev).add(url))
  }

  return (
    <ScrollArea className="w-full whitespace-nowrap rounded-lg bg-gray-800/50">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex w-max space-x-2">
        {sources.map((source, index) => {
          const faviconUrl = getFaviconUrl(source.url)
          const showDefaultIcon = !faviconUrl || failedFavicons.has(source.url)

          return (
            <motion.a
              key={index}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{
                opacity: 1,
                scale: 1,
                transition: { delay: index * 0.1 },
              }}
              whileHover={{ scale: 1.02 }}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg border border-gray-700",
                "bg-gray-800 px-3 py-2 text-sm text-gray-300",
                "transition-colors hover:border-gray-600 hover:bg-gray-700/80",
              )}
            >
              <div className="relative flex h-4 w-4 items-center justify-center">
                {showDefaultIcon ? (
                  <Globe2 className="h-4 w-4 text-gray-400" />
                ) : (
                  <img
                    src={faviconUrl! || "/placeholder.svg"}
                    alt=""
                    className="h-4 w-4 object-contain"
                    onError={() => handleFaviconError(source.url)}
                  />
                )}
              </div>
              <span className="font-light">{truncateTitle(source.title)}</span>
              <LinkIcon className="h-3 w-3 text-gray-500" />
            </motion.a>
          )
        })}
      </motion.div>
      {/* <ScrollBar orientation="horizontal" className="invisible" /> */}
    </ScrollArea>
  )
}

