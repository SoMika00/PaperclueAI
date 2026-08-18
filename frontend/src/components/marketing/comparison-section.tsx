"use client";

export function ComparisonSection() {
  return (
    <section className="py-20 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-[#0f1727] dark:via-[#1e293b] dark:to-[#334155] relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10"></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl mb-6 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 dark:from-white dark:via-blue-100 dark:to-indigo-100 bg-clip-text text-transparent mb-6">
            Why Paper Clue is Better for Academic Research
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed">
            Discover how Paper Clue AI outperforms general-purpose AI tools with specialized academic features
          </p>
        </div>
        
        <div className="max-w-6xl mx-auto">
          {/* Comparison Table */}
          <div className="mt-12 bg-white dark:bg-[#1e293b] rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
                  <tr className="border-b-2 border-gray-200 dark:border-gray-600">
                    <th className="px-8 py-6 w-1/3 text-left">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-xl flex items-center justify-center mr-4">
                          <span className="text-xl">📊</span>
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Academic Features</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Compare key capabilities</p>
                        </div>
                      </div>
                    </th>
                    <th className="px-8 py-6 w-1/3 text-center">
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 bg-gradient-to-r rounded-xl flex items-center justify-between mb-3">
                          <span className="text-xl text-white">🤖</span>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-700 dark:text-gray-300">ChatGPT</h3>
                        <p className="text-sm text-gray-700 dark:text-gray-300">General-purpose AI</p>
                      </div>
                    </th>
                    <th className="px-8 py-6 w-1/3 text-center">
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 bg-gradient-to-r rounded-xl flex items-center justify-between mb-3">
                          <img src="/img/icon.png" alt="Paper Clue" className="w-12 h-12" />
                        </div>
                        <h3 className="text-2xl font-bold text-theme_secondary">Paper Clue</h3>
                        <p className="text-sm text-theme_secondary ">Academic-focused AI</p>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {/* Academic Focus */}
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-8 py-1 w-1/3">
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Academic Focus</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Specialized for academic research</p>
                    </td>
                    <td className="px-8 py-2 w-1/3 text-center">
                      <div className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                        <span className="text-red-600 dark:text-red-400 text-xl mr-2">❌</span>
                        <span className="text-red-800 dark:text-red-200 font-medium text-center w-full">General-purpose</span>
                      </div>
                    </td>
                    <td className="px-8 py-2 w-1/3 text-center">
                      <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <span className="text-green-600 dark:text-green-400 text-xl mr-2">✅</span>
                        <span className="text-green-800 dark:text-green-200 font-medium text-center w-full">Purpose-built to solve academic pain points</span>
                      </div>
                    </td>
                  </tr>

                  {/* Manuscript Review */}
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-8 py-1 w-1/3">
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Manuscript Review</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Peer-review style feedback</p>
                    </td>
                    <td className="px-8 py-2 w-1/3 text-center">
                      <div className="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                        <span className="text-yellow-600 dark:text-yellow-400 text-xl mr-2">⚠️</span>
                        <span className="text-yellow-800 dark:text-yellow-200 font-medium text-center w-full">General writing suggestions</span>
                      </div>
                    </td>
                    <td className="px-8 py-2 w-1/3 text-center">
                      <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <span className="text-green-600 dark:text-green-400 text-xl mr-2">✅</span>
                        <span className="text-green-800 dark:text-green-200 font-medium text-center w-full">Human-level, peer-review–style feedback</span>
                      </div>
                    </td>
                  </tr>

                  {/* Journal Formatting */}
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-8 py-1 w-1/3">
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Journal Formatting</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Journal-specific formatting</p>
                    </td>
                    <td className="px-8 py-2 w-1/3 text-center">
                      <div className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                        <span className="text-red-600 dark:text-red-400 text-xl mr-2">❌</span>
                        <span className="text-red-800 dark:text-red-200 font-medium text-center w-full">Not available</span>
                      </div>
                    </td>
                    <td className="px-8 py-2 w-1/3 text-center">
                      <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <span className="text-green-600 dark:text-green-400 text-xl mr-2">✅</span>
                        <span className="text-green-800 dark:text-green-200 font-medium text-center w-full">Gives curated journal-specific formatting recommendations</span>
                      </div>
                    </td>
                  </tr>

                  {/* Formatting Manuscripts */}
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-8 py-1 w-1/3">
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Formatting Manuscripts</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Apply journal formatting</p>
                    </td>
                    <td className="px-8 py-2 w-1/3 text-center">
                      <div className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                        <span className="text-red-600 dark:text-red-400 text-xl mr-2">❌</span>
                        <span className="text-red-800 dark:text-red-200 font-medium text-center w-full">Not available</span>
                      </div>
                    </td>
                    <td className="px-8 py-2 w-1/3 text-center">
                      <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <span className="text-green-600 dark:text-green-400 text-xl mr-2">✅</span>
                        <span className="text-green-800 dark:text-green-200 font-medium text-center w-full">Applies actual journal formatting to manuscripts</span>
                      </div>
                    </td>
                  </tr>

                  {/* Citation Verification */}
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-8 py-1 w-1/3">
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Citation Verification</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Reference validation</p>
                    </td>
                    <td className="px-8 py-2 w-1/3 text-center">
                      <div className="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                        <span className="text-yellow-600 dark:text-yellow-400 text-xl mr-2">⚠️</span>
                        <span className="text-yellow-800 dark:text-yellow-200 font-medium text-center w-full">May generate unverifiable citations</span>
                      </div>
                    </td>
                    <td className="px-8 py-2 w-1/3 text-center">
                      <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <span className="text-green-600 dark:text-green-400 text-xl mr-2">✅</span>
                        <span className="text-green-800 dark:text-green-200 font-medium text-center w-full">Validates against real journal databases</span>
                      </div>
                    </td>
                  </tr>

                  {/* AI Risk Assessment */}
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-8 py-1 w-1/3">
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">AI Risk Assessment</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Originality evaluation</p>
                    </td>
                    <td className="px-8 py-2 w-1/3 text-center">
                      <div className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                        <span className="text-red-600 dark:text-red-400 text-xl mr-2">❌</span>
                        <span className="text-red-800 dark:text-red-200 font-medium text-center w-full">Not available</span>
                      </div>
                    </td>
                    <td className="px-8 py-2 w-1/3 text-center">
                      <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <span className="text-green-600 dark:text-green-400 text-xl mr-2">✅</span>
                        <span className="text-green-800 dark:text-green-200 font-medium text-center w-full">Helps avoid AI overuse issues</span>
                      </div>
                    </td>
                  </tr>

                  {/* Grammar Check */}
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-8 py-1 w-1/3">
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Grammar Check</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Learning-focused corrections</p>
                    </td>
                    <td className="px-8 py-2 w-1/3 text-center">
                      <div className="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                        <span className="text-yellow-600 dark:text-yellow-400 text-xl mr-2">⚠️</span>
                        <span className="text-yellow-800 dark:text-yellow-200 font-medium text-center w-full">Corrects only grammar- prohibits learning</span>
                      </div>
                    </td>
                    <td className="px-8 py-2 w-1/3 text-center">
                      <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <span className="text-green-600 dark:text-green-400 text-xl mr-2">✅</span>
                        <span className="text-green-800 dark:text-green-200 font-medium text-center w-full">Transforms mistakes into learning opportunities</span>
                      </div>
                    </td>
                  </tr>

                  {/* Research Mind Map */}
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-8 py-1 w-1/3">
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Research Mind Map</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Interactive research mapping</p>
                    </td>
                    <td className="px-8 py-2 w-1/3 text-center">
                      <div className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                        <span className="text-red-600 dark:text-red-400 text-xl mr-2">❌</span>
                        <span className="text-red-800 dark:text-red-200 font-medium text-center w-full">Not available</span>
                      </div>
                    </td>
                    <td className="px-8 py-2 w-1/3 text-center">
                      <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <span className="text-green-600 dark:text-green-400 text-xl mr-2">✅</span>
                        <span className="text-green-800 dark:text-green-200 font-medium text-center w-full">Creates structured, interactive research mind maps</span>
                      </div>
                    </td>
                  </tr>

                  {/* Data Source */}
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-8 py-1 w-1/3">
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Data Source</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Source reliability</p>
                    </td>
                    <td className="px-8 py-2 w-1/3 text-center">
                      <div className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                        <span className="text-red-600 dark:text-red-400 text-xl mr-2">❌</span>
                        <span className="text-red-800 dark:text-red-200 font-medium text-center w-full">General</span>
                      </div>
                    </td>
                    <td className="px-8 py-2 w-1/3 text-center">
                      <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <span className="text-green-600 dark:text-green-400 text-xl mr-2">✅</span>
                        <span className="text-green-800 dark:text-green-200 font-medium text-center w-full">Verified journal databases</span>
                      </div>
                    </td>
                  </tr>

                  {/* Data Accuracy */}
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-8 py-1 w-1/3">
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Data Accuracy</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Information reliability</p>
                    </td>
                    <td className="px-8 py-2 w-1/3 text-center">
                      <div className="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                        <span className="text-yellow-600 dark:text-yellow-400 text-xl mr-2">⚠️</span>
                        <span className="text-yellow-800 dark:text-yellow-200 font-medium text-center w-full">May generate unverifiable data</span>
                      </div>
                    </td>
                    <td className="px-8 py-2 w-1/3 text-center">
                      <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <span className="text-green-600 dark:text-green-400 text-xl mr-2">✅</span>
                        <span className="text-green-800 dark:text-green-200 font-medium text-center w-full">Uses verified sources and journals metadata</span>
                      </div>
                    </td>
                  </tr>

                  {/* Privacy */}
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-8 py-1 w-1/3">
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Privacy</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Data protection</p>
                    </td>
                    <td className="px-8 py-2 w-1/3 text-center">
                      <div className="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                        <span className="text-yellow-600 dark:text-yellow-400 text-xl mr-2">⚠️</span>
                        <span className="text-yellow-800 dark:text-yellow-200 font-medium text-center w-full">Conversations may be used for model improvement</span>
                      </div>
                    </td>
                    <td className="px-8 py-2 w-1/3 text-center">
                      <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <span className="text-green-600 dark:text-green-400 text-xl mr-2">✅</span>
                        <span className="text-green-800 dark:text-green-200 font-medium text-center w-full">No data is saved</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
