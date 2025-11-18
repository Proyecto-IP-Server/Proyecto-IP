import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Pressable, Modal } from 'react-native';
import { Image } from 'expo-image';
import * as Clipboard from 'expo-clipboard';
import BlurModal from '@/components/BlurModal';

const { width } = Dimensions.get('window');
const isMobile = width < 768;

/**
 * Sidebar que muestra la lista de materias del horario generado
 * Incluye detalles como NRC, profesor, horarios, aula, etc.
 */
export default function GeneratedScheduleSidebar({ horariosGenerados, horarioActual, onSelectHorario, onClose }) {
  const [selectedMateria, setSelectedMateria] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  // Obtener las materias del horario actual
  const materias = horarioActual?.materias || [];
  
  const colorsPalette = [
    '#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF',
    '#FFB3E6', '#E6B3FF', '#FFD6BA', '#C9FFE5', '#B3D9FF'
  ];

  const showToast = (message) => {
    setToastMessage(message);
    setToastVisible(true);
    setTimeout(() => {
      setToastVisible(false);
    }, 2000);
  };

  const copyToClipboard = async (text) => {
    try {
      await Clipboard.setStringAsync(text);
      showToast('Copiado');
    } catch (_error) {
      showToast('Error al copiar');
    }
  };

  const copyAllNRCs = async () => {
    const nrcs = materias.map(m => m.nrc).join(', ');
    await copyToClipboard(nrcs, 'Todos los NRCs');
  };

  const openDetails = (materia, index) => {
    setSelectedMateria({ ...materia, colorIndex: index });
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      {/* ============== SECCIÓN SUPERIOR: SELECTOR DE HORARIOS (50%) ============== */}
      <View style={styles.selectorSection}>
        <View style={styles.selectorHeader}>
          <Text style={styles.selectorHeaderTitle}>Combinaciones Generadas</Text>
          <Text style={styles.selectorHeaderSubtitle}>
            {horariosGenerados.length} {horariosGenerados.length === 1 ? 'opción disponible' : 'opciones disponibles'}
          </Text>
        </View>
        
        <ScrollView style={styles.selectorScrollView} showsVerticalScrollIndicator={true}>
          {horariosGenerados.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Generando horarios...</Text>
              <Text style={styles.emptySubtext}>Por favor espera</Text>
            </View>
          ) : (
            horariosGenerados.map((horario, index) => (
              <Pressable
                key={horario.id || index}
                style={[
                  styles.horarioOption,
                  horarioActual?.id === horario.id && styles.horarioOptionSelected
                ]}
                onPress={() => onSelectHorario(horario)}
              >
                <View style={styles.horarioOptionNumber}>
                  <Text style={[
                    styles.horarioOptionNumberText,
                    horarioActual?.id === horario.id && styles.horarioOptionNumberTextSelected
                  ]}>
                    {index + 1}
                  </Text>
                </View>
                <View style={styles.horarioOptionInfo}>
                  <Text style={[
                    styles.horarioOptionTitle,
                    horarioActual?.id === horario.id && styles.horarioOptionTitleSelected
                  ]}>
                    Horario #{index + 1}
                  </Text>
                  <Text style={styles.horarioOptionDetails}>
                    {horario.materias?.length || 0} materias
                  </Text>
                </View>
                {horarioActual?.id === horario.id && (
                  <View style={styles.selectedIndicator}>
                    <Image 
                      source={require('@/assets/images/check.svg')}
                      style={styles.selectedIndicatorIcon}
                      contentFit="contain"
                    />
                  </View>
                )}
              </Pressable>
            ))
          )}
        </ScrollView>
      </View>

      {/* ============== DIVISOR ============== */}
      <View style={styles.divider} />

      {/* ============== SECCIÓN INFERIOR: MATERIAS DEL HORARIO (50%) ============== */}
      <View style={styles.materiasSection}>
        <View style={styles.materiasHeader}>
          <Text style={styles.materiasHeaderTitle}>
            Materias ({materias.length})
          </Text>
          {materias.length > 0 && (
            <Pressable style={styles.copyAllButton} onPress={copyAllNRCs}>
              <Text style={styles.copyAllButtonText}>Copiar NRCs</Text>
            </Pressable>
          )}
        </View>

        <ScrollView style={styles.materiasScrollView} showsVerticalScrollIndicator={true}>
        {materias.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No hay materias asignadas</Text>
            <Text style={styles.emptySubtext}>
              Esperando resultados del generador...
            </Text>
          </View>
        ) : (
          materias.map((materia, index) => (
            <Pressable
              key={`${materia.nrc}-${index}`}
              style={[
                styles.materiaCard,
                { borderLeftColor: colorsPalette[index % colorsPalette.length] }
              ]}
              onPress={() => openDetails(materia, index)}
            >
              {/* Código y nombre de la materia */}
              <View style={styles.materiaHeader}>
                <Text style={styles.materiaCodigo}>{materia.codigo}</Text>
                <Text style={styles.materiaNombre}>{materia.nombre}</Text>
              </View>

              {/* NRC */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>NRC:</Text>
                <Text style={styles.detailValue}>{materia.nrc}</Text>
              </View>

              {/* Profesor */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Profesor:</Text>
                <Text style={styles.detailValue}>{materia.profesor}</Text>
              </View>

              {/* Créditos */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Créditos:</Text>
                <Text style={styles.detailValue}>{materia.creditos}</Text>
              </View>

              {/* Horarios */}
              <View style={styles.horariosContainer}>
                <Text style={styles.detailLabel}>Horarios:</Text>
                {materia.horarios.map((horario, idx) => (
                  <View key={idx} style={styles.horarioItem}>
                    <Text style={styles.horarioText}>
                      {horario.dia}: {horario.horaInicio} - {horario.horaFin}
                    </Text>
                    {horario.aula && (
                      <Text style={styles.aulaText}>Aula: {horario.aula}</Text>
                    )}
                  </View>
                ))}
              </View>

              {/* Sección */}
              {materia.seccion && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Sección:</Text>
                  <Text style={styles.detailValue}>{materia.seccion}</Text>
                </View>
              )}

              {/* Indicador de color */}
              <View style={styles.colorIndicatorContainer}>
                <View
                  style={[
                    styles.colorIndicator,
                    { backgroundColor: colorsPalette[index % colorsPalette.length] }
                  ]}
                />
                <Text style={styles.colorText}>Toca para ver detalles</Text>
              </View>
            </Pressable>
          ))
        )}
        </ScrollView>
      </View>

      {/* Modal de detalles */}
      {selectedMateria && (
        <BlurModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          containerStyle={styles.modalContainer}
        >
          <View style={styles.modalInnerContent}>
            {/* Header del modal */}
            <View style={[
              styles.modalHeader,
              { backgroundColor: colorsPalette[selectedMateria.colorIndex % colorsPalette.length] }
            ]}>
              <Text style={styles.modalCodigo}>{selectedMateria.codigo}</Text>
              <Text style={styles.modalNombre} numberOfLines={2}>{selectedMateria.nombre}</Text>
            </View>

            {/* Contenido del modal */}
            <View style={styles.modalContent}>
              {/* Fila 1: NRC y Sección */}
              <View style={styles.modalRow}>
                <View style={styles.modalColumn}>
                  <Text style={styles.modalLabel}>NRC</Text>
                  <View style={styles.nrcContainer}>
                    <Text style={styles.modalValue}>{selectedMateria.nrc}</Text>
                    <Pressable
                      style={styles.copyButton}
                      onPress={() => copyToClipboard(selectedMateria.nrc)}
                    >
                      <Image 
                        source={require('@/assets/images/copy.svg')}
                        style={styles.copyIcon}
                        contentFit="contain"
                      />
                    </Pressable>
                  </View>
                </View>
                
                {selectedMateria.seccion && (
                  <View style={styles.modalColumn}>
                    <Text style={styles.modalLabel}>Sección</Text>
                    <Text style={styles.modalValue}>{selectedMateria.seccion}</Text>
                  </View>
                )}
                
                <View style={styles.modalColumn}>
                  <Text style={styles.modalLabel}>Créditos</Text>
                  <Text style={styles.modalValue}>{selectedMateria.creditos}</Text>
                </View>
              </View>

              {/* Profesor */}
              <View style={styles.modalFullRow}>
                <Text style={styles.modalLabel}>Profesor</Text>
                <Text style={styles.modalValue} numberOfLines={2}>{selectedMateria.profesor}</Text>
              </View>

              {/* Horarios */}
              <View style={styles.modalFullRow}>
                <Text style={styles.modalLabel}>Horarios</Text>
                <View style={styles.horariosGrid}>
                  {selectedMateria.horarios.map((horario, idx) => (
                    <View key={idx} style={styles.horarioCompactItem}>
                      <Text style={styles.horarioDia}>{horario.dia}</Text>
                      <Text style={styles.horarioHora}>
                        {horario.horaInicio} - {horario.horaFin}
                      </Text>
                      {horario.aula && (
                        <Text style={styles.horarioAula}>{horario.aula}</Text>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Botón de cerrar */}
            <Pressable
              style={styles.modalCloseButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cerrar</Text>
            </Pressable>
          </View>
        </BlurModal>
      )}

      {/* Toast flotante */}
      <Modal
        visible={toastVisible}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
      >
        <View style={styles.toastContainer} pointerEvents="none">
          <View style={styles.toast}>
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const PRIMARY_COLOR = '#007AFF';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7',
  },
  
  // ============== SECCIÓN SUPERIOR: SELECTOR DE HORARIOS ==============
  selectorSection: {
    flex: 1,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  selectorHeader: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  selectorHeaderTitle: {
    fontSize: isMobile ? 16 : 18,
    fontWeight: '700',
    color: '#1c1c1e',
    marginBottom: 4,
  },
  selectorHeaderSubtitle: {
    fontSize: isMobile ? 12 : 14,
    color: '#8e8e93',
    fontWeight: '500',
  },
  selectorScrollView: {
    flex: 1,
  },
  horarioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginVertical: 6,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  horarioOptionSelected: {
    backgroundColor: '#e8f4fd',
    borderColor: PRIMARY_COLOR,
    borderWidth: 2,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  horarioOptionNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f5f5f7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  horarioOptionNumberText: {
    fontSize: isMobile ? 14 : 16,
    fontWeight: '700',
    color: '#666',
  },
  horarioOptionNumberTextSelected: {
    color: PRIMARY_COLOR,
  },
  horarioOptionInfo: {
    flex: 1,
  },
  horarioOptionTitle: {
    fontSize: isMobile ? 14 : 16,
    fontWeight: '600',
    color: '#1c1c1e',
    marginBottom: 2,
  },
  horarioOptionTitleSelected: {
    color: PRIMARY_COLOR,
    fontWeight: '700',
  },
  horarioOptionDetails: {
    fontSize: isMobile ? 12 : 13,
    color: '#8e8e93',
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: PRIMARY_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  selectedIndicatorIcon: {
    width: 16,
    height: 16,
    tintColor: '#fff',
  },
  
  // ============== DIVISOR ==============
  divider: {
    height: 2,
    backgroundColor: '#e0e0e0',
  },
  
  // ============== SECCIÓN INFERIOR: MATERIAS ==============
  materiasSection: {
    flex: 1,
    backgroundColor: '#f5f5f7',
  },
  materiasHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  materiasHeaderTitle: {
    fontSize: isMobile ? 14 : 16,
    fontWeight: '700',
    color: '#1c1c1e',
  },
  copyAllButton: {
    backgroundColor: PRIMARY_COLOR,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  copyAllButtonText: {
    color: '#fff',
    fontSize: isMobile ? 11 : 13,
    fontWeight: '600',
  },
  materiasScrollView: {
    flex: 1,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: isMobile ? 14 : 16,
    fontWeight: '600',
    color: '#8e8e93',
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: isMobile ? 12 : 14,
    color: '#aeaeb2',
    textAlign: 'center',
  },
  
  // ============== TARJETAS DE MATERIAS (COMPACTAS) ==============
  materiaCard: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginVertical: 6,
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  materiaHeader: {
    marginBottom: 8,
  },
  materiaCodigo: {
    fontSize: isMobile ? 11 : 12,
    fontWeight: '700',
    color: PRIMARY_COLOR,
    marginBottom: 2,
  },
  materiaNombre: {
    fontSize: isMobile ? 13 : 14,
    fontWeight: '600',
    color: '#1c1c1e',
    marginBottom: 6,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 4,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: isMobile ? 11 : 12,
    fontWeight: '600',
    color: '#8e8e93',
    marginRight: 6,
  },
  detailValue: {
    fontSize: isMobile ? 11 : 12,
    color: '#1c1c1e',
    flex: 1,
  },
  horariosContainer: {
    marginTop: 6,
    marginBottom: 6,
  },
  horarioItem: {
    backgroundColor: '#f5f5f7',
    padding: 6,
    borderRadius: 6,
    marginTop: 3,
  },
  horarioText: {
    fontSize: isMobile ? 11 : 12,
    color: '#1c1c1e',
    fontWeight: '500',
  },
  aulaText: {
    fontSize: isMobile ? 10 : 11,
    color: '#8e8e93',
    marginTop: 2,
  },
  colorIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  colorIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  colorText: {
    fontSize: isMobile ? 10 : 11,
    color: '#8e8e93',
    fontStyle: 'italic',
  },
  // ============== ESTILOS DEL MODAL ==============
  modalContainer: {
    width: isMobile ? '92%' : '85%',
    maxWidth: 550,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  modalInnerContent: {
    // Sin flex: 1 para que el contenido determine la altura
  },
  modalHeader: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#f5f5f7',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalCodigo: {
    fontSize: isMobile ? 13 : 15,
    fontWeight: '700',
    color: PRIMARY_COLOR,
    marginBottom: 4,
  },
  modalNombre: {
    fontSize: isMobile ? 16 : 18,
    fontWeight: '700',
    color: '#1c1c1e',
    textAlign: 'center',
  },
  modalContent: {
    padding: 16,
  },
  modalRow: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 12,
  },
  modalColumn: {
    flex: 1,
  },
  modalFullRow: {
    marginBottom: 12,
  },
  modalLabel: {
    fontSize: isMobile ? 11 : 12,
    fontWeight: '700',
    color: PRIMARY_COLOR,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  modalValue: {
    fontSize: isMobile ? 13 : 14,
    color: '#1c1c1e',
    fontWeight: '500',
  },
  nrcContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f7',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  copyButton: {
    padding: 4,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyIcon: {
    width: 20,
    height: 20,
    tintColor: PRIMARY_COLOR,
  },
  horariosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  horarioCompactItem: {
    backgroundColor: '#f5f5f7',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minWidth: isMobile ? '47%' : '30%',
  },
  horarioDia: {
    fontSize: isMobile ? 12 : 13,
    fontWeight: '700',
    color: '#1c1c1e',
    marginBottom: 2,
  },
  horarioHora: {
    fontSize: isMobile ? 11 : 12,
    color: '#3c3c43',
    marginBottom: 2,
  },
  horarioAula: {
    fontSize: isMobile ? 10 : 11,
    color: '#8e8e93',
  },
  modalCloseButton: {
    backgroundColor: PRIMARY_COLOR,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseButtonText: {
    color: '#fff',
    fontSize: isMobile ? 16 : 18,
    fontWeight: '700',
  },
  // ============== TOAST ==============
  toastContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 80,
  },
  toast: {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  toastText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
