/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './types/**/*.{js,ts,jsx,tsx}',
  ],
  safelist: [
    // Bar component
    'relative', 'w-32', 'h-12', 'bg-amber-200', 'border-l-4', 'border-amber-600', 'text-amber-700',
    // WC component
    'w-20', 'h-20', 'bg-blue-100', 'border-2', 'border-blue-500', 'text-blue-700',
    // Wardrobe component
    'bg-purple-100', 'border-purple-500', 'text-purple-700',
    // Kitchen component
    'w-32', 'h-20', 'bg-red-100', 'border-2', 'border-red-600', 'text-red-800', 'text-red-500',
    // Wall component
    'w-32', 'h-6', 'bg-gray-800', 'text-gray-100',
    // Shared classes
    'flex', 'items-center', 'justify-center', 'rounded', 'text-sm', 'text-xs', 'font-semibold', 'font-bold',
    'flex-col', 'absolute', '-top-4', 'rounded-sm', 'rounded-lg',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
} 