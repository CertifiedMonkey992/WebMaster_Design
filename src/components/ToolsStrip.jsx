const tools = [
  'ChatGPT', 'Claude', 'Midjourney', 'GitHub Copilot',
  'Canva AI', 'Gemini', 'Perplexity AI', 'Stable Diffusion',
  'Notion AI', 'Grammarly AI',
]

/* Duplicate for seamless infinite loop (animate to -50%) */
const doubled = [...tools, ...tools]

export default function ToolsStrip() {
  return (
    <section className="tools-strip" aria-label="Popular AI tools you will study">
      <p className="tools-label">AI tools you&apos;ll actually master</p>

      <div className="marquee-outer" aria-hidden="true">
        <div className="marquee-track">
          {doubled.map((tool, i) => (
            <span className="marquee-item" key={i}>
              <span className="marquee-sep" />
              {tool}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
