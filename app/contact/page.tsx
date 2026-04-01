import ContactForm from '@/components/common/ContactForm';

export const metadata = { title: '联系 — Portfolio' };

export default function ContactPage() {
  return (
    <section className="pt-28 pb-20">
      <div className="max-w-screen-md mx-auto px-6 sm:px-10">
        {/* Header */}
        <div className="mb-16">
          <div className="w-8 h-px bg-white/20 mb-8" />
          <h1 className="text-3xl sm:text-5xl font-extralight tracking-[0.1em] uppercase text-white/90">
            Contact
          </h1>
          <p className="text-xs tracking-[0.3em] uppercase text-white/30 mt-3 font-light">
            联系 · 合作咨询
          </p>
        </div>

        <ContactForm />
      </div>
    </section>
  );
}
