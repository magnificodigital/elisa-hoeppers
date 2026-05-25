import { createFileRoute } from '@tanstack/react-router'
import Layout from '@/components/Layout'

export const Route = createFileRoute('/cursos')({
  component: () => (
    <Layout>
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-4xl mb-4">Cursos e Aulas</h1>
        <p className="text-lg text-primary/70">Em construção — virá no prompt #4</p>
      </div>
    </Layout>
  )
})
