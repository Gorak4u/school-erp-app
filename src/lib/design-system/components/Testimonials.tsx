// Production-Grade Testimonials Section Component
// Based on the School Management ERP UI Design Documents

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, Badge } from '../index';

interface Testimonial {
  id: number;
  name: string;
  role: string;
  school: string;
  image: string;
  content: string;
  rating: number;
  metrics: { label: string; value: string; change: string }[];
  category: 'school' | 'teacher' | 'student' | 'parent';
}

const Testimonials: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const testimonials: Testimonial[] = [
    {
      id: 1,
      name: "Dr. Priya Sharma",
      role: "Principal",
      school: "Delhi Public School",
      image: "👩‍🏫",
      content: "School ERP has transformed our administrative processes completely. We've reduced paperwork by 80% and improved parent communication significantly. The AI analytics have helped us identify at-risk students early and provide targeted support for board exams.",
      rating: 5,
      metrics: [
        { label: "Time Saved", value: "80%", change: "↓" },
        { label: "Parent Satisfaction", value: "95%", change: "↑" },
        { label: "Board Results", value: "+25%", change: "↑" }
      ],
      category: "school"
    },
    {
      id: 2,
      name: "Raj Kumar",
      role: "Mathematics Teacher",
      school: "Kendriya Vidyalaya",
      image: "👨‍🏫",
      content: "The automated grading system has saved me countless hours. I can now focus more on teaching rather than administrative tasks. The student analytics help me tailor my teaching methods for JEE/NEET preparation.",
      rating: 5,
      metrics: [
        { label: "Grading Time", value: "75%", change: "↓" },
        { label: "Student Engagement", value: "60%", change: "↑" },
        { label: "Class Performance", value: "+30%", change: "↑" }
      ],
      category: "teacher"
    },
    {
      id: 3,
      name: "Ananya Gupta",
      role: "Student",
      school: "National Public School",
      image: "👩‍🎓",
      content: "I love how easy it is to access my grades, assignments, and class schedules. The mobile app helps me stay organized and never miss deadlines. The personalized learning recommendations have really helped improve my board exam preparation.",
      rating: 5,
      metrics: [
        { label: "Grade Improvement", value: "+2", change: "↑" },
        { label: "Assignment Completion", value: "98%", change: "↑" },
        { label: "Study Time", value: "-20%", change: "↓" }
      ],
      category: "student"
    },
    {
      id: 4,
      name: "Amit Patel",
      role: "Parent",
      school: "St. Mary's School",
      image: "👨‍👩‍👧‍👦",
      content: "As a working parent, I appreciate being able to track my child's progress in real-time. The instant notifications about grades and attendance keep me informed without having to wait for parent-teacher conferences.",
      rating: 5,
      metrics: [
        { label: "Parent Engagement", value: "85%", change: "↑" },
        { label: "Communication", value: "90%", change: "↑" },
        { label: "Student Progress", value: "+40%", change: "↑" }
      ],
      category: "parent"
    }
  ];

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, testimonials.length]);

  const nextTestimonial = () => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goToTestimonial = (index: number) => {
    setActiveIndex(index);
    setIsAutoPlaying(false);
  };

  const categoryColors = {
    school: 'from-blue-500 to-cyan-500',
    teacher: 'from-green-500 to-emerald-500',
    student: 'from-purple-500 to-pink-500',
    parent: 'from-orange-500 to-red-500'
  };

  const categoryBadges = {
    school: 'bg-blue-100 text-blue-700',
    teacher: 'bg-green-100 text-green-700',
    student: 'bg-purple-100 text-purple-700',
    parent: 'bg-orange-100 text-orange-700'
  };

  return (
    <section className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <Badge variant="primary" size="lg" className="mb-6">
            💬 Real Success Stories
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Trusted by Educational
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {" "}Leaders Worldwide
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            See how schools, teachers, students, and parents are transforming 
            education with our innovative platform.
          </p>
        </motion.div>

        {/* Main Testimonial Display */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.5 }}
              >
                <Card variant="elevated" className="p-8 md:p-12">
                  <CardContent className="space-y-6">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-16 h-16 bg-gradient-to-br ${categoryColors[testimonials[activeIndex].category]} rounded-2xl flex items-center justify-center text-3xl shadow-lg`}>
                          {testimonials[activeIndex].image}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">
                            {testimonials[activeIndex].name}
                          </h3>
                          <p className="text-gray-600">
                            {testimonials[activeIndex].role}
                          </p>
                          <p className="text-sm text-gray-500">
                            {testimonials[activeIndex].school}
                          </p>
                        </div>
                      </div>
                      <Badge className={categoryBadges[testimonials[activeIndex].category]}>
                        {testimonials[activeIndex].category}
                      </Badge>
                    </div>

                    {/* Rating */}
                    <div className="flex gap-1">
                      {[...Array(testimonials[activeIndex].rating)].map((_, i) => (
                        <svg
                          key={i}
                          className="w-6 h-6 text-yellow-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>

                    {/* Content */}
                    <blockquote className="text-lg text-gray-700 leading-relaxed italic">
                      "{testimonials[activeIndex].content}"
                    </blockquote>

                    {/* Metrics */}
                    <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-100">
                      {testimonials[activeIndex].metrics.map((metric, index) => (
                        <div key={index} className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-2xl font-bold text-gray-900">
                              {metric.value}
                            </span>
                            <span className={`text-sm ${metric.change === '↑' ? 'text-green-500' : 'text-blue-500'}`}>
                              {metric.change}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500">{metric.label}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>

            {/* Navigation Controls */}
            <button
              onClick={prevTestimonial}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={nextTestimonial}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => goToTestimonial(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === activeIndex
                    ? 'bg-blue-600 w-8'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>

          {/* Auto-play Toggle */}
          <div className="flex justify-center mt-4">
            <button
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              {isAutoPlaying ? '⏸ Pause' : '▶ Play'} Auto-play
            </button>
          </div>
        </div>

        {/* Grid of All Testimonials */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              onClick={() => goToTestimonial(index)}
              className="cursor-pointer"
            >
              <Card 
                variant="outlined" 
                className={`p-6 hover:shadow-lg transition-all duration-300 ${
                  index === activeIndex ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 bg-gradient-to-br ${categoryColors[testimonial.category]} rounded-lg flex items-center justify-center text-lg`}>
                      {testimonial.image}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm">
                        {testimonial.name}
                      </h4>
                      <p className="text-xs text-gray-500">{testimonial.school}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <svg
                        key={i}
                        className="w-4 h-4 text-yellow-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-3">
                    "{testimonial.content}"
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
