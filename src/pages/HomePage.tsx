import React from 'react'
import { Link } from 'react-router-dom'
const heroImg1 = '/images/download.jpeg'
const heroImg2 = '/images/images.jpeg'
const heroImg3 = '/images/download (1).jpeg'

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-white" />
        {/* Animated background blob */}
        <svg className="absolute -top-20 -right-20 h-96 w-96 text-indigo-200 opacity-60 blur-3xl animate-pulse" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path fill="currentColor" d="M45.5,-57.8C57.6,-50.1,64.4,-34.9,69.3,-19.4C74.1,-3.9,76.9,12,71.5,25.6C66.2,39.2,52.6,50.6,38.1,58.5C23.6,66.5,8.1,71.1,-7.9,71.1C-24,71.1,-40.7,66.6,-52.1,56.3C-63.5,46,-69.7,29.9,-73.2,13.3C-76.8,-3.3,-77.6,-20.6,-70.8,-34.7C-64,-48.7,-49.6,-59.5,-34.4,-66.4C-19.2,-73.3,-3.2,-76.2,11.6,-74.3C26.4,-72.4,39.1,-65.4,45.5,-57.8Z" transform="translate(100 100)" />
        </svg>
        <div className="relative max-w-7xl mx-auto px-6 sm:px-8 py-20 sm:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">AI-powered telerehab</span>
              <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900">
                Recover faster with real‑time form coaching
              </h1>
              <p className="mt-4 text-lg text-gray-600">
                RehabAI+ guides patients through prescribed exercises using your device camera, tracks reps and form, and shares progress with clinicians.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link to="/signup" className="inline-flex justify-center items-center px-6 py-3 rounded-md bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors shadow-sm">
                  Get started
                </Link>
                <Link to="/login" className="inline-flex justify-center items-center px-6 py-3 rounded-md border border-gray-300 text-gray-700 font-medium hover:bg-gray-50">
                  I already have an account
                </Link>
              </div>
              <div className="mt-6 flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  HIPAA-ready data handling
                </div>
                <div>Browser-based • No wearables</div>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-video w-full rounded-2xl bg-gray-100 shadow-xl ring-1 ring-gray-200 overflow-hidden">
                {/* Simple image montage with subtle animation */}
                <div className="w-full h-full grid grid-cols-2 gap-2 p-4">
                  <img src={heroImg1} alt="Demo UI" className="rounded-lg object-cover bg-white p-0 shadow-sm hover:scale-[1.02] transition-transform" />
                  <img src={heroImg2} alt="Analytics" className="rounded-lg object-cover bg-white p-0 shadow-sm hover:scale-[1.02] transition-transform" />
                  <div className="col-span-2 relative rounded-xl bg-gradient-to-tr from-indigo-50 to-white ring-1 ring-gray-200 flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-indigo-600/10 text-indigo-600 flex items-center justify-center animate-bounce">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6"><path d="M12 6v12m6-6H6"/></svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Live Coaching Cues</p>
                        <p className="text-xs text-gray-600">Form tips appear as you move</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-indigo-600">+82%</p>
                      <p className="text-xs text-gray-500">Avg completion</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 p-6 hover:shadow-md transition-shadow">
              <h2 className="text-2xl font-bold text-gray-900">For Patients</h2>
              <ul className="mt-4 space-y-3 text-gray-700">
                <li className="flex gap-3"><span className="text-green-600">✓</span> Guided sessions with instant feedback</li>
                <li className="flex gap-3"><span className="text-green-600">✓</span> Automatic rep counting & progress</li>
                <li className="flex gap-3"><span className="text-green-600">✓</span> Track pain and difficulty over time</li>
              </ul>
              <Link to="/signup" className="mt-6 inline-flex px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700">Create patient account</Link>
            </div>
            <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 p-6 hover:shadow-md transition-shadow">
              <h2 className="text-2xl font-bold text-gray-900">For Clinicians</h2>
              <ul className="mt-4 space-y-3 text-gray-700">
                <li className="flex gap-3"><span className="text-indigo-600">◆</span> Assign protocols and reps remotely</li>
                <li className="flex gap-3"><span className="text-indigo-600">◆</span> View adherence, form scores, pain trends</li>
                <li className="flex gap-3"><span className="text-indigo-600">◆</span> Focus visits on what matters</li>
              </ul>
              <Link to="/login" className="mt-6 inline-flex px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">Sign in as clinician</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Showcase screenshots / images */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center">See it in action</h2>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="group relative overflow-hidden rounded-2xl ring-1 ring-gray-200 shadow-sm">
              <img src={heroImg2} alt="Session screen" className="w-full h-56 object-cover transition-transform group-hover:scale-105" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 text-white text-sm">Real-time posture tracking</div>
            </div>
            <div className="group relative overflow-hidden rounded-2xl ring-1 ring-gray-200 shadow-sm">
              <img src={heroImg3} alt="Analytics screen" className="w-full h-56 object-cover transition-transform group-hover:scale-105" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 text-white text-sm">Progress analytics</div>
            </div>
            <div className="group relative overflow-hidden rounded-2xl ring-1 ring-gray-200 shadow-sm">
              <img src={heroImg1} alt="Plan screen" className="w-full h-56 object-cover transition-transform group-hover:scale-105" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 text-white text-sm">Personalized plans</div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center">How it works</h2>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl ring-1 ring-gray-200 hover:shadow-md transition-shadow">
              <div className="h-10 w-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-semibold">1</div>
              <h3 className="mt-4 font-semibold text-gray-900">Sign up & select role</h3>
              <p className="mt-1 text-gray-600">Create an account as a patient or clinician to get started.</p>
            </div>
            <div className="p-6 rounded-xl ring-1 ring-gray-200 hover:shadow-md transition-shadow">
              <div className="h-10 w-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-semibold">2</div>
              <h3 className="mt-4 font-semibold text-gray-900">Start your session</h3>
              <p className="mt-1 text-gray-600">Patients run sessions with the camera on and receive real‑time cues.</p>
            </div>
            <div className="p-6 rounded-xl ring-1 ring-gray-200 hover:shadow-md transition-shadow">
              <div className="h-10 w-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-semibold">3</div>
              <h3 className="mt-4 font-semibold text-gray-900">Track and review</h3>
              <p className="mt-1 text-gray-600">Progress and analytics sync to dashboards for both sides.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick stats */}
      <section className="py-8 bg-indigo-50">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="text-2xl font-bold text-indigo-600">10k+</div>
              <div className="text-sm text-gray-600">Sessions completed</div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="text-2xl font-bold text-indigo-600">92%</div>
              <div className="text-sm text-gray-600">Avg adherence</div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="text-2xl font-bold text-indigo-600">120+</div>
              <div className="text-sm text-gray-600">Clinicians</div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="text-2xl font-bold text-indigo-600">A+</div>
              <div className="text-sm text-gray-600">Session quality</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-8 py-10 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h3 className="text-2xl font-semibold">Ready to try RehabAI+?</h3>
              <p className="text-indigo-100">Create an account and start your first guided session in minutes.</p>
            </div>
            <div className="flex gap-3">
              <Link to="/signup" className="px-5 py-3 rounded-md bg-white text-indigo-700 font-semibold hover:bg-indigo-50">Sign up free</Link>
              <Link to="/login" className="px-5 py-3 rounded-md ring-1 ring-white/60 hover:bg-white/10">Sign in</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 text-center text-sm text-gray-500">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          © {new Date().getFullYear()} RehabAI+. All rights reserved.
        </div>
      </footer>
    </div>
  )
}

export default HomePage


