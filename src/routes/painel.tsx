import { createFileRoute } from '@tanstack/react-router'
import Layout from '@/components/Layout'

export const Route = createFileRoute('/painel')({
  component: () => (
    <Layout>
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-4xl mb-4">Área do Aluno</h1>
        <p className="text-lg text-primary/70">Em construção — integração Supabase em breve</p>
      </div>
    </Layout>
  )
})
