"use client"

import { Check, Sparkles, Crown, Rocket, Star, Zap, Users, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useScrollAnimation, useStaggeredAnimation } from '@/hooks/useScrollAnimation'

const plans = [
  {
    id: "free",
    name: "Starter",
    description: "Perfect for testing the platform",
    price: "Free",
    period: "forever",
    icon: Sparkles,
    popular: false,
    features: [
      "3 Title Analysis per day",
      "3 Channel Analysis per day",
      "2 Compare tools per day",
      "5 Tag Suggestions per day",
      "Limited AI Title & Description",
      "Basic Challenge features",
      "Community support"
    ]
  },
  {
    id: "pro",
    name: "Pro",
    description: "For serious creators ready to grow",
    price: "₹499",
    period: "per month",
    icon: Crown,
    popular: true,
    features: [
      "10 Title Analysis per day",
      "10 Channel Analysis per day",
      "10 Compare tools per day",
      "Unlimited Tag Suggestions",
      "20 AI Title & Description per day",
      "Advanced Challenge features",
      "Priority email support",
      "Analytics dashboard",
      "Auto-detect uploads"
    ]
  },
  {
    id: "business",
    name: "Business",
    description: "For professional content creators",
    price: "₹699",
    period: "per month",
    icon: Rocket,
    popular: false,
    features: [
      "Unlimited Title Analysis",
      "Unlimited Channel Analysis",
      "Unlimited Compare tools",
      "Unlimited Tag Suggestions",
      "Unlimited AI Title & Description",
      "Premium Challenge features",
      "24/7 Priority support",
      "Advanced analytics",
      "Team collaboration",
      "Custom integrations",
      "Dedicated account manager"
    ]
  }
]

export function PricingSection() {
  const { isVisible: headerVisible, elementRef: headerRef } = useScrollAnimation({ threshold: 0.1 })
  const { visibleItems: planItems, containerRef: plansRef } = useStaggeredAnimation(3, { threshold: 0.1 })
  const { visibleItems: statItems, containerRef: statsRef } = useStaggeredAnimation(3, { threshold: 0.1 })

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div 
          ref={headerRef}
          className={`text-center mb-16 transition-all duration-1000 ${
            headerVisible 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-12'
          }`}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-600 text-sm font-medium mb-6 animate-pulse">
            <Star className="w-4 h-4" />
            <span>Simple, transparent pricing</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Choose Your Growth Plan
          </h2>

          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Start free and upgrade as you grow. All plans include a 14-day money-back guarantee.
          </p>
        </div>

        {/* Pricing Cards */}
        <div 
          ref={plansRef}
          className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto"
        >
          {plans.map((plan, index) => {
            const IconComponent = plan.icon
            const isVisible = planItems.includes(index)
            
            return (
              <div 
                key={plan.id}
                data-animate-item={index}
                className={`relative rounded-2xl p-8 border-2 transition-all duration-700 hover:shadow-xl ${
                  plan.popular 
                    ? 'border-blue-500 bg-gradient-to-b from-blue-50 to-white scale-105' 
                    : 'border-gray-200 bg-white hover:border-blue-300'
                } ${
                  isVisible 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-12'
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 animate-bounce">
                    <div className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      Most Popular
                    </div>
                  </div>
                )}

                {/* Icon and Header */}
                <div className="text-center mb-8">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4 transition-all duration-500 ${
                    plan.popular ? 'bg-blue-100' : 'bg-gray-100'
                  } ${isVisible ? 'animate-pulse' : ''}`}>
                    <IconComponent className={`w-7 h-7 ${plan.popular ? 'text-blue-600' : 'text-gray-600'} transition-colors duration-300`} />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 mb-2 transition-colors duration-300">{plan.name}</h3>
                  <p className="text-gray-600 transition-opacity duration-500">{plan.description}</p>
                </div>

                {/* Price */}
                <div className="text-center mb-8">
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-5xl font-bold text-gray-900">{plan.price}</span>
                    {plan.period !== "forever" && (
                      <span className="text-gray-600">/{plan.period.split(" ")[1]}</span>
                    )}
                  </div>
                  {plan.period !== "forever" && (
                    <p className="text-gray-500 mt-2">Billed {plan.period}</p>
                  )}
                </div>

                {/* Features */}
                <div className="space-y-4 mb-8">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                        plan.popular ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        <Check className={`w-3 h-3 ${plan.popular ? 'text-blue-600' : 'text-gray-600'}`} />
                      </div>
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <Button
                  asChild
                  className={`w-full py-4 rounded-lg font-semibold transition-all ${
                    plan.popular
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-900 hover:bg-gray-800 text-white'
                  }`}
                >
                  <Link href={plan.id === 'free' ? "/signup" : "/pricing"}>
                    {plan.id === 'free' ? 'Get Started Free' : 'Choose Plan'}
                  </Link>
                </Button>
              </div>
            )
          })}
        </div>

        {/* Trust indicators */}
        <div 
          ref={statsRef}
          className="mt-16 pt-12 border-t border-gray-200"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {[
              { icon: Users, number: "10K+", label: "Active Users" },
              { icon: TrendingUp, number: "250%", label: "Average Growth" },
              { icon: Zap, number: "99.9%", label: "Uptime" }
            ].map((stat, index) => {
              const Icon = stat.icon
              const isVisible = statItems.includes(index)
              return (
                <div 
                  key={index} 
                  data-animate-item={index}
                  className={`group transition-all duration-700 ${
                    isVisible 
                      ? 'opacity-100 translate-y-0' 
                      : 'opacity-0 translate-y-8'
                  }`}
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl mb-4 group-hover:bg-blue-200 transition-colors duration-300">
                    <Icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-2 transition-colors duration-300">{stat.number}</div>
                  <div className="text-gray-600 font-medium">{stat.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
