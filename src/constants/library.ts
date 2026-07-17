import { TaskCategory, TaskDifficulty, TaskType } from '@/domain/entities';

/**
 * Biblioteca inicial: 250+ tarefas prontas, organizadas por categoria.
 * Cada linha: [título, emoji, minutos, dificuldade].
 */
export interface LibraryTask {
  title: string;
  emoji: string;
  category: TaskCategory;
  type: TaskType;
  estimatedMinutes: number;
  difficulty: TaskDifficulty;
  xp: number;
  coins: number;
}

type Row = [title: string, emoji: string, minutes: number, difficulty: TaskDifficulty, type?: TaskType];

const BASE_XP: Record<TaskDifficulty, number> = { facil: 15, media: 30, dificil: 50 };

function build(category: TaskCategory, defaultType: TaskType, rows: Row[]): LibraryTask[] {
  return rows.map(([title, emoji, estimatedMinutes, difficulty, type]) => {
    const xp = BASE_XP[difficulty] + Math.min(30, Math.round(estimatedMinutes / 5));
    return {
      title,
      emoji,
      category,
      type: type ?? defaultType,
      estimatedMinutes,
      difficulty,
      xp,
      coins: Math.max(5, Math.round(xp / 2)),
    };
  });
}

const CASA: Row[] = [
  ['Arrumar cama', '🛏️', 10, 'facil'],
  ['Aspirar casa', '🌀', 40, 'media'],
  ['Varrer', '🧹', 20, 'facil'],
  ['Passar pano', '🪣', 40, 'media'],
  ['Limpar banheiro', '🚿', 30, 'dificil'],
  ['Limpar janelas', '🪟', 45, 'dificil'],
  ['Limpar espelhos', '🪞', 15, 'facil'],
  ['Tirar pó dos móveis', '🪶', 25, 'facil'],
  ['Organizar quarto', '🛏️', 30, 'facil'],
  ['Organizar sala', '🛋️', 30, 'facil'],
  ['Organizar armário', '👚', 60, 'media'],
  ['Organizar garagem', '🧰', 90, 'dificil'],
  ['Trocar lixo', '🗑️', 5, 'facil'],
  ['Trocar lençóis', '🛌', 15, 'facil'],
  ['Trocar toalhas', '🧻', 10, 'facil'],
  ['Limpar geladeira', '🧊', 45, 'dificil'],
  ['Limpar forno', '🔥', 40, 'dificil'],
  ['Limpar micro-ondas', '📦', 15, 'facil'],
  ['Desentulhar gavetas', '🗄️', 40, 'media'],
  ['Arrumar despensa', '🥫', 35, 'media'],
];

const CASAL: Row[] = [
  ['Assistir filme', '🎬', 120, 'facil'],
  ['Caminhar juntos', '🚶', 45, 'facil'],
  ['Jantar romântico', '🕯️', 90, 'media'],
  ['Planejar férias', '🏖️', 60, 'media'],
  ['Planejar orçamento', '📊', 45, 'media'],
  ['Fazer compras juntos', '🛍️', 90, 'media'],
  ['Passear', '🌅', 60, 'facil'],
  ['Organizar viagem', '✈️', 60, 'media'],
  ['Tempo do casal', '❤️', 90, 'facil'],
  ['Fazer supermercado juntos', '🛒', 90, 'media'],
  ['Preparar jantar juntos', '🍝', 60, 'media'],
  ['Noite de jogos', '🎲', 90, 'facil'],
  ['Piquenique', '🧺', 120, 'media'],
  ['Sessão de fotos', '📸', 45, 'facil'],
  ['Dançar juntos', '💃', 30, 'facil'],
  ['Café da manhã na cama', '🥐', 40, 'facil'],
  ['Maratona de série', '📺', 150, 'facil'],
  ['Conversa da semana', '💬', 30, 'facil'],
  ['Cozinhar receita nova', '👨‍🍳', 75, 'media'],
  ['Passeio de bicicleta', '🚲', 60, 'media'],
];

const PESSOAL: Row[] = [
  ['Escovar os dentes', '🪥', 5, 'facil'],
  ['Tomar banho', '🚿', 15, 'facil'],
  ['Beber água', '💧', 5, 'facil'],
  ['Tomar vitaminas', '💊', 5, 'facil'],
  ['Ler livro', '📖', 30, 'facil'],
  ['Dormir cedo', '🌙', 10, 'media'],
  ['Meditar', '🧘', 15, 'media'],
  ['Escrever diário', '📓', 15, 'facil'],
  ['Skincare', '🧴', 15, 'facil'],
  ['Cortar cabelo', '💇', 60, 'media'],
  ['Fazer as unhas', '💅', 45, 'facil'],
  ['Ligar para a família', '📞', 20, 'facil'],
  ['Organizar fotos do celular', '🖼️', 30, 'facil'],
  ['Responder mensagens', '💬', 15, 'facil'],
  ['Planejar a semana', '🗓️', 20, 'media'],
  ['Hobby favorito', '🎨', 60, 'facil'],
  ['Ouvir podcast', '🎧', 40, 'facil'],
  ['Praticar gratidão', '🙏', 10, 'facil'],
];

const SAUDE: Row[] = [
  ['Fazer exercício', '🏋️', 45, 'dificil'],
  ['Caminhar', '🚶', 30, 'facil'],
  ['Correr', '🏃', 40, 'dificil'],
  ['Academia', '💪', 75, 'dificil'],
  ['Yoga', '🧘', 45, 'media'],
  ['Alongamento', '🤸', 15, 'facil'],
  ['Consulta médica', '🩺', 60, 'media'],
  ['Consulta dentária', '🦷', 60, 'media'],
  ['Pesar-se', '⚖️', 5, 'facil'],
  ['Preparar marmita saudável', '🥗', 45, 'media'],
  ['Dormir 8 horas', '😴', 10, 'media'],
  ['Tomar sol 15 min', '☀️', 15, 'facil'],
  ['Natação', '🏊', 60, 'dificil'],
  ['Pedalar', '🚴', 45, 'media'],
  ['Subir escadas', '🪜', 10, 'facil'],
  ['Sessão de fisioterapia', '🦵', 50, 'media'],
  ['Exame de rotina', '🧪', 45, 'media'],
  ['Dia sem açúcar', '🍬', 10, 'dificil'],
];

const COZINHA: Row[] = [
  ['Fazer café da manhã', '☕', 30, 'facil'],
  ['Fazer almoço', '🥗', 60, 'media'],
  ['Fazer jantar', '🍲', 60, 'media'],
  ['Lavar louça', '🍽️', 30, 'facil'],
  ['Limpar cozinha', '🍳', 45, 'media'],
  ['Limpar fogão', '🔥', 25, 'media'],
  ['Guardar louça', '🥣', 10, 'facil'],
  ['Organizar geladeira', '🧊', 30, 'media'],
  ['Preparar lanche', '🥪', 15, 'facil'],
  ['Assar pão', '🍞', 90, 'dificil'],
  ['Fazer sobremesa', '🍰', 60, 'media'],
  ['Preparar marmitas da semana', '🍱', 120, 'dificil'],
  ['Afiar facas', '🔪', 15, 'facil'],
  ['Limpar bancada', '🧽', 10, 'facil'],
  ['Descongelar carne', '🥩', 5, 'facil'],
  ['Fazer suco natural', '🧃', 15, 'facil'],
  ['Testar receita nova', '📖', 75, 'media'],
  ['Limpar exaustor', '💨', 30, 'dificil'],
];

const LAVANDARIA: Row[] = [
  ['Lavar roupa', '🧺', 60, 'media'],
  ['Estender roupa', '🌬️', 15, 'facil'],
  ['Recolher roupa', '👖', 10, 'facil'],
  ['Dobrar roupa', '👕', 25, 'facil'],
  ['Passar roupa', '🔥', 40, 'media'],
  ['Guardar roupa', '🚪', 15, 'facil'],
  ['Lavar roupa de cama', '🛏️', 60, 'media'],
  ['Lavar toalhas', '🧻', 45, 'facil'],
  ['Lavar cortinas', '🪟', 75, 'dificil'],
  ['Lavar tênis', '👟', 30, 'media'],
  ['Separar roupa por cor', '🎨', 10, 'facil'],
  ['Costurar/remendar peça', '🪡', 30, 'media'],
  ['Lavar tapetes', '🧶', 60, 'dificil'],
  ['Limpar máquina de lavar', '🌀', 30, 'media'],
  ['Doar roupas antigas', '📦', 45, 'media'],
  ['Tirar manchas', '🧴', 20, 'media'],
];

const TRABALHO: Row[] = [
  ['Trabalhar', '💼', 240, 'dificil'],
  ['Responder e-mails', '📧', 30, 'facil'],
  ['Reunião de equipe', '👥', 60, 'media'],
  ['Planejar o dia', '📝', 15, 'facil'],
  ['Revisar metas da semana', '🎯', 20, 'media'],
  ['Organizar mesa de trabalho', '🖥️', 15, 'facil'],
  ['Atualizar currículo', '📄', 45, 'media'],
  ['Networking', '🤝', 30, 'media'],
  ['Curso profissional', '🎓', 60, 'media'],
  ['Backup dos arquivos', '💾', 20, 'facil'],
  ['Relatório semanal', '📊', 45, 'media'],
  ['Bloco de foco profundo', '🧠', 90, 'dificil'],
  ['Preparar apresentação', '📽️', 75, 'dificil'],
  ['Revisar finanças do negócio', '💹', 40, 'media'],
  ['Inbox zero', '📥', 30, 'media'],
  ['Feedback 1:1', '🗣️', 30, 'media'],
];

const ESTUDOS: Row[] = [
  ['Estudar', '📚', 60, 'media'],
  ['Fazer curso online', '💻', 60, 'media'],
  ['Praticar idioma', '🗣️', 30, 'media'],
  ['Ler artigo técnico', '📰', 25, 'facil'],
  ['Fazer exercícios', '✏️', 45, 'media'],
  ['Revisar anotações', '🗒️', 20, 'facil'],
  ['Assistir aula', '🎥', 60, 'facil'],
  ['Fazer resumo', '📋', 30, 'media'],
  ['Flashcards', '🃏', 15, 'facil'],
  ['Simulado', '⏱️', 90, 'dificil'],
  ['Ler 20 páginas', '📖', 30, 'facil'],
  ['Praticar instrumento', '🎸', 40, 'media'],
  ['Escrever redação', '🖊️', 50, 'dificil'],
  ['Pesquisar tema novo', '🔍', 30, 'facil'],
  ['Organizar material de estudo', '🗂️', 20, 'facil'],
  ['Aula de idioma', '🌍', 60, 'media'],
];

const FINANCAS: Row[] = [
  ['Pagar contas', '🧾', 20, 'media'],
  ['Revisar orçamento do mês', '📊', 30, 'media', 'compartilhada'],
  ['Registrar gastos', '🖊️', 10, 'facil'],
  ['Conferir extrato', '🏦', 15, 'facil'],
  ['Planejar investimentos', '📈', 45, 'dificil', 'compartilhada'],
  ['Separar dinheiro da poupança', '🐷', 10, 'facil'],
  ['Renegociar assinatura', '📱', 30, 'media'],
  ['Comparar preços', '🔍', 25, 'facil'],
  ['Declarar impostos', '🏛️', 90, 'dificil'],
  ['Revisar seguros', '🛡️', 40, 'media'],
  ['Meta de economia do mês', '🎯', 15, 'media', 'compartilhada'],
  ['Organizar notas fiscais', '🗃️', 25, 'facil'],
  ['Planejar compras grandes', '🛋️', 30, 'media', 'compartilhada'],
  ['Cancelar serviços sem uso', '✂️', 20, 'facil'],
  ['Fundo de emergência', '🚨', 15, 'media', 'compartilhada'],
  ['Revisar faturas do cartão', '💳', 20, 'media'],
];

const CARRO: Row[] = [
  ['Abastecer', '⛽', 15, 'facil'],
  ['Lavar carro', '🚿', 60, 'media'],
  ['Aspirar interior', '🌀', 30, 'media'],
  ['Calibrar pneus', '🛞', 15, 'facil'],
  ['Verificar óleo', '🛢️', 10, 'facil'],
  ['Revisão periódica', '🔧', 120, 'dificil'],
  ['Trocar palhetas', '🌧️', 15, 'facil'],
  ['Renovar documento', '📄', 45, 'media'],
  ['Pagar seguro do carro', '🛡️', 15, 'facil'],
  ['Organizar porta-luvas', '🗂️', 10, 'facil'],
  ['Verificar água do radiador', '💧', 10, 'facil'],
  ['Rodízio de pneus', '🔄', 60, 'media'],
  ['Polir carroceria', '✨', 90, 'dificil'],
  ['Trocar lâmpada queimada', '💡', 20, 'media'],
  ['Higienizar ar-condicionado', '❄️', 40, 'media'],
  ['Estacionar na vaga do mês', '🅿️', 5, 'facil'],
];

const PETS: Row[] = [
  ['Passear com cachorro', '🐶', 30, 'facil'],
  ['Alimentar pet', '🍖', 10, 'facil'],
  ['Trocar água do pet', '💧', 5, 'facil'],
  ['Dar banho no pet', '🛁', 45, 'media'],
  ['Escovar pelos', '🪮', 15, 'facil'],
  ['Limpar caixa de areia', '🐱', 10, 'facil'],
  ['Consulta veterinária', '🩺', 60, 'media'],
  ['Vacinar pet', '💉', 45, 'media'],
  ['Comprar ração', '🛒', 30, 'facil'],
  ['Brincar com o pet', '🎾', 20, 'facil'],
  ['Cortar unhas do pet', '✂️', 15, 'media'],
  ['Antipulgas', '🦟', 10, 'facil'],
  ['Lavar caminha do pet', '🧺', 30, 'media'],
  ['Adestramento', '🎓', 30, 'media'],
  ['Limpar aquário', '🐠', 45, 'dificil'],
  ['Passeio no parque', '🌳', 45, 'facil'],
];

const JARDIM: Row[] = [
  ['Regar plantas', '🪴', 10, 'facil'],
  ['Podar plantas', '✂️', 30, 'media'],
  ['Adubar', '🌾', 20, 'media'],
  ['Cortar grama', '🌿', 60, 'dificil'],
  ['Plantar mudas', '🌱', 45, 'media'],
  ['Tirar ervas daninhas', '🌾', 30, 'media'],
  ['Varrer folhas', '🍂', 20, 'facil'],
  ['Limpar vasos', '🏺', 25, 'facil'],
  ['Trocar terra dos vasos', '🪨', 40, 'media'],
  ['Montar horta de temperos', '🌶️', 60, 'dificil'],
  ['Colher hortaliças', '🥬', 15, 'facil'],
  ['Pulverizar contra pragas', '🐛', 20, 'media'],
  ['Organizar ferramentas', '🧰', 20, 'facil'],
  ['Regar jardim externo', '💦', 20, 'facil'],
  ['Decorar varanda', '🪻', 45, 'media'],
  ['Compostagem', '♻️', 15, 'media'],
];

const COMPRAS: Row[] = [
  ['Mercado', '🛒', 90, 'dificil'],
  ['Feira', '🍎', 60, 'media'],
  ['Padaria', '🥖', 20, 'facil'],
  ['Farmácia', '💊', 25, 'facil'],
  ['Comprar produtos de limpeza', '🧴', 30, 'facil'],
  ['Lista de compras da semana', '📝', 15, 'facil', 'compartilhada'],
  ['Comprar presente', '🎁', 45, 'media'],
  ['Açougue', '🥩', 25, 'facil'],
  ['Comprar itens da casa', '🏠', 40, 'media'],
  ['Papelaria', '✏️', 20, 'facil'],
  ['Pet shop', '🐾', 30, 'facil'],
  ['Comprar roupas', '👗', 60, 'media'],
  ['Retirar encomenda', '📦', 20, 'facil'],
  ['Devolver produto', '↩️', 30, 'media'],
  ['Pesquisar promoções', '🏷️', 20, 'facil'],
  ['Comprar material de estudo', '📚', 25, 'facil'],
];

const PRODUTIVIDADE: Row[] = [
  ['Planejar o dia', '🗓️', 10, 'facil'],
  ['Revisão semanal', '🔁', 30, 'media', 'compartilhada'],
  ['Definir 3 prioridades', '🎯', 5, 'facil'],
  ['Pomodoro de 25 min', '🍅', 25, 'facil'],
  ['Bloco sem celular', '📵', 60, 'dificil'],
  ['Inbox zero pessoal', '📥', 20, 'media'],
  ['Organizar agenda', '📆', 15, 'facil'],
  ['Limpar downloads', '🗑️', 15, 'facil'],
  ['Backup do celular', '☁️', 20, 'facil'],
  ['Desinscrever newsletters', '✉️', 15, 'facil'],
  ['Revisar metas do casal', '💑', 30, 'media', 'compartilhada'],
  ['Ler resumo de livro', '📖', 20, 'facil'],
  ['Journaling de produtividade', '📔', 15, 'facil'],
  ['Automatizar uma rotina', '🤖', 45, 'dificil'],
  ['Arquivar documentos digitais', '🗂️', 25, 'media'],
  ['Detox de redes sociais', '🌿', 30, 'dificil'],
];

/** Biblioteca completa (250+ tarefas). */
export const LIBRARY: LibraryTask[] = [
  ...build('casa', 'casa', CASA),
  ...build('casal', 'compartilhada', CASAL),
  ...build('pessoal', 'individual', PESSOAL),
  ...build('saude', 'individual', SAUDE),
  ...build('cozinha', 'casa', COZINHA),
  ...build('lavandaria', 'casa', LAVANDARIA),
  ...build('trabalho', 'individual', TRABALHO),
  ...build('estudos', 'individual', ESTUDOS),
  ...build('financas', 'individual', FINANCAS),
  ...build('carro', 'casa', CARRO),
  ...build('pets', 'casa', PETS),
  ...build('jardim', 'casa', JARDIM),
  ...build('compras', 'casa', COMPRAS),
  ...build('produtividade', 'individual', PRODUTIVIDADE),
];
