"use client"

import { useState } from "react"
import { Copy, Download, RefreshCw, Eye, Check } from "lucide-react"
import SharedSidebar from "@/components/shared-sidebar"

const TEMPLATES = {
  fitness: {
    name: 'Fitness & Health',
    icon: '💪',
    type: 'Workout & Health',
    content: `Unlock Your Dream Body: The Ultimate Fitness Guide for India! Are you tired of feeling sluggish, unmotivated, and far from your fitness goals? Do you dream of a healthier, stronger, and more confident you, but struggle to find the right path? This is your moment to unlock your dream body!

In this comprehensive, in-depth guide, we've curated the ultimate fitness roadmap specifically designed for the vibrant and diverse population of India. Forget generic, one-size-fits-all advice. We understand the unique challenges and opportunities you face, from cultural nuances to readily available resources.

What You'll Discover Inside: Personalized Fitness Planning - Learn how to create a workout plan that aligns with your individual goals, fitness level, and available time. We'll cover everything from strength training to cardio, flexibility, and mindful movement. Nutrition for Success - Discover the power of fueling your body with the right foods. We'll delve into balanced Indian dietary principles, practical meal prep ideas, and how to make healthy choices that are both delicious and effective. Effective Workout Routines - Get ready for a variety of workout demonstrations and explanations. We'll showcase exercises that can be done at home with minimal equipment, as well as gym-based routines. Building Sustainable Habits - Fitness isn't just about a few weeks of intense effort; it's about creating lasting lifestyle changes. We'll guide you on building discipline, staying motivated, and making fitness a natural part of your routine. Mind-Body Connection - Explore the crucial link between your mental and physical well-being. Learn techniques for stress management, mindfulness, and cultivating a positive body image. Indian Fitness Insights - We'll touch upon how to adapt traditional Indian practices like Yoga and Pranayama for modern fitness goals.

This is your ultimate companion on the path to achieving your desired physique and overall well-being. Hit that play button, take notes, and get ready to transform your life. Your dream body awaits!`,
    keywords: 'fitness guide India, dream body, workout routines, healthy living, Indian fitness, weight loss, muscle gain, fitness motivation, yoga India, nutrition tips, home workout, gym life, personal fitness, transform your body, get fit India, fitness for beginners, strength training, cardio workout, healthy diet, meal prep India, exercise at home, gym exercises, fitness tips, weight training, body transformation, Indian diet, healthy lifestyle, fitness challenges, workout plan, exercise routine, fitness journey, wellness guide, body goals, health tips, Indian health, fitness coaching, diet plan, nutrition guide, yoga for fitness, Pranayama benefits, sustainable fitness, fitness habits, body building, core strength',
    hashtags: '#FitnessIndia #DreamBody #WorkoutGuide #HealthyLiving #IndianFitness #WeightLoss #MuscleGain #FitnessMotivation #YogaIndia #NutritionTips #HomeWorkout #GymLife #PersonalFitness #TransformYourBody #GetFitIndia',
  },
  hollywood: {
    name: 'Entertainment & Filmmaking',
    icon: '🎬',
    type: 'Movies & Production',
    content: `Ever wondered what it takes to bring a Hollywood movie to life? This comprehensive guide uncovers the fascinating world of filmmaking, from the spark of an idea to the grand premiere. Whether you're an aspiring filmmaker, a movie enthusiast, or simply curious about how Hollywood creates magic, this video is your backstage pass to the entertainment industry.

Discover the intricate process of filmmaking with our in-depth exploration of screenplay writing, directing techniques, cinematography brilliance, and post-production mastery. We'll delve into the roles of key players like screenwriters, directors, cinematographers, producers, and editors, each contributing their unique expertise to create cinematic masterpieces.

Learn about the pre-production phase where ideas transform into detailed plans, the production phase where scenes come to life, and the post-production phase where editing, sound design, and visual effects create the final magic. Understand how budgeting, scheduling, and crew coordination ensure smooth production, and explore the art of directing actors, framing shots, and crafting compelling narratives.

From lighting techniques and lens selection to sound design and special effects, every element plays a crucial role in creating an unforgettable film experience. Discover the power of editing, color grading, and visual effects in post-production. We'll also discuss the significance of film festivals, movie premieres, and distribution strategies that bring films to worldwide audiences.

Whether it's drama, action, animation, or documentary filmmaking, each genre has its own unique characteristics and production requirements. Join us as we explore the collaborative nature of filmmaking, where creativity meets technical expertise to produce the entertainment we love.`,
    keywords: 'Hollywood filmmaking, movie production, film directing, screenwriting, cinematography, filmmaking tutorial, movie making, production design, visual effects, VFX, special effects, film editing, post-production, sound design, lighting techniques, directing actors, film festival, movie premiere, animation filmmaking, documentary filmmaking, film distribution, movie script, screenplay writing, camera techniques, lens selection, color grading, film crew, producer role, director role, cinematographer role, film budget, production schedule, dramatic filmmaking, action sequences, film industry, behind the scenes, movie set, film production process, entertainment industry, creative storytelling',
    hashtags: '#Hollywood #Filmmaking #MovieProduction #DirectingTips #Cinematography #FilmTutorial #BehindTheScenes #FilmIndustry #MovieMaking #ProductionDesign #VisualEffects #FilmFestival #CreativeStories #ActingTips #MoviePremiere',
  },
  gaming: {
    name: 'Gaming & Esports',
    icon: '🎮',
    type: 'Gaming & Strategy',
    content: `Level Up Your Gaming Skills: The Ultimate Guide to Mastering Your Favorite Games! Are you struggling to improve your gameplay, climb the competitive ladder, or simply want to enjoy gaming more? This comprehensive gaming guide is designed for players of all skill levels, from complete beginners to aspiring professionals.

In this in-depth tutorial, we cover everything you need to know to become a better gamer. Learn essential gaming strategies, map awareness techniques, character selection tips, and advanced combat mechanics. We break down the most effective gameplay tactics used by professional esports players and world champions.

What You'll Discover: Game Mechanics Mastery - Understand the core mechanics that make each game unique. We'll explore controls, abilities, weapons, and character builds. Strategic Gameplay - Learn how to read the game, predict opponent moves, and make tactical decisions. Map Knowledge - Discover the importance of map awareness, positioning, and rotations. Character Selection - Find the perfect character that matches your playstyle and strengths. Competitive Ranking - Understand the ranking system and how to climb efficiently. Community & Tournaments - Join gaming communities, participate in tournaments, and improve alongside other players.

Whether you're into first-person shooters, multiplayer online battle arenas, role-playing games, strategy games, or any other genre, these fundamental principles apply. We'll also discuss the importance of practice routines, watching professional matches, streaming tips, and maintaining a healthy gaming lifestyle.

Practice consistently, stay positive, learn from defeats, and remember that improvement takes time. With dedication and the right strategies, you'll watch your skills grow. Let's get started on your gaming journey!`,
    keywords: 'gaming tutorial, gameplay guide, gaming tips, esports strategies, competitive gaming, gaming mechanics, character guide, map awareness, gaming skills, rank up, gaming channel, FPS tips, MOBA strategies, RPG guide, gaming tactics, professional gaming, gaming equipment, mouse sensitivity, keyboard shortcuts, gaming resolution, FPS optimization, gaming monitor, gameplay recording, streaming setup, gaming community, gaming tournaments, gaming practice, gaming routine, gaming motivation, gaming performance, gaming improvement, gaming ladder, gaming mindset, gaming experience, gaming techniques, gaming secrets, gaming hacks, gaming tricks, gaming methods',
    hashtags: '#GamingTutorial #GameplayGuide #Esports #CompetitiveGaming #ProGaming #GamingTips #LevelUp #GamingSkills #FPS #MOBA #RPG #GamingCommunity #TwitchStreaming #YoutubeBetter #GamersUnite',
  },
  tech: {
    name: 'Tech Reviews & How-To',
    icon: '📱',
    type: 'Tech & Gadgets',
    content: `Discover the Latest Technology: Your Complete Tech Guide for 2026! In our fast-paced digital world, staying updated with the newest technology is essential. Whether you're a tech enthusiast, professional, or casual user, this comprehensive guide will help you navigate the world of gadgets, software, and digital innovation.

From smartphones and laptops to smart home devices and cutting-edge wearables, we explore the latest technological advancements and their real-world applications. This video covers product reviews, in-depth unboxing experiences, detailed specifications, and practical comparisons to help you make informed purchasing decisions.

What You'll Learn: Smartphone Technology - Discover the latest features, camera systems, processing power, and display innovations. Laptop & Computing - Explore different operating systems, performance specifications, and the best devices for your needs. Smart Home Devices - Learn how IoT technology can enhance your living space and improve daily convenience. Wearable Technology - Understand smartwatches, fitness trackers, and their health-monitoring capabilities. Software & Apps - Discover productivity tools, security software, and applications that enhance your digital life. Audio & Visual - Explore headphones, speakers, monitors, and displays with cutting-edge technology.

We'll provide honest reviews, detailed specifications, performance benchmarks, and value-for-money assessments. Whether you're looking for budget-friendly options or premium flagship devices, this guide covers all price ranges. We also discuss technology trends, future innovations, and how to stay ahead in the digital revolution.

Make smart tech decisions with our expert guidance. Subscribe for more tech reviews and stay updated with the digital world!`,
    keywords: 'tech review, gadget review, smartphone review, laptop review, technology guide, tech tutorial, unboxing video, product review, tech comparison, specifications, features, tech trends, smart home, wearable technology, tech news, tech update, gadget unboxing, performance test, benchmark, tech tips, tech tricks, tech hacks, tech setup, tech guide, digital innovation, tech recommendation, best gadgets, latest technology, tech channel, tech reviews 2026, phone comparison, laptop comparison, tech buying guide, tech installation, software tutorial, app review, tech support',
    hashtags: '#TechReview #GadgetReview #Unboxing #Smartphone #Laptop #SmartHome #TechTutorial #TechTrends #Gadgets #Review #TechGuide #BestOfTech #ProductReview #TechChannel #TechCommunity',
  },
  cooking: {
    name: 'Cooking & Food',
    icon: '🍳',
    type: 'Food & Recipes',
    content: `Master the Art of Cooking: Delicious Recipes and Kitchen Techniques! Do you want to become a better cook and impress your family and friends with amazing meals? This comprehensive cooking guide brings you easy-to-follow recipes, essential cooking techniques, and secret tips from professional chefs.

From basic cooking fundamentals to advanced culinary techniques, we'll guide you through the entire cooking process. Whether you're a beginner in the kitchen or an experienced cook looking to expand your repertoire, this video offers valuable insights for everyone.

What You'll Discover: Essential Cooking Techniques - Master knife skills, heat control, seasoning, and timing. Recipe Selection - Learn how to choose recipes based on ingredients, difficulty level, and cooking time. Ingredient Quality - Understand the importance of fresh, high-quality ingredients and sourcing tips. Kitchen Tools - Explore essential equipment and gadgets that make cooking easier and more enjoyable. Food Preparation - Learn proper cleaning, cutting, and preparation methods to save time and ensure safety. Flavor Development - Discover how to build layers of flavor, balance seasonings, and create memorable dishes.

We cover various cuisines including Indian, Continental, Asian, Mediterranean, and more. You'll find quick weekday meals, special occasion recipes, desserts, drinks, and dietary-specific options including vegetarian and vegan alternatives. We also discuss meal planning, grocery shopping strategies, food storage, and kitchen organization.

Food is about passion, creativity, and sharing love with others. Let's cook together and create beautiful memories around the dining table. Join our cooking community and start your culinary adventure today!`,
    keywords: 'cooking tutorial, recipe video, food channel, cooking tips, cooking techniques, Indian recipes, easy recipes, quick recipes, healthy cooking, home cooking, kitchen skills, knife techniques, food preparation, ingredient selection, cooking hacks, cooking methods, cuisine guide, meal planning, food storage, kitchen organization, restaurant cooking, professional chef, culinary arts, food photography, cooking channel, cooking skills, seasonal recipes, cooking basics, advanced cooking, cooking for beginners, family recipes, special occasion recipes, dessert recipes, vegetarian recipes, vegan recipes, food blog, cooking channel ideas, kitchen gadgets, cooking equipment',
    hashtags: '#CookingTutorial #RecipeVideo #FoodChannel #EasyRecipes #HealthyEating #HomeCooked #CookingTips #FoodLover #RecipeIdeas #KitchenTips #FoodBlog #CookingChannel #YummyFood #RecipeShare #FoodCommunity',
  },
};

export default function SeoDescriptionBuilder() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState<string | null>(null)
  const [mainContent, setMainContent] = useState("")
  const [seoKeywords, setSeoKeywords] = useState("")
  const [hashtags, setHashtags] = useState("")
  const [youtubeChannel, setYoutubeChannel] = useState("")
  const [instagramHandle, setInstagramHandle] = useState("")
  const [twitterHandle, setTwitterHandle] = useState("")
  const [linkedinProfile, setLinkedinProfile] = useState("")
  const [websiteLink, setWebsiteLink] = useState("")
  const [generatedDescription, setGeneratedDescription] = useState("")
  const [charCount, setCharCount] = useState(0)

  const selectTemplate = (templateKey: string) => {
    const template = TEMPLATES[templateKey as keyof typeof TEMPLATES]
    setSelectedTemplate(templateKey)
    setMainContent(template.content)
    setSeoKeywords(template.keywords)
    setHashtags(template.hashtags)
    setShowPreview(null)
  }

  const generateDescription = () => {
    let description = ""

    if (mainContent.trim()) {
      description += mainContent.trim() + "\n\n"
    }

    if (seoKeywords.trim()) {
      description += "SEO: " + seoKeywords.trim() + "\n\n"
    }

    if (hashtags.trim()) {
      description += hashtags.trim() + "\n\n"
    }

    const links = []
    if (youtubeChannel.trim()) links.push(`🎬 YouTube: ${youtubeChannel}`)
    if (instagramHandle.trim()) links.push(`📷 Instagram: ${instagramHandle}`)
    if (twitterHandle.trim()) links.push(`𝕏 Twitter/X: ${twitterHandle}`)
    if (linkedinProfile.trim()) links.push(`💼 LinkedIn: ${linkedinProfile}`)
    if (websiteLink.trim()) links.push(`🌐 Website: ${websiteLink}`)

    if (links.length > 0) {
      description += "Connect With Us:\n" + links.join("\n")
    }

    setGeneratedDescription(description)
    setCharCount(description.length)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedDescription)
    alert("Description copied to clipboard!")
  }

  const downloadDescription = () => {
    const element = document.createElement("a")
    const file = new Blob([generatedDescription], { type: "text/plain" })
    element.href = URL.createObjectURL(file)
    element.download = `description-${selectedTemplate || 'custom'}.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const resetAll = () => {
    setSelectedTemplate(null)
    setMainContent("")
    setSeoKeywords("")
    setHashtags("")
    setYoutubeChannel("")
    setInstagramHandle("")
    setTwitterHandle("")
    setLinkedinProfile("")
    setWebsiteLink("")
    setGeneratedDescription("")
    setCharCount(0)
    setShowPreview(null)
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
      <div className="flex">
        <SharedSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className={`flex-1 pt-16 md:pt-18 px-3 sm:px-4 md:px-6 pb-24 md:pb-12 transition-all duration-300 ${sidebarCollapsed ? 'md:ml-20' : 'md:ml-72'}`}>
          {/* Mobile Menu Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden fixed top-4 left-4 z-40 p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm"
            aria-label="Open sidebar"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Desktop Sidebar Collapse Toggle */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden md:flex fixed md:top-20 md:left-3 z-30 p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm items-center justify-center"
            aria-label="Toggle sidebar"
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <svg className={`w-5 h-5 text-gray-700 transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-slate-900 mb-2">
                SEO Description Builder
              </h1>
              <p className="text-slate-600">
                Select a template, customize it, and generate professional YouTube descriptions
              </p>
            </div>

            {/* Template Selection Grid - Show 5 Templates */}
            {!selectedTemplate && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">
                  Choose a Template Type
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {Object.entries(TEMPLATES).map(([key, template]) => (
                    <div
                      key={key}
                      className="bg-white rounded-xl shadow-lg hover:shadow-xl transition overflow-hidden group"
                    >
                      {/* Template Card */}
                      <div className="p-6 text-center">
                        <div className="text-5xl mb-3">{template.icon}</div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">
                          {template.name}
                        </h3>
                        <p className="text-sm text-slate-600 mb-4">
                          {template.type}
                        </p>

                        {/* Preview & Choose Buttons */}
                        <div className="space-y-2 flex flex-col">
                          <button
                            onClick={() => setShowPreview(key)}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 transition text-sm"
                          >
                            <Eye size={16} />
                            Preview
                          </button>
                          <button
                            onClick={() => selectTemplate(key)}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg font-semibold hover:from-emerald-600 hover:to-emerald-700 transition text-sm"
                          >
                            <Check size={16} />
                            Choose
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Preview Modal */}
            {showPreview && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-96 overflow-y-auto">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-2xl font-bold">
                        {TEMPLATES[showPreview as keyof typeof TEMPLATES].icon}{' '}
                        {TEMPLATES[showPreview as keyof typeof TEMPLATES].name}
                      </h3>
                      <button
                        onClick={() => setShowPreview(null)}
                        className="text-slate-500 hover:text-slate-700 text-2xl"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="text-sm text-slate-700 mb-6 whitespace-pre-wrap max-h-48 overflow-y-auto">
                      {TEMPLATES[showPreview as keyof typeof TEMPLATES].content.substring(0, 500)}...
                    </div>

                    <div className="bg-emerald-50 p-4 rounded-lg mb-4">
                      <p className="text-sm text-slate-700">
                        <span className="font-bold">Keywords:</span>{' '}
                        {TEMPLATES[showPreview as keyof typeof TEMPLATES].keywords.split(',').length}
                      </p>
                      <p className="text-sm text-slate-700 mt-2">
                        <span className="font-bold">Hashtags:</span>{' '}
                        {TEMPLATES[showPreview as keyof typeof TEMPLATES].hashtags.split('#').length - 1}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        selectTemplate(showPreview)
                        setShowPreview(null)
                      }}
                      className="w-full px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg font-semibold hover:from-emerald-600 hover:to-emerald-700 transition"
                    >
                      Use This Template
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Editor Section - Show after template selected */}
            {selectedTemplate && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left - Form */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-2xl font-bold text-slate-900">
                        Edit Your Description
                      </h2>
                      <button
                        onClick={() => setSelectedTemplate(null)}
                        className="text-sm px-3 py-1 bg-slate-200 text-slate-700 rounded hover:bg-slate-300 transition"
                      >
                        Change Template
                      </button>
                    </div>

                    {/* Main Content */}
                    <div className="mb-6">
                      <label className="block text-sm font-bold text-slate-700 mb-2">
                        Main Content
                      </label>
                      <textarea
                        value={mainContent}
                        onChange={(e) => setMainContent(e.target.value)}
                        rows={8}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none font-mono text-sm"
                      />
                      <p className="text-xs text-slate-500 mt-2">
                        {mainContent.length} characters
                      </p>
                    </div>

                    {/* SEO Keywords */}
                    <div className="mb-6">
                      <label className="block text-sm font-bold text-slate-700 mb-2">
                        SEO Keywords (comma separated)
                      </label>
                      <textarea
                        value={seoKeywords}
                        onChange={(e) => setSeoKeywords(e.target.value)}
                        rows={4}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none font-mono text-sm"
                      />
                      <p className="text-xs text-slate-500 mt-2">
                        {seoKeywords.split(',').filter(k => k.trim()).length} keywords
                      </p>
                    </div>

                    {/* Hashtags */}
                    <div className="mb-6">
                      <label className="block text-sm font-bold text-slate-700 mb-2">
                        Hashtags
                      </label>
                      <textarea
                        value={hashtags}
                        onChange={(e) => setHashtags(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none font-mono text-sm"
                      />
                      <p className="text-xs text-slate-500 mt-2">
                        {hashtags.split('#').length - 1} hashtags
                      </p>
                    </div>

                    {/* Social Links */}
                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-4 mb-6">
                      <h3 className="font-bold text-slate-900 mb-4">Add Social Media Links</h3>
                      <div className="space-y-3">
                        <input
                          type="text"
                          placeholder="🎬 YouTube channel link"
                          value={youtubeChannel}
                          onChange={(e) => setYoutubeChannel(e.target.value)}
                          className="w-full px-3 py-2 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                        />
                        <input
                          type="text"
                          placeholder="📷 Instagram profile"
                          value={instagramHandle}
                          onChange={(e) => setInstagramHandle(e.target.value)}
                          className="w-full px-3 py-2 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                        />
                        <input
                          type="text"
                          placeholder="𝕏 Twitter/X profile"
                          value={twitterHandle}
                          onChange={(e) => setTwitterHandle(e.target.value)}
                          className="w-full px-3 py-2 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                        />
                        <input
                          type="text"
                          placeholder="💼 LinkedIn profile"
                          value={linkedinProfile}
                          onChange={(e) => setLinkedinProfile(e.target.value)}
                          className="w-full px-3 py-2 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                        />
                        <input
                          type="text"
                          placeholder="🌐 Website link"
                          value={websiteLink}
                          onChange={(e) => setWebsiteLink(e.target.value)}
                          className="w-full px-3 py-2 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <button
                        onClick={generateDescription}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg font-bold hover:from-emerald-600 hover:to-emerald-700 transition"
                      >
                        Generate Description
                      </button>
                      <button
                        onClick={resetAll}
                        className="flex-1 px-6 py-3 bg-slate-400 text-white rounded-lg font-bold hover:bg-slate-500 transition flex items-center justify-center gap-2"
                      >
                        <RefreshCw size={18} />
                        Reset
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right - Preview */}
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Preview</h3>

                    {generatedDescription ? (
                      <>
                        <div className="bg-slate-900 text-white rounded-lg p-4 mb-4 max-h-64 overflow-y-auto font-mono text-xs whitespace-pre-wrap">
                          {generatedDescription}
                        </div>

                        <div className="bg-emerald-50 rounded-lg p-4 mb-4">
                          <p className="text-sm font-bold text-slate-900">
                            {charCount} characters
                          </p>
                          <div className="w-full bg-slate-300 rounded-full h-2 mt-2">
                            <div
                              className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2 rounded-full transition"
                              style={{ width: `${Math.min((charCount / 3000) * 100, 100)}%` }}
                            />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <button
                            onClick={copyToClipboard}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition"
                          >
                            <Copy size={18} />
                            Copy
                          </button>
                          <button
                            onClick={downloadDescription}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg font-semibold hover:bg-purple-600 transition"
                          >
                            <Download size={18} />
                            Download
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8 text-slate-500">
                        <p>Edit your content and click "Generate Description"</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
