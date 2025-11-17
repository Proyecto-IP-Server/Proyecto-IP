import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Pressable, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import BlurModal from '@/components/BlurModal';

const { width } = Dimensions.get('window');
const isMobile = width < 768;

/**
 * Sidebar que muestra la lista de materias del horario generado
 * Incluye detalles como NRC, profesor, horarios, aula, etc.
 */
export default function GeneratedScheduleSidebar({ materias }) {
  const colorsPalette = [
    '#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF',
    '#FFB3E6', '#E6B3FF', '#FFD6BA', '#C9FFE5', '#B3D9FF'
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerSubtitle}>
          {materias.length} {materias.length === 1 ? 'materia' : 'materias'}
        </Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={true}>
        {materias.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No hay materias asignadas</Text>
            <Text style={styles.emptySubtext}>
              Esperando resultados del generador...
            </Text>
          </View>
        ) : (
          materias.map((materia, index) => (
            <View
              key={`${materia.nrc}-${index}`}
              style={[
                styles.materiaCard,
                { borderLeftColor: colorsPalette[index % colorsPalette.length] }
              ]}
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
                <Text style={styles.colorText}>Color en el horario</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 16,
    backgroundColor: '#000',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSubtitle: {
    fontSize: isMobile ? 14 : 16,
    color: '#fff',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  materiaCard: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  materiaHeader: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  materiaCodigo: {
    fontSize: isMobile ? 12 : 14,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 4,
  },
  materiaNombre: {
    fontSize: isMobile ? 14 : 16,
    fontWeight: '600',
    color: '#333',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: isMobile ? 12 : 14,
    fontWeight: '600',
    color: '#666',
    marginRight: 8,
    minWidth: 80,
  },
  detailValue: {
    fontSize: isMobile ? 12 : 14,
    color: '#333',
    flex: 1,
  },
  horariosContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  horarioItem: {
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 6,
    marginTop: 4,
  },
  horarioText: {
    fontSize: isMobile ? 12 : 13,
    color: '#333',
    fontWeight: '500',
  },
  aulaText: {
    fontSize: isMobile ? 11 : 12,
    color: '#666',
    marginTop: 2,
  },
  colorIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  colorIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  colorText: {
    fontSize: isMobile ? 11 : 12,
    color: '#666',
    fontStyle: 'italic',
  },
});
