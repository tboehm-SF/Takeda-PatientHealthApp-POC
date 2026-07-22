import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { pushD360Event } from '../components/D360Panel'
import { getForYouNow, contentLibrary, categories, personalise, getAnonymousRecommendations, domainArticleMap } from '../data/contentLibrary'
import ContentCard from '../components/ContentCard'

// Domain display metadata for the anonymous recommendation cards
const DOMAIN_META = {
  itch: { icon: '🌡', label: 'Itch Intensity', color: 'from-orange-400 to-amber-500', tagColor: 'bg-orange-100 text-orange-700' },
  sleep: { icon: '🌙', label: 'Sleep Quality', color: 'from-indigo-500 to-blue-800', tagColor: 'bg-indigo-100 text-indigo-700' },
  emotional: { icon: '💜', label: 'Emotional Wellbeing', color: 'from-purple-400 to-pink-500', tagColor: 'bg-purple-100 text-purple-700' },
  work: { icon: '💼', label: 'Work & Productivity', color: 'from-orange-400 to-red-500', tagColor: 'bg-orange-100 text-orange-700' },
}

export default function EducationHub() {
  const { nrsScore, psodiskScores, patient, profile, checkInSubmitted, setCurrentScreen, setSelectedArticle } = useApp()
  const [activeCategory, setActiveCategory] = useState(null)
  const [articleCache, setArticleCache] = useState({})

  const isAnonymous = !profile.email || !profile.emailConsent

  const forYouNow = getForYouNow(nrsScore, psodiskScores, patient.weekOnTherapy)
  const anonRecos = isAnonymous ? getAnonymousRecommendations(nrsScore, psodiskScores) : []

  // Prefetch article JSONs for anonymous recommendations
  useEffect(() => {
    if (!isAnonymous || anonRecos.length === 0) return
    anonRecos.forEach((reco) => {
      if (articleCache[reco.articleSlug]) return
      fetch(`/cms/articles/${reco.articleSlug}.json`)
        .then((r) => r.json())
        .then((data) => setArticleCache((prev) => ({ ...prev, [reco.articleSlug]: data })))
        .catch(() => {})
    })
  }, [isAnonymous, anonRecos.length])

  function openArticle(articleSlug) {
    const article = articleCache[articleSlug]
    if (article) {
      pushD360Event(`Open Article: ${article.title}`, 'engagement', { domain: articleSlug })
      setSelectedArticle(article)
      setCurrentScreen('article')
    }
  }

  function handleContentCardClick(item) {
    // Check if this content library item maps to a full article
    const trigger = item.triggers
    if (trigger?.psodiskDomain && domainArticleMap[trigger.psodiskDomain]) {
      openArticle(domainArticleMap[trigger.psodiskDomain])
    }
  }

  const filteredContent = activeCategory
    ? contentLibrary.filter((c) => c.category === activeCategory)
    : personalise(nrsScore, psodiskScores, patient.weekOnTherapy)

  return (
    <div className="bg-[#f5f8fa] pb-6 screen-enter">
      {/* Header */}
      <div className="bg-white px-5 pt-2 pb-4">
        <h1 className="text-[26px] font-bold text-gray-900">Education Hub</h1>
        <div className="flex items-center gap-2 mt-2">
          <div className="flex-1 relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#94a3b8"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              placeholder="Search articles..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 rounded-xl text-[13px] border border-transparent focus:outline-none focus:border-primary"
            />
          </div>
          <button className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-5">
        {/* ── Anonymous-only: Personalized Article Recommendations ── */}
        {isAnonymous && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-bold text-gray-900 text-[16px]">
                  Recommended For You
                </h2>
                {checkInSubmitted ? (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <p className="text-[11px] text-primary font-semibold">
                      Personalised based on your NRS {nrsScore}/10 + PsOdisk scores
                    </p>
                  </div>
                ) : (
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Complete today's check-in to personalise
                  </p>
                )}
              </div>
            </div>

            {/* Domain-ranked article recommendation cards */}
            <div className="space-y-2.5">
              {anonRecos.slice(0, 4).map((reco, i) => {
                const meta = DOMAIN_META[reco.domain]
                const article = articleCache[reco.articleSlug]
                const title = article?.contentBody?.title?.value ?? article?.title ?? `${meta.label} article`
                const summary = article?.contentBody?.summary?.value ?? ''
                const readTime = article?.contentBody?.readTime?.value ?? '5 min'

                return (
                  <div
                    key={reco.domain}
                    className="card overflow-hidden cursor-pointer hover:shadow-md transition-all fade-in"
                    style={{ animationDelay: `${i * 0.1}s` }}
                    onClick={() => openArticle(reco.articleSlug)}
                  >
                    <div className="flex gap-0">
                      {/* Gradient sidebar */}
                      <div className={`w-1.5 bg-gradient-to-b ${meta.color} flex-shrink-0`} />
                      <div className="flex-1 p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[14px]">{meta.icon}</span>
                          <span className={`pill ${meta.tagColor} text-[10px]`}>{meta.label}</span>
                          {i === 0 && checkInSubmitted && (
                            <span className="pill bg-primary-light text-primary text-[9px] font-bold">TOP MATCH</span>
                          )}
                        </div>
                        <p className="font-semibold text-[13px] text-gray-900 leading-tight line-clamp-2">{title}</p>
                        {summary && <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">{summary}</p>}
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-[10px] text-gray-300">{readTime} read</span>
                          <span className="text-[10px] font-semibold text-primary">Read article →</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── For You Now (existing content library personalization) ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-bold text-gray-900 text-[16px]">
                For You Now
              </h2>
              {checkInSubmitted ? (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <p className="text-[11px] text-primary font-semibold">
                    Updated based on your NRS {nrsScore}/10 + PsOdisk
                  </p>
                </div>
              ) : (
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Complete today's check-in to personalise
                </p>
              )}
            </div>
          </div>

          {/* Horizontal scroll cards */}
          <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
            {forYouNow.map((item, i) => (
              <div
                key={item.id}
                className="fade-in"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <ContentCard item={item} size="default" onArticleClick={handleContentCardClick} />
              </div>
            ))}
          </div>
        </div>

        {/* Category grid */}
        <div>
          <h2 className="font-bold text-gray-900 text-[16px] mb-3">Browse by topic</h2>
          <div className="grid grid-cols-2 gap-2.5">
            {categories.map((cat) => (
              <button
                key={cat.label}
                onClick={() => { pushD360Event(`Category: ${cat.label}`, 'click'); setActiveCategory(activeCategory === cat.label ? null : cat.label) }}
                className={`rounded-xl overflow-hidden text-left relative h-20 transition-all ${
                  activeCategory === cat.label ? 'ring-2 ring-primary' : ''
                }`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${cat.gradient} opacity-90`} />
                <div className="relative px-3 py-3">
                  <p className="text-[18px] mb-0.5">{cat.icon}</p>
                  <p className="text-white font-bold text-[13px] leading-tight">{cat.label}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Discover / filtered list */}
        <div>
          <h2 className="font-bold text-gray-900 text-[16px] mb-3">
            {activeCategory ? activeCategory : 'Discover'}
          </h2>
          <div className="space-y-2">
            {filteredContent.map((item) => (
              <ContentCard key={item.id} item={item} size="compact" onArticleClick={handleContentCardClick} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
