import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/types';
import { colors, fonts, spacing, radius } from '../../tokens';
import { useOnboardingStore } from '../../stores/onboardingStore';
import Button from '../../components/Button';
import ProgressBar from './ProgressBar';

type Nav = StackNavigationProp<AuthStackParamList, 'ContratoDigital'>;

const CONTRATO = `CONTRATO DE PRESTA\u00c7\u00c3O DE SERVI\u00c7OS \u2014 ACADEMIA BONY FIT

CL\u00c1USULA 1 \u2014 DO OBJETO
O presente contrato tem por objeto a presta\u00e7\u00e3o de servi\u00e7os de atividade f\u00edsica e uso das instala\u00e7\u00f5es da academia BONY FIT, doravante denominada CONTRATADA, ao aluno, doravante denominado CONTRATANTE, nos termos e condi\u00e7\u00f5es aqui estabelecidos.

CL\u00c1USULA 2 \u2014 DO PLANO E VIG\u00caNCIA
O CONTRATANTE poder\u00e1 optar por planos mensal, trimestral, semestral ou anual, com vig\u00eancia a partir da data de ativa\u00e7\u00e3o do acesso. A renova\u00e7\u00e3o ser\u00e1 autom\u00e1tica, salvo manifesta\u00e7\u00e3o contr\u00e1ria com anteced\u00eancia m\u00ednima de 30 dias.

CL\u00c1USULA 3 \u2014 DA COBRAN\u00c7A E PAGAMENTO
Os valores ser\u00e3o cobrados conforme o plano escolhido, via PIX, cart\u00e3o de cr\u00e9dito ou boleto banc\u00e1rio. O atraso no pagamento superior a 15 dias acarretar\u00e1 a suspens\u00e3o do acesso \u00e0s instala\u00e7\u00f5es at\u00e9 a regulariza\u00e7\u00e3o do d\u00e9bito. Multa de 2% e juros de 1% ao m\u00eas incidir\u00e3o sobre valores em atraso.

CL\u00c1USULA 4 \u2014 DO ACESSO \u00c0S INSTALA\u00c7\u00d5ES
O acesso ser\u00e1 realizado mediante identifica\u00e7\u00e3o na catraca eletr\u00f4nica. O CONTRATANTE compromete-se a n\u00e3o compartilhar seu acesso com terceiros. Tentativas de acesso indevido poder\u00e3o resultar em cancelamento do contrato sem reembolso.

CL\u00c1USULA 5 \u2014 DAS OBRIGA\u00c7\u00d5ES DO CONTRATANTE
O CONTRATANTE se obriga a: (a) utilizar trajes e cal\u00e7ados adequados; (b) respeitar os hor\u00e1rios de funcionamento; (c) zelar pela conserva\u00e7\u00e3o dos equipamentos; (d) respeitar os demais alunos e profissionais; (e) seguir as orienta\u00e7\u00f5es dos instrutores e normas internas da academia.

CL\u00c1USULA 6 \u2014 DA SA\u00daDE E RESPONSABILIDADE
O CONTRATANTE declara estar ciente de que a pr\u00e1tica de atividade f\u00edsica envolve riscos. A CONTRATADA recomenda avalia\u00e7\u00e3o m\u00e9dica pr\u00e9via. Em caso de mal-estar durante a pr\u00e1tica, o CONTRATANTE deve comunicar imediatamente o instrutor. A CONTRATADA n\u00e3o se responsabiliza por les\u00f5es decorrentes do uso inadequado de equipamentos ou descumprimento das orienta\u00e7\u00f5es dos profissionais.

CL\u00c1USULA 7 \u2014 DO PROGRAMA DE GAMIFICA\u00c7\u00c3O
A CONTRATADA disponibiliza sistema de gamifica\u00e7\u00e3o com pontua\u00e7\u00e3o por presen\u00e7a, ranking e recompensas. Os pontos n\u00e3o possuem valor monet\u00e1rio e est\u00e3o sujeitos \u00e0s regras do programa, que podem ser alteradas a qualquer tempo mediante aviso pr\u00e9vio de 15 dias.

CL\u00c1USULA 8 \u2014 DAS OBRIGA\u00c7\u00d5ES DA CONTRATADA
A CONTRATADA se obriga a: (a) manter as instala\u00e7\u00f5es em condi\u00e7\u00f5es adequadas de uso; (b) disponibilizar profissionais qualificados; (c) oferecer suporte t\u00e9cnico pelo aplicativo; (d) garantir a seguran\u00e7a dos dados pessoais do CONTRATANTE.

CL\u00c1USULA 9 \u2014 DO CANCELAMENTO
O cancelamento poder\u00e1 ser solicitado a qualquer tempo, respeitada a fidelidade do plano. No caso de cancelamento antecipado de planos com fidelidade, ser\u00e1 cobrada multa proporcional ao per\u00edodo restante, limitada a 30% do valor total. O pedido de cancelamento deve ser feito com 30 dias de anteced\u00eancia.

CL\u00c1USULA 10 \u2014 DA SUSPENS\u00c3O TEMPOR\u00c1RIA
O CONTRATANTE poder\u00e1 solicitar suspens\u00e3o tempor\u00e1ria (trancamento) por per\u00edodo m\u00ednimo de 15 e m\u00e1ximo de 90 dias, mediante apresenta\u00e7\u00e3o de justificativa. O per\u00edodo de suspens\u00e3o ser\u00e1 adicionado ao final da vig\u00eancia do contrato.

CL\u00c1USULA 11 \u2014 DA PROTE\u00c7\u00c3O DE DADOS (LGPD)
Em conformidade com a Lei Geral de Prote\u00e7\u00e3o de Dados (Lei 13.709/2018), a CONTRATADA informa que os dados pessoais coletados ser\u00e3o utilizados exclusivamente para: (a) gest\u00e3o do contrato; (b) controle de acesso; (c) comunica\u00e7\u00f5es sobre o servi\u00e7o; (d) funcionamento do sistema de gamifica\u00e7\u00e3o. Os dados n\u00e3o ser\u00e3o compartilhados com terceiros sem consentimento expresso, exceto quando exigido por lei.

CL\u00c1USULA 12 \u2014 DA PROPRIEDADE INTELECTUAL
Todo o conte\u00fado do aplicativo BONY FIT, incluindo marca, logotipo, design, c\u00f3digo e funcionalidades, s\u00e3o de propriedade exclusiva da CONTRATADA, protegidos pela legisla\u00e7\u00e3o de direitos autorais e propriedade industrial.

CL\u00c1USULA 13 \u2014 DAS DISPOSI\u00c7\u00d5ES GERAIS
Eventuais altera\u00e7\u00f5es neste contrato ser\u00e3o comunicadas com anteced\u00eancia m\u00ednima de 30 dias atrav\u00e9s do aplicativo. O CONTRATANTE que n\u00e3o concordar com as altera\u00e7\u00f5es poder\u00e1 cancelar o contrato sem multa.

CL\u00c1USULA 14 \u2014 DO FORO
Fica eleito o foro da comarca da cidade sede da unidade onde o CONTRATANTE est\u00e1 matriculado para dirimir quaisquer d\u00favidas ou lit\u00edgios decorrentes deste contrato.

CL\u00c1USULA 15 \u2014 DA ACEITA\u00c7\u00c3O DIGITAL
A aceita\u00e7\u00e3o deste contrato de forma digital tem a mesma validade jur\u00eddica de um contrato f\u00edsico, conforme o Marco Civil da Internet (Lei 12.965/2014) e a Medida Provis\u00f3ria 2.200-2/2001. A assinatura digital registrada no aplicativo servir\u00e1 como prova de anu\u00eancia do CONTRATANTE.

Data de gera\u00e7\u00e3o: ${new Date().toLocaleDateString('pt-BR')}
Vers\u00e3o do contrato: v1.0`;

export default function ContratoDigitalScreen() {
  const navigation = useNavigation<Nav>();
  const { scrolledToEnd, setScrolledToEnd, aceitouTermos, setAceitouTermos } =
    useOnboardingStore();
  const [showScrollHint, setShowScrollHint] = useState(!scrolledToEnd);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    const isBottom =
      layoutMeasurement.height + contentOffset.y >= contentSize.height - 40;
    if (isBottom && !scrolledToEnd) {
      setScrolledToEnd(true);
      setShowScrollHint(false);
    }
  };

  const toggleTerms = () => {
    if (scrolledToEnd) {
      setAceitouTermos(!aceitouTermos);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ProgressBar step={3} total={6} />
      <View style={styles.wrapper}>
        <Text style={styles.title}>Contrato Digital</Text>

        {showScrollHint && (
          <View style={styles.hintCard}>
            <Text style={styles.hintText}>
              Role at\u00e9 o final para continuar
            </Text>
          </View>
        )}

        <ScrollView
          style={styles.contractScroll}
          contentContainerStyle={styles.contractContent}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          <Text style={styles.contractText}>{CONTRATO}</Text>
        </ScrollView>

        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={toggleTerms}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.checkbox,
              aceitouTermos && styles.checkboxChecked,
              !scrolledToEnd && styles.checkboxDisabled,
            ]}
          >
            {aceitouTermos && <Text style={styles.checkmark}>{'\u2713'}</Text>}
          </View>
          <Text
            style={[
              styles.checkboxLabel,
              !scrolledToEnd && { color: colors.textMuted },
            ]}
          >
            Li e concordo com os termos do contrato
          </Text>
        </TouchableOpacity>

        <View style={styles.buttons}>
          <Button
            title="Continuar"
            onPress={() => navigation.navigate('AssinaturaDigital')}
            disabled={!aceitouTermos}
          />
          <Button
            title="Voltar"
            variant="outline"
            onPress={() => navigation.goBack()}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  wrapper: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingBottom: 32,
    gap: 16,
  },
  title: {
    fontFamily: fonts.numbersExtraBold,
    fontSize: 24,
    color: colors.text,
  },
  hintCard: {
    backgroundColor: colors.orange,
    borderRadius: radius.sm,
    paddingVertical: 10,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  hintText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.text,
  },
  contractScroll: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.elevated,
  },
  contractContent: {
    padding: spacing.lg,
  },
  contractText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.orange,
    borderColor: colors.orange,
  },
  checkboxDisabled: {
    opacity: 0.4,
  },
  checkmark: {
    color: colors.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  buttons: {
    gap: 12,
  },
});
