'use client'

import { redirect } from 'next/navigation'

// Mind map lives on the home page (it's the free trial tool for guests
// and signed-in users alike). Keep this route as an alias.
export default function MindMapPage() {
  redirect('/')
}
