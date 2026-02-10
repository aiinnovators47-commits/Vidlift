'use client';

import { useState } from 'react';
import { Copy, Download, RefreshCw, ChevronDown } from 'lucide-react';
import SharedSidebar from '@/components/shared-sidebar';

const TEMPLATES = {
  fitness: {
    name: 'Fitness & Health',
    icon: '💪',
    description: 'Perfect for fitness, workout, and health content',
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
    description: 'Great for movies, filmmaking, and entertainment tutorials',
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
    description: 'Perfect for gaming tutorials, reviews, and gameplay videos',
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
    description: 'Ideal for tech reviews, gadget unboxing, and tutorials',
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
    description: 'Perfect for recipes, cooking tutorials, and food content',
    content: `Master the Art of Cooking: Delicious Recipes and Kitchen Techniques! Do you want to become a better cook and impress your family and friends with amazing meals? This comprehensive cooking guide brings you easy-to-follow recipes, essential cooking techniques, and secret tips from professional chefs.

From basic cooking fundamentals to advanced culinary techniques, we'll guide you through the entire cooking process. Whether you're a beginner in the kitchen or an experienced cook looking to expand your repertoire, this video offers valuable insights for everyone.

What You'll Discover: Essential Cooking Techniques - Master knife skills, heat control, seasoning, and timing. Recipe Selection - Learn how to choose recipes based on ingredients, difficulty level, and cooking time. Ingredient Quality - Understand the importance of fresh, high-quality ingredients and sourcing tips. Kitchen Tools - Explore essential equipment and gadgets that make cooking easier and more enjoyable. Food Preparation - Learn proper cleaning, cutting, and preparation methods to save time and ensure safety. Flavor Development - Discover how to build layers of flavor, balance seasonings, and create memorable dishes.

We cover various cuisines including Indian, Continental, Asian, Mediterranean, and more. You'll find quick weekday meals, special occasion recipes, desserts, drinks, and dietary-specific options including vegetarian and vegan alternatives. We also discuss meal planning, grocery shopping strategies, food storage, and kitchen organization.

Food is about passion, creativity, and sharing love with others. Let's cook together and create beautiful memories around the dining table. Join our cooking community and start your culinary adventure today!`,
    keywords: 'cooking tutorial, recipe video, food channel, cooking tips, cooking techniques, Indian recipes, easy recipes, quick recipes, healthy cooking, home cooking, kitchen skills, knife techniques, food preparation, ingredient selection, cooking hacks, cooking methods, cuisine guide, meal planning, food storage, kitchen organization, restaurant cooking, professional chef, culinary arts, food photography, cooking channel, cooking skills, seasonal recipes, cooking basics, advanced cooking, cooking for beginners, family recipes, special occasion recipes, dessert recipes, vegetarian recipes, vegan recipes, food blog, cooking channel ideas, kitchen gadgets, cooking equipment',
    hashtags: '#CookingTutorial #RecipeVideo #FoodChannel #EasyRecipes #HealthyEating #HomeCooked #CookingTips #FoodLover #RecipeIdeas #KitchenTips #FoodBlog #CookingChannel #YummyFood #RecipeShare #FoodCommunity',
  },
};

export default function DescriptionTemplates() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState('fitness');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [customContent, setCustomContent] = useState(TEMPLATES.fitness.content);
  const [customKeywords, setCustomKeywords] = useState(TEMPLATES.fitness.keywords);
  const [customHashtags, setCustomHashtags] = useState(TEMPLATES.fitness.hashtags);
  const [showUseModal, setShowUseModal] = useState(false);
  const [videoTitle, setVideoTitle] = useState('');
  const [generatedTitle, setGeneratedTitle] = useState('');
  const [generatedDescription, setGeneratedDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const currentTemplate = TEMPLATES[selectedTemplate as keyof typeof TEMPLATES];

  const handleTemplateChange = (templateKey: string) => {
    setSelectedTemplate(templateKey);
    const template = TEMPLATES[templateKey as keyof typeof TEMPLATES];
    setCustomContent(template.content);
    setCustomKeywords(template.keywords);
    setCustomHashtags(template.hashtags);
    setIsDropdownOpen(false);
  };

  const generateDescription = () => {
    const description = `${customContent}\n\nSEO: ${customKeywords}\n\n${customHashtags}\n\nConnect With Us:\n🎬 YouTube: [add your YouTube channel link]\n📷 Instagram: [add your Instagram link]\n𝕏 Twitter/X: [add your Twitter link]\n💼 LinkedIn: [add your LinkedIn link]\n🌐 Website: [add your website link]`;
    return description;
  };

  const fullDescription = generateDescription();

  const copyToClipboard = () => {
    navigator.clipboard.writeText(fullDescription);
    alert('Description copied to clipboard!');
  };

  const downloadDescription = () => {
    const element = document.createElement('a');
    const file = new Blob([fullDescription], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `description-${selectedTemplate}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const resetForm = () => {
    handleTemplateChange(selectedTemplate);
  };

  const handleUseTemplate = () => {
    if (!generatedTitle.trim() || !generatedDescription.trim()) {
      alert('Please generate a description first');
      return;
    }
    // Save the template with title
    const descriptionData = {
      title: generatedTitle,
      template: selectedTemplate,
      description: generatedDescription,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem(`video-description-${Date.now()}`, JSON.stringify(descriptionData));
    alert(`Template saved for: "${generatedTitle}"\n\nDescription copied to clipboard!`);
    navigator.clipboard.writeText(generatedDescription);
    setShowUseModal(false);
    setVideoTitle('');
    setGeneratedTitle('');
    setGeneratedDescription('');
  };

  const handleGenerateFromTitle = async () => {
    if (!videoTitle.trim()) {
      alert('Please enter a video title');
      return;
    }
    setIsGenerating(true);
    try {
      const prompt = `Create a professional YouTube video description for a "${currentTemplate.name}" video with the title: "${videoTitle}"

Generate a description with EXACTLY this format (4 sections). Use ONLY numbers (1️⃣ 2️⃣ 3️⃣ 4️⃣) and emojis for formatting. NO asterisks (*):

1️⃣ MAIN CONTENT: Compelling introduction and detailed content about the video (1000+ words). Use natural paragraphs with line breaks.

2️⃣ SEO KEYWORDS: Include 25-40+ relevant keywords separated by commas. These should relate to the title and template type.

3️⃣ HASHTAGS: Include 10-15 popular hashtags starting with # that are relevant to the content.

4️⃣ CONNECT WITH US:
🎬 YouTube: [add your YouTube channel link]
📷 Instagram: [add your Instagram link]
𝕏 Twitter/X: [add your Twitter link]
💼 LinkedIn: [add your LinkedIn link]
🌐 Website: [add your website link]

Make it unique, engaging, and optimized for YouTube SEO. Do NOT use asterisks (*) anywhere in the description. Use proper formatting with emojis and numbering only.`;

      const response = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          type: 'description'
        })
      });

      if (response.ok) {
        const data = await response.json();
        const result = data.result || data.text || '';
        setGeneratedDescription(result);
        setGeneratedTitle(videoTitle);
      } else {
        alert('Failed to generate description. Please try again.');
      }
    } catch (error) {
      console.error('Error generating description:', error);
      alert('An error occurred while generating the description');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
      <div className="flex">
        <SharedSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} isCollapsed={sidebarCollapsed} setIsCollapsed={setSidebarCollapsed} />
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
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-slate-900 mb-2">
                Description Templates
              </h1>
              <p className="text-slate-600">
                Choose a template, customize it, and generate professional YouTube descriptions
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Side - Template Selector */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
                  <h2 className="text-lg font-bold text-slate-900 mb-4">
                    Select Template
                  </h2>

                  {/* Dropdown */}
                  <div className="relative mb-4">
                    <button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg font-semibold hover:from-emerald-600 hover:to-emerald-700 transition"
                    >
                      <span>{currentTemplate.icon} {currentTemplate.name}</span>
                      <ChevronDown
                        size={20}
                        className={`transition ${isDropdownOpen ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {isDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-emerald-100 z-10">
                        {Object.entries(TEMPLATES).map(([key, template]) => (
                          <button
                            key={key}
                            onClick={() => handleTemplateChange(key)}
                            className="w-full text-left px-4 py-3 hover:bg-emerald-50 border-b last:border-b-0 transition"
                          >
                            <span className="text-lg">{template.icon}</span>{' '}
                            <span className="font-semibold text-slate-900">
                              {template.name}
                            </span>
                            <p className="text-xs text-slate-500 mt-1">
                              {template.description}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Template Info */}
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-4 mb-4">
                    <p className="text-sm text-slate-700 font-semibold mb-2">
                      Template Info
                    </p>
                    <p className="text-sm text-slate-600">
                      {currentTemplate.description}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Characters:</span>
                      <span className="font-bold text-emerald-600">
                        {fullDescription.length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Keywords:</span>
                      <span className="font-bold text-emerald-600">
                        {customKeywords.split(',').length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Hashtags:</span>
                      <span className="font-bold text-emerald-600">
                        {customHashtags.split('#').length - 1}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 space-y-3">
                    <button
                      onClick={() => setShowUseModal(true)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg font-semibold hover:from-emerald-600 hover:to-emerald-700 transition shadow-md"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L9 4.414V12.5a1 1 0 002 0V4.414l6.293 6.293a1 1 0 001.414-1.414l-7-7z"/></svg>
                      Use Template
                    </button>
                    <button
                      onClick={copyToClipboard}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition"
                    >
                      <Copy size={18} />
                      Copy Description
                    </button>
                    <button
                      onClick={downloadDescription}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg font-semibold hover:bg-purple-600 transition"
                    >
                      <Download size={18} />
                      Download
                    </button>
                    <button
                      onClick={resetForm}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-400 text-white rounded-lg font-semibold hover:bg-slate-500 transition"
                    >
                      <RefreshCw size={18} />
                      Reset
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Side - Preview & Editor */}
              <div className="lg:col-span-2 space-y-6">
                {/* Content Editor */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-3">
                    Main Content
                  </h3>
                  <textarea
                    value={customContent}
                    onChange={(e) => setCustomContent(e.target.value)}
                    className="w-full h-48 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none font-mono text-sm"
                    placeholder="Edit main content..."
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    Word count: {customContent.split(/\s+/).length}
                  </p>
                </div>

                {/* Keywords Editor */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-3">
                    SEO Keywords
                  </h3>
                  <textarea
                    value={customKeywords}
                    onChange={(e) => setCustomKeywords(e.target.value)}
                    className="w-full h-24 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none font-mono text-sm"
                    placeholder="Add keywords separated by commas..."
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    Keywords: {customKeywords.split(',').length}
                  </p>
                </div>

                {/* Hashtags Editor */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-3">
                    Hashtags
                  </h3>
                  <textarea
                    value={customHashtags}
                    onChange={(e) => setCustomHashtags(e.target.value)}
                    className="w-full h-20 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none font-mono text-sm"
                    placeholder="Add hashtags separated by spaces..."
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    Hashtags: {customHashtags.split('#').length - 1}
                  </p>
                </div>

                {/* Preview */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl shadow-lg p-6 text-white">
                  <h3 className="text-lg font-bold mb-3">Preview</h3>
                  <div className="bg-slate-950 rounded-lg p-4 max-h-64 overflow-y-auto font-mono text-sm whitespace-pre-wrap">
                    {fullDescription}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Use Template Modal */}
          {showUseModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-4 rounded-t-xl sticky top-0">
                  <h2 className="text-xl font-bold text-white">Use Template</h2>
                </div>

                {/* Modal Body */}
                <div className="px-6 py-6 space-y-4">
                  {/* Title Input Section */}
                  {!generatedTitle && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-900 mb-2">
                          Video Title
                        </label>
                        <input
                          type="text"
                          value={videoTitle}
                          onChange={(e) => setVideoTitle(e.target.value)}
                          placeholder="Enter your video title"
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                          onKeyPress={(e) => e.key === 'Enter' && handleGenerateFromTitle()}
                          autoFocus
                        />
                      </div>
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                        <p className="text-sm text-slate-600">
                          <span className="font-semibold text-slate-900">Template:</span> {currentTemplate.icon} {currentTemplate.name}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Generated Description Preview */}
                  {generatedTitle && (
                    <div className="space-y-4">
                      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg p-4">
                        <p className="text-sm text-slate-700">
                          <span className="font-bold block text-slate-900 mb-1">📌 Video Title:</span>
                          {generatedTitle}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 mb-2">Description Preview:</p>
                        <div className="bg-slate-900 rounded-lg p-4 text-white text-xs overflow-y-auto max-h-64 font-mono whitespace-pre-wrap">
                          {generatedDescription}
                        </div>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-xs text-slate-600">
                          <span className="font-semibold text-slate-900 block mb-1">📊 Stats:</span>
                          Characters: <span className="font-bold text-emerald-600">{generatedDescription.length}</span> • Keywords: <span className="font-bold text-emerald-600">{(generatedDescription.match(/SEO|keywords/gi) ? generatedDescription.split(',').length : 0)}</span> • Hashtags: <span className="font-bold text-emerald-600">{generatedDescription.split('#').length - 1}</span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="flex gap-3 px-6 py-4 bg-slate-50 rounded-b-xl border-t border-slate-200 sticky bottom-0">
                  <button
                    onClick={() => {
                      setShowUseModal(false);
                      setVideoTitle('');
                      setGeneratedTitle('');
                    }}
                    className="flex-1 px-4 py-2 bg-slate-300 text-slate-900 rounded-lg font-semibold hover:bg-slate-400 transition"
                  >
                    Close
                  </button>
                  {!generatedTitle ? (
                    <button
                      onClick={handleGenerateFromTitle}
                      disabled={isGenerating || !videoTitle.trim()}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGenerating ? 'Generating...' : 'Generate'}
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setGeneratedTitle('');
                          setVideoTitle('');
                        }}
                        className="px-4 py-2 bg-slate-200 text-slate-900 rounded-lg font-semibold hover:bg-slate-300 transition"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleUseTemplate}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg font-semibold hover:from-emerald-600 hover:to-emerald-700 transition shadow-md"
                      >
                        Save & Use
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
