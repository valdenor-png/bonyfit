import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { colors, fonts, spacing, radius } from '../tokens';
import Button from '../components/Button';

// ─── TYPES ──────────────────────────────────────────────
interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSection {
  title: string;
  items: FAQItem[];
}

// ─── MOCK DATA ──────────────────────────────────────────
const FAQ_SECTIONS: FAQSection[] = [
  {
    title: 'Planos e Pagamentos',
    items: [
      {
        question: 'Quais planos estão disponíveis?',
        answer:
          'Oferecemos planos mensais, trimestrais, semestrais e anuais. Cada plano inclui acesso completo à academia, aulas em grupo e app Bony Fit. Planos mais longos possuem descontos progressivos.',
      },
      {
        question: 'Como faço para mudar meu plano?',
        answer:
          'Você pode alterar seu plano diretamente pelo app, na seção Perfil > Meu Plano, ou presencialmente na recepção. A mudança entra em vigor no próximo ciclo de cobrança.',
      },
      {
        question: 'Quais formas de pagamento são aceitas?',
        answer:
          'Aceitamos cartão de crédito (Visa, Mastercard, Elo), PIX, boleto bancário e débito automático. O pagamento recorrente no cartão garante renovação automática sem risco de perda de acesso.',
      },
      {
        question: 'Como cancelar minha assinatura?',
        answer:
          'O cancelamento pode ser feito pelo app em Perfil > Meu Plano > Cancelar, ou presencialmente. Há fidelidade mínima de acordo com o plano contratado. Após o cancelamento, o acesso permanece até o final do período pago.',
      },
    ],
  },
  {
    title: 'Treinos',
    items: [
      {
        question: 'Como recebo minha ficha de treino?',
        answer:
          'Sua ficha de treino é montada pelo professor da academia e fica disponível automaticamente no app, na aba Treino. A ficha é atualizada a cada 4-6 semanas conforme sua evolução.',
      },
      {
        question: 'Posso treinar sem professor?',
        answer:
          'Sim, desde que você tenha uma ficha de treino ativa no app. O app guia você por cada exercício com vídeos demonstrativos, séries, repetições e tempo de descanso. Porém, recomendamos acompanhamento profissional para iniciantes.',
      },
      {
        question: 'Como funciona o treino com personal trainer?',
        answer:
          'Você pode contratar sessões avulsas ou pacotes com nossos personal trainers diretamente pelo app, na seção Personal. Cada sessão dura 60 minutos e é totalmente personalizada.',
      },
    ],
  },
  {
    title: 'Conta e Acesso',
    items: [
      {
        question: 'Esqueci minha senha, o que faço?',
        answer:
          'Na tela de login, toque em "Esqueci minha senha". Você receberá um link de redefinição por e-mail. Se não receber em 5 minutos, verifique a pasta de spam ou entre em contato com o suporte.',
      },
      {
        question: 'Como altero meus dados cadastrais?',
        answer:
          'Acesse Perfil > Editar perfil para alterar nome, foto, e-mail e telefone. Para alterar CPF ou data de nascimento, entre em contato com o suporte via WhatsApp.',
      },
      {
        question: 'Posso usar o app em mais de um dispositivo?',
        answer:
          'Sim, sua conta pode ser acessada em até 2 dispositivos simultaneamente. Basta fazer login com seu e-mail e senha em cada aparelho.',
      },
    ],
  },
  {
    title: 'Catraca e Check-in',
    items: [
      {
        question: 'Como faço check-in na academia?',
        answer:
          'Ao chegar na academia, abra o app e toque em "Check-in" na tela inicial. Um QR Code será gerado para liberação da catraca. Você também pode usar a biometria cadastrada na recepção.',
      },
      {
        question: 'A catraca não liberou, o que faço?',
        answer:
          'Verifique se seu plano está ativo e se o check-in foi realizado corretamente. Caso o problema persista, procure a recepção para liberação manual e reporte o problema pelo app.',
      },
      {
        question: 'Posso entrar com acompanhante?',
        answer:
          'Convidados podem fazer um day pass avulso na recepção. Algumas promoções incluem passes para convidados. Confira a seção Recompensas para verificar se há day passes disponíveis.',
      },
    ],
  },
];

// ─── COMPONENT ──────────────────────────────────────────
export default function SuporteScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');

  const toggleSection = (title: string) => {
    setExpandedSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const toggleQuestion = (key: string) => {
    setExpandedQuestions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSendMessage = () => {
    // Placeholder: would send message to backend
    setContactName('');
    setContactSubject('');
    setContactMessage('');
    setContactModalVisible(false);
  };

  // Filter FAQ by search
  const filteredSections = searchQuery
    ? FAQ_SECTIONS.map((section) => ({
        ...section,
        items: section.items.filter(
          (item) =>
            item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.answer.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      })).filter((section) => section.items.length > 0)
    : FAQ_SECTIONS;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Text style={styles.header}>Ajuda e Suporte</Text>

        {/* Search */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar ajuda..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* FAQ Sections */}
        {filteredSections.map((section) => {
          const isSectionOpen = expandedSections[section.title] !== false; // default open
          return (
            <View key={section.title} style={styles.faqSection}>
              <TouchableOpacity
                style={styles.sectionHeader}
                onPress={() => toggleSection(section.title)}
              >
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <Text style={styles.sectionChevron}>
                  {isSectionOpen ? '−' : '+'}
                </Text>
              </TouchableOpacity>

              {isSectionOpen &&
                section.items.map((item, idx) => {
                  const qKey = `${section.title}-${idx}`;
                  const isOpen = expandedQuestions[qKey];
                  return (
                    <TouchableOpacity
                      key={qKey}
                      style={styles.faqItem}
                      onPress={() => toggleQuestion(qKey)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.questionRow}>
                        <Text style={styles.questionText}>{item.question}</Text>
                        <Text style={styles.questionChevron}>
                          {isOpen ? '−' : '+'}
                        </Text>
                      </View>
                      {isOpen && (
                        <Text style={styles.answerText}>{item.answer}</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
            </View>
          );
        })}

        {/* Contact section */}
        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>Precisa de mais ajuda?</Text>

          <View style={styles.contactRow}>
            <Text style={styles.contactIcon}>E-mail:</Text>
            <Text style={styles.contactValue}>suporte@bonyfit.com.br</Text>
          </View>
          <View style={styles.contactRow}>
            <Text style={styles.contactIcon}>WhatsApp:</Text>
            <Text style={styles.contactValue}>(91) 98765-4321</Text>
          </View>

          <View style={{ marginTop: spacing.lg }}>
            <Button
              title="Enviar mensagem"
              onPress={() => setContactModalVisible(true)}
            />
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Contact Form Modal */}
      <Modal
        visible={contactModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setContactModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Enviar mensagem</Text>
              <TouchableOpacity onPress={() => setContactModalVisible(false)}>
                <Text style={styles.modalClose}>X</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.formInput}
              placeholder="Seu nome"
              placeholderTextColor={colors.textMuted}
              value={contactName}
              onChangeText={setContactName}
            />
            <TextInput
              style={styles.formInput}
              placeholder="Assunto"
              placeholderTextColor={colors.textMuted}
              value={contactSubject}
              onChangeText={setContactSubject}
            />
            <TextInput
              style={[styles.formInput, styles.formTextArea]}
              placeholder="Sua mensagem..."
              placeholderTextColor={colors.textMuted}
              value={contactMessage}
              onChangeText={setContactMessage}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />

            <View style={{ marginTop: spacing.md }}>
              <Button title="Enviar" onPress={handleSendMessage} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── STYLES ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    fontFamily: fonts.bodyBold,
    fontSize: 24,
    color: colors.text,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },

  // Search
  searchContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  searchInput: {
    backgroundColor: colors.card,
    borderRadius: radius.sm,
    padding: spacing.md,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.text,
  },

  // FAQ Sections
  faqSection: {
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  sectionTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.text,
  },
  sectionChevron: {
    fontFamily: fonts.bodyBold,
    fontSize: 20,
    color: colors.orange,
  },
  faqItem: {
    backgroundColor: colors.elevated,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginTop: spacing.sm,
    marginLeft: spacing.sm,
  },
  questionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  questionText: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  questionChevron: {
    fontFamily: fonts.bodyBold,
    fontSize: 18,
    color: colors.orange,
  },
  answerText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginTop: spacing.sm,
  },

  // Contact
  contactSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    borderTopWidth: 0.5,
    borderTopColor: colors.elevated,
    marginTop: spacing.md,
  },
  contactTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 18,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  contactIcon: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.textSecondary,
    marginRight: spacing.sm,
  },
  contactValue: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.text,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 20,
    color: colors.text,
  },
  modalClose: {
    fontFamily: fonts.bodyBold,
    fontSize: 18,
    color: colors.textMuted,
    padding: spacing.sm,
  },
  formInput: {
    backgroundColor: colors.card,
    borderRadius: radius.sm,
    padding: spacing.md,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.text,
    marginBottom: spacing.md,
  },
  formTextArea: {
    height: 120,
  },
});
