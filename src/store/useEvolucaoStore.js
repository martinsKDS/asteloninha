import { create } from 'zustand'
import { buscarEvolucao, registrarPeso as registrarPesoApi } from '../services/evolucaoService.js'

let ultimaRequisicao = 0

export const useEvolucaoStore = create((set, get) => ({
  tipo: 'peso', // 'peso' | 'calorias' | 'health-score'
  periodo: 30, // 7 | 30 | 90
  dados: null,
  carregando: false,
  erro: null,

  setTipo: (tipo) => {
    set({ tipo })
    get().carregar()
  },

  setPeriodo: (periodo) => {
    set({ periodo: Number(periodo) })
    get().carregar()
  },

  carregar: async () => {
    const id = ++ultimaRequisicao
    const { tipo, periodo } = get()
    set({ carregando: true, erro: null })
    try {
      const dados = await buscarEvolucao({ tipo, periodo })
      if (id === ultimaRequisicao) set({ dados, carregando: false })
    } catch (e) {
      if (id === ultimaRequisicao) set({ erro: e.message, carregando: false })
    }
  },

  // Em caso de erro, a exceção sobe para o modal exibir a mensagem.
  registrarPeso: async ({ data, valor }) => {
    await registrarPesoApi({ data, valor })
    set({ tipo: 'peso' })
    await get().carregar()
  },
}))
