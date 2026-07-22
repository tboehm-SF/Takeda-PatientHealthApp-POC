import { useApp } from '../context/AppContext'
import { pushD360Event } from '../components/D360Panel'

export default function ArticleDetail() {
  const { selectedArticle, setSelectedArticle, setCurrentScreen } = useApp()

  if (!selectedArticle) return null

  const article = selectedArticle.contentBody || selectedArticle

  // Extract values — handles both raw JSON shape and flat shape
  const title = article.title?.value ?? article.title ?? ''
  const summary = article.summary?.value ?? article.summary ?? ''
  const heroImage = article.heroImage?.value ?? article.heroImage ?? ''
  const heroAlt = article.heroImage?.altText ?? 'Article hero image'
  const body = article.body?.value ?? article.body ?? ''
  const category = article.category?.value ?? article.category ?? ''
  const tag = article.tag?.value ?? article.tag ?? ''
  const tagColor = article.tagColor?.value ?? article.tagColor ?? 'bg-gray-100 text-gray-700'
  const gradient = article.gradient?.value ?? article.gradient ?? 'from-gray-400 to-gray-600'
  const readTime = article.readTime?.value ?? article.readTime ?? ''

  function handleBack() {
    pushD360Event('Article Back', 'navigation')
    setSelectedArticle(null)
    setCurrentScreen('education')
  }

  return (
    <div className="bg-white min-h-full screen-enter">
      {/* Hero */}
      <div className={`relative h-52 bg-gradient-to-br ${gradient}`}>
        {heroImage && (
          <img
            src={heroImage}
            alt={heroAlt}
            className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-60"
          />
        )}
        {/* Back button */}
        <button
          onClick={handleBack}
          className="absolute top-3 left-3 w-9 h-9 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        {/* Tag pill */}
        <div className="absolute bottom-3 left-4">
          <span className={`pill ${tagColor} text-[11px] font-semibold shadow-sm`}>{tag}</span>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 py-4 space-y-4">
        {/* Title + meta */}
        <div>
          <h1 className="text-[22px] font-bold text-gray-900 leading-tight">{title}</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-[12px] text-gray-400">{category}</span>
            {readTime && (
              <>
                <span className="text-gray-200">·</span>
                <span className="text-[12px] text-gray-400">{readTime} read</span>
              </>
            )}
          </div>
        </div>

        {/* Summary */}
        <p className="text-[14px] text-gray-600 leading-relaxed border-l-3 border-primary pl-3 italic">
          {summary}
        </p>

        {/* Body HTML */}
        <div
          className="article-body text-[14px] text-gray-800 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: body }}
        />

        {/* Bottom spacer + back */}
        <div className="pt-4 pb-8">
          <button
            onClick={handleBack}
            className="w-full py-3 rounded-xl bg-gray-50 text-gray-600 font-semibold text-[14px] active:bg-gray-100 transition-colors"
          >
            ← Back to Education Hub
          </button>
        </div>
      </div>
    </div>
  )
}
