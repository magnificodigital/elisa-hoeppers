import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/bio')({
  component: () => (
    <div className="min-h-screen bg-cream py-10 px-4">
      <div className="max-w-md mx-auto text-center">
        <img src="/logo.png" alt="Elisa Hoeppers" className="h-16 mx-auto mb-8" />
        <h1 className="font-display text-2xl mb-10 text-primary">Links Úteis</h1>
        <div className="space-y-4">
          <p className="text-primary/70">Em construção — virá no prompt #6</p>
        </div>
      </div>
    </div>
  )
})
