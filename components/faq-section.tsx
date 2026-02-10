'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Shield, Zap, Users, HelpCircle, Star } from 'lucide-react'

const faqs = [
  {
    question: 'Is this an AI that replaces my creativity?',
    answer: 'No. We are not a replacement. We are a thinking system. Our tools amplify your ideas, structure your thoughts, and optimize your content – but you remain in complete control. Every suggestion is reviewed and approved by you before publishing.',
    category: 'general'
  },
  {
    question: 'Will this sound like ChatGPT or other generic AI?',
    answer: 'Not at all. Our AI is trained to adapt to your unique voice, audience, and niche. We learn from your past content and preferences to create suggestions that feel authentically yours, not robotic or generic.',
    category: 'general'
  },
  {
    question: 'Can I use this if I am a beginner?',
    answer: 'Absolutely. Whether you are just starting or have thousands of subscribers, our system works for you. We provide guided suggestions that help you think strategically, regardless of your current channel size.',
    category: 'general'
  },
  {
    question: 'How long does it take to see results?',
    answer: 'Many creators see improvements in engagement within 1-2 weeks of consistent, optimized posting. However, building real authority is a gradual process. Most see significant growth in 3-6 months.',
    category: 'results'
  },
  {
    question: 'Is my channel data safe?',
    answer: 'Yes. We use enterprise-grade security and never share your data. Your channel insights are encrypted and only visible to you. We comply with all YouTube API policies and privacy regulations.',
    category: 'security'
  },
  {
    question: 'Can I cancel anytime?',
    answer: 'Yes. No contracts, no long-term commitments. Cancel your subscription whenever you want. Your data remains yours, and you can export your content library anytime.',
    category: 'billing'
  }
]

const categories = [
  { id: 'all', label: 'All', icon: HelpCircle },
  { id: 'general', label: 'General', icon: Users },
  { id: 'results', label: 'Results', icon: Zap },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'billing', label: 'Billing', icon: Star }
]

export function FAQSection() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  const [visibleItems, setVisibleItems] = useState<number[]>([])
  const [activeCategory, setActiveCategory] = useState('all')
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const faqElements = entry.target.querySelectorAll('[data-faq]')
            faqElements.forEach((el) => {
              const faqIndex = parseInt(el.getAttribute('data-faq') || '0')
              setTimeout(() => {
                setVisibleItems((prev) => [...new Set([...prev, faqIndex])])
              }, faqIndex * 50)
            })
          }
        })
      },
      { threshold: 0.1 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const filteredFaqs = activeCategory === 'all' 
    ? faqs 
    : faqs.filter(faq => faq.category === activeCategory)

  return (
    <section
      ref={sectionRef}
      className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-gray-50"
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-600 text-sm font-medium mb-6">
            <HelpCircle className="w-4 h-4" />
            <span>Got questions?</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Everything you need to know about growing your YouTube channel with AI
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((category) => {
            const Icon = category.icon
            return (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  activeCategory === category.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:text-blue-600'
                }`}
              >
                <Icon className="w-4 h-4" />
                {category.label}
              </button>
            )
          })}
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {filteredFaqs.map((faq, index) => {
            const isVisible = visibleItems.includes(index)
            const isExpanded = expandedIndex === index

            return (
              <div
                key={index}
                data-faq={index}
                className={`border border-gray-200 rounded-2xl overflow-hidden transition-all duration-500 transform hover:shadow-md ${
                  isVisible
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-4'
                }`}
              >
                <button
                  onClick={() => setExpandedIndex(isExpanded ? null : index)}
                  className="w-full p-6 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors duration-300 text-left"
                >
                  <h3 className="text-lg font-semibold text-gray-900">
                    {faq.question}
                  </h3>
                  <ChevronDown
                    className={`w-6 h-6 text-gray-600 flex-shrink-0 ml-4 transition-transform duration-300 ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isExpanded && (
                  <div className="px-6 pb-6 bg-gray-50 border-t border-gray-200">
                    <p className="text-gray-700 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm max-w-2xl mx-auto">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl mx-auto mb-4">
              <HelpCircle className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Still have questions?</h3>
            <p className="text-gray-600 mb-6">
              Our support team is here to help you succeed.
            </p>
            <button className="px-8 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl">
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
