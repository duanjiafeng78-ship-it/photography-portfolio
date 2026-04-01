export const metadata = { title: '关于 — Portfolio' };

export default function AboutPage() {
  return (
    <section className="pt-28 pb-20">
      <div className="max-w-screen-xl mx-auto px-6 sm:px-10">
        {/* Header */}
        <div className="mb-20">
          <div className="w-8 h-px bg-white/20 mb-8" />
          <h1 className="text-3xl sm:text-5xl font-extralight tracking-[0.1em] uppercase text-white/90">
            About
          </h1>
          <p className="text-xs tracking-[0.3em] uppercase text-white/30 mt-3 font-light">
            关于摄影师
          </p>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24">
          {/* Left — Avatar placeholder */}
          <div className="relative aspect-[3/4] bg-white/5 overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center text-white/10 text-xs tracking-[0.2em] uppercase">
              摄影师照片
            </div>
          </div>

          {/* Right — Bio */}
          <div className="flex flex-col justify-center space-y-12">
            <div>
              <h2 className="text-xs tracking-[0.3em] uppercase text-white/40 mb-4">简介</h2>
              <p className="text-sm leading-relaxed text-white/60 font-light">
                一位专注于人像与商业摄影的独立摄影师。善于在光影之间捕捉真实而富有张力的瞬间，
                追求简约、纯粹的视觉表达。作品涵盖商业广告、时尚杂志、艺术人像等多个领域。
              </p>
            </div>

            <div>
              <h2 className="text-xs tracking-[0.3em] uppercase text-white/40 mb-4">风格与设备</h2>
              <p className="text-sm leading-relaxed text-white/60 font-light">
                偏好自然光与极简构图，注重情绪氛围的营造。主要使用 Sony 与 Fujifilm 系统，
                搭配定焦镜头进行创作。后期风格偏向电影感色调，强调质感与层次。
              </p>
            </div>

            <div>
              <h2 className="text-xs tracking-[0.3em] uppercase text-white/40 mb-4">经历</h2>
              <p className="text-sm leading-relaxed text-white/60 font-light">
                多年独立摄影经验，合作客户涵盖时尚品牌、杂志媒体与个人委托。
                作品曾入选多个摄影展览与线上平台。持续探索影像的边界与可能性。
              </p>
            </div>

            {/* Contact CTA */}
            <div className="pt-4">
              <a
                href="/contact"
                className="inline-block px-8 py-3 border border-white/20 text-[10px] tracking-[0.3em] uppercase text-white/60 hover:bg-white hover:text-black hover:border-white transition-all duration-500"
              >
                联系合作 →
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
